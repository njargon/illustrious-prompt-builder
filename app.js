const catalog = window.PromptCatalog;

let catalogState = catalog.fallbackData();
let DATA = catalogState.data;
let ALL_TAGS = catalogState.allTags;

const state = {
  categoryId: DATA[0].id,
  sectionId: DATA[0].sections[0].id,
  sort: "count",
  localSearch: "",
  globalSearch: "",
  selected: new Map(), // key = tag
  history: [],
  redoHistory: [],
  tagLookup: new Map(),
  emphasisTags: new Set(),
  emphasisWeight: 1.2,
  visibleCount: 300,
  storageReady: false
};

const PAGE_SIZE = 300;
const STORAGE_KEY = "illustrious-prompt-builder-state-v15";

const els = {
  categoryNav: document.getElementById("categoryNav"),
  subCategoryTabs: document.getElementById("subCategoryTabs"),
  sectionTitle: document.getElementById("sectionTitle"),
  breadcrumb: document.getElementById("breadcrumb"),
  selectionHint: document.getElementById("selectionHint"),
  itemCount: document.getElementById("itemCount"),
  tagGrid: document.getElementById("tagGrid"),
  promptOutput: document.getElementById("promptOutput"),
  selectedSummary: document.getElementById("selectedSummary"),
  copyBtn: document.getElementById("copyBtn"),
  importPromptBtn: document.getElementById("importPromptBtn"),
  importDialog: document.getElementById("importDialog"),
  importPromptText: document.getElementById("importPromptText"),
  importReplaceBtn: document.getElementById("importReplaceBtn"),
  importAddBtn: document.getElementById("importAddBtn"),
  importResult: document.getElementById("importResult"),
  emphasisBtn: document.getElementById("emphasisBtn"),
  emphasisStatus: document.getElementById("emphasisStatus"),
  emphasisDialog: document.getElementById("emphasisDialog"),
  emphasisWeight: document.getElementById("emphasisWeight"),
  emphasisTagList: document.getElementById("emphasisTagList"),
  emphasisSelectAllBtn: document.getElementById("emphasisSelectAllBtn"),
  emphasisClearSelectionBtn: document.getElementById("emphasisClearSelectionBtn"),
  emphasisApplyBtn: document.getElementById("emphasisApplyBtn"),
  emphasisRemoveAllBtn: document.getElementById("emphasisRemoveAllBtn"),
  undoBtn: document.getElementById("undoBtn"),
  redoBtn: document.getElementById("redoBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  clearCategoryBtn: document.getElementById("clearCategoryBtn"),
  randomAllBtn: document.getElementById("randomAllBtn"),
  randomSectionBtn: document.getElementById("randomSectionBtn"),
  randomCategoryBtn: document.getElementById("randomCategoryBtn"),
  sortSelect: document.getElementById("sortSelect"),
  tagSearch: document.getElementById("tagSearch"),
  globalSearch: document.getElementById("globalSearch"),
  copyStatus: document.getElementById("copyStatus"),
  dataStatus: document.getElementById("dataStatus")
};

function findCategory(id) {
  return DATA.find(c => c.id === id);
}

function findSection(categoryId, sectionId) {
  return findCategory(categoryId)?.sections.find(s => s.id === sectionId);
}

function outputTag(tag) {
  return tag.replaceAll("_", " ");
}

function formatCount(n) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function snapshot() {
  return {
    selected: Array.from(state.selected.entries()).map(([k, v]) => [k, { ...v }]),
    emphasisTags: Array.from(state.emphasisTags),
    emphasisWeight: state.emphasisWeight
  };
}

function restore(snapshotData) {
  state.selected = new Map(
    (snapshotData.selected || []).map(([k, v]) => [k, { ...v }])
  );
  state.emphasisTags = new Set(snapshotData.emphasisTags || []);
  state.emphasisWeight = Number(snapshotData.emphasisWeight || 1.2);
}

function pushHistory() {
  state.history.push(snapshot());
  if (state.history.length > 50) state.history.shift();
  state.redoHistory = [];
}

function persistentStatePayload() {
  return {
    version: 1,
    selectedTags: Array.from(state.selected.keys()),
    emphasisTags: Array.from(state.emphasisTags),
    emphasisWeight: state.emphasisWeight
  };
}

function savePersistentState() {
  if (!state.storageReady) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentStatePayload()));
  } catch (err) {
    console.warn("localStorage save failed:", err);
  }
}

function restorePersistentState() {
  let raw = null;

  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.warn("localStorage read failed:", err);
    return;
  }

  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    const selectedTags = Array.isArray(saved.selectedTags) ? saved.selectedTags : [];
    const emphasized = new Set(
      Array.isArray(saved.emphasisTags) ? saved.emphasisTags : []
    );

    state.selected.clear();
    state.emphasisTags.clear();

    for (const tag of selectedTags) {
      const item = state.tagLookup.get(normalizeLookupKey(tag));
      if (item) {
        selectTag(item);
        if (emphasized.has(tag)) {
          state.emphasisTags.add(item.tag);
        }
      }
    }

    const weight = Number(saved.emphasisWeight);
    if (Number.isFinite(weight) && weight >= 0.1 && weight <= 3) {
      state.emphasisWeight = Number(weight.toFixed(2));
    }
  } catch (err) {
    console.warn("localStorage restore failed:", err);
  }
}

function resetVisibleCount() {
  state.visibleCount = PAGE_SIZE;
}


function countSelectedForSection(categoryId, sectionId) {
  let count = 0;
  for (const item of state.selected.values()) {
    if ((item.memberships || []).some(m => m.categoryId === categoryId && m.sectionId === sectionId)) {
      count++;
    }
  }
  return count;
}

function countSelectedForCategory(categoryId) {
  let count = 0;
  for (const item of state.selected.values()) {
    if ((item.memberships || []).some(m => m.categoryId === categoryId)) {
      count++;
    }
  }
  return count;
}

function clearSectionSelection(categoryId, sectionId) {
  for (const [tag, item] of Array.from(state.selected.entries())) {
    if ((item.memberships || []).some(m => m.categoryId === categoryId && m.sectionId === sectionId)) {
      state.selected.delete(tag);
      state.emphasisTags.delete(tag);
    }
  }
}

function clearCategorySelection(categoryId) {
  for (const [tag, item] of Array.from(state.selected.entries())) {
    if ((item.memberships || []).some(m => m.categoryId === categoryId)) {
      state.selected.delete(tag);
      state.emphasisTags.delete(tag);
    }
  }
}

function selectTag(item) {
  state.selected.set(item.tag, item);
}

function isSelected(item) {
  return state.selected.has(item.tag);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomizeSection(categoryId, sectionId) {
  const section = findSection(categoryId, sectionId);
  if (!section || !section.tags.length) return;

  pushHistory();
  clearSectionSelection(categoryId, sectionId);
  selectTag(randomItem(section.tags));
}

function randomizeCategory(categoryId) {
  const category = findCategory(categoryId);
  if (!category) return;

  pushHistory();
  clearCategorySelection(categoryId);

  for (const section of category.sections) {
    if (Math.random() < 0.75 && section.tags.length) {
      selectTag(randomItem(section.tags));
    }
  }
}

function randomizeAll() {
  pushHistory();
  state.selected.clear();
  state.emphasisTags.clear();

  for (const category of DATA) {
    if (category.randomAll === false || category.id === "adult" || category.id === "misc") continue;
    for (const section of category.sections) {
      if (Math.random() < 0.60 && section.tags.length) {
        selectTag(randomItem(section.tags));
      }
    }
  }
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    if (state.sort === "name") return a.tag.localeCompare(b.tag);
    return (b.count || 0) - (a.count || 0) || a.tag.localeCompare(b.tag);
  });
}

function tagMatches(item, q) {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  return item.tag.toLowerCase().includes(query) ||
         outputTag(item.tag).toLowerCase().includes(query) ||
         (item.ja || "").toLowerCase().includes(query);
}

function membershipLabels(item) {
  const labels = [];
  for (const m of item.memberships || []) {
    const label = `${m.categoryLabel} › ${m.sectionLabel}`;
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}


function normalizeLookupKey(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\\([()[\]{}])/g, "$1")
    .replace(/\s+/g, " ")
    .replaceAll(" ", "_");
}

function rebuildTagLookup() {
  const lookup = new Map();

  for (const item of ALL_TAGS) {
    const keys = [
      item.tag,
      outputTag(item.tag),
      ...(item.aliases || [])
    ];

    for (const key of keys) {
      const norm = normalizeLookupKey(key);
      if (norm && !lookup.has(norm)) lookup.set(norm, item);
    }
  }

  state.tagLookup = lookup;
}

function splitPromptTokens(text) {
  const tokens = [];
  let current = "";
  let round = 0;
  let square = 0;
  let curly = 0;

  for (const ch of String(text || "")) {
    if (ch === "(") round++;
    else if (ch === ")" && round > 0) round--;
    else if (ch === "[") square++;
    else if (ch === "]" && square > 0) square--;
    else if (ch === "{") curly++;
    else if (ch === "}" && curly > 0) curly--;

    if (ch === "," && round === 0 && square === 0 && curly === 0) {
      if (current.trim()) tokens.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

function parsePromptSyntax(raw) {
  let s = String(raw || "").trim();
  if (!s) return { tag: "", weight: null };

  s = s.replace(/^BREAK$/i, "");
  s = s.replace(/^AND$/i, "");
  if (!s) return { tag: "", weight: null };

  // LoRA / embedding等はDanbooruタグとして扱わない。
  if (/^<[^>]+>$/.test(s)) {
    return { tag: "", weight: null };
  }

  let weight = null;

  // NovelAI系: 1.2::tag::
  const novelMatch = s.match(/^([+-]?\d+(?:\.\d+)?)::(.+?)::$/);
  if (novelMatch) {
    weight = Number(novelMatch[1]);
    s = novelMatch[2].trim();
  }

  // 外側括弧を外す。明示重み (tag:1.2) は先に取得する。
  let changed = true;
  while (changed && s.length >= 2) {
    changed = false;

    if (s.startsWith("(") && s.endsWith(")")) {
      const inner = s.slice(1, -1).trim();
      const weighted = inner.match(/^(.*?):\s*([+-]?\d+(?:\.\d+)?)\s*$/);
      if (weighted) {
        s = weighted[1].trim();
        if (weight === null) weight = Number(weighted[2]);
      } else {
        s = inner;
      }
      changed = true;
      continue;
    }

    if ((s.startsWith("[") && s.endsWith("]")) ||
        (s.startsWith("{") && s.endsWith("}"))) {
      s = s.slice(1, -1).trim();
      changed = true;
    }
  }

  // 括弧を外した後に残る tag:1.2 も解釈。
  const trailingWeight = s.match(/^(.*?):\s*([+-]?\d+(?:\.\d+)?)\s*$/);
  if (trailingWeight) {
    s = trailingWeight[1].trim();
    if (weight === null) weight = Number(trailingWeight[2]);
  }

  s = s.replace(/\\([()[\]{}])/g, "$1").trim();

  if (!Number.isFinite(weight)) weight = null;
  return { tag: s, weight };
}

function interpretPrompt(text) {
  const matched = [];
  const unmatched = [];
  const seen = new Set();
  const emphasisByTag = new Map();

  for (const rawToken of splitPromptTokens(text)) {
    const parsed = parsePromptSyntax(rawToken);
    const cleaned = parsed.tag;
    if (!cleaned) continue;

    const key = normalizeLookupKey(cleaned);
    const item = state.tagLookup.get(key);

    if (item) {
      if (!seen.has(item.tag)) {
        matched.push(item);
        seen.add(item.tag);
      }

      if (parsed.weight !== null && parsed.weight !== 1) {
        emphasisByTag.set(item.tag, Number(parsed.weight.toFixed(2)));
      }
    } else {
      unmatched.push(cleaned);
    }
  }

  const uniqueWeights = Array.from(new Set(emphasisByTag.values()));
  return { matched, unmatched, emphasisByTag, uniqueWeights };
}

function renderImportResult(result, emphasisNote = "") {
  els.importResult.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "import-result-success";
  summary.textContent = `${result.matched.length}件を認識 / ${result.unmatched.length}件は未認識`;
  els.importResult.appendChild(summary);

  if (emphasisNote) {
    const emphasis = document.createElement("div");
    emphasis.className = "import-result-emphasis";
    emphasis.textContent = emphasisNote;
    els.importResult.appendChild(emphasis);
  }

  if (result.unmatched.length) {
    const unknown = document.createElement("div");
    unknown.className = "import-result-unmatched";
    const shown = result.unmatched.slice(0, 30);
    unknown.textContent =
      `未認識: ${shown.join(", ")}${result.unmatched.length > shown.length ? " …" : ""}`;
    els.importResult.appendChild(unknown);
  }
}

function importPrompt(mode) {
  const result = interpretPrompt(els.importPromptText.value);

  if (!result.matched.length) {
    renderImportResult(result);
    return;
  }

  let emphasisNote = "";
  let importedWeight = null;
  let canApplyImportedEmphasis = false;

  if (result.uniqueWeights.length === 1) {
    importedWeight = result.uniqueWeights[0];
    canApplyImportedEmphasis = true;
  } else if (result.uniqueWeights.length > 1) {
    emphasisNote =
      `強調値が複数（${result.uniqueWeights.join(", ")}）あるため、タグのみ読み込み、強調は復元していません。`;
  }

  if (mode === "add" && canApplyImportedEmphasis &&
      state.emphasisTags.size > 0 &&
      Number(state.emphasisWeight.toFixed(2)) !== importedWeight) {
    canApplyImportedEmphasis = false;
    emphasisNote =
      `既存の強調値 ${Number(state.emphasisWeight.toFixed(2))} と読込側 ${importedWeight} が異なるため、追加タグの強調は復元していません。`;
  }

  pushHistory();

  if (mode === "replace") {
    state.selected.clear();
    state.emphasisTags.clear();
  }

  for (const item of result.matched) {
    selectTag(item);
  }

  if (canApplyImportedEmphasis && result.emphasisByTag.size) {
    state.emphasisWeight = importedWeight;
    for (const tag of result.emphasisByTag.keys()) {
      if (state.selected.has(tag)) {
        state.emphasisTags.add(tag);
      }
    }

    if (!emphasisNote) {
      emphasisNote =
        `${result.emphasisByTag.size}件の強調を強度 ${importedWeight} で復元しました。`;
    }
  }

  renderImportResult(result, emphasisNote);
  render();
}

function renderCategoryNav() {
  els.categoryNav.innerHTML = "";
  DATA.forEach(category => {
    const selectedCount = countSelectedForCategory(category.id);
    const button = document.createElement("button");
    const classes = [
      "category-button",
      !state.globalSearch && category.id === state.categoryId ? "active" : "",
      selectedCount > 0 ? "has-selection" : ""
    ].filter(Boolean).join(" ");
    button.className = classes;
    button.innerHTML = `
      <span class="category-label-wrap">
        <span>${category.label}</span>
        ${selectedCount > 0 ? `<span class="category-count">${selectedCount}</span>` : ""}
      </span>
    `;
    button.addEventListener("click", () => {
      state.globalSearch = "";
      els.globalSearch.value = "";
      state.categoryId = category.id;
      state.sectionId = category.sections[0].id;
      state.localSearch = "";
      els.tagSearch.value = "";
      resetVisibleCount();
      render();
    });
    els.categoryNav.appendChild(button);
  });
}

function renderSubCategories() {
  const category = findCategory(state.categoryId);
  els.subCategoryTabs.innerHTML = "";

  if (state.globalSearch) {
    els.subCategoryTabs.style.display = "none";
    return;
  }

  els.subCategoryTabs.style.display = "";

  category.sections.forEach(section => {
    const selectedCount = countSelectedForSection(category.id, section.id);
    const button = document.createElement("button");
    const classes = [
      "subcategory-button",
      section.id === state.sectionId ? "active" : "",
      selectedCount > 0 ? "has-selection" : ""
    ].filter(Boolean).join(" ");
    button.className = classes;
    button.innerHTML = `
      <span>${section.label}</span>
      ${selectedCount > 0 ? `<span class="subcategory-count">${selectedCount}</span>` : ""}
    `;
    button.addEventListener("click", () => {
      state.sectionId = section.id;
      state.localSearch = "";
      els.tagSearch.value = "";
      resetVisibleCount();
      renderMain();
    });
    els.subCategoryTabs.appendChild(button);
  });
}

function makeCard(item, showMemberships) {
  const button = document.createElement("button");
  const selected = isSelected(item);
  button.className = `tag-card ${selected ? "selected" : ""}`;
  button.setAttribute("aria-pressed", String(selected));

  const memberships = showMemberships
    ? `<div class="group-badges">${
        membershipLabels(item)
          .slice(0, 4)
          .map(label => `<span class="group-badge">${label}</span>`)
          .join("")
      }</div>`
    : "";

  button.innerHTML = `
    <span class="tag-main">
      <span class="tag-label-primary">${outputTag(item.tag)}</span>
      ${item.ja ? `<span class="tag-label-secondary">${item.ja}</span>` : ""}
      ${memberships}
    </span>
    <span class="tag-count">${formatCount(item.count)}</span>
  `;

  button.addEventListener("click", () => {
    pushHistory();
    if (selected) {
      state.selected.delete(item.tag);
      state.emphasisTags.delete(item.tag);
    } else {
      selectTag(item);
    }
    render();
  });

  return button;
}

function appendLoadMoreButton(totalCount, showMemberships) {
  if (state.visibleCount >= totalCount) return;

  const button = document.createElement("button");
  button.className = "load-more-button";
  const remaining = totalCount - state.visibleCount;
  const nextCount = Math.min(PAGE_SIZE, remaining);
  button.textContent = `さらに${nextCount}件表示（残り${remaining.toLocaleString()}件）`;
  button.addEventListener("click", () => {
    state.visibleCount += PAGE_SIZE;
    renderTagGrid();
  });
  els.tagGrid.appendChild(button);
}

function renderSectionView() {
  const category = findCategory(state.categoryId);
  const section = findSection(state.categoryId, state.sectionId);
  if (!category || !section) return;

  els.breadcrumb.textContent = category.label;
  els.sectionTitle.textContent = section.label;
  els.selectionHint.textContent = "複数選択可";
  els.tagSearch.style.display = "";
  els.randomSectionBtn.style.display = "";
  els.randomCategoryBtn.style.display = "";
  els.clearCategoryBtn.style.display = "";

  const items = sortItems(section.tags.filter(item => tagMatches(item, state.localSearch)));
  const shown = items.slice(0, state.visibleCount);

  els.itemCount.textContent =
    `${items.length.toLocaleString()}件` +
    (items.length > shown.length ? `（${shown.length.toLocaleString()}件表示）` : "");
  els.tagGrid.innerHTML = "";

  if (!items.length) {
    els.tagGrid.innerHTML = `<div class="empty-state">該当するタグがありません。</div>`;
    return;
  }

  shown.forEach(item => {
    els.tagGrid.appendChild(makeCard(item, false));
  });

  appendLoadMoreButton(items.length, false);
}

function renderGlobalSearchView() {
  const query = state.globalSearch.trim();
  els.breadcrumb.textContent = "All Categories";
  els.sectionTitle.textContent = `全体検索: ${query}`;
  els.selectionHint.textContent = "全カテゴリ横断";
  els.tagSearch.style.display = "none";
  els.randomSectionBtn.style.display = "none";
  els.randomCategoryBtn.style.display = "none";
  els.clearCategoryBtn.style.display = "none";

  const results = sortItems(ALL_TAGS.filter(item => tagMatches(item, query)));
  const shown = results.slice(0, state.visibleCount);

  els.itemCount.textContent =
    `${results.length.toLocaleString()}件` +
    (results.length > shown.length ? `（${shown.length.toLocaleString()}件表示）` : "");
  els.tagGrid.innerHTML = "";

  if (!shown.length) {
    els.tagGrid.innerHTML = `<div class="empty-state">該当するタグがありません。</div>`;
    return;
  }

  shown.forEach(item => {
    els.tagGrid.appendChild(makeCard(item, true));
  });

  appendLoadMoreButton(results.length, true);
}

function renderTagGrid() {
  if (state.globalSearch.trim()) {
    renderGlobalSearchView();
  } else {
    renderSectionView();
  }
}

function primaryMembership(item) {
  const memberships = item.memberships || [];
  if (!memberships.length) {
    return {
      categoryId: "unknown",
      categoryLabel: "Other",
      sectionId: "unknown",
      sectionLabel: "Other",
      order: 999999
    };
  }

  return memberships.slice().sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999))[0];
}

function selectedGroupedData() {
  const values = Array.from(state.selected.values()).sort((a, b) => {
    const ao = primaryMembership(a).order ?? 999999;
    const bo = primaryMembership(b).order ?? 999999;
    if (ao !== bo) return ao - bo;
    return (b.count || 0) - (a.count || 0);
  });

  const categoryMap = new Map();

  for (const item of values) {
    const pm = primaryMembership(item);

    if (!categoryMap.has(pm.categoryId)) {
      categoryMap.set(pm.categoryId, {
        id: pm.categoryId,
        label: pm.categoryLabel,
        order: pm.order ?? 999999,
        sections: new Map(),
        count: 0
      });
    }

    const cat = categoryMap.get(pm.categoryId);
    cat.count += 1;

    if (!cat.sections.has(pm.sectionId)) {
      cat.sections.set(pm.sectionId, {
        id: pm.sectionId,
        label: pm.sectionLabel,
        order: pm.order ?? 999999,
        items: []
      });
    }

    cat.sections.get(pm.sectionId).items.push(item);
  }

  return Array.from(categoryMap.values())
    .sort((a, b) => a.order - b.order)
    .map(cat => ({
      ...cat,
      sections: Array.from(cat.sections.values()).sort((a, b) => a.order - b.order)
    }));
}

function removeSelectedTag(tag) {
  if (!state.selected.has(tag)) return;
  pushHistory();
  state.selected.delete(tag);
  state.emphasisTags.delete(tag);
  render();
}


function emphasizedOutputTag(tag) {
  const plain = outputTag(tag);
  if (!state.emphasisTags.has(tag)) return plain;

  const weight = Number(state.emphasisWeight);
  if (!Number.isFinite(weight) || weight === 1) return plain;

  const compact = Number(weight.toFixed(2));
  return `(${plain}:${compact})`;
}

function cleanEmphasisState() {
  for (const tag of Array.from(state.emphasisTags)) {
    if (!state.selected.has(tag)) {
      state.emphasisTags.delete(tag);
    }
  }
}

function renderEmphasisStatus() {
  cleanEmphasisState();

  if (!state.emphasisTags.size) {
    els.emphasisStatus.textContent = "強調なし";
    return;
  }

  els.emphasisStatus.textContent =
    `${state.emphasisTags.size} tags / 強度 ${Number(state.emphasisWeight.toFixed(2))}`;
}

function renderEmphasisDialog() {
  cleanEmphasisState();

  const grouped = selectedGroupedData();
  els.emphasisTagList.innerHTML = "";
  els.emphasisWeight.value = String(state.emphasisWeight);

  if (!grouped.length) {
    const empty = document.createElement("div");
    empty.className = "summary-empty";
    empty.textContent = "現在選択されているタグがありません。";
    els.emphasisTagList.appendChild(empty);
    return;
  }

  grouped.forEach(category => {
    const catEl = document.createElement("section");
    catEl.className = "emphasis-category";

    const title = document.createElement("div");
    title.className = "emphasis-category-title";
    title.textContent = category.label;
    catEl.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "emphasis-checkbox-grid";

    category.sections.flatMap(section => section.items).forEach(item => {
      const label = document.createElement("label");
      label.className = "emphasis-checkbox";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = item.tag;
      checkbox.checked = state.emphasisTags.has(item.tag);

      const text = document.createElement("span");
      text.textContent = outputTag(item.tag);

      label.appendChild(checkbox);
      label.appendChild(text);
      grid.appendChild(label);
    });

    catEl.appendChild(grid);
    els.emphasisTagList.appendChild(catEl);
  });
}

function emphasisDialogCheckedTags() {
  return Array.from(
    els.emphasisTagList.querySelectorAll('input[type="checkbox"]:checked')
  ).map(el => el.value);
}

function setAllEmphasisCheckboxes(checked) {
  els.emphasisTagList
    .querySelectorAll('input[type="checkbox"]')
    .forEach(el => {
      el.checked = checked;
    });
}

function applyEmphasisFromDialog() {
  const weight = Number(els.emphasisWeight.value);
  if (!Number.isFinite(weight) || weight < 0.1 || weight > 3) {
    els.emphasisWeight.focus();
    return;
  }

  pushHistory();
  state.emphasisWeight = Number(weight.toFixed(2));
  state.emphasisTags = new Set(emphasisDialogCheckedTags());
  render();
  renderEmphasisDialog();
}

function renderPrompt() {
  const grouped = selectedGroupedData();
  const flatValues = grouped.flatMap(cat => cat.sections.flatMap(section => section.items));

  cleanEmphasisState();
  els.promptOutput.value = flatValues.map(v => emphasizedOutputTag(v.tag)).join(", ");

  els.selectedSummary.innerHTML = "";

  if (!grouped.length) {
    const empty = document.createElement("div");
    empty.className = "summary-empty";
    empty.textContent = "未選択";
    els.selectedSummary.appendChild(empty);
  } else {
    grouped.forEach(category => {
      const groupEl = document.createElement("section");
      groupEl.className = "prompt-category-group";

      const header = document.createElement("div");
      header.className = "prompt-category-header";
      header.innerHTML = `
        <div class="prompt-category-title">${category.label}</div>
        <div class="prompt-category-count">${category.count} tags</div>
      `;
      groupEl.appendChild(header);

      category.sections.forEach(section => {
        const secEl = document.createElement("div");
        secEl.className = "prompt-subsection";

        const secTitle = document.createElement("div");
        secTitle.className = "prompt-subsection-title";
        secTitle.textContent = section.label;
        secEl.appendChild(secTitle);

        const chipList = document.createElement("div");
        chipList.className = "prompt-chip-list";

        section.items.forEach(item => {
          const chip = document.createElement("span");
          chip.className = `removable-chip ${state.emphasisTags.has(item.tag) ? "emphasized-chip" : ""}`;

          const label = document.createElement("span");
          label.className = "removable-chip-label";
          label.textContent = outputTag(item.tag);

          if (state.emphasisTags.has(item.tag)) {
            const weightBadge = document.createElement("span");
            weightBadge.className = "emphasis-weight-badge";
            weightBadge.textContent = `×${Number(state.emphasisWeight.toFixed(2))}`;
            chip.appendChild(label);
            chip.appendChild(weightBadge);
          } else {
            chip.appendChild(label);
          }

          const removeBtn = document.createElement("button");
          removeBtn.className = "removable-chip-remove";
          removeBtn.type = "button";
          removeBtn.title = "削除";
          removeBtn.setAttribute("aria-label", `${outputTag(item.tag)} を削除`);
          removeBtn.textContent = "×";
          removeBtn.addEventListener("click", () => removeSelectedTag(item.tag));

          chip.appendChild(removeBtn);
          chipList.appendChild(chip);
        });

        secEl.appendChild(chipList);
        groupEl.appendChild(secEl);
      });

      els.selectedSummary.appendChild(groupEl);
    });
  }

  els.undoBtn.disabled = state.history.length === 0;
  els.redoBtn.disabled = state.redoHistory.length === 0;
  if (!state.globalSearch) {
    els.clearCategoryBtn.disabled = countSelectedForCategory(state.categoryId) === 0;
  }
}

function renderMain() {
  renderSubCategories();
  renderTagGrid();
}

function render() {
  renderCategoryNav();
  renderMain();
  renderPrompt();
  renderEmphasisStatus();
  savePersistentState();
}

els.sortSelect.addEventListener("change", e => {
  state.sort = e.target.value;
  resetVisibleCount();
  renderTagGrid();
});

els.tagSearch.addEventListener("input", e => {
  state.localSearch = e.target.value;
  resetVisibleCount();
  renderTagGrid();
});

els.globalSearch.addEventListener("input", e => {
  state.globalSearch = e.target.value;
  resetVisibleCount();
  render();
});

els.clearAllBtn.addEventListener("click", () => {
  if (!state.selected.size) return;
  pushHistory();
  state.selected.clear();
  state.emphasisTags.clear();
  render();
});

els.clearCategoryBtn.addEventListener("click", () => {
  if (countSelectedForCategory(state.categoryId) === 0) return;
  pushHistory();
  clearCategorySelection(state.categoryId);
  render();
});

els.undoBtn.addEventListener("click", () => {
  const previous = state.history.pop();
  if (!previous) return;
  state.redoHistory.push(snapshot());
  if (state.redoHistory.length > 50) state.redoHistory.shift();
  restore(previous);
  render();
});

els.redoBtn.addEventListener("click", () => {
  const next = state.redoHistory.pop();
  if (!next) return;
  state.history.push(snapshot());
  if (state.history.length > 50) state.history.shift();
  restore(next);
  render();
});

els.randomSectionBtn.addEventListener("click", () => {
  randomizeSection(state.categoryId, state.sectionId);
  render();
});

els.randomCategoryBtn.addEventListener("click", () => {
  randomizeCategory(state.categoryId);
  render();
});

els.randomAllBtn.addEventListener("click", () => {
  randomizeAll();
  render();
});



els.emphasisBtn.addEventListener("click", () => {
  renderEmphasisDialog();
  if (typeof els.emphasisDialog.showModal === "function") {
    els.emphasisDialog.showModal();
  } else {
    els.emphasisDialog.setAttribute("open", "");
  }
});

els.emphasisSelectAllBtn.addEventListener("click", () => {
  setAllEmphasisCheckboxes(true);
});

els.emphasisClearSelectionBtn.addEventListener("click", () => {
  setAllEmphasisCheckboxes(false);
});

els.emphasisApplyBtn.addEventListener("click", () => {
  applyEmphasisFromDialog();
});

els.emphasisRemoveAllBtn.addEventListener("click", () => {
  if (!state.emphasisTags.size) return;
  pushHistory();
  state.emphasisTags.clear();
  render();
  renderEmphasisDialog();
});

els.importPromptBtn.addEventListener("click", () => {
  els.importResult.innerHTML = "";
  els.importPromptText.value = "";
  if (typeof els.importDialog.showModal === "function") {
    els.importDialog.showModal();
  } else {
    els.importDialog.setAttribute("open", "");
  }
});

els.importReplaceBtn.addEventListener("click", () => {
  importPrompt("replace");
});

els.importAddBtn.addEventListener("click", () => {
  importPrompt("add");
});

els.copyBtn.addEventListener("click", async () => {
  const text = els.promptOutput.value;
  if (!text) {
    els.copyStatus.textContent = "Promptが空です";
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    els.promptOutput.focus();
    els.promptOutput.select();
    document.execCommand("copy");
  }

  els.copyStatus.textContent = "コピーしました";
  setTimeout(() => {
    els.copyStatus.textContent = "";
  }, 1600);
});

async function initializeCatalog() {
  rebuildTagLookup();
  render();
  els.dataStatus.textContent = "簡易辞書";

  try {
    const remote = await catalog.loadRemote();
    DATA = remote.data;
    ALL_TAGS = remote.allTags;
    rebuildTagLookup();

    state.categoryId = DATA[0].id;
    state.sectionId = DATA[0].sections[0].id;

    restorePersistentState();
    state.storageReady = true;

    els.dataStatus.textContent =
      `Danbooru由来 ${remote.accepted.toLocaleString()} tags`;

    render();
  } catch (err) {
    console.warn("Remote catalog load failed:", err);

    rebuildTagLookup();
    restorePersistentState();
    state.storageReady = true;

    els.dataStatus.textContent = "簡易辞書（外部読込失敗）";
    render();
  }
}

initializeCatalog();

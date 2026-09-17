(() => {
  "use strict";

  const REMOTE_CSV = "https://raw.githubusercontent.com/PYU224/tagdb-updater/main/dist/danbooru-general-ja.csv";

  // v4系の使い勝手を維持しつつ、各セクションの上限を引き上げる。
  const SCHEMA = [
    {
      id: "character", label: "Character",
      sections: [
        ["count", "人数・構成"],
        ["age_type", "年齢・人物タイプ"],
        ["identity_role", "属性・役割"],
        ["hair_color", "髪色"],
        ["hair_length", "髪の長さ・量"],
        ["hair_style", "髪型"],
        ["hair_accessory", "髪まわり装飾"],
        ["bangs", "前髪・顔まわり"],
        ["eye_color", "目の色"],
        ["eye_features", "目・眉の特徴"],
        ["expression", "表情"],
        ["mouth_teeth", "口・歯・舌"],
        ["face_skin", "顔・肌"],
        ["body", "体格・身体特徴"],
        ["body_parts", "体の部位"],
        ["fantasy_traits", "耳・角・翼・尻尾"],
        ["character_status", "状態・雰囲気"],
        ["character_misc", "人物その他"]
      ]
    },
    {
      id: "clothing", label: "Clothing",
      sections: [
        ["outfit", "衣装・スタイル"],
        ["uniforms", "制服・職業衣装"],
        ["tops", "トップス"],
        ["bottoms", "ボトムス"],
        ["dresses", "ドレス・ワンピース"],
        ["outerwear", "アウター"],
        ["swimwear", "水着・リゾート衣装"],
        ["sleeves", "袖・肩まわり"],
        ["legwear", "靴下・レッグウェア"],
        ["footwear", "靴"],
        ["headwear", "帽子・頭部装飾"],
        ["neckwear", "首まわり"],
        ["armwear", "手袋・腕まわり"],
        ["accessories", "装身具・小物"],
        ["patterns", "柄・素材"],
        ["clothing_state", "着崩し・服の状態"],
        ["clothing_detail", "服の形・ディテール"],
        ["clothing_misc", "衣服その他"]
      ]
    },
    {
      id: "pose", label: "Pose / Action",
      sections: [
        ["posture", "姿勢"],
        ["sitting_lying", "座る・寝る"],
        ["gaze", "視線・顔の向き"],
        ["arms_hands", "腕・手"],
        ["hand_gesture", "手のジェスチャー"],
        ["legs_feet", "脚・足"],
        ["holding", "持つ"],
        ["movement", "移動・運動"],
        ["daily_action", "日常動作"],
        ["performance", "演奏・歌・ダンス"],
        ["interaction", "人物間の動作"],
        ["pose_misc", "ポーズその他"]
      ]
    },
    {
      id: "composition", label: "Composition",
      sections: [
        ["framing", "画角・写る範囲"],
        ["viewpoint", "視点・カメラ角度"],
        ["focus", "被写体・フォーカス"],
        ["crop", "クロップ・画面外"],
        ["layout", "配置・複数ビュー"],
        ["format", "画面形式・漫画表現"],
        ["camera_effect", "レンズ・撮影表現"],
        ["perspective", "遠近・構図補助"],
        ["composition_misc", "構図その他"]
      ]
    },
    {
      id: "environment", label: "Environment",
      sections: [
        ["background", "背景"],
        ["home_indoor", "住宅・室内"],
        ["public_indoor", "公共施設・店舗"],
        ["school_work", "学校・職場"],
        ["urban", "街・道路・建築"],
        ["nature", "自然・地形"],
        ["water", "水辺・水中"],
        ["transport_place", "交通・乗り物内"],
        ["time_weather", "時間・天候・空"],
        ["event_scene", "行事・舞台・装飾背景"],
        ["fantasy_place", "幻想・宇宙・特殊空間"],
        ["environment_misc", "背景その他"]
      ]
    },
    {
      id: "objects", label: "Objects",
      sections: [
        ["device", "機器・メディア"],
        ["furniture", "家具・生活用品"],
        ["stationery", "本・文具・紙類"],
        ["container_tableware", "容器・食器"],
        ["food", "食べ物・飲み物"],
        ["animal", "動物"],
        ["plant", "植物・花"],
        ["weapon", "武器"],
        ["tool", "道具・工具"],
        ["vehicle", "乗り物"],
        ["instrument", "楽器"],
        ["sports", "スポーツ用品"],
        ["toy", "玩具・ぬいぐるみ"],
        ["decoration", "装飾物・記念品"],
        ["misc_object", "その他の物"],
        ["object_misc", "物体その他"]
      ]
    },
    {
      id: "effects", label: "Effects / Style",
      sections: [
        ["lighting", "光・照明"],
        ["aura_emotion", "オーラ・感情エフェクト"],
        ["visual_effect", "視覚効果"],
        ["color", "色・パレット"],
        ["line_render", "線・塗り・レンダリング"],
        ["art_style", "描画・表現"],
        ["texture", "質感・画材"],
        ["atmosphere", "雰囲気・演出"],
        ["magic", "魔法・オーラ・超常効果"],
        ["symbol_text", "記号・文字・漫画記号"],
        ["effect_misc", "効果その他"]
      ]
    },
    {
      id: "adult", label: "Adult",
      randomAll: false,
      sections: [
        ["adult_nudity", "裸体・露出"],
        ["adult_breasts", "胸部"],
        ["adult_genitals", "性器"],
        ["adult_sex_act", "性交・性的行為"],
        ["adult_oral_manual", "口・手による行為"],
        ["adult_masturbation", "自慰・自己刺激"],
        ["adult_fluids", "体液・射精表現"],
        ["adult_fetish", "フェティッシュ・拘束"],
        ["adult_clothing", "成人向け衣装・下着"],
        ["adult_pose", "成人向けポーズ・状態"],
        ["adult_misc", "成人向けその他"]
      ]
    },
    {
      id: "misc", label: "Misc",
      randomAll: false,
      sections: [
        ["theme_event", "テーマ・イベント"],
        ["abstract_misc", "抽象・概念"],
        ["general_misc", "未分類その他"]
      ]
    }
  ];

  // 成人向けタグ自体は採用する。
  // ただし未成年を明示・強く示唆する性的タグは対象外にする。
  const BLOCKED = [
    /\bloli\b/i, /\bshota\b/i, /\bunderage\b/i, /\bminor\b/i,
    /\bchild sex\b/i, /\bchild sexual\b/i, /\bpreteen\b/i
  ];

  const META_BLOCKED = [
    "artist name", "character name", "copyright request", "twitter username",
    "x username", "web address", "watermark", "signature", "dated",
    "commentary", "commentary request", "one-hour drawing challenge",
    "virtual youtuber"
  ];

  const COLOR_WORDS = [
    "black","white","grey","gray","red","blue","green","yellow","orange","pink",
    "purple","brown","blonde","aqua","teal","cyan","gold","silver","multicolored",
    "two-tone","gradient","streaked","rainbow"
  ];

  const HAIR_STYLE_WORDS = [
    "ponytail","twintails","braid","braids","hair bun","bob cut","hime cut","wolf cut",
    "jellyfish cut","mullet","afro","drill hair","drills","ringlets","curly hair",
    "wavy hair","straight hair","messy hair","spiked hair","fluffy hair","topknot",
    "two side up","hair rings","hair down","hair up","floating hair","hair pulled back",
    "hair slicked back","parted hair","mohawk","pixie cut","crew cut","buzz cut",
    "sidelocks","braided ponytail","single braid","side braid","low twintails"
  ];

  const BANG_WORDS = [
    "bangs","sidelocks","hair between eyes","hair over one eye","hair over eyes",
    "hair intakes","hair behind ear","curtained hair","widow's peak","ahoge",
    "antenna hair","loose hair strand","forehead","parted bangs","blunt bangs"
  ];

  const EXPRESSIONS = [
    "smile","grin","blush","open mouth","closed mouth","parted lips","tongue out",
    "tears","crying","surprised","expressionless","light smile","wavy mouth",
    "clenched teeth","fang","sharp teeth","one eye closed","closed eyes",
    "wide-eyed","jitome",":d",":o",":q",":<","sweatdrop","furrowed brow",
    "frown","pout","smirk","laughing"
  ];

  const BODY_WORDS = [
    "muscular","flat chest","collarbone","navel","stomach","back","feet","toes",
    "fingernails","toenails","armpits","thighs","pale skin","dark skin","colored skin",
    "dark-skinned female","tattoo","mole","scar","freckles","tall","short stack",
    "mature female","young","skinny","plump","curvy","fat","body hair",
    "skinny legs","thick thighs","slender"
  ];

  const FANTASY_TRAITS = [
    "animal ears","cat ears","fox ears","wolf ears","rabbit ears","horse ears","pointy ears",
    "horns","single horn","dragon horns","tail","cat tail","dog tail","dragon tail","fake tail",
    "wings","feathered wings","bat wings","demon wings","angel wings","halo","fins","elf","oni",
    "mermaid","antlers"
  ];

  const OUTFIT_WORDS = [
    "school uniform","serafuku","sailor uniform","military uniform","winter uniform",
    "summer uniform","maid","magical girl","japanese clothes","kimono","hakama",
    "suit","sportswear","casual","formal clothes","idol clothes","gothic lolita",
    "lolita fashion","goth fashion","streetwear","techwear","jirai kei","gyaru",
    "swimsuit","school swimsuit","armor","leotard","bodysuit","cheerleader","nurse",
    "wedding dress","china dress","qipao","apron dress"
  ];

  const TOP_WORDS = [
    "shirt","t-shirt","blouse","sweater","hoodie","tank top","camisole","crop top",
    "vest","jersey","turtleneck","tube top","halter top","cardigan","polo shirt",
    "sweatshirt","button shirt","blazer"
  ];

  const BOTTOM_WORDS = [
    "skirt","shorts","pants","jeans","trousers","hakama","bloomers","miniskirt",
    "long skirt","pleated skirt","pencil skirt","short shorts"
  ];

  const DRESS_WORDS = ["dress","gown","sundress","sailor dress","one-piece dress","sleeveless dress"];
  const OUTER_WORDS = ["jacket","coat","cape","cloak","robe","poncho","parka","bolero","raincoat","lab coat"];
  const SLEEVE_WORDS = ["sleeves","sleeveless","bare shoulders","off shoulder","strapless","puffy sleeves","detached sleeves"];
  const LEGWEAR_WORDS = ["thighhighs","pantyhose","socks","stockings","legwear","knee highs","garter","leg warmers","ankle socks"];
  const FOOT_WORDS = ["shoes","boots","heels","loafers","sneakers","sandals","slippers","barefoot","mary janes"];
  const HEAD_WORDS = ["hat","cap","helmet","hood","headband","hairband","headdress","crown","tiara","goggles on head","beret"];
  const NECK_WORDS = ["necktie","bowtie","neckerchief","scarf","choker","collar","ascot","neck ribbon","necklace"];
  const ARM_WORDS = ["gloves","gauntlets","wrist cuffs","wristband","bracelet","armband","arm warmers","fingerless gloves"];
  const ACCESSORY_WORDS = ["jewelry","earrings","necklace","pendant","ring","belt","bag","pouch","ribbon","bow","hair ornament","hairclip","hair flower","scrunchie","brooch","satchel","backpack"];
  const CLOTHING_DETAIL_WORDS = [
    "frills","lace","trim","buttons","buckle","plaid","striped","denim","torn clothes",
    "open clothes","open jacket","see-through clothes","skin tight","clothing cutout",
    "fur trim","layered","puffy","collared","front-tie","long sleeves","short sleeves",
    "zipper","hooded","cropped jacket","oversized clothes"
  ];

  const POSTURE_WORDS = [
    "standing","sitting","lying","kneeling","seiza","wariza","on back","on side",
    "crouching","squatting","walking","running","sleeping","leaning","bending over",
    "jumping","floating","midair"
  ];

  const GAZE_WORDS = [
    "looking at viewer","looking away","looking back","looking up","looking down",
    "looking to the side","looking at another","sideways glance","facing viewer",
    "eye contact","from side","over shoulder"
  ];

  const HAND_WORDS = [
    "hand up","hands up","arm up","arms up","arms behind back","arm behind back",
    "arms behind head","arm behind head","crossed arms","hand on own hip",
    "hand on own face","finger to mouth","index finger raised","hand in pocket",
    "own hands together","interlocked fingers","peace sign","v","clenched hands",
    "holding own arm"
  ];

  const LEG_WORDS = [
    "leg up","crossed legs","spread legs","feet out of frame","between legs",
    "legs together","knees together","one knee","tiptoes","crossed ankles"
  ];

  const ACTION_WORDS = [
    "eating","drinking","sleeping","walking","running","reaching","reading","writing",
    "singing","dancing","cooking","swimming","jumping","waving","saluting","stretching",
    "trembling","crying","smoking","playing instrument","brushing teeth","talking",
    "laughing","yawning"
  ];

  const INTERACTION_WORDS = [
    "hug","embrace","holding hands","handshake","head pat","carrying","piggyback",
    "kissing cheek","lap pillow","leaning on another","back-to-back"
  ];

  const FRAMING_WORDS = [
    "full body","upper body","cowboy shot","portrait","close-up","face","bust",
    "wide shot","medium shot","cropped torso","profile","upper body from behind"
  ];

  const VIEWPOINT_WORDS = [
    "from above","from below","from behind","from side","pov","foreshortening",
    "dutch angle","fisheye","overhead","low angle","high angle","profile",
    "front view","rear view","three-quarter view"
  ];

  const FOCUS_WORDS = ["solo focus","male focus","female focus","depth of field","focus","blurry background"];
  const CROP_WORDS = ["cropped legs","feet out of frame","out of frame","cropped torso","cropped shoulders","partially visible"];
  const FORMAT_WORDS = ["multiple views","4koma","2koma","comic","cover page","letterboxed","border","split screen","panorama"];

  const BACKGROUND_WORDS = ["background","simple background","white background","grey background","black background","gradient background","transparent background"];
  const INDOOR_WORDS = ["indoors","bedroom","classroom","kitchen","bathroom","library","office","restaurant","cafe","shop","store","hallway","room","train interior","school","home interior","living room"];
  const OUTDOOR_WORDS = ["outdoors","street","city","road","bridge","park","schoolyard","rooftop","beach","poolside","garden","playground","sidewalk","alley"];
  const NATURE_WORDS = ["forest","tree","grass","flower","plant","mountain","ocean","sea","river","lake","water","cherry blossoms","skyline","field","underwater"];
  const WEATHER_WORDS = ["day","night","sunset","sunrise","sky","blue sky","cloud","cloudy sky","starry sky","moon","sun","rain","snow","wind","fog","weather","storm"];

  const DEVICE_WORDS = ["smartphone","phone","computer","laptop","tablet","camera","headphones","headset","microphone","television","monitor","game controller","keyboard","mouse"];
  const FURNITURE_WORDS = ["table","chair","bed","pillow","bed sheet","sofa","desk","window","door","mirror","umbrella","towel","bottle","cup","plate","tray","bookshelf","lamp"];
  const FOOD_WORDS = ["food","drink","candy","cake","bread","fruit","apple","strawberry","ice cream","coffee","tea","alcohol","bottle","bento","rice"];
  const ANIMAL_PLANT_WORDS = ["cat","dog","fish","bird","butterfly","flower","tree","plant","grass","rose","bouquet","petals","leaf"];
  const WEAPON_WORDS = ["weapon","sword","gun","handgun","rifle","knife","staff","polearm","bow weapon","shield","spear","katana","dagger"];
  const MISC_OBJECT_WORDS = ["book","bag","stuffed toy","rope","gem","flower","umbrella","cigarette","microphone","phone","cup","bottle","paper","pen","pencil","notebook","letter"];

  const LIGHT_WORDS = ["sunlight","backlighting","lighting","rim light","lens flare","glowing","light rays","spotlight","shadow","soft lighting","dramatic lighting"];
  const EFFECT_WORDS = ["sparkle","motion lines","speed lines","steam","fire","wind","blurry","bokeh","depth of field","notice lines","glitter","smoke","particles"];
  const COLOR_STYLE_WORDS = ["monochrome","greyscale","limited palette","pastel colors","vivid colors","colorful","sepia","muted colors"];
  const ART_STYLE_WORDS = ["sketch","chibi","lineart","watercolor","pixel art","silhouette","3d","realistic","painting","traditional media","anime coloring","rough sketch"];
  const SYMBOL_TEXT_WORDS = ["speech bubble","sound effects","heart","star (symbol)","cross","crescent","question mark","exclamation mark","text","music note"];

  const AGE_TYPE_WORDS = [
    "adult","mature female","mature male","old woman","old man","elderly","middle-aged",
    "young woman","young man","woman","man","female","male","androgynous","tomboy",
    "crossdressing","genderswap","genderswap (mtf)","genderswap (ftm)"
  ];

  const MOUTH_TEETH_WORDS = [
    "mouth","open mouth","closed mouth","parted lips","lips","lipstick","tongue",
    "tongue out","teeth","fang","fangs","sharp teeth","clenched teeth","saliva",
    "drooling","biting lip","licking lips"
  ];

  const UNIFORM_WORDS = [
    "school uniform","sailor uniform","serafuku","military uniform","police uniform",
    "nurse","maid","waitress","office lady","business suit","lab coat","chef",
    "sports uniform","gym uniform","track suit","cheerleader","flight attendant"
  ];

  const PATTERN_WORDS = [
    "plaid","striped","polka dot","checkered","floral print","camouflage","animal print",
    "print","patterned","denim","leather","latex","lace","mesh","fur trim","see-through"
  ];

  const CLOTHING_STATE_WORDS = [
    "open clothes","open shirt","open jacket","unbuttoned","unzipped","torn clothes",
    "wet clothes","clothes pull","clothes lift","clothes tug","shirt lift","skirt lift",
    "disheveled clothes","partially unbuttoned","off shoulder"
  ];

  const MOVEMENT_WORDS = [
    "walking","running","jumping","swimming","flying","floating","falling","climbing",
    "crawling","skating","skiing","cycling","riding","sprinting"
  ];

  const DAILY_ACTION_WORDS = [
    "eating","drinking","reading","writing","cooking","sleeping","waking up","washing",
    "brushing teeth","smoking","shopping","studying","working","typing","talking",
    "phone call","taking photo","photography","cleaning","bathing"
  ];

  const PERFORMANCE_WORDS = [
    "singing","dancing","playing instrument","guitar playing","piano playing",
    "violin playing","drumming","conducting","performing"
  ];

  const LAYOUT_WORDS = [
    "multiple views","reference sheet","character sheet","turnaround","split screen",
    "panel layout","two-shot","group shot","symmetrical composition","centered",
    "off-center","rule of thirds","diagonal composition"
  ];

  const CAMERA_EFFECT_WORDS = [
    "fisheye","wide-angle lens","telephoto","lens flare","depth of field","bokeh",
    "motion blur","blurry foreground","blurry background","chromatic aberration",
    "film grain","vignette","perspective"
  ];

  const HOME_INDOOR_WORDS = [
    "bedroom","living room","kitchen","bathroom","home interior","house","apartment",
    "bed","sofa","dining room","balcony"
  ];

  const PUBLIC_INDOOR_WORDS = [
    "restaurant","cafe","bar","shop","store","mall","library","museum","hospital",
    "hotel","gym","locker room","church","temple","station interior"
  ];

  const SCHOOL_WORK_WORDS = [
    "classroom","school","school hallway","schoolyard","office","workplace","laboratory",
    "meeting room","desk","blackboard","chalkboard"
  ];

  const URBAN_WORDS = [
    "street","city","cityscape","road","sidewalk","alley","bridge","building","rooftop",
    "parking lot","crosswalk","train station","urban","downtown"
  ];

  const WATER_WORDS = [
    "beach","ocean","sea","river","lake","pool","poolside","underwater","waterfall",
    "shore","coast","hot spring","onsen","bath"
  ];

  const TRANSPORT_PLACE_WORDS = [
    "train interior","car interior","bus interior","airplane interior","ship interior",
    "subway","station","platform","airport"
  ];

  const FANTASY_PLACE_WORDS = [
    "space","outer space","spaceship interior","fantasy","castle","dungeon","ruins",
    "heaven","hell","dream","surreal","void","cyberspace","underworld"
  ];

  const STATIONERY_WORDS = [
    "book","notebook","paper","letter","pen","pencil","eraser","ruler","scissors",
    "clipboard","document","newspaper","magazine","map"
  ];

  const CONTAINER_TABLEWARE_WORDS = [
    "cup","mug","glass","bottle","plate","bowl","tray","teapot","kettle","fork","spoon",
    "knife (utensil)","chopsticks","can","jar"
  ];

  const ANIMAL_WORDS = [
    "cat","dog","bird","fish","rabbit","horse","butterfly","insect","snake","dragon",
    "fox","wolf","bear","mouse","hamster","frog","turtle","shark","whale"
  ];

  const PLANT_WORDS = [
    "flower","rose","sunflower","lily","tree","plant","grass","leaf","petals","bouquet",
    "cherry blossoms","bamboo","cactus","vine"
  ];

  const TOOL_WORDS = [
    "tool","hammer","screwdriver","wrench","drill","saw","scissors","needle","thread",
    "paintbrush","brush","flashlight","rope","chain","bucket"
  ];

  const VEHICLE_WORDS = [
    "car","truck","bus","train","motorcycle","bicycle","airplane","helicopter","boat",
    "ship","spaceship","tank","vehicle","scooter"
  ];

  const INSTRUMENT_WORDS = [
    "guitar","piano","violin","cello","flute","trumpet","saxophone","drums","drum",
    "microphone","musical instrument","bass guitar","harp"
  ];

  const SPORTS_WORDS = [
    "ball","soccer ball","basketball","baseball","tennis racket","volleyball","bat",
    "glove","skateboard","surfboard","sports equipment","dumbbell"
  ];

  const TOY_WORDS = [
    "stuffed toy","plush","plush toy","doll","figure","toy","teddy bear","balloon",
    "playing cards","board game"
  ];

  const LINE_RENDER_WORDS = [
    "lineart","outline","thick lineart","thin lineart","colored lineart","cel shading",
    "soft shading","flat color","gradient shading","crosshatching","hatching","rough sketch"
  ];

  const TEXTURE_WORDS = [
    "watercolor","oil painting","pastel","colored pencil","marker","crayon","ink",
    "traditional media","paper texture","canvas texture","grain","film grain"
  ];

  const ADULT_NUDITY_WORDS = [
    "nude","naked","topless","bottomless","completely nude","partial nudity",
    "covering breasts","covering crotch","nude towel","nude apron","strategic covering"
  ];

  const ADULT_BREAST_WORDS = [
    "breasts","large breasts","medium breasts","small breasts","huge breasts",
    "flat chest","nipples","areola","cleavage","sideboob","underboob","breast press",
    "breast hold","breast grab","breast squeeze","breast lift"
  ];

  const ADULT_GENITAL_WORDS = [
    "penis","vagina","pussy","genitals","testicles","pubic hair","erection",
    "cameltoe","crotch","labia"
  ];

  const ADULT_SEX_ACT_WORDS = [
    "sex","vaginal","anal","penetration","sexual intercourse","cowgirl position",
    "reverse cowgirl position","missionary","doggystyle","spooning sex","clothed sex",
    "group sex","threesome","orgy"
  ];

  const ADULT_ORAL_MANUAL_WORDS = [
    "oral","fellatio","cunnilingus","handjob","fingering","breast sucking",
    "nipple sucking","licking","deepthroat","irrumatio"
  ];

  const ADULT_MASTURBATION_WORDS = [
    "masturbation","masturbating","female masturbation","male masturbation",
    "self fingering","self fondle","self sucking"
  ];

  const ADULT_FLUID_WORDS = [
    "cum","semen","ejaculation","facial","cum on body","cum on breasts","cum on face",
    "cum in mouth","cum inside","after sex","saliva","drool"
  ];

  const ADULT_FETISH_WORDS = [
    "bondage","bdsm","restraints","handcuffs","rope bondage","gag","blindfold",
    "collar and leash","latex","dominatrix","femdom","submission","spanking",
    "whip","chastity"
  ];

  const ADULT_CLOTHING_WORDS = [
    "panties","bra","lingerie","underwear","thong","garter belt","stockings",
    "babydoll","corset","latex suit","bunny suit","micro bikini","bikini"
  ];

  const ADULT_POSE_WORDS = [
    "spread legs","legs apart","on all fours","arched back","presenting",
    "ass focus","breast focus","crotch focus","between breasts","between legs",
    "after sex","post-coital"
  ];

  function isAdultTag(tag) {
    return has(tag, ADULT_NUDITY_WORDS) ||
      has(tag, ADULT_BREAST_WORDS) ||
      has(tag, ADULT_GENITAL_WORDS) ||
      has(tag, ADULT_SEX_ACT_WORDS) ||
      has(tag, ADULT_ORAL_MANUAL_WORDS) ||
      has(tag, ADULT_MASTURBATION_WORDS) ||
      has(tag, ADULT_FLUID_WORDS) ||
      has(tag, ADULT_FETISH_WORDS) ||
      has(tag, ADULT_CLOTHING_WORDS) ||
      has(tag, ADULT_POSE_WORDS);
  }

  const ROLE_IDENTITY_WORDS = [
    "maid","nurse","teacher","student","office lady","waitress","chef","idol","princess",
    "queen","king","knight","witch","magician","angel","demon","bride","groom",
    "police","soldier","doctor","scientist","artist","musician","athlete","swimmer",
    "samurai","miko","shrine maiden","warrior","pilot","mechanic"
  ];

  const HAIR_ACCESSORY_WORDS = [
    "hair ornament","hairclip","hair flower","hair ribbon","hair bow","scrunchie",
    "hairband","headband","barrette","hairpin","hair ring","braided ribbon"
  ];

  const BODY_PART_WORDS = [
    "hand","hands","finger","fingers","arm","arms","leg","legs","foot","feet","toe","toes",
    "thigh","thighs","hip","hips","waist","stomach","belly","back","shoulder","shoulders",
    "neck","chest","breast","breasts","ass","butt","buttocks","navel","abdomen","rib",
    "collarbone","elbow","knees","calf","ankle","wrist"
  ];

  const CHARACTER_STATUS_WORDS = [
    "happy","sad","angry","embarrassed","shy","tired","sleepy","drunk","confused",
    "scared","nervous","relaxed","calm","serious","energetic","cheerful","gloomy",
    "lonely","melancholy","smug","aroused"
  ];

  const SWIMWEAR_WORDS = [
    "swimsuit","school swimsuit","bikini","one-piece swimsuit","micro bikini",
    "competition swimsuit","rash guard","beachwear","wet swimsuit","monokini"
  ];

  const SITTING_LYING_WORDS = [
    "sitting","lying","lying on bed","lying on stomach","lying on back","on side",
    "kneeling","seiza","wariza","crouching","squatting","reclining","leaning back"
  ];

  const HAND_GESTURE_WORDS = [
    "peace sign","thumbs up","thumbs down","pointing","finger gun","index finger raised",
    "hand on own face","hand on own hip","finger to mouth","v","ok sign","rock sign",
    "waving","saluting","clenched fist"
  ];

  const PERSPECTIVE_WORDS = [
    "foreshortening","perspective","vanishing point","dutch angle","three-quarter view",
    "front view","rear view","profile","side view","low angle","high angle","overhead"
  ];

  const EVENT_SCENE_WORDS = [
    "festival","fireworks","concert stage","stage","theater","wedding","christmas",
    "halloween","birthday","valentine","new year","party","ceremony","sports day"
  ];

  const DECORATION_WORDS = [
    "jewelry","necklace","earrings","bracelet","ring","brooch","medal","trophy",
    "ornament","banner","flag","gift","present","balloon","candle","lantern","clock",
    "watch","picture frame","poster"
  ];

  const ATMOSPHERE_WORDS = [
    "dramatic","cinematic","moody","romantic","cozy","dark","bright","soft",
    "glossy","shiny","sparkly","glittering","dreamy","ethereal","intense","dynamic"
  ];

  const AURA_EMOTION_WORDS = [
    "aura","loving aura","love aura","dark aura","evil aura","bright aura",
    "colored aura","heart aura","anger vein","anger symbol","gloom","gloomy aura",
    "menacing","intimidation","sparkling aura","radiating lines","notice lines",
    "heart-shaped aura","emotional aura","depressed aura","happy aura"
  ];

  const MAGIC_WORDS = [
    "magic","magical","spell","aura","energy","lightning","electricity","fire",
    "ice","flames","smoke","steam","explosion","particles","glow","summoning",
    "magic circle","barrier"
  ];

  const THEME_EVENT_WORDS = [
    "christmas","halloween","valentine","new year","summer festival","birthday",
    "wedding","graduation","holiday","party","sports day","tanabata","april fools"
  ];

  function regexTest(tag, patterns) {
    return patterns.some(re => re.test(tag));
  }

  const CHARACTER_FALLBACK_PATTERNS = [
    /\bhair\b/, /\bbang/, /\beye\b/, /\beyebrow\b/, /\beyelash\b/, /\bpupil\b/,
    /\bmouth\b/, /\blip\b/, /\btongue\b/, /\btooth\b/, /\bteeth\b/, /\bface\b/,
    /\bcheek\b/, /\bskin\b/, /\bear\b/, /\bhorn\b/, /\btail\b/, /\bwing\b/,
    /\bhalo\b/, /\bbody\b/, /\bbreast\b/, /\bass\b/, /\bnavel\b/, /\bwaist\b/,
    /\bthigh\b/, /\bhip\b/, /\bshoulder\b/, /\bhand\b/, /\bfinger\b/, /\bleg\b/,
    /\bfoot\b/, /\btoe\b/, /\bmuscle\b/, /\bfreckle\b/, /\bscar\b/, /\bmole\b/
  ];

  const CLOTHING_FALLBACK_PATTERNS = [
    /\bshirt\b/, /\bblouse\b/, /\bsweater\b/, /\bhoodie\b/, /\bjacket\b/, /\bcoat\b/,
    /\bdress\b/, /\bskirt\b/, /\bpants\b/, /\bshorts\b/, /\bjeans\b/, /\bsock\b/,
    /\bstocking\b/, /\bshoe\b/, /\bboot\b/, /\bglove\b/, /\bhat\b/, /\bcap\b/,
    /\bhelmet\b/, /\bhood\b/, /\bribbon\b/, /\bbow\b/, /\bnecktie\b/, /\bscarf\b/,
    /\bcollar\b/, /\bsleeve\b/, /\bclothes\b/, /\bclothing\b/, /\buniform\b/,
    /\bkimono\b/, /\barmor\b/, /\bapron\b/, /\bcorset\b/, /\bbikini\b/, /\bswimsuit\b/
  ];

  const POSE_FALLBACK_PATTERNS = [
    /\bstanding\b/, /\bsitting\b/, /\blying\b/, /\bkneeling\b/, /\bpose\b/,
    /\blook/, /\bgaze/, /\bholding\b/, /\bgrab/, /\btouch/, /\bpoint/, /\bhug/,
    /\bkiss/, /\bwave/, /\bsalut/, /\bwalk/, /\brun/, /\bjump/, /\bdance/,
    /\bgesture\b/, /\bposture\b/, /\bleaning\b/, /\bbending\b/, /\braise/
  ];

  const COMPOSITION_FALLBACK_PATTERNS = [
    /\bview\b/, /\bshot\b/, /\bangle\b/, /\bfocus\b/, /\bcrop\b/, /\bpanel\b/,
    /\bframe\b/, /\bcomposition\b/, /\bpov\b/, /\bperspective\b/, /\bfisheye\b/,
    /\bportrait\b/, /\bprofile\b/, /\bdepth of field\b/, /\bblur\b/, /\bmultiple\b/
  ];

  const ENVIRONMENT_FALLBACK_PATTERNS = [
    /\bbackground\b/, /\broom\b/, /\bhouse\b/, /\bbedroom\b/, /\bkitchen\b/,
    /\bbathroom\b/, /\bclassroom\b/, /\bschool\b/, /\boffice\b/, /\bstreet\b/,
    /\bcity\b/, /\broad\b/, /\bpark\b/, /\bbeach\b/, /\bocean\b/, /\bforest\b/,
    /\bmountain\b/, /\briver\b/, /\blake\b/, /\bsky\b/, /\bcloud\b/, /\brain\b/,
    /\bsnow\b/, /\bnight\b/, /\bsunset\b/, /\bsunrise\b/, /\bweather\b/,
    /\bindoors\b/, /\boutdoors\b/, /\bbuilding\b/, /\bcastle\b/, /\bspace\b/,
    /\bgarden\b/, /\bshop\b/, /\bcafe\b/, /\brestaurant\b/
  ];

  const OBJECT_FALLBACK_PATTERNS = [
    /\bphone\b/, /\bcamera\b/, /\bcomputer\b/, /\bbook\b/, /\bpaper\b/, /\bpen\b/,
    /\bpencil\b/, /\bchair\b/, /\btable\b/, /\bbed\b/, /\bcup\b/, /\bbottle\b/,
    /\bplate\b/, /\bfood\b/, /\bdrink\b/, /\bcake\b/, /\bbread\b/, /\bfruit\b/,
    /\bcat\b/, /\bdog\b/, /\bbird\b/, /\bflower\b/, /\bplant\b/, /\bsword\b/,
    /\bgun\b/, /\bknife\b/, /\btool\b/, /\bcar\b/, /\btrain\b/, /\bbus\b/,
    /\bairplane\b/, /\binstrument\b/, /\bball\b/, /\btoy\b/, /\bplush\b/,
    /\bbag\b/, /\bumbrella\b/, /\bbox\b/, /\bclock\b/, /\bwatch\b/
  ];

  const EFFECT_FALLBACK_PATTERNS = [
    /\blight\b/, /\blighting\b/, /\bshadow\b/, /\beffect\b/, /\bsparkle\b/,
    /\bglow\b/, /\bflare\b/, /\bbokeh\b/, /\bmonochrome\b/, /\bcolor\b/,
    /\bpalette\b/, /\bstyle\b/, /\brender\b/, /\blineart\b/, /\bsketch\b/,
    /\bpainting\b/, /\bwatercolor\b/, /\btexture\b/, /\bgrain\b/, /\baura\b/,
    /\bmagic\b/, /\bsymbol\b/, /\btext\b/, /\bspeech bubble\b/
  ];

  const ADULT_FALLBACK_PATTERNS = [
    /\bnude\b/, /\bnaked\b/, /\btopless\b/, /\bbottomless\b/, /\bbreast\b/,
    /\bnipple\b/, /\bareola\b/, /\bgenital\b/, /\bpenis\b/, /\bvagina\b/, /\bpussy\b/,
    /\bsex\b/, /\bcum\b/, /\bsemen\b/, /\bmasturb/, /\bbondage\b/, /\blingerie\b/,
    /\bunderwear\b/, /\bthong\b/, /\bbra\b/, /\bpanties\b/, /\banal\b/, /\boral\b/,
    /\bfellatio\b/, /\bcunnilingus\b/, /\bhandjob\b/, /\bfingering\b/,
    /\bejaculation\b/, /\bcensored\b/, /\buncensored\b/, /\bmosaic censoring\b/
  ];

  function fallbackClassify(tag) {
    if (regexTest(tag, ADULT_FALLBACK_PATTERNS)) return ["adult","adult_misc"];
    if (regexTest(tag, CHARACTER_FALLBACK_PATTERNS)) return ["character","character_misc"];
    if (regexTest(tag, CLOTHING_FALLBACK_PATTERNS)) return ["clothing","clothing_misc"];
    if (regexTest(tag, POSE_FALLBACK_PATTERNS)) return ["pose","pose_misc"];
    if (regexTest(tag, COMPOSITION_FALLBACK_PATTERNS)) return ["composition","composition_misc"];
    if (regexTest(tag, ENVIRONMENT_FALLBACK_PATTERNS)) return ["environment","environment_misc"];
    if (regexTest(tag, OBJECT_FALLBACK_PATTERNS)) return ["objects","object_misc"];
    if (regexTest(tag, EFFECT_FALLBACK_PATTERNS)) return ["effects","effect_misc"];
    if (has(tag, THEME_EVENT_WORDS)) return ["misc","theme_event"];
    if (/\bconcept\b|\babstract\b|\bsymbolic\b|\btheme\b|\bmotif\b/.test(tag)) return ["misc","abstract_misc"];
    return ["misc","general_misc"];
  }

  function has(tag, list) {
    const haystack = String(tag || "")
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\s+/g, " ")
      .trim();

    return list.some(raw => {
      const needle = String(raw || "")
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!needle) return false;
      if (haystack === needle) return true;

      // 単純な includes() は使わない。
      // "v" が "loving aura" に、"man" が "woman" に一致する等の誤分類を防ぐ。
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`);
      return pattern.test(haystack);
    });
  }

  function hasExact(tag, list) {
    const haystack = String(tag || "")
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\s+/g, " ")
      .trim();

    return list.some(raw => {
      const needle = String(raw || "")
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\s+/g, " ")
        .trim();

      return haystack === needle;
    });
  }

  function colorBefore(tag, suffix) {
    return COLOR_WORDS.some(c => tag === `${c} ${suffix}`);
  }

  function classify(tag) {
    // 成人向けは先に分離して、一般カテゴリへ誤投入しにくくする。
    if (isAdultTag(tag)) {
      if (has(tag, ADULT_NUDITY_WORDS)) return ["adult","adult_nudity"];
      if (has(tag, ADULT_BREAST_WORDS)) return ["adult","adult_breasts"];
      if (has(tag, ADULT_GENITAL_WORDS)) return ["adult","adult_genitals"];
      if (has(tag, ADULT_ORAL_MANUAL_WORDS)) return ["adult","adult_oral_manual"];
      if (has(tag, ADULT_MASTURBATION_WORDS)) return ["adult","adult_masturbation"];
      if (has(tag, ADULT_FLUID_WORDS)) return ["adult","adult_fluids"];
      if (has(tag, ADULT_FETISH_WORDS)) return ["adult","adult_fetish"];
      if (has(tag, ADULT_CLOTHING_WORDS)) return ["adult","adult_clothing"];
      if (has(tag, ADULT_POSE_WORDS)) return ["adult","adult_pose"];
      if (has(tag, ADULT_SEX_ACT_WORDS)) return ["adult","adult_sex_act"];
    }

    // 感情オーラ類は、"v" など短いジェスチャータグより先に判定する。
    if (has(tag, AURA_EMOTION_WORDS)) return ["effects","aura_emotion"];

    // 人数・構成
    if (/^\d+\+?(girls|boys)$/.test(tag) ||
        /^\d+(girls|boys)$/.test(tag) ||
        has(tag, ["solo","multiple girls","multiple boys","no humans","male focus",
                  "female focus","solo focus","hetero","1girl","1boy"])) {
      return ["character","count"];
    }

    if (has(tag, AGE_TYPE_WORDS)) return ["character","age_type"];
    if (has(tag, ROLE_IDENTITY_WORDS)) return ["character","identity_role"];

    // 構図
    if (hasExact(tag, FRAMING_WORDS)) return ["composition","framing"];
    if (hasExact(tag, VIEWPOINT_WORDS)) return ["composition","viewpoint"];
    if (hasExact(tag, FOCUS_WORDS)) return ["composition","focus"];
    if (hasExact(tag, CROP_WORDS)) return ["composition","crop"];
    if (hasExact(tag, LAYOUT_WORDS)) return ["composition","layout"];
    if (hasExact(tag, CAMERA_EFFECT_WORDS)) return ["composition","camera_effect"];
    if (hasExact(tag, PERSPECTIVE_WORDS)) return ["composition","perspective"];
    if (hasExact(tag, FORMAT_WORDS)) return ["composition","format"];

    // ポーズ・動作
    if (tag.startsWith("holding ") || tag === "holding") return ["pose","holding"];
    if (has(tag, GAZE_WORDS)) return ["pose","gaze"];
    if (has(tag, HAND_GESTURE_WORDS)) return ["pose","hand_gesture"];
    if (has(tag, HAND_WORDS) || /\b(hand|hands|arm|arms|finger|fingers)\b/.test(tag)) return ["pose","arms_hands"];
    if (has(tag, LEG_WORDS) || /\b(leg|legs|foot|feet|knee|knees)\b/.test(tag)) return ["pose","legs_feet"];
    if (has(tag, SITTING_LYING_WORDS)) return ["pose","sitting_lying"];
    if (has(tag, POSTURE_WORDS)) return ["pose","posture"];
    if (has(tag, INTERACTION_WORDS)) return ["pose","interaction"];
    if (has(tag, MOVEMENT_WORDS)) return ["pose","movement"];
    if (has(tag, PERFORMANCE_WORDS)) return ["pose","performance"];
    if (has(tag, DAILY_ACTION_WORDS) || has(tag, ACTION_WORDS)) return ["pose","daily_action"];

    // キャラクター
    if (colorBefore(tag, "hair")) return ["character","hair_color"];
    if (has(tag, ["very short hair","short hair","medium hair","long hair","very long hair",
                  "absurdly long hair","big hair","bald","balding","short twintails"])) {
      return ["character","hair_length"];
    }
    if (has(tag, HAIR_ACCESSORY_WORDS)) return ["character","hair_accessory"];
    if (has(tag, BANG_WORDS)) return ["character","bangs"];
    if (has(tag, HAIR_STYLE_WORDS) ||
        /\b(ponytail|twintails|braid|braids|hair bun|drill hair|ringlets)\b/.test(tag)) {
      return ["character","hair_style"];
    }

    if (colorBefore(tag, "eyes")) return ["character","eye_color"];
    if (/\b(pupils|eyelashes|eyebrows|eye covered|eyes visible|heterochromia|eyepatch|eyeshadow|eyeliner)\b/.test(tag)) {
      return ["character","eye_features"];
    }
    if (has(tag, MOUTH_TEETH_WORDS)) return ["character","mouth_teeth"];
    if (has(tag, EXPRESSIONS)) return ["character","expression"];
    if (has(tag, FANTASY_TRAITS)) return ["character","fantasy_traits"];
    if (has(tag, BODY_PART_WORDS)) return ["character","body_parts"];
    if (has(tag, BODY_WORDS)) return ["character","body"];
    if (has(tag, CHARACTER_STATUS_WORDS)) return ["character","character_status"];
    if (/\b(face|skin|mole|scar|freckles|lipstick|makeup|cheek)\b/.test(tag)) return ["character","face_skin"];

    // 服装
    if (has(tag, UNIFORM_WORDS)) return ["clothing","uniforms"];
    if (has(tag, SWIMWEAR_WORDS)) return ["clothing","swimwear"];
    if (has(tag, PATTERN_WORDS)) return ["clothing","patterns"];
    if (has(tag, CLOTHING_STATE_WORDS)) return ["clothing","clothing_state"];
    if (has(tag, OUTFIT_WORDS)) return ["clothing","outfit"];
    if (has(tag, TOP_WORDS)) return ["clothing","tops"];
    if (has(tag, BOTTOM_WORDS)) return ["clothing","bottoms"];
    if (has(tag, DRESS_WORDS)) return ["clothing","dresses"];
    if (has(tag, OUTER_WORDS)) return ["clothing","outerwear"];
    if (has(tag, SLEEVE_WORDS)) return ["clothing","sleeves"];
    if (has(tag, LEGWEAR_WORDS)) return ["clothing","legwear"];
    if (has(tag, FOOT_WORDS)) return ["clothing","footwear"];
    if (has(tag, HEAD_WORDS)) return ["clothing","headwear"];
    if (has(tag, NECK_WORDS)) return ["clothing","neckwear"];
    if (has(tag, ARM_WORDS)) return ["clothing","armwear"];
    if (has(tag, ACCESSORY_WORDS)) return ["clothing","accessories"];
    if (has(tag, CLOTHING_DETAIL_WORDS)) return ["clothing","clothing_detail"];

    // 環境
    if (has(tag, BACKGROUND_WORDS)) return ["environment","background"];
    if (has(tag, HOME_INDOOR_WORDS)) return ["environment","home_indoor"];
    if (has(tag, PUBLIC_INDOOR_WORDS)) return ["environment","public_indoor"];
    if (has(tag, SCHOOL_WORK_WORDS)) return ["environment","school_work"];
    if (has(tag, EVENT_SCENE_WORDS)) return ["environment","event_scene"];
    if (has(tag, URBAN_WORDS) || has(tag, OUTDOOR_WORDS)) return ["environment","urban"];
    if (has(tag, WATER_WORDS)) return ["environment","water"];
    if (has(tag, TRANSPORT_PLACE_WORDS)) return ["environment","transport_place"];
    if (has(tag, FANTASY_PLACE_WORDS)) return ["environment","fantasy_place"];
    if (has(tag, NATURE_WORDS)) return ["environment","nature"];
    if (has(tag, WEATHER_WORDS)) return ["environment","time_weather"];

    // 効果・スタイル
    if (has(tag, LIGHT_WORDS)) return ["effects","lighting"];
    if (has(tag, LINE_RENDER_WORDS)) return ["effects","line_render"];
    if (has(tag, TEXTURE_WORDS)) return ["effects","texture"];
    if (has(tag, ATMOSPHERE_WORDS)) return ["effects","atmosphere"];
    if (has(tag, MAGIC_WORDS)) return ["effects","magic"];
    if (has(tag, EFFECT_WORDS)) return ["effects","visual_effect"];
    if (has(tag, COLOR_STYLE_WORDS)) return ["effects","color"];
    if (has(tag, ART_STYLE_WORDS)) return ["effects","art_style"];
    if (has(tag, SYMBOL_TEXT_WORDS)) return ["effects","symbol_text"];

    // 物
    if (has(tag, DEVICE_WORDS)) return ["objects","device"];
    if (has(tag, STATIONERY_WORDS)) return ["objects","stationery"];
    if (has(tag, CONTAINER_TABLEWARE_WORDS)) return ["objects","container_tableware"];
    if (has(tag, FURNITURE_WORDS)) return ["objects","furniture"];
    if (has(tag, FOOD_WORDS)) return ["objects","food"];
    if (has(tag, ANIMAL_WORDS)) return ["objects","animal"];
    if (has(tag, PLANT_WORDS)) return ["objects","plant"];
    if (has(tag, WEAPON_WORDS)) return ["objects","weapon"];
    if (has(tag, TOOL_WORDS)) return ["objects","tool"];
    if (has(tag, VEHICLE_WORDS)) return ["objects","vehicle"];
    if (has(tag, INSTRUMENT_WORDS)) return ["objects","instrument"];
    if (has(tag, SPORTS_WORDS)) return ["objects","sports"];
    if (has(tag, TOY_WORDS)) return ["objects","toy"];
    if (has(tag, DECORATION_WORDS)) return ["objects","decoration"];
    if (has(tag, MISC_OBJECT_WORDS)) return ["objects","misc_object"];

    // テーマ・イベント
    if (has(tag, THEME_EVENT_WORDS)) return ["misc","theme_event"];

    // ここまでで分類できなかったものは、キーワードベースの受け皿へ回す。
    return fallbackClassify(tag);
  }

  function parseCsvLine(line) {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (quoted && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === "," && !quoted) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  function makeEmptyData() {
    return SCHEMA.map((cat, catIndex) => ({
      id: cat.id,
      label: cat.label,
      randomAll: cat.randomAll,
      sections: cat.sections.map(([id, label], idx) => ({
        id, label, mode: "multi",
        order: (catIndex + 1) * 100 + idx,
        tags: []
      }))
    }));
  }

  function sectionOf(data, categoryId, sectionId) {
    return data.find(c => c.id === categoryId)?.sections.find(s => s.id === sectionId);
  }

  function isBlocked(tag) {
    if (META_BLOCKED.includes(tag)) return true;
    return BLOCKED.some(re => re.test(tag));
  }

  function safeJa(raw) {
    if (!raw) return "";
    const s = raw.trim();
    if (!s || s.length > 36) return "";
    return s;
  }

  function makeMembership(category, section) {
    return [{
      categoryId: category.id,
      categoryLabel: category.label,
      sectionId: section.id,
      sectionLabel: section.label,
      order: section.order
    }];
  }

  async function loadRemote() {
    const response = await fetch(REMOTE_CSV, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const text = await response.text();
    const data = makeEmptyData();

    const allTags = [];
    const allTagKeys = new Set();

    // generalタグCSV全体を見る。
    const lines = text.split(/\r?\n/);
    let accepted = 0;

    for (const line of lines) {
      if (!line) continue;
      const cols = parseCsvLine(line);
      if (cols.length < 3) continue;

      const rawTag = (cols[0] || "").trim().toLowerCase();
      const count = Number(cols[2] || 0);
      const aliases = (cols[3] || "")
        .split(",")
        .map(x => x.trim().toLowerCase())
        .filter(Boolean);
      const ja = safeJa(cols[4] || "");

      if (!rawTag || count < 200 || isBlocked(rawTag)) continue;

      const dest = classify(rawTag);
      if (!dest) continue;

      const section = sectionOf(data, dest[0], dest[1]);
      const category = data.find(c => c.id === dest[0]);
      if (!section || !category) continue;
      const internalTag = rawTag.replaceAll(" ", "_");
      if (section.tags.some(t => t.tag === internalTag)) continue;

      const item = {
        tag: internalTag,
        aliases: aliases.map(x => x.replaceAll(" ", "_")),
        ja,
        count,
        memberships: makeMembership(category, section)
      };

      section.tags.push(item);
      accepted++;

      if (!allTagKeys.has(internalTag)) {
        allTagKeys.add(internalTag);
        allTags.push(item);
      }
    }

    for (const cat of data) {
      cat.sections = cat.sections.filter(s => s.tags.length > 0);
    }
    const compact = data.filter(c => c.sections.length > 0);

    return { data: compact, allTags, accepted, source: REMOTE_CSV };
  }

  // 外部読込失敗時用。少数だがUIが崩れない程度。
  const FALLBACK = [
    ["character","count","1girl","女性1人",8414954],
    ["character","count","1boy","男性1人",2131635],
    ["character","count","2girls","女性2人",1438938],
    ["character","count","multiple_girls","複数女性",768597],
    ["character","count","solo","ソロ",7066603],
    ["character","hair_color","black_hair","黒髪",2203058],
    ["character","hair_color","blonde_hair","金髪",2172640],
    ["character","hair_color","brown_hair","茶髪",2089644],
    ["character","hair_length","long_hair","ロングヘア",6211043],
    ["character","hair_style","twintails","ツインテール",1237511],
    ["character","hair_style","ponytail","ポニーテール",966634],
    ["character","bangs","hair_between_eyes","目の間の髪",1788157],
    ["character","eye_color","blue_eyes","青い目",2472009],
    ["character","expression","smile","笑顔",4173587],
    ["character","expression","blush","頬染め",4103337],
    ["character","fantasy_traits","wings","翼",625818],
    ["clothing","tops","shirt","シャツ",2944989],
    ["clothing","tops","white_shirt","白シャツ",1418195],
    ["clothing","bottoms","skirt","スカート",2181736],
    ["clothing","dresses","dress","ドレス",1955233],
    ["clothing","outerwear","jacket","ジャケット",1494781],
    ["clothing","outfit","school_uniform","制服",1057572],
    ["clothing","legwear","thighhighs","ニーソックス",1534316],
    ["pose","posture","standing","立つ",1333367],
    ["pose","gaze","looking_at_viewer","こちらを見る",4918745],
    ["pose","arms_hands","peace_sign","ピース",628935],
    ["composition","framing","full_body","全身",1284366],
    ["composition","framing","upper_body","上半身",1195910],
    ["environment","background","simple_background","単純背景",2869702],
    ["environment","outdoor","outdoors","屋外",810625],
    ["objects","food","cake","ケーキ",312000],
    ["effects","color","monochrome","モノクロ",854621]
  ];

  function fallbackData() {
    const data = makeEmptyData();
    const allTags = [];
    const keys = new Set();

    for (const [catId, secId, tag, ja, count] of FALLBACK) {
      const category = data.find(c => c.id === catId);
      const section = sectionOf(data, catId, secId);
      if (!category || !section) continue;

      const item = {
        tag,
        aliases: [],
        ja,
        count,
        memberships: makeMembership(category, section)
      };
      section.tags.push(item);

      if (!keys.has(tag)) {
        keys.add(tag);
        allTags.push(item);
      }
    }

    for (const cat of data) cat.sections = cat.sections.filter(s => s.tags.length);
    return {
      data: data.filter(c => c.sections.length),
      allTags
    };
  }

  window.PromptCatalog = {
    loadRemote,
    fallbackData
  };
})();

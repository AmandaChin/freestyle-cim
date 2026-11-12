(function () {
  const ASSET_ROOT = "./assets/skates/yjs-pro-cim/";
  // 资源快照来自 2026-11-12 的 CIM Base；每次同步表格资源时递增版本，避免缓存继续命中旧图片。
  const ASSET_VERSION = "20261112-cim-base-v1";

  // 资源分类、皮料编号和图片文件以 Base「皮料图片」表为准。
  const categorySeed = [
    ["pu", "PU", "PU", ["1", "2", "3", "5", "9"]],
    ["others", "OTHERS", "Others", ["6", "12", "14", "15", "49", "50", "51", "60", "61", "62", "63", "64", "65", "66", "67"]],
    ["bear", "小熊", "Bear", ["7", "8"]],
    ["twill-dot", "斜纹点子布", "Twill dot fabric", ["16", "33"]],
    ["chinoiserie", "中国风", "Chinoiserie", ["17", "34", "52", "53"]],
    ["straw", "草席", "Straw texture", ["18", "31", "32", "35", "36", "37", "39", "41"]],
    ["leather", "皮革", "Leather", ["19", "20", "27", "28", "30", "42"]],
    ["silk-texture", "丝状肌理", "Silk texture", ["22", "24", "38"]],
    ["tpu", "TPU", "TPU", ["23", "25", "26", "29", "40"]],
    ["scale", "鳞片", "Scale texture", ["43", "44", "45", "46", "47", "48"]]
  ];

  const materialCategories = categorySeed.map(([id, name, en]) => ({
    id,
    name,
    en,
    note: "正式皮料",
    kind: "official_texture_set",
    groups: ["upper", "strap"]
  }));

  const materialTextures = categorySeed.flatMap(([categoryId, categoryName, categoryEn, ids]) => ids.map((id) => ({
    id,
    name: `${id}号皮料`,
    en: `Leather No. ${id}`,
    categoryId,
    categoryName,
    categoryEn,
    file: `${categoryName}/${id}.jpg`
  })));

  // 主表当前普通皮料配置的原始顺序，包含已建关系但尚无图片的编号。
  const fullMaterialIds = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "17", "18", "22", "23",
    "24", "25", "26", "29", "31", "32", "34", "35", "36", "37", "38", "39", "40", "41", "43", "44",
    "45", "46", "47", "48", "49", "50", "51", "52", "53", "60", "61", "62", "63", "64", "65", "66",
    "67", "55", "57", "54", "56", "58", "59"
  ];
  // H 裁片按 Base 当前关系单独配置，不能从普通裁片关系推导。
  const toeMaterialIds = [
    "32", "36", "37", "18", "35", "41", "38", "24", "22", "15", "59", "53", "34", "52", "17", "16",
    "14", "49", "50", "11", "10", "61", "62", "63", "64", "65", "66", "67", "6"
  ];

  // k 是 Base 中保留大小写的业务 key，C 端历史组件 ID 为 K；通过显式映射保持两边语义一致。
  const materialKeyAliases = { k: "K" };
  const materialAvailabilityByAngle = {
    side: {
      A: fullMaterialIds, B: fullMaterialIds, C: fullMaterialIds, C1: fullMaterialIds, C2: fullMaterialIds, C3: fullMaterialIds,
      F: fullMaterialIds, F1: fullMaterialIds, G: fullMaterialIds, H: toeMaterialIds, I: fullMaterialIds, K: fullMaterialIds
    },
    forty_five: {
      A: fullMaterialIds, C: fullMaterialIds, C1: fullMaterialIds, C2: fullMaterialIds, C3: fullMaterialIds,
      F: fullMaterialIds, F1: fullMaterialIds, G: fullMaterialIds, H: toeMaterialIds, I: fullMaterialIds, K: fullMaterialIds
    },
    front: {
      C: fullMaterialIds, C1: fullMaterialIds, C2: fullMaterialIds, C3: fullMaterialIds,
      F1: fullMaterialIds, G: fullMaterialIds, H: toeMaterialIds, I: fullMaterialIds, K: fullMaterialIds
    }
  };
  const materialAvailability = Object.fromEntries(
    ["A", "B", "C", "C1", "C2", "C3", "F", "F1", "G", "I", "K"].map((key) => [key, fullMaterialIds])
  );
  materialAvailability.H = toeMaterialIds;

  // 主表「默认皮料」按视角拆开保存；未列出的固定裁片不参与皮料默认值。
  const defaultMaterialsByAngle = {
    side: { A: "51", B: "50", C: "50", C1: "49", C2: "50", C3: "50", F: "50", F1: "50", G: "49", H: "50", I: "50", K: "50" },
    forty_five: { A: "51", C: "50", C1: "49", C2: "50", C3: "50", F: "50", F1: "50", G: "49", H: "50", I: "50", K: "50" },
    front: { C: "50", C1: "49", C2: "50", C3: "50", F1: "50", G: "50", H: "50", I: "50", K: "50" }
  };

  const materials = [
    ...materialCategories,
    { id: "fixed-image", name: "固定样式", en: "Fixed style", note: "", kind: "fixed", groups: ["fixed"] }
  ];

  const palettes = {
    leather: [
      { id: "white", name: "瓷白", value: "#f7f7f8" },
      { id: "pink", name: "樱花粉", value: "#f0b7c8" },
      { id: "silver", name: "银灰", value: "#cfd2d5" },
      { id: "black", name: "黑色", value: "#17171a" },
      { id: "mint", name: "薄荷绿", value: "#86d9bd" },
      { id: "lavender", name: "淡紫", value: "#ad94ff" },
      { id: "red", name: "枫叶红", value: "#d94b48" }
    ],
    strap: [
      { id: "white", name: "白色", value: "#f7f7f8" },
      { id: "black", name: "黑色", value: "#17171a" },
      { id: "pink", name: "樱花粉", value: "#f0b7c8" }
    ],
    hardware: [
      { id: "white", name: "白色", value: "#f7f7f8" },
      { id: "silver", name: "银色", value: "#cfd2d5" },
      { id: "black", name: "黑色", value: "#17171a" }
    ],
    sole: [
      { id: "black", name: "黑色", value: "#17171a" },
      { id: "white", name: "白色", value: "#f7f7f8" },
      { id: "grey", name: "灰色", value: "#8f9298" }
    ]
  };

  const fixedStyleSets = {
    lace: {
      // 鞋带只允许使用产品确认的 5 个固定色值，不能回退到官方皮料库。
      colorOptions: [
        { id: "black", name: "黑色", en: "Black", value: "#000000", swatch: "#000000" },
        { id: "white", name: "白色", en: "White", value: "#ffffff", swatch: "#ffffff" },
        { id: "red", name: "红色", en: "Red", value: "#e41c16", swatch: "#e41c16" },
        { id: "ochre", name: "土黄色", en: "Ochre", value: "#e2bc00", swatch: "#e2bc00" },
        { id: "purple", name: "紫色", en: "Purple", value: "#380059", swatch: "#380059" }
      ]
    }
  };

  const fixedVariants = {
    D: [
      { id: "cuff-black-gold", name: "黑金色 CUFF", en: "Black-gold cuff", swatch: "linear-gradient(135deg, #302010 0 72%, #403020 100%)" },
      { id: "cuff-silver", name: "银色 CUFF", en: "Silver cuff", swatch: "linear-gradient(135deg, #b0b0b0 0 72%, #d8d8d8 100%)" },
      { id: "cuff-red-black", name: "红黑色 CUFF", en: "Red-black cuff", swatch: "linear-gradient(135deg, #301010 0 72%, #401818 100%)" },
      { id: "cuff-black-purple", name: "黑紫色 CUFF", en: "Black-purple cuff", swatch: "linear-gradient(135deg, #281830 0 72%, #302038 100%)" },
      { id: "cuff-black", name: "黑色 CUFF", en: "Black cuff", swatch: "linear-gradient(135deg, #202020 0 72%, #303030 100%)" }
    ],
    D1: [
      { id: "mushroom-nail-white", name: "白色蘑菇钉", en: "White mushroom nail", swatch: "#f7f7f8" },
      { id: "mushroom-nail-black", name: "黑色蘑菇钉", en: "Black mushroom nail", swatch: "#17171a" }
    ],
    E: [
      { id: "sole-silver", name: "银色碳纤鞋壳", en: "Silver carbon shell", swatch: "linear-gradient(135deg, #d8d0d0 0 72%, #e0e0e0 100%)" },
      { id: "sole-black-red", name: "黑红色碳纤鞋壳", en: "Black-red carbon shell", swatch: "linear-gradient(135deg, #301010 0 72%, #401818 100%)" },
      { id: "sole-black-purple", name: "黑紫色碳纤鞋壳", en: "Black-purple carbon shell", swatch: "linear-gradient(135deg, #281830 0 72%, #302038 100%)" },
      { id: "sole-black", name: "黑色碳纤鞋壳", en: "Black carbon shell", swatch: "linear-gradient(135deg, #202020 0 72%, #282828 100%)" }
    ],
    M: [
      { id: "upper-strap-white", name: "白色上能量带", en: "White upper energy strap", swatch: "#f7f7f8" },
      { id: "upper-strap-black", name: "黑色上能量带", en: "Black upper energy strap", swatch: "#17171a" }
    ],
    N: [
      { id: "lower-strap-white", name: "白色下能量带", en: "White lower energy strap", swatch: "#f7f7f8" },
      { id: "lower-strap-black", name: "黑色下能量带", en: "Black lower energy strap", swatch: "#17171a" }
    ],
    L: [
      { id: "pad-new-white", name: "新防磨片 · 白色", en: "New abrasion pad · White", swatch: "#f7f7f8" },
      { id: "pad-new-black", name: "新防磨片 · 黑色", en: "New abrasion pad · Black", swatch: "#17171a" },
      { id: "pad-old-white", name: "旧防磨片 · 白色", en: "Old abrasion pad · White", swatch: "#f7f7f8" },
      { id: "pad-old-black", name: "旧防磨片 · 黑色", en: "Old abrasion pad · Black", swatch: "#17171a" }
    ]
  };

  // 固定色值默认项来自 CIM 主表备注；J 的默认值按视角区分，O 为主绣线默认黑色。
  const defaultFixedColorsByAngle = {
    side: { J: "#380059", O: "#111111" },
    forty_five: { J: "#380059", O: "#111111" },
    front: { J: "#000000", O: "#111111" }
  };

  // C 端初始显示使用侧面视角的 Base 默认皮料；切换视角时可通过 defaultMaterialsByAngle 查对应默认值。
  const defaultMaterial = defaultMaterialsByAngle.side;
  const defaultWhite = "#f7f7f8";
  const parts = [
    { key: "A", name: "鞋帮", en: "Shoe collar", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 30, defaultStyle: { color: defaultWhite, material: defaultMaterial.A } },
    { key: "B", name: "后提带", en: "Back handle strap", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 34, defaultStyle: { color: defaultWhite, material: defaultMaterial.B } },
    { key: "C", name: "鞋舌", en: "Tongue", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 55, defaultStyle: { color: defaultWhite, material: defaultMaterial.C } },
    { key: "C1", name: "鞋舌三角片", en: "Tongue triangle", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 56, defaultStyle: { color: defaultWhite, material: defaultMaterial.C1 } },
    { key: "C2", name: "皮垫套下片", en: "Pad sleeve lower", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 57, defaultStyle: { color: defaultWhite, material: defaultMaterial.C2 } },
    { key: "C3", name: "皮垫套上片", en: "Pad sleeve upper", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 58, defaultStyle: { color: defaultWhite, material: defaultMaterial.C3 } },
    { key: "E", name: "碳纤鞋壳", en: "Carbon shell", group: "sole", selectable: true, renderMode: "fixed_variant", renderOrder: 20, defaultStyle: { material: "fixed-image", variant: "sole-black-purple" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.E },
    { key: "F", name: "下鞋身片", en: "Lower body", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 35, defaultStyle: { color: defaultWhite, material: defaultMaterial.F } },
    { key: "F1", name: "下鞋身片2", en: "Lower body 2", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 40, defaultStyle: { color: defaultWhite, material: defaultMaterial.F1 } },
    // CUFF 和蘑菇钉是外露五金，必须压在下鞋身片之上，同时仍保留在上鞋身片 G 之前。
    { key: "D", name: "CUFF", en: "Cuff", group: "hardware", selectable: true, renderMode: "fixed_variant", renderOrder: 42, defaultStyle: { material: "fixed-image", variant: "cuff-black-purple" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.D },
    { key: "D1", name: "蘑菇钉", en: "Mushroom nail", group: "hardware", selectable: true, renderMode: "fixed_variant", renderOrder: 43, defaultStyle: { material: "fixed-image", variant: "mushroom-nail-black" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.D1 },
    { key: "G", name: "上鞋身片", en: "Main upper", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 45, defaultStyle: { color: defaultWhite, material: defaultMaterial.G } },
    { key: "H", name: "鞋头下片", en: "Toe lower panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 50, defaultStyle: { color: defaultWhite, material: defaultMaterial.H } },
    { key: "I", name: "鞋眼片", en: "Eyelet panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 65, defaultStyle: { color: defaultWhite, material: defaultMaterial.I } },
    {
      key: "J",
      name: "鞋带",
      en: "Lace",
      group: "strap",
      selectable: true,
      renderMode: "mask_tint",
      renderOrder: 80,
      defaultStyle: { color: defaultFixedColorsByAngle.side.J, material: "fixed-image" },
      materialIds: ["fixed-image"],
      materialRule: "仅支持黑色、白色、红色、土黄色、紫色固定色值",
      fixedStyleSet: fixedStyleSets.lace
    },
    { key: "K", name: "前魔术贴绑带", en: "Front velcro strap", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 90, defaultStyle: { color: defaultWhite, material: defaultMaterial.K } },
    {
      key: "L",
      name: "防磨片",
      en: "Abrasive pad",
      group: "sole",
      selectable: true,
      renderMode: "fixed_variant",
      renderOrder: 95,
      defaultStyle: { material: "fixed-image", variant: "pad-new-black" },
      materialIds: ["fixed-image"],
      materialRule: "黑色/白色，样式：新/旧",
      fixedVariants: fixedVariants.L
    },
    { key: "M", name: "上能量带", en: "Upper energy strap", group: "strap", selectable: true, renderMode: "fixed_variant", renderOrder: 100, defaultStyle: { material: "fixed-image", variant: "upper-strap-black" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.M },
    { key: "N", name: "下能量带", en: "Lower energy strap", group: "strap", selectable: true, renderMode: "fixed_variant", renderOrder: 105, defaultStyle: { material: "fixed-image", variant: "lower-strap-black" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.N }
  ];

  const angles = [
    { key: "side", name: "侧面", en: "Side", active: true, baseFile: "side/base.png", stitchFile: "side/stitch.png", layerPartKeys: ["A", "B", "C", "C1", "C3", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] },
    { key: "forty_five", name: "45度", en: "45°", active: true, baseFile: "forty_five/base.png", stitchFile: "forty_five/stitch.png", layerPartKeys: ["A", "C", "C1", "C2", "C3", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] },
    { key: "front", name: "正面", en: "Front", active: true, baseFile: "front/base.png", stitchFile: "front/stitch.png", layerPartKeys: ["C", "C1", "C2", "C3", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] }
  ];

  window.SKATE_CIM_SCHEMA = {
    schemaVersion: 2,
    shoeId: "yjs-pro-cim-upper",
    name: "YJS-pro CIM",
    code: "YJS-PRO",
    description: "高帮轮滑鞋上鞋定制，面向进阶训练与比赛配置。",
    notes: "鞋款裁片、视角、布料和贴图由统一 schema 驱动。",
    homeLabel: "专业支撑款",
    homeFeatures: ["YJS-PRO", "CIM 表格导出"],
    defaultAngleKey: "side",
    defaultPartKey: "G",
    assets: {
      root: ASSET_ROOT,
      version: ASSET_VERSION,
      materialDir: "materials/",
      realProductDir: "real-products/",
      realProducts: [
        { file: "white-pink-1.jpg", alt: "YJS-pro CIM 白粉鞋款" },
        { file: "brown-1.jpg", alt: "YJS-pro CIM 咖色鞋款" },
        { file: "white-red-1.jpg", alt: "YJS-pro CIM 白红鞋款" },
        { file: "pink-purple-1.jpg", alt: "YJS-pro CIM 粉紫鞋款" },
        { file: "black-gold-1.jpg", alt: "YJS-pro CIM 黑金鞋款" },
        { file: "silver-white-1.jpg", alt: "YJS-pro CIM 银白鞋款" },
        { file: "black-purple-2.jpg", alt: "YJS-pro CIM 黑紫鞋款" }
      ]
    },
    palettes,
    materials,
    materialCategories,
    materialTextures,
    materialAvailability,
    materialAvailabilityByAngle,
    defaultMaterialsByAngle,
    defaultFixedColorsByAngle,
    materialKeyAliases,
    materialSource: {
      baseToken: "YH27bJJSJafbd3s2ff6cFlGLnQh",
      configTableId: "tblzPpnAxit5RrsD",
      mappingTableId: "tblgXTpDXMylMi2X",
      configRevision: 199,
      mappingRevision: 123,
      missingAssetIds: ["4", "10", "11", "13", "21", "54", "55", "56", "57", "58", "59"],
      fixedColorPartKeys: ["D", "D1", "E", "L", "M", "N", "O"]
    },
    fixedStyleSets,
    fixedVariants,
    parts,
    angles
  };
}());

(function () {
  const ASSET_ROOT = "./assets/skates/yjs-pro-cim/";
  const ASSET_VERSION = "20260523-schema-v2";

  const materials = [
    { id: "smooth", name: "光面皮", note: "细腻皮革", kind: "tint", groups: ["upper", "strap", "sole"] },
    { id: "mesh", name: "网布纹理", note: "细密织纹", kind: "tint", groups: ["upper"] },
    { id: "pearl", name: "珍珠皮", note: "柔亮渐变", kind: "tint", groups: ["upper"] },
    { id: "matte", name: "哑光皮", note: "低反光", kind: "tint", groups: ["upper", "strap", "sole", "hardware"] },
    { id: "chinoiserie-pink", name: "中国风粉色", note: "固定花纹布料", kind: "pattern", groups: ["upper"] },
    { id: "chinoiserie-white", name: "中国风白色", note: "固定花纹布料", kind: "pattern", groups: ["upper"] },
    { id: "fixed-straw", name: "草席", note: "固定皮料花纹", kind: "style_set", groups: ["upper"] },
    { id: "webbing", name: "织带", note: "织带纹理", kind: "tint", groups: ["strap"] },
    { id: "fixed-image", name: "固定样式", note: "", kind: "fixed", groups: ["fixed"] }
  ];

  const palettes = {
    leather: [
      { id: "white", name: "奶油白", value: "#f6f3ec" },
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
      { id: "white", name: "白色", value: "#f6f3ec" },
      { id: "grey", name: "灰色", value: "#8f9298" }
    ]
  };

  const fixedStyleSets = {};

  const fixedVariants = {
    D: [
      { id: "cuff-black-gold", name: "黑金色 CUFF", swatch: "linear-gradient(135deg, #302010 0 72%, #403020 100%)" },
      { id: "cuff-silver", name: "银色 CUFF", swatch: "linear-gradient(135deg, #b0b0b0 0 72%, #d8d8d8 100%)" },
      { id: "cuff-red-black", name: "红黑色 CUFF", swatch: "linear-gradient(135deg, #301010 0 72%, #401818 100%)" },
      { id: "cuff-black-purple", name: "黑紫色 CUFF", swatch: "linear-gradient(135deg, #281830 0 72%, #302038 100%)" },
      { id: "cuff-black", name: "黑色 CUFF", swatch: "linear-gradient(135deg, #202020 0 72%, #303030 100%)" }
    ],
    D1: [
      { id: "mushroom-nail-white", name: "白色蘑菇钉", swatch: "#f7f7f8" },
      { id: "mushroom-nail-black", name: "黑色蘑菇钉", swatch: "#17171a" }
    ],
    E: [
      { id: "sole-silver", name: "银色碳纤鞋壳", swatch: "linear-gradient(135deg, #d8d0d0 0 72%, #e0e0e0 100%)" },
      { id: "sole-black-red", name: "黑红色碳纤鞋壳", swatch: "linear-gradient(135deg, #301010 0 72%, #401818 100%)" },
      { id: "sole-black-purple", name: "黑紫色碳纤鞋壳", swatch: "linear-gradient(135deg, #281830 0 72%, #302038 100%)" },
      { id: "sole-black", name: "黑色碳纤鞋壳", swatch: "linear-gradient(135deg, #202020 0 72%, #282828 100%)" },
      { id: "sole-black-gold", name: "黑金色碳纤鞋壳", swatch: "linear-gradient(135deg, #302010 0 72%, #403020 100%)" }
    ],
    M: [
      { id: "upper-strap-white", name: "白色上能量带", swatch: "#f7f7f8" },
      { id: "upper-strap-black", name: "黑色上能量带", swatch: "#17171a" }
    ],
    N: [
      { id: "lower-strap-white", name: "白色下能量带", swatch: "#f7f7f8" },
      { id: "lower-strap-black", name: "黑色下能量带", swatch: "#17171a" }
    ],
    L: [
      { id: "pad-new-white", name: "新防磨片 · 白色", swatch: "#f6f3ec" },
      { id: "pad-new-black", name: "新防磨片 · 黑色", swatch: "#17171a" },
      { id: "pad-old-white", name: "旧防磨片 · 白色", swatch: "#f6f3ec" },
      { id: "pad-old-black", name: "旧防磨片 · 黑色", swatch: "#17171a" }
    ]
  };

  const parts = [
    { key: "A", name: "鞋帮", en: "Shoe collar", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 30, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "B", name: "后提带", en: "Back handle strap", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 34, defaultStyle: { color: "#ffffff", material: "webbing" }, materialIds: ["webbing", "smooth"] },
    { key: "C", name: "鞋舌", en: "Tongue", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 55, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "C1", name: "鞋舌三角片", en: "Tongue triangle panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 60, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "C2", name: "皮垫套下片", en: "Lower pad cover", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 62, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "C3", name: "皮垫套上片", en: "Upper pad cover", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 64, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "D", name: "CUFF", en: "Cuff", group: "hardware", selectable: true, renderMode: "fixed_variant", renderOrder: 110, defaultStyle: { material: "fixed-image", variant: "cuff-silver" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.D },
    { key: "D1", name: "蘑菇钉", en: "Mushroom nail", group: "hardware", selectable: true, renderMode: "fixed_variant", renderOrder: 130, defaultStyle: { material: "fixed-image", variant: "mushroom-nail-black" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.D1 },
    { key: "E", name: "碳纤鞋壳", en: "Carbon shell", group: "sole", selectable: true, renderMode: "fixed_variant", renderOrder: 20, defaultStyle: { material: "fixed-image", variant: "sole-silver" }, materialIds: ["fixed-image"], fixedVariants: fixedVariants.E },
    { key: "F", name: "下鞋身片", en: "Lower body", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 35, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "F1", name: "下鞋身片2", en: "Lower body 2", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 40, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "G", name: "上鞋身片", en: "Main upper", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 45, defaultStyle: { color: "#f0b7c8", material: "pearl" }, materialIds: ["smooth", "mesh", "pearl", "matte", "chinoiserie-pink", "chinoiserie-white", "fixed-straw"] },
    { key: "H", name: "鞋头下片", en: "Toe lower panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 50, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte"], materialRule: "部分可用（PU/TPU 不可用于鞋头）" },
    { key: "I", name: "鞋眼片", en: "Eyelet panel", group: "upper", selectable: true, renderMode: "mask_tint", renderOrder: 65, defaultStyle: { color: "#f6f3ec", material: "smooth" }, materialIds: ["smooth", "mesh", "pearl", "matte"] },
    { key: "J", name: "鞋带", en: "Lace", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 80, defaultStyle: { color: "#ffffff", material: "webbing" }, materialIds: ["webbing", "smooth"] },
    { key: "K", name: "前魔术贴绑带", en: "Front velcro strap", group: "strap", selectable: true, renderMode: "mask_tint", renderOrder: 90, defaultStyle: { color: "#ffffff", material: "webbing" }, materialIds: ["webbing", "smooth"] },
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
    { key: "side", name: "侧面", active: true, baseFile: "side/base.png", stitchFile: "side/stitch.png", layerPartKeys: ["A", "B", "C", "C1", "C2", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] },
    { key: "forty_five", name: "45度", active: true, baseFile: "forty_five/base.png", stitchFile: "forty_five/stitch.png", layerPartKeys: ["A", "C", "C1", "C2", "C3", "D", "D1", "E", "F", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] },
    { key: "front", name: "正面", active: true, baseFile: "front/base.png", stitchFile: "front/stitch.png", layerPartKeys: ["C", "C1", "C2", "C3", "F1", "G", "H", "I", "J", "K", "L", "M", "N"] }
  ];

  window.SKATE_CIM_SCHEMA = {
    schemaVersion: 2,
    shoeId: "yjs-pro-cim-upper",
    name: "YJS-pro CIM",
    code: "YJS-PRO",
    description: "高帮轮滑鞋上鞋定制，面向进阶训练与比赛配置。",
    notes: "鞋款裁片、视角、布料和贴图由统一 schema 驱动。",
    homeLabel: "专业支撑款",
    homeFeatures: ["YJS-PRO", "高帮支撑", "CIM 表格导出"],
    defaultAngleKey: "side",
    defaultPartKey: "G",
    assets: {
      root: ASSET_ROOT,
      version: ASSET_VERSION,
      realProductDir: "real-products/",
      realProducts: [
        { file: "brown-1.jpg", alt: "YJS-pro CIM 咖色真实鞋款" },
        { file: "white-pink-1.jpg", alt: "YJS-pro CIM 白粉真实鞋款" },
        { file: "white-red-1.jpg", alt: "YJS-pro CIM 白红真实鞋款" },
        { file: "pink-purple-1.jpg", alt: "YJS-pro CIM 粉紫真实鞋款" },
        { file: "black-gold-1.jpg", alt: "YJS-pro CIM 黑金真实鞋款" },
        { file: "silver-white-1.jpg", alt: "YJS-pro CIM 银白真实鞋款" },
        { file: "black-purple-2.jpg", alt: "YJS-pro CIM 黑紫真实鞋款" }
      ]
    },
    palettes,
    materials,
    fixedStyleSets,
    fixedVariants,
    parts,
    angles
  };
}());

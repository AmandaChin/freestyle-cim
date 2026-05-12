window.SKATE_CIM_CONFIG = {
  schemaVersion: 1,
  release: {
    online: {
      version: "v2.2.4",
      publishedAt: "2026-05-06 18:20",
      status: "正常"
    },
    testing: null,
    history: [
      { version: "v2.2.3", publishedAt: "2026-05-02 12:00", operator: "Design Ops" },
      { version: "v2.2.2", publishedAt: "2026-04-28 10:30", operator: "Amanda" },
      { version: "v2.2.1", publishedAt: "2026-04-22 16:18", operator: "Skate Team" }
    ]
  },
  shoes: [
    {
      id: "shoe-yjs-pro-cim",
      shoeId: "yjs-pro-cim-upper",
      name: "YJS-pro CIM",
      code: "YJS-PRO",
      version: 12,
      status: "published",
      defaultAngleKey: "side",
      defaultPartKey: "G",
      updatedAt: "2026-05-09 18:20",
      description: "高帮轮滑鞋上鞋定制，面向进阶训练与比赛配置。",
      notes: "专业上鞋定制，侧面图层已接入 MVP。",
      homeLabel: "专业支撑款",
      homeFeatures: ["YJS-PRO", "高帮支撑", "CIM 表格导出"],
      angles: [
        { key: "front", name: "正面", active: false, baseFile: "front/base.png", layerAssets: {} },
        { key: "forty_five", name: "45度", active: false, baseFile: "forty_five/base.png", layerAssets: {} },
        {
          key: "side",
          name: "侧面",
          active: true,
          baseFile: "side/base.png",
          layerAssets: {
            A: { maskFile: "side/A/mask.png" },
            A1: { maskFile: "side/A1/mask.png" },
            F: { maskFile: "side/F/mask.png" },
            G: { maskFile: "side/G/mask.png" },
            H: { maskFile: "side/H/mask.png" },
            C: { maskFile: "side/C/mask.png" },
            C2: { maskFile: "side/C2/mask.png" },
            I: { maskFile: "side/I/mask.png" },
            I1: { maskFile: "side/I1/mask.png" },
            B: { maskFile: "side/B/mask.png" },
            J: { maskFile: "side/J/mask.png" },
            K1: { maskFile: "side/K1/mask.png" },
            K2: { maskFile: "side/K2/mask.png" },
            L: { maskFile: "side/L/mask.png" },
            D: { maskFile: "side/D/fixed.png" },
            M: { maskFile: "side/M/fixed.png" },
            N: { maskFile: "side/N/fixed.png" }
          }
        }
      ],
      parts: [
        { key: "A", name: "鞋帮", group: "upper", selectable: true },
        { key: "A1", name: "鞋身下摆", group: "upper", selectable: true },
        { key: "F", name: "下身鞋片", group: "upper", selectable: true },
        { key: "G", name: "上身鞋片", group: "upper", selectable: true },
        { key: "H", name: "鞋头", group: "upper", selectable: true },
        { key: "C", name: "鞋舌", group: "upper", selectable: true },
        { key: "C2", name: "鞋舌裁片", group: "upper", selectable: true },
        { key: "I", name: "鞋眼片", group: "upper", selectable: true },
        { key: "I1", name: "鞋眼", group: "hardware", selectable: true },
        { key: "B", name: "后提带", group: "strap", selectable: true },
        { key: "J", name: "鞋带", group: "strap", selectable: true },
        { key: "K1", name: "扣带1", group: "strap", selectable: true },
        { key: "K2", name: "扣带2", group: "strap", selectable: true },
        { key: "L", name: "防磨片", group: "sole", selectable: true },
        { key: "D", name: "CUFF", group: "hardware", selectable: true },
        { key: "M", name: "巴扣 / 芭扣", group: "hardware", selectable: true },
        { key: "N", name: "鞋底", group: "sole", selectable: true }
      ]
    }
  ],
  fabrics: [
    {
      id: "fabric-cream",
      materialKey: "leather_cream_solid",
      name: "奶油白光面皮",
      mode: "solid_mask",
      color: "#f6f3ec",
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-07 11:16"
    },
    {
      id: "fabric-pearl-pink",
      materialKey: "leather_pearl_pink",
      name: "樱花粉珍珠皮",
      mode: "texture_tint",
      color: "#f0b7c8",
      textureFile: { name: "pearl-leather-texture.png", size: "1.9 MB" },
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-07 11:20"
    },
    {
      id: "fabric-carbon",
      materialKey: "carbon_black_tile",
      name: "黑碳纤异型纹",
      mode: "image_tile",
      color: "#2d2e32",
      textureFile: { name: "carbon-tile.png", size: "1.3 MB" },
      groups: ["sole", "hardware"],
      status: "draft",
      updatedAt: "2026-05-08 09:34"
    }
  ]
};

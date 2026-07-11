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
      homeLabel: "专业支撑款",
      homeFeatures: ["YJS-PRO", "高帮支撑", "CIM 表格导出"],
      assets: window.SKATE_CIM_SCHEMA.assets,
      palettes: window.SKATE_CIM_SCHEMA.palettes,
      materials: window.SKATE_CIM_SCHEMA.materials,
      fixedStyleSets: window.SKATE_CIM_SCHEMA.fixedStyleSets,
      fixedVariants: window.SKATE_CIM_SCHEMA.fixedVariants,
      angles: [
        {
          key: "front",
          name: "正面",
          en: "Front",
          active: true,
          baseFile: "front/base.png",
          layerAssets: {
            C: { maskFile: "front/C/mask.png" },
            C1: { maskFile: "front/C1/mask.png" },
            C2: { maskFile: "front/C2/mask.png" },
            C3: { maskFile: "front/C3/mask.png" },
            F1: { maskFile: "front/F1/mask.png" },
            G: { maskFile: "front/G/mask.png" },
            H: { maskFile: "front/H/mask.png" },
            I: { maskFile: "front/I/mask.png" },
            J: { maskFile: "front/J/mask.png" },
            K: { maskFile: "front/K/mask.png" },
            L: { maskFile: "front/L/fixed.png" },
            M: { maskFile: "front/M/fixed.png" },
            N: { maskFile: "front/N/fixed.png" }
          }
        },
        {
          key: "forty_five",
          name: "45度",
          en: "45°",
          active: true,
          baseFile: "forty_five/base.png",
          layerAssets: {
            A: { maskFile: "forty_five/A/mask.png" },
            C: { maskFile: "forty_five/C/mask.png" },
            C1: { maskFile: "forty_five/C1/mask.png" },
            C2: { maskFile: "forty_five/C2/mask.png" },
            C3: { maskFile: "forty_five/C3/mask.png" },
            D: { maskFile: "forty_five/D/fixed.png" },
            D1: { maskFile: "forty_five/D1/fixed.png" },
            E: { maskFile: "forty_five/E/fixed.png" },
            F: { maskFile: "forty_five/F/mask.png" },
            F1: { maskFile: "forty_five/F1/mask.png" },
            G: { maskFile: "forty_five/G/mask.png" },
            H: { maskFile: "forty_five/H/mask.png" },
            I: { maskFile: "forty_five/I/mask.png" },
            J: { maskFile: "forty_five/J/mask.png" },
            K: { maskFile: "forty_five/K/mask.png" },
            L: { maskFile: "forty_five/L/fixed.png" },
            M: { maskFile: "forty_five/M/fixed.png" },
            N: { maskFile: "forty_five/N/fixed.png" }
          }
        },
        {
          key: "side",
          name: "侧面",
          en: "Side",
          active: true,
          baseFile: "side/base.png",
          layerAssets: {
            A: { maskFile: "side/A/mask.png" },
            B: { maskFile: "side/B/mask.png" },
            C: { maskFile: "side/C/mask.png" },
            C1: { maskFile: "side/C1/mask.png" },
            C3: { maskFile: "side/C3/mask.png" },
            D: { maskFile: "side/D/fixed.png" },
            D1: { maskFile: "side/D1/fixed.png" },
            E: { maskFile: "side/E/fixed.png" },
            F: { maskFile: "side/F/mask.png" },
            F1: { maskFile: "side/F1/mask.png" },
            G: { maskFile: "side/G/mask.png" },
            H: { maskFile: "side/H/mask.png" },
            I: { maskFile: "side/I/mask.png" },
            J: { maskFile: "side/J/mask.png" },
            K: { maskFile: "side/K/mask.png" },
            L: { maskFile: "side/L/fixed.png" },
            M: { maskFile: "side/M/fixed.png" },
            N: { maskFile: "side/N/fixed.png" }
          }
        }
      ],
      parts: window.SKATE_CIM_SCHEMA.parts

    }
  ],
  fabrics: window.SKATE_CIM_SCHEMA.materialCategories.map((category) => ({
    id: `fabric-${category.id}`,
    materialKey: category.id,
    name: category.name,
    mode: "fixed_style_set",
    styles: window.SKATE_CIM_SCHEMA.materialTextures
      .filter((texture) => texture.categoryId === category.id)
      .map((texture) => ({ id: texture.id, name: texture.name, file: texture.file })),
    groups: category.groups,
    status: "published",
    updatedAt: "2026-06-13 00:00"
  }))};

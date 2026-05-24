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
      assets: window.SKATE_CIM_SCHEMA.assets,
      palettes: window.SKATE_CIM_SCHEMA.palettes,
      materials: window.SKATE_CIM_SCHEMA.materials,
      fixedStyleSets: window.SKATE_CIM_SCHEMA.fixedStyleSets,
      fixedVariants: window.SKATE_CIM_SCHEMA.fixedVariants,
      angles: [
        {
          key: "front",
          name: "正面",
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
          active: true,
          baseFile: "side/base.png",
          layerAssets: {
            A: { maskFile: "side/A/mask.png" },
            B: { maskFile: "side/B/mask.png" },
            C: { maskFile: "side/C/mask.png" },
            C1: { maskFile: "side/C1/mask.png" },
            C2: { maskFile: "side/C2/mask.png" },
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
  fabrics: [
    {
      id: "fabric-smooth",
      materialKey: "smooth",
      name: "光面皮",
      mode: "solid_mask",
      color: "#f6f3ec",
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-24 01:10"
    },
    {
      id: "fabric-matte",
      materialKey: "matte",
      name: "哑光皮",
      mode: "solid_mask",
      color: "#17171a",
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-24 01:10"
    },
    {
      id: "fabric-fixed-straw",
      materialKey: "fixed_straw",
      name: "草席",
      mode: "fixed_style_set",
      styles: [
        { id: "fixed-straw-1336", name: "1336号皮料", file: "草席/1336.png" },
        { id: "fixed-straw-1437", name: "1437号皮料", file: "草席/1437.png" },
        { id: "fixed-straw-1518", name: "1518号皮料", file: "草席/1518.png" },
        { id: "fixed-straw-1635", name: "1635号皮料", file: "草席/1635.png" },
        { id: "fixed-straw-1741", name: "1741号皮料", file: "草席/1741.png" },
        { id: "fixed-straw-2932", name: "2932号皮料", file: "草席/2932.png" }
      ],
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-23 18:20"
    },
    {
      id: "fabric-ue-pu",
      materialKey: "ue_pu",
      name: "PU",
      mode: "fixed_style_set",
      styles: [
        { id: "ue-pu-183", name: "183号皮料", file: "PU/183.png" },
        { id: "ue-pu-199", name: "199号皮料", file: "PU/199.png" },
        { id: "ue-pu-201", name: "201号皮料", file: "PU/201.png" },
        { id: "ue-pu-215", name: "215号皮料", file: "PU/215.png" },
        { id: "ue-pu-232", name: "232号皮料", file: "PU/232.png" }
      ],
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-24 01:10"
    },
    {
      id: "fabric-ue-tpu",
      materialKey: "ue_tpu",
      name: "TPU",
      mode: "fixed_style_set",
      styles: [
        { id: "ue-tpu-2623", name: "2623号皮料", file: "TPU/2623.png" },
        { id: "ue-tpu-2840", name: "2840号皮料", file: "TPU/2840.png" },
        { id: "ue-tpu-2925", name: "2925号皮料", file: "TPU/2925.png" },
        { id: "ue-tpu-3029", name: "3029号皮料", file: "TPU/3029.png" }
      ],
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-24 01:10"
    },
    {
      id: "fabric-ue-pu-tpu",
      materialKey: "ue_pu_tpu",
      name: "PU TPU",
      mode: "fixed_style_set",
      styles: [
        { id: "ue-pu-tpu-1741", name: "1741号皮料", file: "PU TPU/1741.png" },
        { id: "ue-pu-tpu-201", name: "201号皮料", file: "PU TPU/201.png" },
        { id: "ue-pu-tpu-215", name: "215号皮料", file: "PU TPU/215.png" },
        { id: "ue-pu-tpu-232", name: "232号皮料", file: "PU TPU/232.png" },
        { id: "ue-pu-tpu-2623", name: "2623号皮料", file: "PU TPU/2623.png" },
        { id: "ue-pu-tpu-2840", name: "2840号皮料", file: "PU TPU/2840.png" },
        { id: "ue-pu-tpu-2925", name: "2925号皮料", file: "PU TPU/2925.png" },
        { id: "ue-pu-tpu-3029", name: "3029号皮料", file: "PU TPU/3029.png" }
      ],
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-24 01:10"
    },
    {
      id: "fabric-ue-scale",
      materialKey: "ue_鳞片",
      name: "鳞片",
      mode: "fixed_style_set",
      styles: [
        { id: "ue-scale-1046", name: "1046号皮料", file: "鳞片/1046.png" },
        { id: "ue-scale-1148", name: "1148号皮料", file: "鳞片/1148.png" },
        { id: "ue-scale-647", name: "647号皮料", file: "鳞片/647.png" },
        { id: "ue-scale-744", name: "744号皮料", file: "鳞片/744.png" },
        { id: "ue-scale-845", name: "845号皮料", file: "鳞片/845.png" },
        { id: "ue-scale-943", name: "943号皮料", file: "鳞片/943.png" }
      ],
      groups: ["upper"],
      status: "published",
      updatedAt: "2026-05-24 01:10"
    }
  ]
};

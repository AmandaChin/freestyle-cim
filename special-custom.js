(function initSpecialCustomizer() {
  "use strict";

  const STORAGE_KEY = "SKATE_CIM_SPECIAL_CUSTOM_DEMO_V1";
  const CUSTOMIZATION_HANDOFF_KEY = "SKATE_CIM_CUSTOMIZATION_HANDOFF_V1";
  const LOCAL_RUNTIME_CACHE_KEY = "SKATE_CIM_LOCAL_RUNTIME_ID";
  const localRuntimeId = window.__SKATE_CIM_LOCAL_RUNTIME_ID__;
  if (localRuntimeId) {
    try {
      if (localStorage.getItem(LOCAL_RUNTIME_CACHE_KEY) !== localRuntimeId) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CUSTOMIZATION_HANDOFF_KEY);
        sessionStorage.removeItem(CUSTOMIZATION_HANDOFF_KEY);
        localStorage.setItem(LOCAL_RUNTIME_CACHE_KEY, localRuntimeId);
      }
    } catch {
      // 隐私模式禁用存储时继续使用当前内存中的默认画板。
    }
  }
  const ARTBOARD = { width: 600, height: 760 };
  const MAX_OBJECTS = 6;
  const SLOT_DEFINITIONS = [
    {
      id: "B1",
      code: "B1",
      label: "后提带电绣",
      template: { src: "./assets/skates/yjs-pro-cim/side/parts/B.png", sourceWidth: 2401, sourceHeight: 1600, bounds: { x: 252, y: 232, width: 347, height: 273 }, angleId: "side", componentId: "B" },
      defaultArtwork: { src: "./assets/skates/yjs-pro-cim/embroidery-defaults/B1.png", width: 259, height: 170, bounds: { x: 296, y: 284, width: 259, height: 170 } }
    },
    {
      id: "tongue",
      code: "C",
      label: "鞋舌三角片电绣",
      template: { src: "./assets/skates/yjs-pro-cim/front/parts/C1.png", sourceWidth: 2401, sourceHeight: 1601, bounds: { x: 1088, y: 339, width: 226, height: 173 }, angleId: "front", componentId: "C1" },
      defaultArtwork: { src: "./assets/skates/yjs-pro-cim/embroidery-defaults/C.png", width: 94, height: 94, bounds: { x: 1153, y: 386, width: 94, height: 94 } }
    },
    {
      id: "pad-upper",
      code: "C3",
      label: "皮垫套上片",
      template: { src: "./assets/skates/yjs-pro-cim/front/parts/C3.png", sourceWidth: 2401, sourceHeight: 1601, bounds: { x: 1194, y: 452, width: 232, height: 189 }, angleId: "front", componentId: "C3" },
      defaultArtwork: { src: "./assets/skates/yjs-pro-cim/embroidery-defaults/C3.png", width: 94, height: 94, bounds: { x: 1271, y: 505, width: 94, height: 94 } }
    },
    {
      id: "toe-left",
      code: "K-L",
      label: "左脚前魔术贴",
      template: { src: "./assets/skates/yjs-pro-cim/front/parts/K.png", sourceWidth: 2401, sourceHeight: 1601, bounds: { x: 1039, y: 933, width: 349, height: 228 }, angleId: "front", componentId: "K" },
      defaultArtwork: { src: "./assets/skates/yjs-pro-cim/embroidery-defaults/K-L.png", width: 298, height: 124, bounds: { x: 1064, y: 978, width: 298, height: 124 } }
    },
    {
      id: "toe-right",
      code: "K-R",
      label: "右脚前魔术贴",
      template: { src: "./assets/skates/yjs-pro-cim/front/parts/K.png", sourceWidth: 2401, sourceHeight: 1601, bounds: { x: 1039, y: 933, width: 349, height: 228 }, angleId: "front", componentId: "K", mirror: true },
      // 左右贴片轮廓镜像，但刺绣字样保持正向可读。
      defaultArtwork: { src: "./assets/skates/yjs-pro-cim/embroidery-defaults/K-R.png", width: 281, height: 164, bounds: { x: 1075, y: 962, width: 281, height: 164 } }
    }
  ];
  const THREAD_COLORS = ["#111111", "#ffffff", "#bf3f49", "#d19a34", "#6258a5", "#2f6f77", "#d7789b"];
  const els = {
    slotTitle: document.querySelector("#slotTitle"),
    slotTabs: document.querySelector("#slotTabs"),
    artboard: document.querySelector("#artboard"),
    pieceTemplateImage: document.querySelector("#pieceTemplateImage"),
    pieceBaseColorLayer: document.querySelector("#pieceBaseColorLayer"),
    materialPatternImage: document.querySelector("#materialPatternImage"),
    pieceMaterialLayer: document.querySelector("#pieceMaterialLayer"),
    pieceMaskImage: document.querySelector("#pieceMaskImage"),
    objectLayer: document.querySelector("#objectLayer"),
    selectionLayer: document.querySelector("#selectionLayer"),
    stageHint: document.querySelector("#stageHint"),
    emptyInspector: document.querySelector("#emptyInspector"),
    inspectorContent: document.querySelector("#inspectorContent"),
    inspectorTitle: document.querySelector("#inspectorTitle"),
    objectCount: document.querySelector("#objectCount"),
    textField: document.querySelector("#textField"),
    fontField: document.querySelector("#fontField"),
    sizeField: document.querySelector("#sizeField"),
    styleField: document.querySelector("#styleField"),
    colorField: document.querySelector("#colorField"),
    textInput: document.querySelector("#textInput"),
    textCounter: document.querySelector("#textCounter"),
    fontSelect: document.querySelector("#fontSelect"),
    sizeInput: document.querySelector("#sizeInput"),
    colorOptions: document.querySelector("#colorOptions"),
    constraintNote: document.querySelector("#constraintNote"),
    imageInput: document.querySelector("#imageInput"),
    syncStatus: document.querySelector("#syncStatus"),
    jsonModal: document.querySelector("#jsonModal"),
    jsonOutput: document.querySelector("#jsonOutput"),
    toast: document.querySelector("#toast")
  };

  const requestedSlotId = new URLSearchParams(window.location.search).get("slot") || (() => {
    try {
      const handoff = JSON.parse(sessionStorage.getItem(CUSTOMIZATION_HANDOFF_KEY) || localStorage.getItem(CUSTOMIZATION_HANDOFF_KEY) || "null");
      return handoff?.specialDesignLastSlot || "tongue";
    } catch {
      return "tongue";
    }
  })();
  const state = {
    slotId: SLOT_DEFINITIONS.some((slot) => slot.id === requestedSlotId) ? requestedSlotId : "tongue",
    documents: loadDocuments(),
    selectedId: null,
    undoStack: [],
    redoStack: [],
    drag: null,
    objectUrls: new Map(),
    toastTimer: 0
  };

  function setSyncStatus(message, status = "idle") {
    els.syncStatus.textContent = message;
    els.syncStatus.dataset.state = status;
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizeCropRect(rect) {
    if (!rect) return { x: 0, y: 0, width: 1, height: 1 };
    const width = clamp(Number(rect.width) || 1, 1 / 3, 1);
    const height = clamp(Number(rect.height) || 1, 1 / 3, 1);
    return { x: clamp(Number(rect.x) || 0, 0, 1 - width), y: clamp(Number(rect.y) || 0, 0, 1 - height), width, height };
  }

  function fontFamilyCss(fontFamilyId) {
    const families = {
      "system-serif": '"Songti SC", "SimSun", serif',
      "system-kai": '"Kaiti SC", "KaiTi", cursive',
      "system-sans": '"PingFang SC", "Microsoft YaHei", sans-serif'
    };
    return families[fontFamilyId] || families["system-sans"];
  }

  function round(value, digits = 4) {
    const base = 10 ** digits;
    return Math.round(value * base) / base;
  }

  function emptyDocument(slotId) {
    const defaultObjects = defaultObjectsForSlot(slotId);
    return {
      schemaVersion: 1,
      id: uid("design"),
      ownerSessionId: null,
      productId: "yjs-pro-cim",
      slotId,
      side: "shared",
      templateVersion: 1,
      // 这里故意保留占位值，真实毫米尺寸必须由生产侧提供后替换。
      productionFrame: { widthMm: null, heightMm: null, bleedMm: null, safeMarginMm: null, isPlaceholder: true },
      status: "editing",
      revision: 0,
      defaultArtworkVersion: 4,
      objects: defaultObjects,
      updatedAt: new Date().toISOString()
    };
  }

  function loadDocuments() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return SLOT_DEFINITIONS.reduce((documents, slot) => {
        documents[slot.id] = stored[slot.id]
          ? resetDocumentImages(stored[slot.id], slot.id)
          : emptyDocument(slot.id);
        return documents;
      }, {});
    } catch {
      return SLOT_DEFINITIONS.reduce((documents, slot) => {
        documents[slot.id] = emptyDocument(slot.id);
        return documents;
      }, {});
    }
  }

  function normalizeDocument(document, slotId) {
    const empty = emptyDocument(slotId);
    let storedObjects = Array.isArray(document.objects) ? document.objects : empty.objects;
    const artworkIds = new Set(empty.objects.map((object) => object.id));
    const previousArtworkVersion = Number(document.defaultArtworkVersion) || 0;
    // 首次初始化填充默认图；后续版本只补缺失的新默认图，不替换用户对象。
    if (previousArtworkVersion === 1 && storedObjects.some((object) => artworkIds.has(object.id)) && storedObjects.some((object) => !artworkIds.has(object.id))) {
      storedObjects = storedObjects.filter((object) => !artworkIds.has(object.id));
    }
    // 单个贴片只保留一张图片；迁移旧草稿时优先保留最后添加的用户图片。
    const images = storedObjects.filter((object) => object.type === "image");
    if (images.length > 1) {
      const preferredImage = images.filter((object) => object.id !== `obj_image_default_${slotId}`).at(-1)
        || images.at(-1);
      storedObjects = [...storedObjects.filter((object) => object.type !== "image"), preferredImage];
    }
    const hasDefaultArtwork = storedObjects.some((object) => object.id === `obj_image_default_${slotId}`);
    const hasAnyImage = storedObjects.some((object) => object.type === "image");
    const shouldAddNewDefault = previousArtworkVersion < 4 && !hasDefaultArtwork && !hasAnyImage && empty.objects.length > 0 && storedObjects.length < MAX_OBJECTS;
    const missingDefaults = previousArtworkVersion === 0 && storedObjects.length === 0
      ? empty.objects
      : shouldAddNewDefault ? empty.objects : [];
    const normalized = { ...empty, ...document, slotId, defaultArtworkVersion: 4, objects: [...storedObjects, ...missingDefaults].slice(0, MAX_OBJECTS) };
    normalized.objects = normalized.objects.map((object) => {
      const isDefaultArtwork = object.id === `obj_image_default_${slotId}`;
      const defaultAssetPath = isDefaultArtwork ? slotDefinition(slotId).defaultArtwork?.src : object.defaultAssetPath;
      return {
        ...object,
        ...(isDefaultArtwork ? { defaultAssetPath, threadColor: object.threadColor || "#111111" } : {}),
        fontFamilyId: object.fontFamilyId === "source-han-serif" ? "system-serif" : object.fontFamilyId === "inter" || object.fontFamilyId === "noto-sans-sc" ? "system-sans" : object.fontFamilyId || "system-sans",
        cropRect: object.type === "image" ? normalizeCropRect(object.cropRect) : object.cropRect,
        previewUrl: isDefaultArtwork ? defaultAssetPath : object.previewUrl || object.defaultAssetPath || "",
        transform: {
          x: clamp(Number(object.transform?.x) || 0.5, 0.06, 0.94),
          y: clamp(Number(object.transform?.y) || 0.5, 0.06, 0.94),
          width: clamp(Number(object.transform?.width) || 0.3, 0.04, 0.9),
          height: clamp(Number(object.transform?.height) || 0.12, 0.04, 0.9),
          rotationDeg: Number(object.transform?.rotationDeg) || 0,
          zIndex: Number(object.transform?.zIndex) || 1
        }
      };
    });
    return normalized;
  }

  function resetDocumentImages(document, slotId) {
    const normalized = normalizeDocument(document, slotId);
    const textObjects = normalized.objects.filter((object) => object.type !== "image").slice(0, MAX_OBJECTS - 1);
    // 刷新后恢复一张默认贴图，同时保留文字、槽位和修订信息。
    return { ...normalized, objects: [...textObjects, ...defaultObjectsForSlot(slotId)], defaultArtworkVersion: 4 };
  }

  function currentDocument() {
    return state.documents[state.slotId];
  }

  function selectedObject() {
    return currentDocument().objects.find((object) => object.id === state.selectedId) || null;
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(currentDocument()));
  }

  function restoreSnapshot(document) {
    state.documents[state.slotId] = normalizeDocument(document, state.slotId);
    if (!selectedObject()) state.selectedId = state.documents[state.slotId].objects.at(-1)?.id || null;
    render();
  }

  function recordHistory() {
    state.undoStack.push(snapshot());
    state.undoStack = state.undoStack.slice(-30);
    state.redoStack = [];
  }

  function saveDocuments() {
    // 只持久化结构化字段，图片预览 URL 和原始字节不会进入 localStorage。
    const persisted = serializableDocuments();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    return persisted;
  }

  function serializableDocuments() {
    return Object.fromEntries(Object.entries(state.documents).map(([slotId, document]) => [slotId, {
      ...document,
      confirmationImageRequired: document.objects.length > 0 && !isDefaultArtworkColorOnly(slotId, document),
      objects: document.objects.map(({ previewUrl, ...object }) => object)
    }]));
  }

  function isDefaultArtworkColorOnly(slotId, document) {
    const defaultObject = defaultObjectsForSlot(slotId)[0];
    const objects = document?.objects || [];
    if (!defaultObject || objects.length !== 1) return false;
    const object = objects[0];
    const close = (a, b) => Math.abs(Number(a) - Number(b)) < 0.000001;
    return object.id === defaultObject.id
      && object.type === "image"
      && object.defaultAssetPath === defaultObject.defaultAssetPath
      && object.sourceAssetId == null
      && object.renderAssetId == null
      && String(object.threadColor || "").toLowerCase() !== String(defaultObject.threadColor || "").toLowerCase()
      && close(object.opacity, defaultObject.opacity)
      && JSON.stringify(normalizeCropRect(object.cropRect)) === JSON.stringify(defaultObject.cropRect)
      && ["x", "y", "width", "height", "rotationDeg", "zIndex"].every((key) => close(object.transform?.[key], defaultObject.transform[key]));
  }

  function touchDocument() {
    currentDocument().revision += 1;
    currentDocument().updatedAt = new Date().toISOString();
    saveDocuments();
    setSyncStatus("设计已保存在当前浏览器", "saved");
  }

  function buildDesignDocumentForSlot(slotId) {
    const documentData = state.documents[slotId];
    return {
      schemaVersion: documentData.schemaVersion,
      id: documentData.id,
      ownerSessionId: null,
      productId: documentData.productId,
      slotId: documentData.slotId,
      side: documentData.side,
      templateVersion: documentData.templateVersion,
      revision: documentData.revision,
      status: documentData.status,
      confirmationImageRequired: documentData.objects.length > 0 && !isDefaultArtworkColorOnly(slotId, documentData),
      productionFrame: documentData.productionFrame,
      objects: documentData.objects.map(({ previewUrl, ...object }) => object),
      updatedAt: documentData.updatedAt
    };
  }

  function createTextObject() {
    return {
      id: uid("obj_text"),
      type: "text",
      text: "输入文字",
      fontFamilyId: "system-sans",
      fontSizeMm: 8,
      fontSizePx: 42,
      fontWeight: 400,
      fontStyle: "normal",
      textAlign: "center",
      fill: { type: "thread", threadCode: "T-001", hex: "#111111" },
      transform: { x: 0.5, y: 0.46, width: 0.42, height: 0.12, rotationDeg: 0, zIndex: nextZIndex() }
    };
  }

  function createImageObject(file, previewUrl) {
    return {
      id: uid("obj_image"),
      type: "image",
      sourceAssetId: null,
      renderAssetId: null,
      mattingMode: "none",
      useOriginal: true,
      fileName: file.name,
      mimeType: file.type,
      cropRect: { x: 0, y: 0, width: 1, height: 1 },
      // 仅运行时使用，saveDocuments 会剥离这个字段。
      previewUrl,
      opacity: 1,
      transform: { x: 0.5, y: 0.48, width: 0.34, height: 0.3, rotationDeg: 0, zIndex: nextZIndex() }
    };
  }

  function nextZIndex() {
    return currentDocument().objects.reduce((max, object) => Math.max(max, object.transform?.zIndex || 0), 0) + 1;
  }

  function slotDefinition(slotId = state.slotId) {
    return SLOT_DEFINITIONS.find((slot) => slot.id === slotId) || SLOT_DEFINITIONS[1];
  }

  function templateLayout(slot = slotDefinition()) {
    const template = slot.template;
    const maxWidth = 500;
    const maxHeight = 610;
    const uniformScale = Math.min(maxWidth / template.bounds.width, maxHeight / template.bounds.height);
    const visibleWidth = template.bounds.width * uniformScale;
    const visibleHeight = template.bounds.height * uniformScale;
    const visibleX = (ARTBOARD.width - visibleWidth) / 2;
    const visibleY = (ARTBOARD.height - visibleHeight) / 2;
    const scaleX = visibleWidth / template.bounds.width;
    const scaleY = visibleHeight / template.bounds.height;
    return {
      scaleX,
      scaleY,
      visibleX,
      visibleY,
      visibleWidth,
      visibleHeight,
      imageX: visibleX - template.bounds.x * scaleX,
      imageY: visibleY - template.bounds.y * scaleY,
      imageWidth: template.sourceWidth * scaleX,
      imageHeight: template.sourceHeight * scaleY
    };
  }

  function defaultObjectsForSlot(slotId) {
    const slot = slotDefinition(slotId);
    const artwork = slot.defaultArtwork;
    if (!artwork) return [];
    const layout = templateLayout(slot);
    const bounds = slot.template.bounds;
    const centerX = layout.visibleX + (artwork.bounds.x + artwork.bounds.width / 2 - bounds.x) * layout.scaleX;
    const centerY = layout.visibleY + (artwork.bounds.y + artwork.bounds.height / 2 - bounds.y) * layout.scaleY;
    return [{
      id: `obj_image_default_${slot.id}`,
      type: "image",
      sourceAssetId: null,
      renderAssetId: null,
      defaultAssetPath: artwork.src,
      mattingMode: "none",
      useOriginal: true,
      fileName: `默认贴图 ${slot.code}`,
      mimeType: "image/png",
      sourceWidth: artwork.width,
      sourceHeight: artwork.height,
      cropRect: { x: 0, y: 0, width: 1, height: 1 },
      threadColor: "#111111",
      previewUrl: artwork.src,
      opacity: 1,
      transform: {
        x: centerX / ARTBOARD.width,
        y: centerY / ARTBOARD.height,
        width: artwork.bounds.width * layout.scaleX / ARTBOARD.width,
        height: artwork.bounds.height * layout.scaleY / ARTBOARD.height,
        rotationDeg: 0,
        zIndex: 1
      }
    }];
  }

  function renderPieceTemplate() {
    const slot = slotDefinition();
    const template = slot.template;
    const layout = templateLayout(slot);
    const material = selectedMaterialForSlot(slot);
    const attributes = {
      href: template.src,
      x: layout.imageX,
      y: layout.imageY,
      width: layout.imageWidth,
      height: layout.imageHeight,
      transform: template.mirror ? `translate(${ARTBOARD.width} 0) scale(-1 1)` : ""
    };
    [els.pieceTemplateImage, els.pieceMaskImage].forEach((image) => {
      Object.entries(attributes).forEach(([name, value]) => image.setAttribute(name, String(value)));
      if (!attributes.transform) image.removeAttribute("transform");
    });
    els.pieceBaseColorLayer.setAttribute("fill", material.color);
    els.materialPatternImage.setAttribute("href", material.src);
    els.pieceMaterialLayer.setAttribute("opacity", material.src ? "0.64" : "0");
  }

  function selectedMaterialForSlot(slot) {
    const schema = window.SKATE_CIM_SCHEMA;
    if (!schema?.materialTextures?.length) return { src: "", color: "#f7f7f8" };
    try {
      const serialized = sessionStorage.getItem(CUSTOMIZATION_HANDOFF_KEY) || localStorage.getItem(CUSTOMIZATION_HANDOFF_KEY) || "null";
      const handoff = JSON.parse(serialized);
      const componentConfig = handoff?.config?.[handoff.productId]?.components?.[slot.template.componentId];
      const texture = schema.materialTextures.find((item) => String(item.id) === String(componentConfig?.material));
      const color = /^#[\da-f]{6}$/i.test(componentConfig?.color || "") ? componentConfig.color : "#f7f7f8";
      return { src: texture ? `${schema.assets.root}${schema.assets.materialDir}${texture.file}` : "", color };
    } catch {
      return { src: "", color: "#f7f7f8" };
    }
  }

  function renderSlotTabs() {
    els.slotTabs.innerHTML = SLOT_DEFINITIONS.map((slot) => `<button class="slot-tab" type="button" role="tab" data-slot-id="${slot.id}" aria-selected="${slot.id === state.slotId}">${slot.code} · ${slot.label}</button>`).join("");
  }

  function svgElement(name, attributes = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function colorMatrixValues(hex) {
    const match = String(hex || "").match(/^#([\da-f]{6})$/i);
    if (!match) return "";
    const value = match[1];
    const rgb = [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
    return `0 0 0 0 ${rgb[0]} 0 0 0 0 ${rgb[1]} 0 0 0 0 ${rgb[2]} 0 0 0 1 0`;
  }

  function drawTintedImageCrop(context, image, source, destination, threadColor) {
    const layer = document.createElement("canvas");
    layer.width = Math.max(1, Math.ceil(destination.width));
    layer.height = Math.max(1, Math.ceil(destination.height));
    const layerContext = layer.getContext("2d");
    if (!layerContext) return;
    layerContext.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, layer.width, layer.height);
    if (colorMatrixValues(threadColor)) {
      layerContext.globalCompositeOperation = "source-in";
      layerContext.fillStyle = threadColor;
      layerContext.fillRect(0, 0, layer.width, layer.height);
    }
    context.drawImage(layer, destination.x, destination.y, destination.width, destination.height);
  }

  function objectBounds(object) {
    const width = object.transform.width * ARTBOARD.width;
    const height = object.transform.height * ARTBOARD.height;
    return { x: object.transform.x * ARTBOARD.width - width / 2, y: object.transform.y * ARTBOARD.height - height / 2, width, height };
  }

  function objectTransform(object) {
    return `translate(${object.transform.x * ARTBOARD.width} ${object.transform.y * ARTBOARD.height}) rotate(${object.transform.rotationDeg})`;
  }

  function renderObject(object) {
    const group = svgElement("g", { "data-object-id": object.id, transform: objectTransform(object), tabindex: "0" });
    const width = object.transform.width * ARTBOARD.width;
    const height = object.transform.height * ARTBOARD.height;
    if (object.type === "text") {
      const scaleX = (object.transform.width || .42) / .42;
      const scaleY = (object.transform.height || .12) / .12;
      const text = svgElement("text", { x: "0", y: "0", transform: `scale(${scaleX} ${scaleY})`, "text-anchor": "middle", "dominant-baseline": "middle", fill: object.fill?.hex || "#111111", "font-size": object.fontSizePx || 42, "font-weight": object.fontWeight || 400, "font-style": object.fontStyle || "normal", "font-family": fontFamilyCss(object.fontFamilyId) });
      text.textContent = object.text || "输入文字";
      group.appendChild(text);
    } else {
      const sourceWidth = object.sourceWidth || 1000;
      const sourceHeight = object.sourceHeight || 1000;
      const crop = normalizeCropRect(object.cropRect);
      const imageFrame = svgElement("svg", { x: -width / 2, y: -height / 2, width, height, viewBox: `${crop.x * sourceWidth} ${crop.y * sourceHeight} ${crop.width * sourceWidth} ${crop.height * sourceHeight}`, preserveAspectRatio: "xMidYMid meet", overflow: "hidden", opacity: object.opacity || 1 });
      const image = svgElement("image", { x: "0", y: "0", width: sourceWidth, height: sourceHeight, preserveAspectRatio: "none" });
      const tintMatrix = colorMatrixValues(object.threadColor);
      if (tintMatrix) {
        const filterId = `thread-tint-${String(object.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
        const defs = svgElement("defs");
        const filter = svgElement("filter", { id: filterId, x: "-10%", y: "-10%", width: "120%", height: "120%", "color-interpolation-filters": "sRGB" });
        filter.appendChild(svgElement("feColorMatrix", { type: "matrix", values: tintMatrix }));
        defs.appendChild(filter);
        imageFrame.appendChild(defs);
        image.setAttribute("filter", `url(#${filterId})`);
      }
      if (object.previewUrl) {
        image.setAttribute("href", object.previewUrl);
        if (!object.sourceWidth || !object.sourceHeight) image.addEventListener("load", () => {
          if (object.sourceWidth && object.sourceHeight) return;
          object.sourceWidth = image.naturalWidth || sourceWidth;
          object.sourceHeight = image.naturalHeight || sourceHeight;
          render();
        }, { once: true });
      } else {
        image.setAttribute("href", "");
        image.setAttribute("visibility", "hidden");
        const placeholder = svgElement("rect", { x: -width / 2, y: -height / 2, width, height, rx: 16, fill: "url(#checkerPattern)", stroke: "#a79a8b", "stroke-dasharray": "7 5" });
        group.appendChild(placeholder);
        const label = svgElement("text", { x: "0", y: "0", "text-anchor": "middle", "dominant-baseline": "middle", fill: "#77736e", "font-size": "15", "font-weight": "700" });
        label.textContent = object.fileName ? `需重新选择：${object.fileName}` : "图片素材";
        group.appendChild(label);
      }
      imageFrame.appendChild(image);
      group.appendChild(imageFrame);
    }
    group.addEventListener("pointerdown", (event) => beginDrag(event, object.id));
    group.addEventListener("click", (event) => { event.stopPropagation(); selectObject(object.id); });
    return group;
  }

  function renderSelection() {
    els.selectionLayer.innerHTML = "";
    const object = selectedObject();
    if (!object) return;
    const bounds = objectBounds(object);
    const centerX = object.transform.x * ARTBOARD.width;
    const centerY = object.transform.y * ARTBOARD.height;
    const handleY = bounds.y - 34;
    const group = svgElement("g", { transform: `rotate(${object.transform.rotationDeg} ${centerX} ${centerY})` });
    group.appendChild(svgElement("rect", { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, rx: 9, fill: "none", stroke: "#111111", "stroke-width": "3", "stroke-dasharray": "9 6", "pointer-events": "none" }));
    group.appendChild(svgElement("line", { x1: centerX, y1: bounds.y, x2: centerX, y2: handleY, stroke: "#111111", "stroke-width": "3", "pointer-events": "none" }));
    group.appendChild(svgElement("circle", { cx: bounds.x, cy: bounds.y, r: "9", fill: "#fff", stroke: "#111111", "stroke-width": "3", "pointer-events": "none" }));
    const scaleHandle = svgElement("circle", { cx: bounds.x + bounds.width, cy: bounds.y + bounds.height, r: "12", fill: "#fff", stroke: "#111111", "stroke-width": "4", class: "scale-handle", role: "slider", tabindex: "0", "aria-label": "缩放大小；拖动或使用方向键调整", "aria-valuemin": "4", "aria-valuemax": "90", "aria-valuenow": String(Math.round(Math.max(object.transform.width, object.transform.height) * 100)) });
    scaleHandle.addEventListener("pointerdown", (event) => beginScaleDrag(event, object.id));
    scaleHandle.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(event.key)) return;
      event.preventDefault();
      const factor = event.key === "ArrowUp" || event.key === "ArrowRight" ? 1.05 : 1 / 1.05;
      updateSelected((selected) => scaleObject(selected, factor));
    });
    group.appendChild(scaleHandle);
    const rotateHandle = svgElement("circle", { cx: centerX, cy: handleY, r: "26", fill: "#fff", stroke: "#111111", "stroke-width": "4", "class": "rotate-handle", role: "slider", tabindex: "0", "aria-label": "旋转角度；拖动调整", "aria-valuemin": "-360", "aria-valuemax": "360", "aria-valuenow": String(Math.round(object.transform.rotationDeg || 0)) });
    rotateHandle.addEventListener("pointerdown", (event) => beginRotateDrag(event, object.id));
    rotateHandle.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const step = event.shiftKey ? 15 : 1;
      updateSelected((selected) => { selected.transform.rotationDeg += event.key === "ArrowRight" ? step : -step; });
    });
    group.appendChild(rotateHandle);
    const rotateIcon = svgElement("text", { x: centerX, y: handleY + 8, "text-anchor": "middle", "font-size": "26", "font-weight": "700", fill: "#111111", "pointer-events": "none", "aria-hidden": "true" });
    rotateIcon.textContent = "↻";
    group.appendChild(rotateIcon);
    // 删除入口跟随当前选中对象，避免占用画板底部的常驻工具位。
    const deleteX = Math.min(ARTBOARD.width - 18, bounds.x + bounds.width + 22);
    const deleteY = Math.max(18, bounds.y - 20);
    const deleteHandle = svgElement("circle", { cx: deleteX, cy: deleteY, r: "18", fill: "#fff", stroke: "#b84b4b", "stroke-width": "3", class: "delete-handle", role: "button", tabindex: "0", "aria-label": "删除当前对象" });
    deleteHandle.addEventListener("pointerdown", (event) => event.stopPropagation());
    deleteHandle.addEventListener("click", (event) => { event.stopPropagation(); deleteSelected(); });
    deleteHandle.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      deleteSelected();
    });
    group.appendChild(deleteHandle);
    const deleteIcon = svgElement("text", { x: deleteX, y: deleteY + 7, "text-anchor": "middle", class: "delete-handle-icon", "aria-hidden": "true" });
    deleteIcon.textContent = "×";
    group.appendChild(deleteIcon);
    els.selectionLayer.appendChild(group);
  }

  function renderInspector() {
    const object = selectedObject();
    const count = currentDocument().objects.length;
    els.objectCount.textContent = `${count} / ${MAX_OBJECTS}`;
    els.emptyInspector.hidden = Boolean(object);
    els.inspectorContent.hidden = !object;
    els.inspectorTitle.textContent = object ? (object.type === "text" ? "文字对象" : "图片对象") : "未选择对象";
    els.stageHint.textContent = object ? "拖动对象可调整位置 · 属性面板可继续微调" : "点击对象后可调整属性";
    if (!object) return;
    const isText = object.type === "text";
    const isImage = object.type === "image";
    [els.textField, els.fontField, els.sizeField, els.styleField].forEach((node) => { node.hidden = !isText; });
    els.colorField.hidden = !isText && !isImage;
    if (isText) {
      els.textInput.value = object.text || "";
      els.textCounter.textContent = `${(object.text || "").length} / 30`;
      els.fontSelect.value = object.fontFamilyId || "system-sans";
      els.sizeInput.value = Math.round(object.fontSizeMm || 8);
      document.querySelectorAll("[data-style]").forEach((button) => button.setAttribute("aria-pressed", button.dataset.style === (object.fontStyle === "italic" ? "italic" : object.fontWeight >= 700 ? "bold" : "normal")));
    }
    els.colorOptions.innerHTML = THREAD_COLORS.map((color) => `<button class="color-option" type="button" data-color="${color}" aria-label="刺绣线色 ${color}" aria-pressed="${(isImage ? object.threadColor : object.fill?.hex) === color}" style="background:${color}"></button>`).join("");
    els.constraintNote.textContent = object.type === "image" && !object.previewUrl ? "图片预览只存在于当前页面；刷新后会保留素材元数据，重新选择原图即可恢复预览。" : "贴片轮廓使用工程内对应素材；真实毫米尺寸、安全区和最小文字高度接入后再进行生产约束校验。";
  }

  function render() {
    const documentData = currentDocument();
    els.slotTitle.textContent = slotDefinition().label;
    renderSlotTabs();
    renderPieceTemplate();
    els.objectLayer.innerHTML = "";
    [...documentData.objects].sort((a, b) => (a.transform.zIndex || 0) - (b.transform.zIndex || 0)).forEach((object) => els.objectLayer.appendChild(renderObject(object)));
    renderSelection();
    renderInspector();
  }

  function selectObject(id) {
    state.selectedId = id;
    render();
  }

  function addObject(object) {
    if (currentDocument().objects.length >= MAX_OBJECTS) {
      showToast("一个裁片最多放置 6 个对象");
      return;
    }
    recordHistory();
    currentDocument().objects.push(object);
    touchDocument();
    state.selectedId = object.id;
    render();
  }

  function replaceImageObject(object) {
    // 每个贴片仅允许一张图片；新图片成功上传后替换现有默认图或用户图片。
    recordHistory();
    currentDocument().objects = currentDocument().objects.filter((existing) => {
      if (existing.type !== "image") return true;
      const objectUrl = state.objectUrls.get(existing.id);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      state.objectUrls.delete(existing.id);
      return false;
    });
    currentDocument().objects.push(object);
    state.selectedId = object.id;
    touchDocument();
    render();
  }

  function updateSelected(mutator) {
    const object = selectedObject();
    if (!object) return;
    recordHistory();
    mutator(object);
    touchDocument();
    render();
  }

  function changeSlot(slotId) {
    if (!state.documents[slotId]) state.documents[slotId] = emptyDocument(slotId);
    state.slotId = slotId;
    state.selectedId = null;
    state.undoStack = [];
    state.redoStack = [];
    render();
    history.replaceState({}, "", `?slot=${encodeURIComponent(slotId)}`);
  }

  function beginDrag(event, objectId) {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    event.preventDefault();
    event.stopPropagation();
    const object = currentDocument().objects.find((item) => item.id === objectId);
    if (!object) return;
    const point = svgPoint(event);
    // 先记录拖动起点并绑定指针，再重绘选中态，避免移动端首个手势丢失。
    state.selectedId = objectId;
    state.drag = { mode: "move", pointerId: event.pointerId, objectId, startX: point.x, startY: point.y, originX: object.transform.x, originY: object.transform.y, historyRecorded: false };
    els.artboard.setPointerCapture?.(event.pointerId);
    render();
  }

  function beginRotateDrag(event, objectId) {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    event.preventDefault();
    event.stopPropagation();
    const object = currentDocument().objects.find((item) => item.id === objectId);
    if (!object) return;
    const point = svgPoint(event);
    const centerX = object.transform.x * ARTBOARD.width;
    const centerY = object.transform.y * ARTBOARD.height;
    state.drag = {
      mode: "rotate",
      pointerId: event.pointerId,
      objectId,
      centerX,
      centerY,
      startAngle: Math.atan2(point.y - centerY, point.x - centerX),
      originRotation: object.transform.rotationDeg,
      historyRecorded: false
    };
    els.artboard.setPointerCapture?.(event.pointerId);
  }

  function beginScaleDrag(event, objectId) {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    event.preventDefault();
    event.stopPropagation();
    const object = currentDocument().objects.find((item) => item.id === objectId);
    if (!object) return;
    const point = svgPoint(event);
    const centerX = object.transform.x * ARTBOARD.width;
    const centerY = object.transform.y * ARTBOARD.height;
    state.drag = {
      mode: "scale",
      pointerId: event.pointerId,
      objectId,
      centerX,
      centerY,
      startDistance: Math.max(1, Math.hypot(point.x - centerX, point.y - centerY)),
      originWidth: object.transform.width,
      originHeight: object.transform.height,
      historyRecorded: false
    };
    els.artboard.setPointerCapture?.(event.pointerId);
  }

  function svgPoint(event) {
    const rect = els.artboard.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * ARTBOARD.width, y: ((event.clientY - rect.top) / rect.height) * ARTBOARD.height };
  }

  function moveDrag(event) {
    if (!state.drag) return;
    const object = currentDocument().objects.find((item) => item.id === state.drag.objectId);
    if (!object) return;
    const point = svgPoint(event);
    if (state.drag.mode === "rotate") {
      const angle = Math.atan2(point.y - state.drag.centerY, point.x - state.drag.centerX);
      if (!state.drag.historyRecorded) { recordHistory(); state.drag.historyRecorded = true; }
      object.transform.rotationDeg = state.drag.originRotation + ((angle - state.drag.startAngle) * 180 / Math.PI);
      render();
      return;
    }
    if (state.drag.mode === "scale") {
      const currentDistance = Math.hypot(point.x - state.drag.centerX, point.y - state.drag.centerY);
      const minScale = Math.max(.04 / state.drag.originWidth, .04 / state.drag.originHeight);
      const maxScale = Math.min(.9 / state.drag.originWidth, .9 / state.drag.originHeight);
      const scale = clamp(currentDistance / state.drag.startDistance, minScale, maxScale);
      if (!state.drag.historyRecorded) { recordHistory(); state.drag.historyRecorded = true; }
      object.transform.width = state.drag.originWidth * scale;
      object.transform.height = state.drag.originHeight * scale;
      render();
      return;
    }
    const dx = (point.x - state.drag.startX) / ARTBOARD.width;
    const dy = (point.y - state.drag.startY) / ARTBOARD.height;
    if (!state.drag.historyRecorded) { recordHistory(); state.drag.historyRecorded = true; }
    object.transform.x = clamp(state.drag.originX + dx, 0.06, 0.94);
    object.transform.y = clamp(state.drag.originY + dy, 0.06, 0.94);
    render();
  }

  function endDrag(event) {
    if (!state.drag) return;
    const drag = state.drag;
    state.drag = null;
    if (drag.pointerId !== undefined && els.artboard.hasPointerCapture?.(drag.pointerId)) els.artboard.releasePointerCapture(drag.pointerId);
    if (drag.historyRecorded) {
      touchDocument();
      render();
    }
  }

  function scaleObject(object, factor) {
    const minScale = Math.max(.04 / object.transform.width, .04 / object.transform.height);
    const maxScale = Math.min(.9 / object.transform.width, .9 / object.transform.height);
    const scale = clamp(factor, minScale, maxScale);
    object.transform.width *= scale;
    object.transform.height *= scale;
  }

  function deleteSelected() {
    if (!selectedObject()) return;
    recordHistory();
    const objectId = state.selectedId;
    currentDocument().objects = currentDocument().objects.filter((object) => object.id !== objectId);
    state.objectUrls.delete(objectId);
    state.selectedId = currentDocument().objects.at(-1)?.id || null;
    touchDocument();
    render();
  }

  function buildDesignDocument() {
    return buildDesignDocumentForSlot(state.slotId);
  }

  function loadPreviewImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function renderDesignPreview(slot) {
    const documentData = state.documents[slot.id];
    if (!documentData?.objects?.length) return null;
    const canvas = document.createElement("canvas");
    canvas.width = ARTBOARD.width;
    canvas.height = ARTBOARD.height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    for (const object of [...documentData.objects].sort((a, b) => (a.transform.zIndex || 0) - (b.transform.zIndex || 0))) {
      context.save();
      context.translate(object.transform.x * ARTBOARD.width, object.transform.y * ARTBOARD.height);
      context.rotate((object.transform.rotationDeg || 0) * Math.PI / 180);
      if (object.type === "text") {
        // 对象框缩放要同时反映到画板和鞋面快照，毫米字号仍由 fontSizeMm 控制。
        context.scale((object.transform.width || .42) / .42, (object.transform.height || .12) / .12);
        const fontStyle = object.fontStyle === "italic" ? "italic" : "normal";
        context.font = `${fontStyle} ${object.fontWeight || 400} ${object.fontSizePx || 42}px ${fontFamilyCss(object.fontFamilyId)}`;
        context.fillStyle = object.fill?.hex || "#111111";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(object.text || "", 0, 0);
      } else if (object.previewUrl) {
        try {
          const image = await loadPreviewImage(object.previewUrl);
          const width = object.transform.width * ARTBOARD.width;
          const height = object.transform.height * ARTBOARD.height;
          context.globalAlpha = object.opacity || 1;
          const crop = normalizeCropRect(object.cropRect);
          drawTintedImageCrop(context, image,
            { x: crop.x * image.naturalWidth, y: crop.y * image.naturalHeight, width: crop.width * image.naturalWidth, height: crop.height * image.naturalHeight },
            { x: -width / 2, y: -height / 2, width, height },
            object.threadColor);
        } catch {
          // 图片预览加载失败时保留其他对象，避免单张素材阻断整份确认单。
        }
      }
      context.restore();
    }

    const layout = templateLayout(slot);
    const templateImage = await loadPreviewImage(slot.template.src);
    context.globalCompositeOperation = "destination-in";
    context.save();
    if (slot.template.mirror) {
      context.translate(ARTBOARD.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(templateImage, layout.imageX, layout.imageY, layout.imageWidth, layout.imageHeight);
    context.restore();
    context.globalCompositeOperation = "source-over";

    return {
      dataUrl: canvas.toDataURL("image/png"),
      objectCount: documentData.objects.length,
      mapping: {
        angleId: slot.template.angleId,
        componentId: slot.template.componentId,
        sourceWidth: slot.template.sourceWidth,
        sourceHeight: slot.template.sourceHeight,
        x: (0 - layout.imageX) / layout.scaleX,
        y: (0 - layout.imageY) / layout.scaleY,
        width: ARTBOARD.width / layout.scaleX,
        height: ARTBOARD.height / layout.scaleY,
        cropFrame: {
          x: layout.visibleX,
          y: layout.visibleY,
          width: layout.visibleWidth,
          height: layout.visibleHeight
        }
      }
    };
  }

  async function buildDesignPreviews() {
    const previews = {};
    for (const slot of SLOT_DEFINITIONS) {
      const preview = await renderDesignPreview(slot);
      if (preview) previews[slot.id] = preview;
    }
    return previews;
  }

  function syncCustomizationHandoff(designPreviews) {
    const designs = serializableDocuments();
    let handoff = { schemaVersion: 1, productId: "yjs-pro-cim-upper", config: {} };
    try {
      let serialized = null;
      try {
        serialized = sessionStorage.getItem(CUSTOMIZATION_HANDOFF_KEY);
      } catch {
        // file:// 直开时部分浏览器会限制 sessionStorage，回退到同源 localStorage。
      }
      handoff = { ...handoff, ...(JSON.parse(serialized || localStorage.getItem(CUSTOMIZATION_HANDOFF_KEY) || "null") || {}) };
    } catch {
      // 直接打开本页时允许从默认鞋款继续，不阻断当前页面内的设计。
    }
    handoff.schemaVersion = 1;
    handoff.specialDesigns = designs;
    handoff.specialDesignPreviews = designPreviews;
    handoff.specialDesignLastSlot = state.slotId;
    handoff.updatedAt = new Date().toISOString();
    const productConfig = handoff.config?.[handoff.productId];
    if (productConfig?.embroidery) {
      SLOT_DEFINITIONS.forEach((slot) => {
        const design = designs[slot.id];
        const slotConfig = productConfig.embroidery[slot.id];
        if (!slotConfig) return;
        const textSummary = design.objects.filter((object) => object.type === "text").map((object) => object.text).filter(Boolean).join(" / ");
        const colorOnlyArtwork = isDefaultArtworkColorOnly(slot.id, state.documents[slot.id]);
        const colorNote = colorOnlyArtwork ? `${window.SKATE_CIM_I18N?.artworkColorValue || "贴图色值"}：${state.documents[slot.id].objects[0].threadColor}` : "";
        slotConfig.enabled = design.objects.length > 0;
        slotConfig.text = [textSummary, colorNote].filter(Boolean).join(" / ");
      });
    }
    // 主页面和画板处于同一 SPA，直接通过事件交接快照，避免大 Data URL 撑满浏览器存储。
    return handoff;
  }

  async function navigateToMainFlow(resumeStep) {
    saveDocuments();
    try {
      setSyncStatus("正在生成邮件用的画板截图…", "saving");
      const designPreviews = await buildDesignPreviews();
      const handoff = syncCustomizationHandoff(designPreviews);
      setSyncStatus("截图已就绪，发送确认单时会随邮件提交", "saved");
      window.dispatchEvent(new CustomEvent("skate-cim:special-finish", { detail: { resumeStep, handoff } }));
    } catch (error) {
      setSyncStatus(`画板截图生成失败：${error.message}`, "error");
      showToast("截图生成失败，请检查画板图片后重试");
    }
  }

  function openJsonModal() {
    els.jsonOutput.textContent = JSON.stringify(buildDesignDocument(), null, 2);
    els.jsonModal.hidden = false;
  }

  function closeJsonModal() { els.jsonModal.hidden = true; }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
  }

  function undo() {
    const previous = state.undoStack.pop();
    if (!previous) return;
    state.redoStack.push(snapshot());
    restoreSnapshot(previous);
  }

  function redo() {
    const next = state.redoStack.pop();
    if (!next) return;
    state.undoStack.push(snapshot());
    restoreSnapshot(next);
  }

  els.slotTabs.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-slot-id]");
    if (tab) changeSlot(tab.dataset.slotId);
  });
  document.querySelector("#artboard").addEventListener("pointermove", moveDrag);
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
  document.querySelector("#artboard").addEventListener("click", (event) => { if (event.target === els.artboard) { state.selectedId = null; render(); } });
  document.querySelector("#addTextButton").addEventListener("click", () => addObject(createTextObject()));
  document.querySelector("#imageInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { showToast("请选择 PNG、JPEG 或 WebP 图片"); return; }
    if (file.size > 8 * 1024 * 1024) { showToast("图片请控制在 8MB 内"); return; }
    if (currentDocument().objects.filter((object) => object.type !== "image").length >= MAX_OBJECTS) { showToast("一个裁片最多放置 6 个对象"); return; }
    const previewUrl = URL.createObjectURL(file);
    try {
      const object = createImageObject(file, previewUrl);
      const imageDimensions = await loadPreviewImage(previewUrl);
      object.sourceWidth = imageDimensions.naturalWidth;
      object.sourceHeight = imageDimensions.naturalHeight;
      state.objectUrls.set(object.id, previewUrl);
      replaceImageObject(object);
      setSyncStatus("图片仅在当前页面使用，完成后会随确认单截图发邮件", "saved");
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      setSyncStatus(`图片读取失败：${error.message}`, "error");
      showToast("图片读取失败，请换一张图片重试");
    }
  });
  document.querySelector("#undoButton").addEventListener("click", undo);
  document.querySelector("#redoButton").addEventListener("click", redo);
  document.querySelector("#jsonButton").addEventListener("click", openJsonModal);
  document.querySelectorAll("[data-back-builder]").forEach((button) => button.addEventListener("click", () => void navigateToMainFlow("builder")));
  document.querySelectorAll("[data-save-plan]").forEach((button) => button.addEventListener("click", () => void navigateToMainFlow("special-preview")));
  document.querySelector("#clearButton").addEventListener("click", () => {
    if (!window.confirm("确定清空当前裁片的所有对象吗？")) return;
    recordHistory();
    currentDocument().objects = [];
    state.selectedId = null;
    touchDocument();
    render();
  });
  document.querySelector("#closeJsonButton").addEventListener("click", closeJsonModal);
  document.querySelector("#closeJsonAction").addEventListener("click", closeJsonModal);
  els.jsonModal.addEventListener("click", (event) => { if (event.target === els.jsonModal) closeJsonModal(); });
  els.textInput.addEventListener("input", (event) => updateSelected((object) => { if (object.type === "text") object.text = event.target.value.slice(0, 30); }));
  els.fontSelect.addEventListener("change", (event) => updateSelected((object) => { object.fontFamilyId = event.target.value; }));
  els.sizeInput.addEventListener("change", (event) => updateSelected((object) => { object.fontSizeMm = clamp(Number(event.target.value) || 8, 4, 48); object.fontSizePx = object.fontSizeMm * 5.25; }));
  document.addEventListener("click", (event) => {
    const styleButton = event.target.closest("[data-style]");
    if (styleButton) updateSelected((object) => { object.fontStyle = styleButton.dataset.style === "italic" ? "italic" : "normal"; object.fontWeight = styleButton.dataset.style === "bold" ? 700 : 400; });
    const colorButton = event.target.closest("[data-color]");
    if (colorButton) updateSelected((object) => {
      if (object.type === "image") object.threadColor = colorButton.dataset.color;
      else object.fill = { ...(object.fill || {}), type: "thread", threadCode: "T-DEMO", hex: colorButton.dataset.color };
    });
  });
  document.querySelector("#copyJsonButton").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(els.jsonOutput.textContent); showToast("JSON 已复制"); } catch { showToast("当前浏览器不允许复制，请手动选择"); }
  });
  window.addEventListener("beforeunload", () => { saveDocuments(); state.objectUrls.forEach((url) => URL.revokeObjectURL(url)); });

  window.addEventListener("skate-cim:open-special", (event) => {
    const slotId = event.detail?.slotId;
    if (SLOT_DEFINITIONS.some((slot) => slot.id === slotId)) state.slotId = slotId;
    state.selectedId = null;
    renderPieceTemplate();
    render();
  });
  window.SKATE_CIM_SPECIAL_CUSTOMIZER_READY = true;

  render();
  setSyncStatus("图片和文字在当前页面内处理，提交确认单时再随邮件发送", "idle");
}());

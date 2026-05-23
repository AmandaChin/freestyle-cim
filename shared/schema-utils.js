(function () {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function byKey(items = []) {
    return new Map(items.map((item) => [item.key || item.id, item]));
  }

  function materialMap(schema) {
    return byKey(schema.materials || []);
  }

  function partMap(schema) {
    return byKey(schema.parts || []);
  }

  function angleMap(schema) {
    return byKey(schema.angles || []);
  }

  function resolveAsset(schema, assetPath) {
    const root = schema.assets?.root || "";
    const version = schema.assets?.version;
    return `${root}${assetPath}${version ? `?v=${version}` : ""}`;
  }

  function variantPath(angleKey, partKey, variantId) {
    return `${angleKey}/fixed/${partKey}/${variantId}.png`;
  }

  function partPath(angleKey, partKey) {
    return `${angleKey}/parts/${partKey}.png`;
  }

  function resolveAngleAssets(schema, angleKey) {
    const angle = (schema.angles || []).find((item) => item.key === angleKey || item.id === angleKey) || schema.angles?.[0];
    if (!angle) return null;
    const partsByKey = partMap(schema);
    const parts = {};
    const fixed = {};

    const layerPartKeys = angle.layerPartKeys || Object.keys(angle.layerAssets || {});
    layerPartKeys.forEach((partKey) => {
      const part = partsByKey.get(partKey);
      if (!part) return;
      if (part.renderMode === "mask_tint") {
        parts[partKey] = resolveAsset(schema, partPath(angle.key, partKey));
      }
      if (part.renderMode === "fixed_variant") {
        fixed[partKey] = Object.fromEntries((part.fixedVariants || []).map((variant) => [
          variant.id,
          resolveAsset(schema, variantPath(angle.key, partKey, variant.id))
        ]));
      }
    });

    return {
      id: angle.key,
      key: angle.key,
      label: angle.name,
      meta: angle.name,
      base: resolveAsset(schema, angle.baseFile),
      stitch: resolveAsset(schema, angle.stitchFile || `${angle.key}/stitch.png`),
      parts,
      fixed
    };
  }

  function availablePartsForAngle(schema, angleKey) {
    const angle = (schema.angles || []).find((item) => item.key === angleKey || item.id === angleKey);
    return angle?.layerPartKeys || Object.keys(angle?.layerAssets || {});
  }

  function materialsForPart(schema, partKey) {
    const part = (schema.parts || []).find((item) => item.key === partKey);
    if (!part) return [];
    const materials = materialMap(schema);
    return (part.materialIds || []).map((id) => materials.get(id)).filter(Boolean);
  }

  function mergePublishedShoe(schema, publishedShoe) {
    if (!publishedShoe) return clone(schema);
    const merged = {
      ...clone(schema),
      ...clone(publishedShoe),
      assets: { ...clone(schema.assets || {}), ...clone(publishedShoe.assets || {}) },
      palettes: publishedShoe.palettes ? clone(publishedShoe.palettes) : clone(schema.palettes || {}),
      materials: publishedShoe.materials?.length ? clone(publishedShoe.materials) : clone(schema.materials || []),
      fixedStyleSets: publishedShoe.fixedStyleSets ? clone(publishedShoe.fixedStyleSets) : clone(schema.fixedStyleSets || {}),
      fixedVariants: publishedShoe.fixedVariants ? clone(publishedShoe.fixedVariants) : clone(schema.fixedVariants || {}),
      parts: publishedShoe.parts?.length ? clone(publishedShoe.parts) : clone(schema.parts || []),
      angles: publishedShoe.angles?.length ? clone(publishedShoe.angles) : clone(schema.angles || [])
    };
    return merged;
  }

  window.SKATE_CIM_SCHEMA_UTILS = {
    clone,
    byKey,
    materialMap,
    partMap,
    angleMap,
    resolveAsset,
    resolveAngleAssets,
    availablePartsForAngle,
    materialsForPart,
    mergePublishedShoe
  };
}());

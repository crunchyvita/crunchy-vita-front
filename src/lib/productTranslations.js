// lib/productTranslations.js - Enhanced version

export function normalizeLocale(locale) {
  if (!locale) return "fr";

  // Convert to string and get base language
  const lang = String(locale).toLowerCase().split(/[-_]/)[0];

  // Only support fr and en
  return lang === "en" ? "en" : "fr";
}

export function pickText(preferred, fallback) {
  if (typeof preferred === "string") {
    const trimmed = preferred.trim();
    if (trimmed) return trimmed;
  }

  if (typeof fallback === "string") {
    const trimmed = fallback.trim();
    if (trimmed) return trimmed;
  }

  return "";
}

export function getTranslatedProduct(product, locale) {
  if (!product || typeof product !== "object") {
    return { name: "", description: "" };
  }

  const baseLocale = normalizeLocale(locale);

  // FR base fields
  const frName = typeof product.name === "string" ? product.name.trim() : "";
  const frDescription = typeof product.description === "string" ? product.description.trim() : "";

  // EN translations (if exist)
  const enName = product.translations?.en?.name;
  const enDescription = product.translations?.en?.description;

  // FR locale
  if (baseLocale === "fr") {
    return {
      name: frName || pickText(enName, ""),
      description: frDescription || pickText(enDescription, ""),
    };
  }

  // EN locale
  return {
    name: pickText(enName, frName),
    description: pickText(enDescription, frDescription),
  };
}

/**
 * ✅ Package: translate name + description when available
 */
export function getTranslatedPackage(pkg, locale) {
  if (!pkg || typeof pkg !== "object") {
    return { name: "", description: "" };
  }

  const baseLocale = normalizeLocale(locale);

  const originalName = typeof pkg.name === "string" ? pkg.name.trim() : "";
  const frDescription = typeof pkg.description === "string" ? pkg.description.trim() : "";

  // translations
  const enName = pkg.translations?.en?.name;
  const enDescription = pkg.translations?.en?.description;

  if (baseLocale === "fr") {
    return {
      name: originalName || pickText(enName, ""),
      description: frDescription || pickText(enDescription, ""),
    };
  }

  return {
    name: pickText(enName, originalName),
    description: pickText(enDescription, frDescription),
  };
}

// Helper to check if product has English translation
export function hasEnglishTranslation(product) {
  if (!product?.translations?.en) return false;

  const hasName = product.translations.en.name && product.translations.en.name.trim() !== "";
  const hasDescription =
    product.translations.en.description && product.translations.en.description.trim() !== "";

  return hasName || hasDescription;
}

// Helper to get translation quality level
export function getTranslationLevel(product) {
  if (!hasEnglishTranslation(product)) return "none";

  const hasName = product.translations.en.name && product.translations.en.name.trim() !== "";
  const hasDescription =
    product.translations.en.description && product.translations.en.description.trim() !== "";

  if (hasName && hasDescription) return "full";
  if (hasName || hasDescription) return "partial";
  return "none";
}

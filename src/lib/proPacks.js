// Bulk formats (1 kg, 2 kg…) get their own "Packs Pros" shop tab and are kept out of the retail lists.
// A product counts as one if it is filed under the "Packs Pros" category in the admin (also spelled
// "PackPros"), or if its name carries a kilogram format — retail bags are sold in grams.
const PRO_PACK_CATEGORIES = new Set(['packspros', 'packpros']);
const KILO_FORMAT = /(^|[^a-z0-9])\d+(?:[.,]\d+)?\s?kg(?![a-z])/i;

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export function isProPack(product) {
  const categories = [...(product?.categoryIds || []), product?.categoryId].filter(Boolean);
  if (categories.some((c) => typeof c === 'object' && PRO_PACK_CATEGORIES.has(normalize(c.name)))) {
    return true;
  }
  return [product?.name, product?.translations?.en?.name].some((name) => KILO_FORMAT.test(String(name || '')));
}

/** "1kg , 2 kg ,10kg" (admin setting) → "1 kg, 2 kg, 10 kg" */
export function formatProFormats(raw) {
  return String(raw || '')
    .split(',')
    .map((f) => f.trim().replace(/\s+/g, '').replace(/(\d)(kg|g)$/i, '$1 $2'))
    .filter(Boolean)
    .join(', ');
}

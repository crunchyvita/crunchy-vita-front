// Bulk formats (1 kg, 2 kg…) are regular products filed under a "Packs Pros" category in the admin.
// They get their own shop tab and are kept out of the retail lists.
const PRO_PACK_CATEGORY = 'packspros';

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export function isProPack(product) {
  const categories = [...(product?.categoryIds || []), product?.categoryId].filter(Boolean);
  return categories.some((c) => typeof c === 'object' && normalize(c.name) === PRO_PACK_CATEGORY);
}

/** "1kg , 2 kg ,10kg" (admin setting) → "1 kg, 2 kg, 10 kg" */
export function formatProFormats(raw) {
  return String(raw || '')
    .split(',')
    .map((f) => f.trim().replace(/\s+/g, '').replace(/(\d)(kg|g)$/i, '$1 $2'))
    .filter(Boolean)
    .join(', ');
}

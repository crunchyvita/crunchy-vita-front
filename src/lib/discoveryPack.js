// The "Pack Découverte" is a regular package created in the admin; it is recognised by its name
// so the home page can feature it as soon as it exists, without any extra setting.
const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function findDiscoveryPack(packages) {
  return (packages || []).find((pkg) => {
    if (pkg?.isActive === false) return false;
    const names = `${normalize(pkg?.name)} ${normalize(pkg?.translations?.en?.name)}`;
    return names.includes('decouverte') || names.includes('discovery');
  }) || null;
}

/** Plain, serialisable data for the home page banner. */
export function toDiscoveryPackProps(pkg, locale) {
  if (!pkg) return null;
  const en = locale === 'en';
  return {
    id: String(pkg._id),
    name: (en && pkg.translations?.en?.name) || pkg.name,
    description: (en && pkg.translations?.en?.description) || pkg.description || '',
    image: pkg.image || null,
    price: Number(pkg.price) > 0 ? Number(pkg.price) * (1 - (Number(pkg.discountPercentage) || 0) / 100) : null,
    discountPercentage: Number(pkg.discountPercentage) || 0,
    freeShipping: pkg.freeShipping === true,
  };
}

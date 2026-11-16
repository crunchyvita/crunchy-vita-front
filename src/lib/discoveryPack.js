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

// Same rule as checkout: fixed price if set, otherwise the sum of the products' latest prices,
// minus the package discount. Needs `products.productId` populated (the packages API does).
function packagePrice(pkg) {
  let base = Number(pkg.price) > 0 ? Number(pkg.price) : 0;
  if (!base) {
    for (const item of pkg.products || []) {
      const history = item?.productId?.pricingHistory;
      const unit = Number(history?.length ? history[history.length - 1]?.price : item?.productId?.price);
      if (!Number.isFinite(unit) || unit <= 0) return null;
      base += unit * (Number(item.quantity) || 1);
    }
  }
  if (!base) return null;
  return Math.round(base * (1 - (Number(pkg.discountPercentage) || 0) / 100) * 100) / 100;
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
    price: packagePrice(pkg),
    discountPercentage: Number(pkg.discountPercentage) || 0,
    freeShipping: pkg.freeShipping === true,
  };
}

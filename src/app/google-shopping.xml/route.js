import { SITE_URL, truncate } from '@/lib/seo';
import { getActivePackages, getPublicProducts, getSettings } from '@/lib/serverApi';
import { getFranceShippingThresholds } from '@/lib/shippingThresholds';
import { getAvailableStock, getCurrentPrice, getDescriptionLines, getProductImages } from '@/lib/productSeo';
import { isProPack } from '@/lib/proPacks';

// Google Merchant Center product feed (RSS 2.0 + g: namespace), registered as a scheduled fetch
// in Merchant Center. Built from live shop data so prices and stock stay in sync.
export const revalidate = 3600;

const BRAND = 'Crunchy Vita';
const GOOGLE_CATEGORY = 'Food, Beverages & Tobacco > Food Items > Fruits & Vegetables';

const xml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Net weight from the product name ("(13g)", "– 1kg") for Google's price-per-unit display.
function unitPricing(name) {
  const match = String(name || '').match(/(\d+(?:[.,]\d+)?)\s?(kg|g)(?![a-z])/i);
  if (!match) return '';
  const unit = match[2].toLowerCase();
  const amount = match[1].replace(',', '.');
  return `
      <g:unit_pricing_measure>${amount}${unit}</g:unit_pricing_measure>
      <g:unit_pricing_base_measure>${unit === 'kg' ? '1kg' : '100g'}</g:unit_pricing_base_measure>`;
}

// Cheapest France delivery (pickup point) for an order of just this item, per the shop's rules.
function shipping(price, freeShipping, thresholds) {
  const cost = freeShipping || price >= thresholds.relayFree ? 0 : thresholds.relayFee;
  return `
      <g:shipping>
        <g:country>FR</g:country>
        <g:service>Point relais</g:service>
        <g:price>${cost.toFixed(2)} EUR</g:price>
      </g:shipping>`;
}

function item({ id, title, description, link, images, price, inStock, productType, freeShipping = false, thresholds }) {
  if (!images.length || !(price > 0)) return ''; // Google rejects items without image or price
  const [main, ...extra] = images;
  return `
    <item>
      <g:id>${xml(id)}</g:id>
      <g:title>${xml(truncate(title, 150))}</g:title>
      <g:description>${xml(truncate(description, 4900))}</g:description>
      <g:link>${xml(link)}</g:link>
      <g:image_link>${xml(main)}</g:image_link>${extra
        .slice(0, 10)
        .map((url) => `\n      <g:additional_image_link>${xml(url)}</g:additional_image_link>`)
        .join('')}
      <g:availability>${inStock ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${price.toFixed(2)} EUR</g:price>
      <g:brand>${xml(BRAND)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${xml(GOOGLE_CATEGORY)}</g:google_product_category>
      <g:product_type>${xml(productType)}</g:product_type>${unitPricing(title)}${shipping(price, freeShipping, thresholds)}
    </item>`;
}

// Package entries carry populated products without stock; use the shop list (which has it).
const resolveProduct = (entry, productMap) => {
  const ref = entry?.productId;
  const id = String(ref?._id || ref || '');
  return productMap.get(id) || (typeof ref === 'object' ? ref : null);
};

// Fixed packages: same price rule as checkout (fixed price, else sum of products, minus discount).
function fixedPackagePrice(pkg, productMap) {
  let base = Number(pkg.price) > 0 ? Number(pkg.price) : 0;
  if (!base) {
    for (const entry of pkg.products || []) {
      const unit = getCurrentPrice(resolveProduct(entry, productMap));
      if (!(unit > 0)) return null;
      base += unit * (Number(entry.quantity) || 1);
    }
  }
  return base ? Math.round(base * (1 - (Number(pkg.discountPercentage) || 0) / 100) * 100) / 100 : null;
}

export async function GET() {
  const [products, packages, settings] = await Promise.all([
    getPublicProducts().catch(() => []),
    getActivePackages().catch(() => []),
    getSettings().catch(() => null),
  ]);
  const thresholds = getFranceShippingThresholds(settings);

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const productItems = products.map((p) =>
    item({
      id: p._id,
      title: p.name,
      description:
        getDescriptionLines(p.description).join('. ') || `${p.name} – fruits lyophilisés ${BRAND}.`,
      link: `${SITE_URL}/fr/shop/${p._id}`,
      images: getProductImages(p),
      price: getCurrentPrice(p),
      inStock: getAvailableStock(p) > 0,
      productType: isProPack(p) ? 'Fruits lyophilisés > Grands formats' : 'Fruits lyophilisés',
      thresholds,
    })
  );

  const packageItems = packages
    .filter((pkg) => pkg.packageType === 'FIXED')
    .map((pkg) =>
      item({
        id: `pack-${pkg._id}`,
        title: pkg.name,
        description: pkg.description || `${pkg.name} – coffret de fruits lyophilisés ${BRAND}.`,
        link: `${SITE_URL}/fr/shop/packages/${pkg._id}`,
        images: pkg.image ? [pkg.image] : [],
        price: fixedPackagePrice(pkg, productMap),
        inStock: (pkg.products || []).every((entry) => getAvailableStock(resolveProduct(entry, productMap)) > 0),
        productType: 'Fruits lyophilisés > Coffrets',
        freeShipping: pkg.freeShipping === true,
        thresholds,
      })
    );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${xml(BRAND)}</title>
    <link>${SITE_URL}</link>
    <description>Fruits lyophilisés ${xml(BRAND)}</description>${[...productItems, ...packageItems].join('')}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

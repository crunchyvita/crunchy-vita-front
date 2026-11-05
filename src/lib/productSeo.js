import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/seo';
import { getTranslatedProduct } from '@/lib/productTranslations';

// Mirrors the rules used by the shop UI (latest pricingHistory entry wins).
export function getCurrentPrice(product) {
  const history = product?.pricingHistory;
  const latest = history?.length ? history[history.length - 1]?.price : undefined;
  const price = latest ?? product?.price ?? 0;
  return Number(price) || 0;
}

export function getAvailableStock(product) {
  const stock = product?.stock;
  if (!stock) return 0;
  return stock.availableQuantity ?? (stock.quantity || 0) - (stock.reservedQuantity || 0);
}

export function getProductImages(product) {
  const media = (product?.media || []).map((m) => m?.url || m).filter((u) => u && u !== 'undefined');
  if (media.length) return media;
  const single = product?.imageUrl || product?.productImage || product?.image;
  return single && single !== 'undefined' ? [single] : [];
}

/** Description lines as stored in the admin (one bullet per line). */
export function getDescriptionLines(description) {
  if (typeof description !== 'string') return [];
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•]\s*/, '').trim())
    .filter(Boolean);
}

export function getAverageRating(product) {
  const ratings = (product?.ratings || []).map((r) => Number(r?.rating)).filter((n) => n >= 1 && n <= 5);
  if (!ratings.length) return null;
  return { value: ratings.reduce((a, b) => a + b, 0) / ratings.length, count: ratings.length };
}

export function productJsonLd(product, locale, { category } = {}) {
  const { name, description } = getTranslatedProduct(product, locale);
  const url = absoluteUrl(locale, `/shop/${product._id}`);
  const rating = getAverageRating(product);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name,
    description: getDescriptionLines(description).join(', ') || undefined,
    image: getProductImages(product),
    sku: product._id,
    brand: { '@type': 'Brand', name: SITE_NAME },
    ...(category && { category }),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'EUR',
      price: getCurrentPrice(product).toFixed(2),
      availability:
        getAvailableStock(product) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
    ...(rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.value.toFixed(1),
        ratingCount: rating.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

/** `items`: [{ name, path }] in order, home first. */
export function breadcrumbJsonLd(locale, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(locale, item.path),
    })),
  };
}

import { getTranslations } from 'next-intl/server';
import ProductGrid from '@/components/product/ProductGrid';

/** Server-rendered cross-links between product pages. */
export default async function RelatedProducts({ products, locale }) {
  if (!products?.length) return null;
  const t = await getTranslations({ locale, namespace: 'ProductDetail.related' });

  return (
    <section className="mt-12 sm:mt-16 border-t border-gray-200 pt-8" aria-labelledby="related-products-title">
      <h2 id="related-products-title" className="text-xl sm:text-2xl font-agrandir font-bold text-[#556822] mb-6 sm:mb-8">
        {t('title')}
      </h2>
      <ProductGrid products={products} locale={locale} />
    </section>
  );
}

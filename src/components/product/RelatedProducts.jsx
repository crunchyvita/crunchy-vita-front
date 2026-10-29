import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import { getTranslatedProduct } from '@/lib/productTranslations';
import { getCurrentPrice, getProductImages } from '@/lib/productSeo';
import { optimizedImageUrl } from '@/lib/imageUrl';

/** Server-rendered cross-links between product pages. */
export default async function RelatedProducts({ products, locale }) {
  if (!products?.length) return null;
  const t = await getTranslations({ locale, namespace: 'ProductDetail.related' });

  return (
    <section className="mt-12 sm:mt-16 border-t border-gray-200 pt-8" aria-labelledby="related-products-title">
      <h2 id="related-products-title" className="text-xl sm:text-2xl font-agrandir font-bold text-[#556822] mb-6 sm:mb-8">
        {t('title')}
      </h2>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => {
          const { name } = getTranslatedProduct(product, locale);
          const image = getProductImages(product)[0];
          return (
            <li key={product._id}>
              <Link
                href={`/shop/${product._id}`}
                className="group block bg-white rounded-2xl overflow-hidden border border-[#E1FBD9] shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-[#F2F8EE] overflow-hidden">
                  {image && (
                    <img
                      src={optimizedImageUrl(image, 400)}
                      alt={name}
                      width={400}
                      height={400}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-black text-[#556822] text-sm sm:text-base mb-1 group-hover:text-[#E10C69] transition-colors">
                    {name}
                  </h3>
                  <p className="font-black text-[#E10C69]">{getCurrentPrice(product).toFixed(2)} €</p>
                  <span className="sr-only">{t('viewProduct')}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

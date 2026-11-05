import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import { getTranslatedProduct } from '@/lib/productTranslations';
import { getCurrentPrice, getProductImages } from '@/lib/productSeo';
import { optimizedImageUrl } from '@/lib/imageUrl';

/** Server-rendered product cards linking to product pages. */
export default async function ProductGrid({ products, locale, headingLevel = 'h3' }) {
  if (!products?.length) return null;
  const t = await getTranslations({ locale, namespace: 'ProductDetail.related' });
  const Heading = headingLevel;

  return (
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => {
        const { name } = getTranslatedProduct(product, locale);
        const image = getProductImages(product)[0];
        return (
          <li key={product._id}>
            <Link
              href={`/shop/${product._id}`}
              className="group block h-full bg-white rounded-2xl overflow-hidden border border-[#E1FBD9] shadow-sm hover:shadow-lg transition-shadow"
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
                <Heading className="font-black text-[#556822] text-sm sm:text-base mb-1 group-hover:text-[#E10C69] transition-colors">
                  {name}
                </Heading>
                <p className="font-black text-[#E10C69]">{getCurrentPrice(product).toFixed(2)} €</p>
                <span className="sr-only">{t('viewProduct')}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

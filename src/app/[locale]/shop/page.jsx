import ShopClient from '@/components/shop/ShopClient';
import JsonLd from '@/components/seo/JsonLd';
import { staticPageMetadata } from '@/lib/pageMetadata';
import { absoluteUrl } from '@/lib/seo';
import { getActivePackages, getPublicProducts } from '@/lib/serverApi';
import { getTranslatedProduct } from '@/lib/productTranslations';

export const generateMetadata = staticPageMetadata('shop', '/shop');

// A backend hiccup shouldn't break the page: the client fetch fills the gaps.
const orNull = (promise) => promise.catch(() => null);

export default async function ShopPage({ params }) {
  const { locale } = await params;
  const [products, packages] = await Promise.all([
    orNull(getPublicProducts()),
    orNull(getActivePackages()),
  ]);

  const itemList = products?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: absoluteUrl(locale, `/shop/${product._id}`),
          name: getTranslatedProduct(product, locale).name,
        })),
      }
    : null;

  return (
    <>
      {itemList && <JsonLd data={itemList} />}
      <ShopClient initialProducts={products ?? undefined} initialPackages={packages ?? undefined} />
    </>
  );
}

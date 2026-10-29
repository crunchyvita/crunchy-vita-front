import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import RelatedProducts from '@/components/product/RelatedProducts';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata, truncate } from '@/lib/seo';
import { getProduct, getPublicProducts } from '@/lib/serverApi';
import { getTranslatedProduct } from '@/lib/productTranslations';
import {
  breadcrumbJsonLd,
  getDescriptionLines,
  getProductImages,
  productJsonLd,
} from '@/lib/productSeo';

const RELATED_COUNT = 4;

// Same visibility rule the client page used: hidden-from-shop products don't exist publicly.
async function loadProduct(id) {
  const product = await getProduct(id);
  if (!product?._id || product.showInShop === false) notFound();
  return product;
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  const product = await loadProduct(id);
  const t = await getTranslations({ locale, namespace: 'ProductDetail.meta' });
  const { name, description } = getTranslatedProduct(product, locale);

  const details = getDescriptionLines(description).join(', ');
  const image = getProductImages(product)[0];

  return buildMetadata({
    locale,
    path: `/shop/${product._id}`,
    title: t('title', { name }),
    description: truncate(t('description', { name, details: details ? `${details}.` : '' })),
    images: image ? [{ url: image, alt: name }] : undefined,
    noIndex: product.status !== 'ACTIVE',
  });
}

export default async function ProductPage({ params }) {
  const { locale, id } = await params;
  const product = await loadProduct(id);
  const [tMeta, tCrumbs, allProducts] = await Promise.all([
    getTranslations({ locale, namespace: 'ProductDetail.meta' }),
    getTranslations({ locale, namespace: 'Breadcrumbs' }),
    getPublicProducts().catch(() => []),
  ]);

  const { name } = getTranslatedProduct(product, locale);
  const related = allProducts.filter((p) => p._id !== product._id).slice(0, RELATED_COUNT);

  return (
    <>
      <JsonLd data={productJsonLd(product, locale, { category: tMeta('category') })} />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tCrumbs('home'), path: '/' },
          { name: tCrumbs('shop'), path: '/shop' },
          { name, path: `/shop/${product._id}` },
        ])}
      />
      <ProductDetailClient
        key={product._id}
        initialProduct={product}
        relatedSlot={<RelatedProducts products={related} locale={locale} />}
      />
    </>
  );
}

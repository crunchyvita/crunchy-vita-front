import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import PackageDetailClient from '@/components/package/PackageDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata, truncate } from '@/lib/seo';
import { getPackage, getPackageProducts } from '@/lib/serverApi';
import { getTranslatedPackage } from '@/lib/productTranslations';
import { breadcrumbJsonLd } from '@/lib/productSeo';

async function loadPackage(id) {
  const pkg = await getPackage(id);
  if (!pkg?._id || !pkg.isActive) notFound();
  return pkg;
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  const pkg = await loadPackage(id);
  const t = await getTranslations({ locale, namespace: 'PackageDetail.meta' });
  const { name, description } = getTranslatedPackage(pkg, locale);

  return buildMetadata({
    locale,
    path: `/shop/packages/${pkg._id}`,
    title: t('title', { name }),
    description: truncate(t('description', { name, details: description || '' })),
    images: pkg.image ? [{ url: pkg.image, alt: name }] : undefined,
  });
}

export default async function PackagePage({ params }) {
  const { locale, id } = await params;
  const pkg = await loadPackage(id);
  const [tCrumbs, products] = await Promise.all([
    getTranslations({ locale, namespace: 'Breadcrumbs' }),
    pkg.packageType === 'FIXED' ? [] : getPackageProducts(pkg._id).catch(() => []),
  ]);
  const { name } = getTranslatedPackage(pkg, locale);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tCrumbs('home'), path: '/' },
          { name: tCrumbs('shop'), path: '/shop' },
          { name, path: `/shop/packages/${pkg._id}` },
        ])}
      />
      <PackageDetailClient key={pkg._id} initialPackage={pkg} initialProducts={products} />
    </>
  );
}

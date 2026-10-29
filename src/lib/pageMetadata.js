import { getTranslations } from 'next-intl/server';
import { buildMetadata } from '@/lib/seo';

/**
 * `generateMetadata` for a static page whose title/description live under `Meta.<key>`
 * in the message files. Usage: `export const generateMetadata = staticPageMetadata('about', '/about-us');`
 */
export function staticPageMetadata(key, path, { absoluteTitle = false } = {}) {
  return async function generateMetadata({ params }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: `Meta.${key}` });
    return buildMetadata({
      locale,
      path,
      title: absoluteTitle ? { absolute: t('title') } : t('title'),
      description: t('description'),
    });
  };
}

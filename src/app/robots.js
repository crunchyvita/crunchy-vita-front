import { locales } from '@/i18n';
import { SITE_URL } from '@/lib/seo';

// Account, cart and back-office pages have no search value.
const PRIVATE_SECTIONS = ['admin', 'auth', 'cart', 'checkout', 'profile', 'orders', 'order', 'favorites'];

export default function robots() {
  const disallow = locales.flatMap((locale) =>
    PRIVATE_SECTIONS.map((section) => `/${locale}/${section}`)
  );

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

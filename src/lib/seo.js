import { locales, defaultLocale } from '@/i18n';

export const SITE_URL = 'https://www.crunchyvita.com';
export const SITE_NAME = 'Crunchy Vita';

export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Fruits lyophilisés bio Crunchy Vita : myrtilles, mangue, ananas, banane et fraise',
};

const OG_LOCALES = { fr: 'fr_FR', en: 'en_GB' };

/** `/shop` + `fr` → `/fr/shop` (home: `/fr`). */
export function localizedPath(locale, path = '/') {
  const suffix = !path || path === '/' ? '' : path;
  return `/${locale}${suffix}`;
}

export function absoluteUrl(locale, path = '/') {
  return `${SITE_URL}${localizedPath(locale, path)}`;
}

export function languageAlternates(path = '/', toUrl = localizedPath) {
  const languages = Object.fromEntries(locales.map((l) => [l, toUrl(l, path)]));
  languages['x-default'] = toUrl(defaultLocale, path);
  return languages;
}

/**
 * Per-page metadata: canonical + hreflang + Open Graph + Twitter.
 * `title` may be a string (gets the "%s | Crunchy Vita" template) or `{ absolute }`.
 */
export function buildMetadata({
  locale,
  path = '/',
  title,
  description,
  images,
  type = 'website',
  noIndex = false,
}) {
  const plainTitle = typeof title === 'string' ? `${title} | ${SITE_NAME}` : title?.absolute;
  const ogImages = images?.length ? images : [DEFAULT_OG_IMAGE];

  return {
    title,
    description,
    alternates: {
      canonical: localizedPath(locale, path),
      languages: languageAlternates(path),
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale] ?? OG_LOCALES[defaultLocale],
      url: localizedPath(locale, path),
      title: plainTitle,
      description,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: plainTitle,
      description,
      images: ogImages.map((img) => (typeof img === 'string' ? img : img.url)),
    },
    ...(noIndex && { robots: { index: false, follow: true } }),
  };
}

/** Trims to a meta-description friendly length on a word boundary. */
export function truncate(text, max = 158) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`;
}

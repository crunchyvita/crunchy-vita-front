import { locales } from '@/i18n';
import { absoluteUrl, languageAlternates } from '@/lib/seo';
import { getActivePackages, getBlogs, getPublicProducts } from '@/lib/serverApi';

export const revalidate = 3600;

const STATIC_PAGES = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/shop', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/about-us', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/blogs', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/espace-professionnel', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.4 },
  { path: '/politique-livraison', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/politique-retour', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/cgv', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/cgu', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/mentions-legales', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/politique-confidentialite', changeFrequency: 'yearly', priority: 0.2 },
];

/** One entry per locale, each listing every language version (hreflang). */
function entriesFor({ path, lastModified, changeFrequency, priority }) {
  const alternates = { languages: languageAlternates(path, absoluteUrl) };
  return locales.map((locale) => ({
    url: absoluteUrl(locale, path),
    ...(lastModified && { lastModified: new Date(lastModified) }),
    changeFrequency,
    priority,
    alternates,
  }));
}

// A backend outage must not wipe dynamic URLs from an otherwise valid sitemap.
async function safe(load, label) {
  try {
    return await load();
  } catch (err) {
    console.error(`[sitemap] could not load ${label}:`, err.message);
    return [];
  }
}

export default async function sitemap() {
  const [products, packages, blogs] = await Promise.all([
    safe(getPublicProducts, 'products'),
    safe(getActivePackages, 'packages'),
    safe(getBlogs, 'blogs'),
  ]);

  return [
    ...STATIC_PAGES.flatMap(entriesFor),
    ...products.flatMap((p) =>
      entriesFor({ path: `/shop/${p._id}`, lastModified: p.updatedAt, changeFrequency: 'weekly', priority: 0.8 })
    ),
    ...packages.flatMap((p) =>
      entriesFor({ path: `/shop/packages/${p._id}`, lastModified: p.updatedAt, changeFrequency: 'weekly', priority: 0.7 })
    ),
    ...blogs.flatMap((b) =>
      entriesFor({ path: `/blogs/${b._id}`, lastModified: b.updatedAt, changeFrequency: 'monthly', priority: 0.5 })
    ),
  ];
}

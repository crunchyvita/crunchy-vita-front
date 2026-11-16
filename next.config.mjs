import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "localhost", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/uploads/**" },
      { protocol: "https", hostname: "crunchy-vita-back-tnst.onrender.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Public pages used to live without a locale prefix (/shop, /about-us…) and are still known
  // to Google. Redirect them permanently to the French URLs so search engines move their
  // signals over, instead of the middleware's temporary (307) locale redirect.
  async redirects() {
    const legacyPublicPaths = [
      'shop', 'shop/packages/:id', 'shop/:id', 'about-us', 'contact', 'blogs', 'blogs/:id',
      'cgv', 'cgu', 'mentions-legales', 'politique-confidentialite',
      'politique-livraison', 'politique-retour', 'fruits-lyophilises-bio',
    ];
    return [
      ...legacyPublicPaths.map((path) => ({ source: `/${path}`, destination: `/fr/${path}`, permanent: true })),
      // The professional space page was removed: its audience now goes to the Packs Pros shop tab.
      { source: '/espaceProfessionnel', destination: '/fr/shop?tab=pros', permanent: true },
      { source: '/espace-professionnel', destination: '/fr/shop?tab=pros', permanent: true },
      { source: '/:locale(fr|en)/espace-professionnel', destination: '/:locale/shop?tab=pros', permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);

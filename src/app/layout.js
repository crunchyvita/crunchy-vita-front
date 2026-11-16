import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import CookieConsent from "@/components/CookieConsent";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import JsonLd from "@/components/seo/JsonLd";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";
import { clientMessages } from "@/lib/adminI18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Fruits lyophilisés bio sans sucre ajouté | Crunchy Vita";
const DEFAULT_DESCRIPTION =
  "Fruits lyophilisés bio et sans sucre ajouté : fraise, mangue, banane, ananas et myrtilles. Un encas sain, 100 % fruit et ultra-croquant, livré en France.";

// Site-wide defaults only. No canonical here: each page sets its own via buildMetadata().
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  verification: {
    other: {
      "facebook-domain-verification": "24wszc0ry36vkc5jh3gulmb1dtad20",
    },
  },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      email: "contact@crunchyvita.com",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Antibes",
        addressCountry: "FR",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "contact@crunchyvita.com",
        availableLanguage: ["French", "English"],
      },
      sameAs: [
        "https://www.instagram.com/crunchyvita/",
        "https://www.facebook.com/profile.php?id=61585718055254",
        "https://www.tiktok.com/@crunchyvita",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: ["fr-FR", "en"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default async function RootLayout({ children }) {
  // Resolved from the URL's [locale] segment (via the next-intl middleware), not from a cookie.
  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd data={organizationJsonLd} />
        {/* Meta Pixel loads from <CookieConsent /> once the visitor accepts (CNIL). */}
        <NextIntlClientProvider locale={locale} messages={clientMessages(messages)}>
          <Providers>{children}</Providers>
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

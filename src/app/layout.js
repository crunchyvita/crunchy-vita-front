import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cookies } from "next/headers";
import { defaultLocale } from "@/i18n";
import { Providers } from "@/components/Providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Crunchy Vita – Fruits Lyophilisés Naturels ",
    template: "%s | Crunchy Vita",
  },
  description:
    "Crunchy Vita : fruits lyophilisés 100% naturels, sans sucre ajouté et sans additifs. Des snacks sains, ultra-croquants, parfaits pour le sport, le travail et les enfants.",
  keywords: [
    "Crunchy Vita",
    "fruits lyophilisés",
    "snack sain",
    "bio",
    "sans sucre ajouté",
    "fruits séchés",
  ],
  alternates: {
    canonical: "https://www.crunchyvita.com",
  },
  verification: {
    other: {
      "facebook-domain-verification": "24wszc0ry36vkc5jh3gulmb1dtad20",
    },
  },
  openGraph: {
    title: "Crunchy Vita – Fruits Lyophilisés Naturels",
    description:
      "Fruits lyophilisés 100% naturels, sans sucre ajouté et sans additifs. Snacks sains et ultra-croquants.",
    url: "https://www.crunchyvita.com",
    siteName: "Crunchy Vita",
    type: "website",
  },
};


export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const locale = cookieStore?.get?.("NEXT_LOCALE")?.value ?? defaultLocale;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '26743132138705184');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=26743132138705184&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

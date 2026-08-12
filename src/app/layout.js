import { Geist, Geist_Mono } from "next/font/google";
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
      "facebook-domain-verification": "9ld5api4kva9efydx8d9f4d1rjz6kz",
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
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

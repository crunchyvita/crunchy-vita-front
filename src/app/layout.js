import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

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
  openGraph: {
    title: "Crunchy Vita – Fruits Lyophilisés Naturels",
    description:
      "Fruits lyophilisés 100% naturels, sans sucre ajouté et sans additifs. Snacks sains et ultra-croquants.",
    url: "https://www.crunchyvita.com",
    siteName: "Crunchy Vita",
    type: "website",
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

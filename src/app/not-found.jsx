import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';

export async function generateMetadata() {
  const t = await getTranslations('NotFound');
  return { title: t('title'), robots: { index: false, follow: true } };
}

export default async function NotFound() {
  const t = await getTranslations('NotFound');

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3ED]">
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-xl text-center">
          <p className="text-7xl font-black text-[#E10C69] mb-6 font-[agrandir]">404</p>
          <h1 className="text-3xl md:text-4xl font-black text-[#556822] uppercase tracking-tight mb-4 font-[agrandir]">
            {t('heading')}
          </h1>
          <p className="text-gray-600 font-medium mb-10">{t('text')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/shop"
              className="rounded-full bg-[#E10C69] px-8 py-4 font-black uppercase tracking-widest text-white text-sm"
            >
              {t('shopCta')}
            </Link>
            <Link
              href="/"
              className="rounded-full border-2 border-[#556822] px-8 py-4 font-black uppercase tracking-widest text-[#556822] text-sm"
            >
              {t('homeCta')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

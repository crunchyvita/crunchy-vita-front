'use client';

import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function CGU() {
  const t = useTranslations('CGU');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAndBreadcrumbs />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-8 font-[agrandir]">{t('title')}</h1>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('intro.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('intro.body')}
          </p>
        </section>

        {/* Article 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article1.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article1.body')}
          </p>
        </section>

        {/* Article 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article2.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article2.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article2.p2')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article2.p3')}
          </p>
        </section>

        {/* Article 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article3.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article3.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article3.p2')}
          </p>
        </section>

        {/* Article 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article4.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article4.body')}
          </p>
        </section>

        {/* Article 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article5.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article5.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article5.p2')}
          </p>
        </section>

        {/* Article 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article6.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article6.body')}
          </p>
        </section>

        {/* Article 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article7.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article7.body')}
          </p>
        </section>

        {/* Article 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article8.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article8.body')}
          </p>
        </section>

        {/* Article 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article9.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article9.body')}
          </p>
        </section>

        {/* Article 10 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article10.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article10.p1')}{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article10.p2')}
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

'use client';

import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function CGV() {
  const t = useTranslations('CGV');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAndBreadcrumbs />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('title')}</h1>
        <p className="text-sm text-slate-600 mb-12">{t('updated')}</p>
 
        {/* Préambule */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('preamble.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('preamble.body')}
          </p>
        </section>

        {/* Article 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article1.title')}</h2>
          <ul className="space-y-3 text-slate-700 font-[maison-neue-book]">
            <li>
              {t('article1.items.item1')}
            </li>
            <li>
              {t('article1.items.item2')}
            </li>
          </ul>
        </section>

        {/* Article 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article2.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article2.body')}
          </p>
        </section>

        {/* Article 2.1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article2_1.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article2_1.body')}
          </p>
        </section>

        {/* Article 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article3.title')}</h2>
          <ul className="space-y-3 text-slate-700 font-[maison-neue-book]">
            <li>
              {t('article3.items.item1')}
            </li>
            <li>
              {t('article3.items.item2')}
            </li>
            <li>
              {t('article3.items.item3')}
            </li>
            <li>
              {t('article3.items.item4')}
            </li>
            <li>
              {t('article3.items.item5')}
            </li>
          </ul>
        </section>

        {/* Article 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article4.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article4.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article4.p2')}
          </p>
        </section>

        {/* Article 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article5.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('article5.intro')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('article5.items.item1')}</li>
            <li>{t('article5.items.item2')}</li>
            <li>{t('article5.items.item3')}</li>
            <li>{t('article5.items.item4')}</li>
            <li>{t('article5.items.item5')}</li>
          </ul>
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
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article7.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-semibold mb-2 ">
            {t('article7.p2')}
          </p>
          <p className="text-slate-700 leading-relaxed">
            {t('article7.p3')}
          </p>
        </section>

        {/* Article 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article8.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article8.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-semibold mb-2">
            {t('article8.returnAddressLabel')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-3">
            {t('article8.returnAddress')}
          </p>
          <p className="text-slate-700 leading-relaxed">
            {t('article8.p2')}
          </p>
        </section>

        {/* Article 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article9.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article9.intro')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-3 font-[maison-neue-book]">
            <li>{t('article9.items.item1')}</li>
            <li>{t('article9.items.item2')}</li>
          </ul>
        </section>

        {/* Article 10 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article10.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('article10.intro')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('article10.items.item1')}</li>
            <li>{t('article10.items.item2')}</li>
            <li>{t('article10.items.item3')}</li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}

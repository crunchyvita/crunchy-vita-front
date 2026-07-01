'use client';

import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function CGU() {
  const t = useTranslations('CGU');

  const renderParagraphs = (text) =>
    text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="text-slate-700 leading-8 text-justify mb-3 font-[maison-neue-book]">
        {paragraph}
      </p>
    ));

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAndBreadcrumbs />

      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-8 font-[agrandir]">{t('title')}</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('intro.title')}</h2>
          <div className="space-y-6">{renderParagraphs(t('intro.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article1.title')}</h2>
          <div>{renderParagraphs(t('article1.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article2.title')}</h2>
          <div>{renderParagraphs(t('article2.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article3.title')}</h2>
          <div>{renderParagraphs(t('article3.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article4.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article4.body')}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article5.title')}</h2>

          <h3 className="text-lg font-semibold text-slate-900 mb-2 font-[agrandir]">{t('article5.subtitle1')}</h3>
          <p className="text-slate-700 leading-8 mb-2 font-[maison-neue-book]">{t('article5.intro')}</p>

          <ol className="list-decimal pl-6 space-y-2 mb-4">
            {t.raw('article5.list').map((item, index) => (
              <li key={index} className="text-slate-700 leading-7 text-justify font-[maison-neue-book]">
                {item}
              </li>
            ))}
          </ol>

          <div className="mb-4">{renderParagraphs(t('article5.outro'))}</div>

          <h3 className="text-lg font-semibold text-slate-900 mb-2 font-[agrandir]">{t('article5.subtitle2')}</h3>
          <div>{renderParagraphs(t('article5.body2'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article6.title')}</h2>
          <div>{renderParagraphs(t('article6.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article7.title')}</h2>
          <div>{renderParagraphs(t('article7.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article8.title')}</h2>
          <div>{renderParagraphs(t('article8.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article9.title')}</h2>
          <div>{renderParagraphs(t('article9.body'))}</div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article10.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article10.body')}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article11.title')}</h2>
          <div>{renderParagraphs(t('article11.body'))}</div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article12.title')}</h2>
          <div>{renderParagraphs(t('article12.body'))}</div>
        </section>

        
      </main>

      <Footer />
    </div>
  );
}
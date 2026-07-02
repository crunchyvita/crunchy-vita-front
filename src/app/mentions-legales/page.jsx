'use client';

import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function MentionsLegales() {
  const t = useTranslations('LegalMentions');

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
        <h1 className="text-4xl font-bold text-slate-900 mb-12 font-[agrandir]">{t('title')}</h1>

        {/* Identification de l'éditeur */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('publisher.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('publisher.intro')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('publisher.director')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('publisher.contact')}</p>
        </section>

        {/* Hébergeur du site internet */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('host.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-2 font-[maison-neue-book]">{t('host.intro')}</p>
          <p className="text-slate-700 leading-relaxed mb-2 font-[maison-neue-book]">{t('host.email')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('host.phone')}</p>
        </section>

        {/* Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('cookies.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('cookies.intro')}</p>
          <div className="mb-4">{renderParagraphs(t('cookies.definition'))}</div>
          <p className="text-slate-700 leading-relaxed mb-4 italic font-[maison-neue-book]">{t('cookies.source')}</p>
          <div>{renderParagraphs(t('cookies.purpose'))}</div>
        </section>

        {/* Respect de la propriété intellectuelle */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">
            {t('intellectualProperty.title')}
          </h2>
          <div>{renderParagraphs(t('intellectualProperty.body'))}</div>
        </section>

        {/* Liens hypertextes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('hyperlinks.title')}</h2>
          <div>{renderParagraphs(t('hyperlinks.body'))}</div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
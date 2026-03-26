'use client';

import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function MentionsLegales() {
  const t = useTranslations('LegalMentions');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAndBreadcrumbs />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-12 font-[agrandir]">{t('title')}</h1>

        {/* Utilisation du site */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('siteUse.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('siteUse.body')}
          </p>
        </section>

        {/* Éditeur du site */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('publisher.title')}</h2>
          <p className="text-slate-700 font-semibold mb-4">{t('publisher.company')}</p>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <p className="text-slate-700 mb-2 font-[maison-neue-book]">
              {t('publisher.line1')}
              <br />
              {t('publisher.line2')}
              <br />
              {t('publisher.line3')}
              <br />
              {t('publisher.line4')}
              <br />
              {t('publisher.line5')}
              <br />
              <span className="font-semibold">{t('publisher.emailLabel')}</span>{' '}
              <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700">
                contact@crunchyvita.com
              </a>
            </p>
          </div>
        </section>

        {/* Directeur de la publication */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('director.title')}</h2>
          <p className="text-slate-700 font-[maison-neue-book]">
            {t('director.body')}
          </p>
        </section>

        {/* Hébergeur du site */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('host.title')}</h2>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <p className="text-slate-700 mb-2 font-[maison-neue-book]">
              {t('host.intro')}{' '}
              <span className="text-slate-700 mb-2 font-semibold">{t('host.name')}</span>
            </p>
            <p className="text-slate-700 mb-2 font-[maison-neue-book] ">
              {t('host.address1')}
            </p>
            <p className="text-slate-700 mb-2 font-[maison-neue-book]">
              {t('host.address2')}
            </p>
            <p className="text-slate-700 mb-4 font-[maison-neue-book]">
              {t('host.phone')}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">{t('host.websiteLabel')}</span>{' '}
              <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                www.ovhcloud.com
              </a>
            </p>
          </div>
        </section>

      
      </main>

      <Footer />
    </div>
  );
}

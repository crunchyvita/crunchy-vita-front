'use client';

import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function PolitiqueConfidentialite() {
  const t = useTranslations('PrivacyPolicy');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAndBreadcrumbs />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-8 font-[agrandir]">{t('title')}</h1>

        <p className="text-slate-700 leading-relaxed mb-12">
          {t('intro')}
        </p>

        {/* Informations personnelles recueillies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('collected.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('collected.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('collected.p2')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('collected.items.item1')}</li>
            <li>{t('collected.items.item2')}</li>
            <li>{t('collected.items.item3')}</li>
          </ul>
        </section>

        {/* Application Mobile - NEW SECTION */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('mobileApp.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('mobileApp.intro')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('mobileApp.items.item1')}</li>
            <li>{t('mobileApp.items.item2')}</li>
            <li>{t('mobileApp.items.item3')}</li>
            <li>{t('mobileApp.items.item4')}</li>
            <li>{t('mobileApp.stripe')}</li>
          </ul>
       
      
        </section>

        {/* Cookies utilisés */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 font-[agrandir]">{t('cookies.title')}</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('cookies.required.title')}</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('cookies.required.body')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('cookies.technical.title')}</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('cookies.technical.body')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('cookies.analytics.title')}</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('cookies.analytics.body')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('cookies.marketing.title')}</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('cookies.marketing.body')}</p>
            </div>
          </div>
        </section>

        {/* Gestion et paramétrage des cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('cookieManagement.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('cookieManagement.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('cookieManagement.p2')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('cookieManagement.p3')}</p>
        </section>

        {/* Utilisation des informations personnelles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('use.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('use.intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('use.items.item1')}</li>
            <li>{t('use.items.item2')}</li>
            <li>{t('use.items.item3')}</li>
            <li>{t('use.items.item4')}</li>
          </ul>
        </section>

        {/* Partage des informations personnelles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('sharing.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('sharing.intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('sharing.items.item1')}</li>
            <li>{t('sharing.items.item2')}</li>
          </ul>
        </section>

        {/* Vos droits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('rights.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('rights.intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('rights.items.item1')}</li>
            <li>{t('rights.items.item2')}</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4 font-[maison-neue-book]">{t('rights.outro')}</p>
        </section>

        {/* Nous contacter */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('contact.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('contact.body')}</p>
          <p className="text-slate-700 font-semibold mt-4 font-[maison-neue-book]">
            📧{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700">
              contact@crunchyvita.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
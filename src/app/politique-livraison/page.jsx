'use client';

import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function PolitiqueLivraison() {
  const t = useTranslations('ShippingPolicy');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAndBreadcrumbs />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-16 font-[agrandir]">{t('title')}</h1>

        {/* Préparation et expédition */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('preparation.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('preparation.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('preparation.p2')}
          </p>
        </section>

        {/* En cas d'absence */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('absence.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('absence.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('absence.p2')}
          </p>
        </section>

        {/* Absence d'informations ou coordonnées incomplètes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('missingInfo.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('missingInfo.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('missingInfo.p2')}
          </p>
        </section>

        {/* Problèmes de livraison */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('issues.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('issues.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('issues.p2')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('issues.p3')}{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
        </section>

        {/* Livraison offerte */}
        <section className="mb-12">
          <div className="bg-green-50 border-2 border-green-600 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Truck className="text-green-600 shrink-0 mt-1" size={24} />
              <p className="text-slate-900 font-semibold">
                {t('promo')}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

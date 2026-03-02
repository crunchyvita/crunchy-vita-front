'use client';

import HeaderHome from '@/components/header';
import Footer from '@/components/footer';
import '../fonts.css'; // Ensure the font styles are applied globally
import { useTranslations } from 'next-intl';

export default function AboutUs() {
  const t = useTranslations('AboutUs');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-16 font-[agrandir]">{t('title')}</h1>

        {/* La lyophilisation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('lyo.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('lyo.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('lyo.p2')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('lyo.p3')}
          </p>
        </section>

        {/* Notre mission */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('mission.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('mission.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('mission.p2')}
          </p>
        </section>

        {/* Collaboration & Sponsoring */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('collab.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('collab.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('collab.p2')}{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
        </section>

        {/* Clients Professionnels B2B */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t('b2b.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            {t('b2b.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed">
            {t('b2b.p2')}{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

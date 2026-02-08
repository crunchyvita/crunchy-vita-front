'use client';

import HeaderHome from '@/components/header';
import Footer from '@/components/footer';
import { useTranslations } from 'next-intl';
import '../fonts.css';

export default function PolitiqueRetour() {
  const t = useTranslations('ReturnPolicy');

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-16 font-[agrandir]">{t('title')}</h1>

        {/* Retour */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('returnSection.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('returnSection.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('returnSection.p2')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('returnSection.p3')}
          </p>
        </section>

        {/* Procédure de retour */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('procedure.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('procedure.intro')}
          </p>
          
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="font-bold text-slate-900 mb-2 font-[agrandir]">{t('procedure.steps.step1.title')}</h3>
              <p className="text-slate-700 leading-relaxed ml-4 font-[maison-neue-book]">
                {t('procedure.steps.step1.body')}
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 mb-2 font-[agrandir]">{t('procedure.steps.step2.title')}</h3>
              <p className="text-slate-700 leading-relaxed ml-4 font-[maison-neue-book]">
                {t('procedure.steps.step2.body')}
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 mb-2 font-[agrandir]">{t('procedure.steps.step3.title')}</h3>
              <p className="text-slate-700 leading-relaxed ml-4 font-semibold">
                {t('procedure.steps.step3.address')}
              </p>
              <p className="text-slate-700 leading-relaxed ml-4 mt-2 font-[maison-neue-book]">
                {t('procedure.steps.step3.note')}
              </p>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('procedure.outro')}
          </p>
        </section>

        {/* Remboursement */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('refund.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            {t('refund.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('refund.p2')}
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

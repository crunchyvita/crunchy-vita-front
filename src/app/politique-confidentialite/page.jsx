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
        <h1 className="text-5xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('title')}</h1>

        {/* Intro */}
        <section className="mb-10">
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('intro.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('intro.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('intro.p3')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('intro.p4')}</p>
        </section>

        {/* Sommaire */}
        <section className="mb-12">
          <p className="text-slate-700 leading-relaxed mb-3 font-semibold font-[maison-neue-book]">
            {t('toc.title')}
          </p>
          <ul className="list-none space-y-1 text-slate-700 font-[maison-neue-book]">
            <li>{t('toc.items.item1')}</li>
            <li>{t('toc.items.item2')}</li>
            <li>{t('toc.items.item3')}</li>
            <li>{t('toc.items.item4')}</li>
            <li>{t('toc.items.item5')}</li>
            <li>{t('toc.items.item6')}</li>
            <li>{t('toc.items.item7')}</li>
          </ul>
        </section>

        {/* Section I */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('section1.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section1.intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('section1.items.item1')}</li>
            <li>{t('section1.items.item2')}</li>
            <li>{t('section1.items.item3')}</li>
            <li>{t('section1.items.item4')}</li>
            <li>{t('section1.items.item5')}</li>
            <li>{t('section1.items.item6')}</li>
            <li>{t('section1.items.item7')}</li>
            <li>{t('section1.items.item8')}</li>
            <li>{t('section1.items.item9')}</li>
            <li>{t('section1.items.item10')}</li>
            <li>{t('section1.items.item11')}</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section1.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section1.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">{t('section1.p3')}</p>

          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('section1.legalBasis.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('section1.legalBasis.intro')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('section1.legalBasis.items.item1')}</li>
            <li>{t('section1.legalBasis.items.item2')}</li>
            <li>{t('section1.legalBasis.items.item3')}</li>
          </ul>
        </section>

        {/* Section II */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('section2.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section2.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section2.p2')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('section2.items.item1')}</li>
            <li>{t('section2.items.item2')}</li>
            <li>{t('section2.items.item3')}</li>
          </ul>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('section2.p3')}</p>
        </section>

        {/* Section III */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('section3.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section3.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section3.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('section3.intro')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('section3.items.item1')}</li>
            <li>{t('section3.items.item2')}</li>
            <li>{t('section3.items.item3')}</li>
          </ul>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('section3.outro')}</p>
        </section>

        {/* Section IV */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('section4.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('section4.p1')}</p>
        </section>

        {/* Section V */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('section5.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section5.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section5.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section5.p3')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section5.p4')}</p>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">{t('section5.p5')}</p>

          <div className="space-y-6 mb-6">
            {/* Droit d'accès */}
            <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
              <span className="font-semibold">{t('section5.rights.access.title')}</span>{' '}
              {t('section5.rights.access.body')}
            </p>

            {/* Droit de rectification */}
            <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
              <span className="font-semibold">{t('section5.rights.rectification.title')}</span>{' '}
              {t('section5.rights.rectification.body')}
            </p>

            {/* Droit à l'effacement */}
            <div>
              <p className="text-slate-700 leading-relaxed mb-2 font-[maison-neue-book]">
                <span className="font-semibold">{t('section5.rights.erasure.title')}</span>{' '}
                {t('section5.rights.erasure.intro')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-[maison-neue-book]">
                <li>{t('section5.rights.erasure.items.item1')}</li>
                <li>{t('section5.rights.erasure.items.item2')}</li>
                <li>{t('section5.rights.erasure.items.item3')}</li>
                <li>{t('section5.rights.erasure.items.item4')}</li>
                <li>{t('section5.rights.erasure.items.item5')}</li>
              </ul>
            </div>

            {/* Droit à la limitation */}
            <div>
              <p className="text-slate-700 leading-relaxed mb-2 font-[maison-neue-book]">
                <span className="font-semibold">{t('section5.rights.limitation.title')}</span>{' '}
                {t('section5.rights.limitation.intro')}
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 mb-2 font-[maison-neue-book]">
                <li>{t('section5.rights.limitation.items.item1')}</li>
                <li>{t('section5.rights.limitation.items.item2')}</li>
                <li>{t('section5.rights.limitation.items.item3')}</li>
                <li>{t('section5.rights.limitation.items.item4')}</li>
              </ul>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
                {t('section5.rights.limitation.outro')}
              </p>
            </div>

            {/* Droit d'opposition */}
            <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
              <span className="font-semibold">{t('section5.rights.opposition.title')}</span>{' '}
              {t('section5.rights.opposition.body')}
            </p>

            {/* Directives post-mortem */}
            <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
              <span className="font-semibold">{t('section5.rights.postMortem.title')}</span>{' '}
              {t('section5.rights.postMortem.body')}
            </p>

            {/* Droit à la portabilité */}
            <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
              <span className="font-semibold">{t('section5.rights.portability.title')}</span>{' '}
              {t('section5.rights.portability.body')}
            </p>
          </div>

          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section5.p6')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('section5.p7')}</p>
        </section>

        {/* Section VI */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('section6.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section6.p1')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('section6.p2')}</p>
        </section>

        {/* Section VII */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">{t('section7.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section7.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section7.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('section7.p3')}</p>
         
        </section>
      </main>

      <Footer />
    </div>
  );
}

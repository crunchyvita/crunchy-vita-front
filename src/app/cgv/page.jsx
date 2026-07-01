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

        {/* Article 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article1.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article1.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article1.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article1.p3')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article1.p4')}</p>
        </section>

        {/* Article 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article2.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p3')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p4')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p5')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p6')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p7')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p8')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p9')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article2.p10')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article2.p11')}</p>
        </section>

        {/* Article 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article3.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article3.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article3.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article3.p3')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article3.p4')}</p>
        </section>

        {/* Article 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article4.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article4.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article4.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">{t('article4.p3')}</p>

          {/* a) Client Obligations */}
          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article4.clientObligations.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article4.clientObligations.intro1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article4.clientObligations.intro2')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-3 font-[maison-neue-book]">
            <li>{t('article4.clientObligations.items.item1')}</li>
            <li>{t('article4.clientObligations.items.item2')}</li>
            <li>{t('article4.clientObligations.items.item3')}</li>
            <li>{t('article4.clientObligations.items.item4')}</li>
            <li>{t('article4.clientObligations.items.item5')}</li>
            <li>{t('article4.clientObligations.items.item6')}</li>
            <li>{t('article4.clientObligations.items.item7')}</li>
            <li>{t('article4.clientObligations.items.item8')}</li>
            <li>{t('article4.clientObligations.items.item9')}</li>
            <li>{t('article4.clientObligations.items.item10')}</li>
            <li>{t('article4.clientObligations.items.item11')}</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article4.clientObligations.outro1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">
            {t('article4.clientObligations.outro2')}
          </p>

          {/* b) Prestataire Obligations */}
          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article4.prestataireObligations.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article4.prestataireObligations.intro')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('article4.prestataireObligations.items.item1')}</li>
            <li>{t('article4.prestataireObligations.items.item2')}</li>
          </ul>
        </section>

        {/* Article 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article5.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article5.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article5.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article5.p3')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article5.p4')}</p>
        </section>

        {/* Article 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article6.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article6.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article6.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article6.p3')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article6.p4')}</p>
        </section>

        {/* Article 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article7.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article7.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article7.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article7.p3')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article7.p4')}</p>
        </section>

        {/* Article 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article8.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article8.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article8.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article8.p3')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article8.p4')}</p>
        </section>

        {/* Article 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article9.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article9.p1')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article9.p2')}</p>
        </section>

        {/* Article 10 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article10.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article10.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article10.p2')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article10.p3')}</p>
        </section>

        {/* Article 11 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article11.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article11.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article11.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article11.p3')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article11.p4')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('article11.p5')}</p>

          {/* Reproduction rights */}
          <p className="text-slate-700 leading-relaxed mb-2 font-semibold font-[maison-neue-book]">
            {t('article11.reproductionTitle')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('article11.reproductionItems.item1')}</li>
            <li>{t('article11.reproductionItems.item2')}</li>
          </ul>

          {/* Representation rights */}
          <p className="text-slate-700 leading-relaxed mb-2 font-semibold font-[maison-neue-book]">
            {t('article11.representationTitle')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('article11.representationItems.item1')}</li>
            <li>{t('article11.representationItems.item2')}</li>
          </ul>

          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article11.p6')}</p>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">{t('article11.p7')}</p>

          {/* a) Trademarks */}
          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article11.marques.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article11.marques.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article11.marques.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">{t('article11.marques.p3')}</p>

          {/* b) Moral rights */}
          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article11.droitMoral.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">
            {t('article11.droitMoral.p1')}
          </p>

          {/* c) Warranty against eviction */}
          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article11.garantieEviction.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article11.garantieEviction.p1')}
          </p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article11.garantieEviction.intro')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-3 font-[maison-neue-book]">
            <li>{t('article11.garantieEviction.items.item1')}</li>
            <li>{t('article11.garantieEviction.items.item2')}</li>
            <li>{t('article11.garantieEviction.items.item3')}</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            {t('article11.garantieEviction.p2')}
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            {t('article11.garantieEviction.p3')}
          </p>
        </section>

        {/* Article 12 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article12.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article12.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article12.p2')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article12.p3')}</p>
        </section>

        {/* Article 13 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article13.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article13.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article13.p2')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article13.p3')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article13.p4')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article13.p5')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article13.p6')}</p>
        </section>

        {/* Article 14 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article14.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article14.p1')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article14.p2')}</p>
        </section>

        {/* Article 15 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article15.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article15.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('article15.p2')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('article15.items.item1')}</li>
            <li>{t('article15.items.item2')}</li>
            <li>{t('article15.items.item3')}</li>
          </ul>
        </section>

        {/* Article 16 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article16.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article16.p1')}</p>
        </section>

        {/* Article 17 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article17.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">{t('article17.p1')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>{t('article17.exclusions.item1')}</li>
            <li>{t('article17.exclusions.item2')}</li>
            <li>{t('article17.exclusions.item3')}</li>
            <li>{t('article17.exclusions.item4')}</li>
            <li>{t('article17.exclusions.item5')}</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article17.intro2')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>{t('article17.commitments.item1')}</li>
            <li>{t('article17.commitments.item2')}</li>
            <li>{t('article17.commitments.item3')}</li>
            <li>{t('article17.commitments.item4')}</li>
          </ul>
        </section>

        {/* Article 18 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article18.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article18.p1')}</p>
        </section>

        {/* Article 19 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article19.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article19.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article19.p2')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article19.p3')}</p>
        </section>

        {/* Article 20 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article20.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article20.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article20.p2')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article20.p3')}</p>
        </section>

        {/* Article 21 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article21.title')}</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article21.p1')}</p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">{t('article21.p2')}</p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article21.p3')}</p>
        </section>

        {/* Article 22 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article22.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article22.p1')}</p>
        </section>

        {/* Article 23 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article23.title')}</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article23.p1')}</p>
        </section>

        {/* Article 24 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">{t('article24.title')}</h2>

          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article24.documentsAnterieurs.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">
            {t('article24.documentsAnterieurs.p1')}
          </p>

          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article24.autonomieClauses.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">
            {t('article24.autonomieClauses.p1')}
          </p>

          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article24.notification.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed mb-6 font-[maison-neue-book]">
            {t('article24.notification.p1')}
          </p>

          <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">
            {t('article24.langue.title')}
          </h3>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">{t('article24.langue.p1')}</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

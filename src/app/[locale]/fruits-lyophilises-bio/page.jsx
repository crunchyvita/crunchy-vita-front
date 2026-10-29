import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import ProductGrid from '@/components/product/ProductGrid';
import JsonLd from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo';
import { breadcrumbJsonLd } from '@/lib/productSeo';
import { getPublicProducts } from '@/lib/serverApi';
import { isComplete } from '@/lib/placeholder';

const PATH = '/fruits-lyophilises-bio';
// Keys match both the message keys and a word in the French product name.
const FRUITS = ['fraise', 'mangue', 'banane', 'ananas', 'myrtille'];
const USES = ['snack', 'breakfast', 'dessert', 'kids'];
const FAQ_COUNT = 9;
const SHIPPING_FAQ = 7;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Category.meta' });
  return buildMetadata({ locale, path: PATH, title: t('title'), description: t('description') });
}

const findProductFor = (fruit, products) =>
  products.find((p) => String(p.name || '').toLowerCase().includes(fruit));

export default async function OrganicFreezeDriedFruitPage({ params }) {
  const { locale } = await params;
  const [t, tCrumbs, products] = await Promise.all([
    getTranslations({ locale, namespace: 'Category' }),
    getTranslations({ locale, namespace: 'Breadcrumbs' }),
    getPublicProducts().catch(() => []),
  ]);

  // Answers still marked [À COMPLÉTER] are left out until the real data is filled in.
  const certifier = t('faq.a4Certifier');
  const faq = Array.from({ length: FAQ_COUNT }, (_, i) => {
    const n = i + 1;
    const answer = n === 4 && isComplete(certifier) ? `${t('faq.a4')} ${certifier}` : t(`faq.a${n}`);
    return { n, question: t(`faq.q${n}`), answer };
  }).filter(({ question, answer }) => isComplete(question) && isComplete(answer));

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  const sectionTitle = 'text-2xl sm:text-3xl font-black text-[#556822] mb-6 tracking-tight font-[agrandir]';

  return (
    <div className="min-h-screen bg-[#F5F3ED]">
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tCrumbs('home'), path: '/' },
          { name: t('breadcrumb'), path: PATH },
        ])}
      />
      <JsonLd data={faqJsonLd} />
      <HeaderAndBreadcrumbs currentLabel={t('breadcrumb')} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16 sm:space-y-20">
        <header className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-black text-[#556822] uppercase tracking-tighter leading-[1.05] mb-6 font-[agrandir]">
            {t('title')}
          </h1>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed">{t('intro')}</p>
        </header>

        <section aria-labelledby="category-products">
          <h2 id="category-products" className={sectionTitle}>{t('productsTitle')}</h2>
          <ProductGrid products={products} locale={locale} />
        </section>

        <section aria-labelledby="category-fruits">
          <h2 id="category-fruits" className={sectionTitle}>{t('fruitsTitle')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FRUITS.map((fruit) => {
              const product = findProductFor(fruit, products);
              return (
                <article key={fruit} className="bg-white rounded-2xl p-6 shadow-sm border border-[#E1FBD9]">
                  <h3 className="text-lg font-black text-[#556822] mb-2">{t(`fruits.${fruit}.name`)}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{t(`fruits.${fruit}.text`)}</p>
                  {product && (
                    <Link
                      href={`/shop/${product._id}`}
                      className="text-sm font-black text-[#E10C69] hover:underline"
                    >
                      {t('seeProduct')} : {t(`fruits.${fruit}.name`)}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-2">
          <section aria-labelledby="category-lyo">
            <h2 id="category-lyo" className={sectionTitle}>{t('lyoTitle')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{t('lyoP1')}</p>
            <p className="text-gray-700 leading-relaxed mb-4">{t('lyoP2')}</p>
            <Link href="/about-us#lyophilisation" className="font-black text-[#E10C69] hover:underline">
              {t('lyoLink')}
            </Link>
          </section>

          <section aria-labelledby="category-uses">
            <h2 id="category-uses" className={sectionTitle}>{t('usesTitle')}</h2>
            <ul className="space-y-3 list-disc pl-5 text-gray-700 leading-relaxed">
              {USES.map((use) => (
                <li key={use}>{t(`uses.${use}`)}</li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="category-faq" className="max-w-3xl">
          <h2 id="category-faq" className={sectionTitle}>{t('faqTitle')}</h2>
          <div className="divide-y divide-[#556822]/10 bg-white rounded-2xl shadow-sm border border-[#E1FBD9]">
            {faq.map(({ n, question, answer }) => (
              <details key={n} className="group p-5 sm:p-6">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-black text-[#556822]">
                  <h3 className="text-base sm:text-lg">{question}</h3>
                  <span aria-hidden="true" className="text-[#E10C69] text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  {answer}
                  {n === SHIPPING_FAQ && (
                    <>
                      {' '}
                      <Link href="/politique-livraison" className="font-bold text-[#E10C69] hover:underline">
                        {t('shippingLink')}
                      </Link>
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-[#556822] text-white rounded-[2rem] p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3 font-[agrandir]">{t('ctaTitle')}</h2>
          <p className="text-white/90 mb-8">{t('ctaText')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/shop" className="rounded-full bg-[#E10C69] px-8 py-4 font-black uppercase tracking-widest text-sm">
              {t('ctaShop')}
            </Link>
            <Link href="/shop?tab=packages" className="rounded-full border-2 border-white px-8 py-4 font-black uppercase tracking-widest text-sm">
              {t('ctaPacks')}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

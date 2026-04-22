"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { useLocale, useTranslations } from 'next-intl';
import { categoryAPI, productAPI } from '@/lib/api';
import { Search, ChevronDown, Check, FileText, Mail, Leaf, Truck, ShieldCheck, Factory, Coffee, ShoppingBasket, Activity } from 'lucide-react';
import { getTranslatedProduct } from '@/lib/productTranslations';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const isProductVisibleInProfessionalSpace = (product) => {
  const status = String(product?.status || '').toUpperCase();
  if (status && status !== 'ACTIVE') return false;
  if (product?.isActive === false) return false;
  if (product?.showInShop === false) return false;
  return true;
};

const CrunchyVita = () => {
  const t = useTranslations('ProfessionalSpace');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState({
    contactName: '',
    email: '',
    company: '',
    activity: '',
    siren: '',
    vat: '',
    website: '',
    message: '',
  });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState('');
  const [quoteError, setQuoteError] = useState('');
  const [productFormats, setProductFormats] = useState('1kg, 2kg, 10kg');

  useEffect(() => {
    let isMounted = true;

    const fetchProfessionalSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings`, {
          cache: 'no-store',
        });

        if (!response.ok) return;

        const data = await response.json();
        const formats = data?.data?.professionalSpace?.productFormats;

        if (isMounted && typeof formats === 'string') {
          setProductFormats(formats);
        }
      } catch (error) {
        console.error('Failed to load professional settings:', error);
      }
    };

    fetchProfessionalSettings();
    const intervalId = setInterval(fetchProfessionalSettings, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          categoryAPI.list(),
          productAPI.list(),
        ]);

        const categoriesList = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || [];
        const productsList = Array.isArray(productsRes) ? productsRes : productsRes?.data || [];

        setCategories(categoriesList);
        setProducts(productsList.filter(isProductVisibleInProfessionalSpace));
      } catch (err) {
        console.error('Failed to load categories/products:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    loadData();
  }, []);

  const getProductCategoryIds = (product) => {
    const ids = new Set();

    if (Array.isArray(product?.categoryIds)) {
      product.categoryIds.forEach((entry) => {
        if (!entry) return;
        if (typeof entry === 'object' && entry._id) {
          ids.add(String(entry._id));
        } else {
          ids.add(String(entry));
        }
      });
    }

    if (product?.categoryId) {
      if (typeof product.categoryId === 'object' && product.categoryId._id) {
        ids.add(String(product.categoryId._id));
      } else {
        ids.add(String(product.categoryId));
      }
    }

    return Array.from(ids);
  };

  const filteredProducts = products.filter((product) => {
    if (!isProductVisibleInProfessionalSpace(product)) return false;
    if (activeTab === 'all') return true;
    const categoryIds = getProductCategoryIds(product);
    return categoryIds.includes(String(activeTab));
  });

  const getProductImage = (product) => {
    const media = Array.isArray(product?.media) ? product.media : [];
    if (!media.length) return null;

    const preferredMedia = media[3] || media[2] || media[1] || media[0];
    if (typeof preferredMedia === 'string') return preferredMedia;
    return preferredMedia?.url || null;
  };

  const handleQuoteChange = (e) => {
    const { name, value } = e.target;
    setQuoteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setQuoteError('');
    setQuoteSuccess('');
    setQuoteLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: quoteForm.contactName.trim() || quoteForm.company.trim(),
          email: quoteForm.email.trim(),
          message: quoteForm.message.trim(),
          subject: t('form.quoteSubject'),
          contactType: 'devis',
          companyName: quoteForm.company.trim(),
          activity: quoteForm.activity.trim(),
          siren: quoteForm.siren.trim(),
          tva: quoteForm.vat.trim(),
          website: quoteForm.website.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t('form.error'));
      }

      setQuoteSuccess(t('form.success'));
      setQuoteForm({
        contactName: '',
        email: '',
        company: '',
        activity: '',
        siren: '',
        vat: '',
        website: '',
        message: '',
      });
    } catch (error) {
      setQuoteError(error?.message || t('form.error'));
    } finally {
      setQuoteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f2] font-sans text-gray-800">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <header className="relative h-125 w-full bg-gray-900 overflow-hidden">
        {/* Background Image Placeholder - Replace with your actual image */}
        <img 
          src="/assets/images/fruit.png" 
          alt="Fruits lyophilisés background" 
          className="w-full h-full object-cover opacity-50"
        />
        
        <div className="absolute inset-0 flex flex-col justify-center px-6 max-w-7xl mx-auto font-[agrandir]">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md max-w-2xl">
            {t('hero.title')}
          </h1>
          <p className="text-white text-lg mb-8 drop-shadow-md">
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-4">
            <a
              href="#pro-devis"
              className="bg-[#556822] text-white px-6 py-3 rounded font-semibold hover:bg-[#445511] transition shadow-lg"
            >
              {t('hero.cta')}
            </a>
          </div>
        </div>
      </header>

      {/* Target Audience Section */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        <h2 className="text-center text-2xl font-bold mb-10 text-gray-800 relative inline-block w-full font-[agrandir]" >
          <span className="relative z-10 bg-[#f9f7f2] px-4 text-[#556822]">{t('audience.title')}</span>
          <div className="absolute top-1/2 left-0 w-full h-px bg-[#556822]/20 z-0"></div>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {[
            { icon: <Leaf className="w-10 h-10 text-orange-600 mx-auto mb-2" />, label: t('audience.items.foodBrands') },
            { icon: <Factory className="w-10 h-10 text-orange-600 mx-auto mb-2" />, label: t('audience.items.agriIndustry') },
            { icon: <Coffee className="w-10 h-10 text-orange-600 mx-auto mb-2" />, label: t('audience.items.cafesRestaurants') },
            { icon: <Activity className="w-10 h-10 text-orange-600 mx-auto mb-2" />, label: t('audience.items.sportsNutrition') },
            { icon: <ShoppingBasket className="w-10 h-10 text-orange-600 mx-auto mb-2" />, label: t('audience.items.grocersWholesalers') },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm">
              {item.icon}
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Bio vs Conventional Range */}
      <section className="py-8 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8">
        {/* Bio */}
        <div className="bg-[#f0f7eb] rounded-lg overflow-hidden shadow-md border border-green-100">
          <div className="bg-[#556822] text-white py-3 px-6 text-center font-bold text-lg">
            {t('ranges.organic.title')}
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2"><Check className="text-green-600 w-5 h-5" /> {t('ranges.organic.items.certified')}</div>
            <div className="flex items-center gap-2"><Check className="text-green-600 w-5 h-5" /> {t('ranges.organic.items.traceability')}</div>
            <div className="flex items-center gap-2"><Check className="text-green-600 w-5 h-5" /> {t('ranges.organic.items.compliant')}</div>
          </div>
        </div>

        {/* Conventional */}
        <div className="bg-[#fff8f0] rounded-lg overflow-hidden shadow-md border border-orange-100">
          <div className="bg-orange-400 text-white py-3 px-6 text-center font-bold text-lg">
            {t('ranges.conventional.title')}
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2"><Check className="text-orange-400 w-5 h-5" /> {t('ranges.conventional.items.costAlternative')}</div>
            <div className="flex items-center gap-2"><Check className="text-orange-400 w-5 h-5" /> {t('ranges.conventional.items.wideSelection')}</div>
            <div className="flex items-center gap-2"><Check className="text-orange-400 w-5 h-5" /> {t('ranges.conventional.items.consistentQuality')}</div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        <h2 className="text-center text-2xl font-bold mb-8 relative">
          <span className="relative z-10 bg-[#f9f7f2] px-4 text-[#556822]">{t('products.title')}</span>
          <div className="absolute top-1/2 left-0 w-full h-px bg-[#556822]/20 z-0"></div>
        </h2>

        <p className="text-center text-sm text-gray-600 mb-6">
          {t('products.formatsLabel')} <span className="font-semibold text-[#556822]">{productFormats}</span>
        </p>

        {/* Filters */}
        <div className="flex justify-center flex-wrap gap-2 mb-10">
          {/* All button */}
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1 border text-sm font-medium transition ${
              activeTab === 'all' 
              ? 'bg-[#556822] text-white border-[#556822]' 
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('products.filters.all')}
          </button>

          {/* Dynamic categories */}
          {categories.map(category => (
            <button 
              key={category._id}
              onClick={() => setActiveTab(category._id)}
              className={`px-4 py-1 border text-sm font-medium transition ${
                activeTab === category._id 
                ? 'bg-[#556822] text-white border-[#556822]' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {productsLoading ? (
            <div className="col-span-full text-center text-gray-500 py-6">Chargement des produits...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-6">Aucun produit dans cette catégorie.</div>
          ) : (
            filteredProducts.map((product) => {
              const imageUrl = getProductImage(product);
              const translated = getTranslatedProduct(product, locale);
              const productId = product._id || product.id;
              const productDescription = (translated.description || product.description || '').trim();

              return (
                <a
                  key={productId}
                  href={`/shop/${productId}`}
                  className="group relative bg-white rounded-3xl border border-gray-200 p-4 md:p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-start text-center"
                >
                  {productDescription && (
                    <div className="pointer-events-none absolute left-1/2 top-0 z-30 w-[220px] -translate-x-1/2 -translate-y-[calc(100%+10px)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-lg">
                        <p className="text-lg font-bold text-gray-900 leading-tight line-clamp-1">
                          {translated.name || product.name}
                        </p>
                        <p className="mt-1 text-sm text-gray-700 leading-snug line-clamp-4">
                          {productDescription}
                        </p>
                      </div>
                      <div className="mx-auto -mt-[6px] h-3 w-3 rotate-45 border-r border-b border-gray-200 bg-white" />
                    </div>
                  )}

                  <div className="h-28 w-28 md:h-32 md:w-32 rounded-full overflow-hidden bg-gray-100">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={translated.name || product.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200" />
                    )}
                  </div>

                  <h3 className="mt-4 text-xl md:text-[26px] leading-tight font-bold text-gray-900 line-clamp-2">
                    {translated.name || product.name}
                  </h3>
                </a>
              );
            })
          )}
        </div>
      </section>

      {/* Recap Table Section */}
      <section className="py-12 ">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-center text-2xl font-bold mb-10 relative">
             <span className="relative z-10 bg-[#f9f7f2] px-4 text-[#556822]  ">{t('recap.title')}</span>
             <div className="absolute top-1/2 left-0 w-full h-px bg-[#556822]/20 z-0"></div>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center">
            {[
              { icon: <ShieldCheck className="text-orange-600 w-12 h-12" />, text: t('recap.items.strictControl') },
              { icon: <Truck className="text-orange-600 w-12 h-12" />, text: t('recap.items.batchTraceability') },
              { icon: <Leaf className="text-orange-600 w-12 h-12" />, text: t('recap.items.certifications') },
              { icon: <Factory className="text-orange-600 w-12 h-12" />, text: t('recap.items.separation') },
              { icon: <Check className="text-orange-600 w-12 h-12" />, text: t('recap.items.moqa') },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-full">{item.icon}</div>
                <span className="text-sm font-bold text-gray-800">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="pro-devis" className="py-16 max-w-4xl mx-auto px-6">
        <h2 className="text-center text-2xl font-bold mb-8 relative">
          <span className="relative z-10 bg-[#f9f7f2] text-[#556822] px-4">{t('form.title')}</span>
          <div className="absolute top-1/2 left-0 w-full h-px bg-[#556822]/20 z-0"></div>
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          {t('form.notice')}{' '}
          <a href="/contact#pro" className="text-[#556822] font-semibold hover:underline">
            {t('form.noticeLink')}
          </a>
          .
        </p>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h3 className="font-bold text-gray-800 mb-6">{t('form.companyTitle')}</h3>
          <form onSubmit={handleQuoteSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quoteError ? (
              <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {quoteError}
              </div>
            ) : null}
            {quoteSuccess ? (
              <div className="md:col-span-2 p-4 bg-green-50 border border-green-300 rounded-lg text-green-700 text-sm">
                {quoteSuccess}
              </div>
            ) : null}

            <input
              type="text"
              name="contactName"
              required
              value={quoteForm.contactName}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.contactName')}
              className="border p-3 rounded text-sm w-full bg-gray-50"
            />
            <input
              type="email"
              name="email"
              required
              value={quoteForm.email}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.email')}
              className="border p-3 rounded text-sm w-full bg-gray-50"
            />
            <input
              type="text"
              name="company"
              required
              value={quoteForm.company}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.company')}
              className="border p-3 rounded text-sm w-full bg-gray-50"
            />
            <input
              type="text"
              name="activity"
              value={quoteForm.activity}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.activity')}
              className="border p-3 rounded text-sm w-full bg-gray-50"
            />
            <input
              type="text"
              name="siren"
              required
              value={quoteForm.siren}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.siren')}
              className="border p-3 rounded text-sm w-full bg-gray-50"
            />
            <input
              type="text"
              name="vat"
              value={quoteForm.vat}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.vat')}
              className="border p-3 rounded text-sm w-full bg-gray-50"
            />
            <input
              type="url"
              name="website"
              value={quoteForm.website}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.website')}
              className="border p-3 rounded text-sm w-full bg-gray-50 md:col-span-2"
            />
            <textarea
              name="message"
              required
              value={quoteForm.message}
              onChange={handleQuoteChange}
              placeholder={t('form.fields.message')}
              className="md:col-span-2 border p-3 rounded text-sm w-full bg-gray-50 min-h-[120px]"
            />

            <div className="md:col-span-2 flex justify-center mt-4">
              <button
                type="submit"
                disabled={quoteLoading}
                className="bg-[#556822] text-white font-bold py-3 px-12 rounded hover:bg-[#44591a] transition shadow-md w-full md:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {quoteLoading ? t('form.sending') : t('form.submit')}
              </button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CrunchyVita;

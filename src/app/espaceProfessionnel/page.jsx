"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import { useLocale, useTranslations } from 'next-intl';
import { categoryAPI, productAPI } from '@/lib/api';
import { Search, ChevronDown, Check, FileText, Mail, Leaf, Truck, ShieldCheck, Factory, Coffee, ShoppingBasket, Activity } from 'lucide-react';
import { getTranslatedProduct } from '@/lib/productTranslations';

const CrunchyVita = () => {
  const t = useTranslations('ProfessionalSpace');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

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
        setProducts(productsList);
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
    if (activeTab === 'all') return true;
    const categoryIds = getProductCategoryIds(product);
    return categoryIds.includes(String(activeTab));
  });

  const getProductImage = (product) => {
    const media = Array.isArray(product?.media) ? product.media : [];
    if (!media.length) return null;

    const preferredMedia = media[2] || media[1] || media[0];
    if (typeof preferredMedia === 'string') return preferredMedia;
    return preferredMedia?.url || null;
  };

  const getCategoryNames = (product) => {
    const names = new Set();

    if (Array.isArray(product?.categoryIds)) {
      product.categoryIds.forEach((entry) => {
        if (!entry) return;
        if (typeof entry === 'object' && entry.name) names.add(entry.name);
      });
    }

    if (product?.categoryId && typeof product.categoryId === 'object' && product.categoryId.name) {
      names.add(product.categoryId.name);
    }

    return Array.from(names);
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
        <div className="grid md:grid-cols-3 gap-6">
          {productsLoading ? (
            <div className="md:col-span-3 text-center text-gray-500 py-6">Chargement des produits...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="md:col-span-3 text-center text-gray-500 py-6">Aucun produit dans cette catégorie.</div>
          ) : (
            filteredProducts.map((product) => {
              const imageUrl = getProductImage(product);
              const translated = getTranslatedProduct(product, locale);
              const categoryNames = getCategoryNames(product);
              const productTags = Array.isArray(product?.tag) ? product.tag : [];
              const productId = product._id || product.id;

              return (
                <div key={productId} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={translated.name || product.name}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100" />
                  )}

                  <div className="p-4 flex flex-col gap-3">
                    <h3 className="font-bold text-gray-800 text-[26px] leading-snug line-clamp-1">
                      {translated.name || product.name}
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {categoryNames.map((categoryName) => (
                        <span
                          key={`${productId}-${categoryName}`}
                          className="text-[11px] font-bold px-2 py-1 rounded bg-[#eef6e6] text-[#556822] border border-[#d9e7c8]"
                        >
                          {categoryName}
                        </span>
                      ))}
                    </div>

                    <ul className="text-[12px] text-gray-600 space-y-1 min-h-[44px]">
                      {productTags.slice(0, 2).map((item, index) => (
                        <li key={`${productId}-tag-${index}`} className="flex items-start gap-2">
                          <span className="text-[#556822] mt-[2px]">•</span>
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-[13px] text-gray-700 font-medium">Formats: 100 g, 1 kg, 5 kg</p>

                    <a
                      href={`/shop/${productId}`}
                      className="mt-1 w-full bg-[#556822] hover:bg-[#3f6e0d] text-white font-semibold text-center py-2 rounded transition-colors"
                    >
                      {t('products.learnMore')}
                    </a>
                  </div>
                </div>
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
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text required" placeholder={t('form.fields.company')} className="border p-3 rounded text-sm w-full bg-gray-50" />
            <input type="text" placeholder={t('form.fields.activity')} className="border p-3 rounded text-sm w-full bg-gray-50" />

            <input type="text required" placeholder={t('form.fields.siret')} className="border p-3 rounded text-sm w-full bg-gray-50" />
            <input type="text" placeholder={t('form.fields.vat')} className="border p-3 rounded text-sm w-full bg-gray-50" />

            <input type="text" placeholder={t('form.fields.address')} className="border p-3 rounded text-sm w-full bg-gray-50" />
            <input type="url" placeholder={t('form.fields.website')} className="border p-3 rounded text-sm w-full bg-gray-50" />

            <div className="relative">
              <select className="border p-3 rounded text-sm w-full bg-gray-50 appearance-none text-gray-500">
                <option>{t('form.selects.products')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 text-gray-400 w-4 h-4" />
            </div>

            <div className="relative">
              <select className="border p-3 rounded text-sm w-full bg-gray-50 appearance-none text-gray-500">
                <option>{t('form.selects.range')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 text-gray-400 w-4 h-4" />
            </div>

            <div className="relative">
              <select className="border p-3 rounded text-sm w-full bg-gray-50 appearance-none text-gray-500">
                <option>{t('form.selects.volume')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 text-gray-400 w-4 h-4" />
            </div>

            <div className="relative">
              <select className="border p-3 rounded text-sm w-full bg-gray-50 appearance-none text-gray-500">
                <option>{t('form.selects.country')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 text-gray-400 w-4 h-4" />
            </div>

            <div className="md:col-span-2 flex justify-center mt-4">
              <button className="bg-[#556822] text-white font-bold py-3 px-12 rounded hover:bg-[#44591a] transition shadow-md w-full md:w-auto">
                {t('form.submit')}
              </button>
            </div>
          </form>
        </div>
      </section>
      
      {/* Footer Decoration */}
      <div className="h-16 bg-linear-to-t from-gray-200 to-transparent"></div>
    </div>
  );
};

export default CrunchyVita;

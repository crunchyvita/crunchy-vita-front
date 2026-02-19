"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import { useTranslations } from 'next-intl';
import { categoryAPI } from '@/lib/api';
import { Search, ChevronDown, Check, FileText, Mail, Leaf, Truck, ShieldCheck, Factory, Coffee, ShoppingBasket, Activity } from 'lucide-react';

const CrunchyVita = () => {
  const t = useTranslations('ProfessionalSpace');
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryAPI.list();
        const list = Array.isArray(res) ? res : res?.data || [];
        setCategories(list);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

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

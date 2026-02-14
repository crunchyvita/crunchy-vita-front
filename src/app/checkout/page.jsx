'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

// Helper to match Cart image logic
const pickUrl = (v) => {
    if (!v || v === 'undefined') return null;
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.url || v.secure_url || null;
    return null;
};

const getCartItemImagesLocal = (item) => {
    const isPackage = item.type === 'package' || !!item.packageId;
    if (!isPackage) {
        const one = pickUrl(item?.image);
        return one ? [one] : [];
    }
    let imgs = Array.isArray(item?.packageImages) ? item.packageImages.map(pickUrl).filter(Boolean) : [];
    return imgs;
};

const CheckoutPage = () => {
    const t = useTranslations('Checkout');
    const locale = useLocale();
    const { cartItems, subtotal, shipping, total, removeFromCart } = useCart();
    const brandGreen = "#556822";

    return (
        <div className="min-h-screen bg-gray-50 font-[Maison_Neue]">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Breadcrumbs */}
                <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2">
                    <Link href={`/${locale}/cart`} className="hover:text-[#556822] transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} /> {t('breadcrumb.backToCart')}
                    </Link>
                    <span className="text-gray-300">/</span>
                    <span className="text-black font-bold">{t('breadcrumb.current')}</span>
                </nav>

                <h1 className="text-4xl font-black text-[#556822] mb-10 font-[agrandir]">{t('title')}</h1>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Forms */}
                    <div className="flex-grow space-y-6">

                        {/* Contact Information */}
                        <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('contact.title')}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('contact.emailLabel')}</label>
                                    <input
                                        type="email"
                                        placeholder={t('contact.emailPlaceholder')}
                                        className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#556822] outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Shipping Information */}
                        <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('shipping.title')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('shipping.firstName')}</label>
                                    <input type="text" className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('shipping.lastName')}</label>
                                    <input type="text" className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('shipping.street')}</label>
                                    <input type="text" className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('shipping.city')}</label>
                                    <input type="text" className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none" />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('shipping.postalCode')}</label>
                                    <input type="text" className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none" />
                                </div>
                            </div>
                        </section>

                        {/* Payment Section */}
                        <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('payment.title')}</h2>
                            <div className="border-2 border-[#556822] rounded-xl p-6 bg-gray-50/30">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-4 h-4 rounded-full border-4 border-[#556822] bg-white"></div>
                                    <span className="font-bold text-lg">{t('payment.creditCard')}</span>
                                </div>

                                <div className="space-y-4">
                                    {/* Name on Card Field */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('payment.nameOnCard')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('payment.nameOnCardPlaceholder')}
                                            className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    {/* Card Number Field */}
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('payment.cardNumber')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('payment.cardNumberPlaceholder')}
                                            className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    {/* Expiry and CVC */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('payment.expiry')}</label>
                                            <input
                                                type="text"
                                                placeholder={t('payment.expiryPlaceholder')}
                                                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('payment.cvc')}</label>
                                            <input
                                                type="text"
                                                placeholder={t('payment.cvcPlaceholder')}
                                                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Order Summary */}
                    <aside className="lg:w-[400px]">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 sticky top-8">
                            <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('summary.title')}</h2>

                            {/* Cart Items List */}
                            <div className="max-h-[400px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                                {cartItems.map((item) => {
                                    const imgs = getCartItemImagesLocal(item);
                                    const isPkg = item.type === 'package' || !!item.packageId;

                                    return (
                                        <div key={item._id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
                                            <div className="w-16 h-16 flex-shrink-0">
                                                {isPkg ? (
                                                    <div className="grid grid-cols-2 gap-0.5">
                                                        {imgs.length > 0 ? imgs.map((img, idx) => (
                                                            <img key={idx} src={img} className="w-full h-full object-cover rounded-sm" alt="" />
                                                        )) : <div className="col-span-2 h-16 bg-gray-100 rounded flex items-center justify-center"><ShoppingBag size={16} /></div>}
                                                    </div>
                                                ) : (
                                                    <img src={imgs[0]} className="w-full h-full object-contain bg-gray-50 rounded-lg" alt="" />
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-sm font-bold text-[#556822] line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-gray-400">{t('summary.qty')}: {item.quantity}</p>
                                                <p className="text-sm font-black text-[#E10C69]">€{(item.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                            <button onClick={() => removeFromCart(item._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Promo Code Section */}
                            <div className="mb-6">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('summary.promoCodeLabel') || 'Promo Code'}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={t('summary.promoPlaceholder') || 'Enter code'}
                                        className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:bg-white focus:border-[#556822] outline-none transition-all"
                                    />
                                    <button className="px-4 py-2 bg-[#556822] text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                                        {t('summary.applyPromo') || 'Apply'}
                                    </button>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between text-gray-500 font-medium">
                                    <span>{t('summary.subtotal')}</span>
                                    <span className="text-gray-900">€{Number(subtotal).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 font-medium">
                                    <span>{t('summary.shipping')}</span>
                                    <span className="text-gray-900">€{Number(shipping).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black pt-4">
                                    <span className="text-[#556822] font-[agrandir]">{t('summary.total')}</span>
                                    <span className="text-[#E10C69]">€{Number(total).toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                className="w-full mt-8 py-4 rounded-md text-white font-black text-lg shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform active:scale-[0.98]"
                                style={{ backgroundColor: brandGreen }}
                            >
                                {t('actions.confirmOrder')}
                            </button>

                            <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-widest font-bold">
                                {t('securityNote')}
                            </p>
                        </div>
                    </aside>

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;
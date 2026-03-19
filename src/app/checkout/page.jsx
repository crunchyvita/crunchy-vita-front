'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PromoCodeInput from '@/components/PromoCodeInput';
import { Trash2, ShoppingBag, ArrowLeft, MapPin, Home, Loader2, Navigation, Gift } from 'lucide-react';
import Link from 'next/link';
import { getTranslatedProduct } from '@/lib/productTranslations';

// Helper to match Cart image logic
const pickUrl = (v) => {
  if (!v || v === 'undefined') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.url || v.secure_url || null;
  return null;
};

const getCartItemImagesLocal = (item) => {
  const isPackage = item.type === 'package' || !!item.packageId;
  const one = pickUrl(item?.image);

  if (!isPackage) {
    return one ? [one] : [];
  }

  if (one) {
    return [one];
  }

  const packageMainImage =
    pickUrl(item?.packageImage) ||
    pickUrl(item?.package?.image) ||
    pickUrl(item?.packageId?.image);
  if (packageMainImage) {
    return [packageMainImage];
  }

  let imgs = [];
  if (Array.isArray(item?.packageImages)) {
    imgs = item.packageImages.map((img) => pickUrl(img)).filter(Boolean);
  }

  if (Array.isArray(item?.selectedProducts)) {
    imgs = [
      ...imgs,
      ...item.selectedProducts
        .map((sp) => {
          const direct = pickUrl(sp?.image);
          if (direct) return direct;

          const product = sp?.product || (typeof sp?.productId === 'object' ? sp.productId : null);
          if (!product) return null;

          return (
            pickUrl(product?.image) ||
            pickUrl(product?.imageUrl) ||
            pickUrl(product?.productImage) ||
            pickUrl(product?.media?.[0]?.url) ||
            pickUrl(product?.media?.[0])
          );
        })
        .filter(Boolean),
    ];
  }

  const seen = new Set();
  const unique = [];
  for (const u of imgs) {
    if (!seen.has(u)) {
      seen.add(u);
      unique.push(u);
    }
  }

  return unique;
};

const CheckoutPage = () => {
  const t = useTranslations('Checkout');
  const locale = useLocale();
  const { cartItems, subtotal, shipping, total, removeFromCart } = useCart();
  const brandGreen = '#556822';

  // ----------------------------
  // Form states
  // ----------------------------
  const [email, setEmail] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Delivery type: home | relay
  const [deliveryType, setDeliveryType] = useState('home'); // "home" | "relay"

  // Relay search + selection
  const [relayCountry, setRelayCountry] = useState('');
  const [relayAddressQuery, setRelayAddressQuery] = useState('');
  const [relayPoints, setRelayPoints] = useState([]);
  const [relayLoading, setRelayLoading] = useState(false);
  const [relayError, setRelayError] = useState('');
  const [selectedRelay, setSelectedRelay] = useState(null);

  // Geolocation state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Promo code state
  const [promoDiscount, setPromoDiscount] = useState(0);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const searchRelayPoints = async (q) => {
    setRelayLoading(true);
    setRelayError('');
    setRelayPoints([]);
    setSelectedRelay(null);

    try {
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_URL is missing');

      const res = await fetch(`${apiBase}/shipping/relay-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: relayCountry,
          query: q,
          limit: 20,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to load relay points');

      const points = Array.isArray(data?.points) ? data.points : [];
      setRelayPoints(points);
      if (points.length === 0) setRelayError(t('shipping.noRelayFound') || 'Aucun point relais trouvé.');
    } catch (e) {
      setRelayError(e?.message || 'Relay search failed');
    } finally {
      setRelayLoading(false);
    }
  };

  const handleSearchRelay = async () => {
    const q = (relayAddressQuery || '').trim();
    if (!q) {
      setRelayError(t('shipping.missingRelayQuery') || 'Veuillez saisir une adresse ou un code postal.');
      return;
    }
    await searchRelayPoints(q);
  };

  // "Utiliser mon emplacement" => geolocation -> reverse-ish query for backend
  // Since we can't reliably reverse geocode without an external API,
  // we send lat/lng to backend, and backend can:
  // 1) reverse geocode (recommended) OR
  // 2) call Boxtal if it supports search by coordinates
  const handleUseMyLocation = async () => {
    setGeoError('');
    setRelayError('');
    setGeoLoading(true);

    try {
      if (!navigator.geolocation) throw new Error('Geolocation is not supported');

      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = pos.coords;

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_URL is missing');

      setRelayLoading(true);
      setRelayPoints([]);
      setSelectedRelay(null);

      const res = await fetch(`${apiBase}/shipping/relay-points/by-geo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: relayCountry,
          lat: latitude,
          lng: longitude,
          limit: 20,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to load relay points');

      const points = Array.isArray(data?.points) ? data.points : [];
      setRelayPoints(points);
      if (points.length === 0) setRelayError(t('shipping.noRelayFound') || 'Aucun point relais trouvé.');
    } catch (e) {
      // browser errors: PERMISSION_DENIED / POSITION_UNAVAILABLE / TIMEOUT
      const msg =
        e?.code === 1
          ? (t('shipping.geoDenied') || "Autorisation refusée. Active la localisation dans ton navigateur.")
          : e?.code === 2
          ? (t('shipping.geoUnavailable') || "Position indisponible. Réessaie.")
          : e?.code === 3
          ? (t('shipping.geoTimeout') || "Temps dépassé. Réessaie.")
          : (e?.message || 'Geolocation error');

      setGeoError(msg);
    } finally {
      setGeoLoading(false);
      setRelayLoading(false);
    }
  };

  // Simple validation for UI
  const isHomeValid =
    email.trim() &&
    firstName.trim() &&
    lastName.trim() &&
    country.trim() &&
    street.trim() &&
    city.trim() &&
    postalCode.trim();

  const isRelayValid =
    email.trim() &&
    firstName.trim() &&
    lastName.trim() &&
    !!selectedRelay;

  const canConfirm = deliveryType === 'home' ? isHomeValid : isRelayValid;
  const finalTotal = Math.max(0, Number(total || 0) - Number(promoDiscount || 0));

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
          <div className="grow space-y-6">
            {/* Contact Information */}
            <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('contact.title')}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {t('contact.emailLabel')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('contact.emailPlaceholder')}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#556822] outline-none transition-all"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Information */}
            <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('shipping.title')}</h2>

              {/* Delivery type toggles */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {t('shipping.deliveryType') || 'Livraison'}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('home');
                      setSelectedRelay(null);
                      setRelayPoints([]);
                      setRelayError('');
                      setGeoError('');
                    }}
                    className={`p-4 rounded-lg border text-left transition-all flex items-center justify-between ${
                      deliveryType === 'home'
                        ? 'border-[#556822] bg-[#556822]/5'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Home size={18} className="text-[#556822]" />
                      <div>
                        <div className="font-bold">{t('shipping.home') || "Expédier à l’adresse"}</div>
                        <div className="text-xs text-gray-500">{t('shipping.homeHint') || 'À votre domicile'}</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-4 ${
                        deliveryType === 'home' ? 'border-[#556822]' : 'border-gray-200'
                      } bg-white`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('relay');
                      setRelayError('');
                      setGeoError('');
                    }}
                    className={`p-4 rounded-lg border text-left transition-all flex items-center justify-between ${
                      deliveryType === 'relay'
                        ? 'border-[#556822] bg-[#556822]/5'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-[#556822]" />
                      <div>
                        <div className="font-bold">{t('shipping.relay') || "Expédier au point relais"}</div>
                        <div className="text-xs text-gray-500">{t('shipping.relayHint') || 'Choisir un relais proche'}</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-4 ${
                        deliveryType === 'relay' ? 'border-[#556822]' : 'border-gray-200'
                      } bg-white`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name fields */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {t('shipping.firstName')}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('shipping.firstNamePlaceholder')}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {t('shipping.lastName')}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('shipping.lastNamePlaceholder')}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                  />
                </div>

                {/* Home address */}
                {deliveryType === 'home' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        {t('shipping.country')}
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder={t('shipping.countryPlaceholder')}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        {t('shipping.street')}
                      </label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder={t('shipping.streetPlaceholder')}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        {t('shipping.city')}
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('shipping.cityPlaceholder')}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        {t('shipping.postalCode')}
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={t('shipping.postalCodePlaceholder')}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Relay UI */}
                {deliveryType === 'relay' && (
                  <div className="md:col-span-2 space-y-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                        <div className="text-sm font-black text-[#556822]">
                          {t('shipping.relayTitle') || 'Point relais'}
                        </div>

                        <button
                          type="button"
                          onClick={handleUseMyLocation}
                          disabled={geoLoading}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
                        >
                          {geoLoading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                          {t('shipping.useMyLocation') || 'Utiliser mon emplacement'}
                        </button>
                      </div>

                      {geoError && <div className="mt-3 text-sm text-red-600">{geoError}</div>}

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            {t('shipping.country') || 'Pays / région'}
                          </label>
                          <input
                            value={relayCountry}
                            onChange={(e) => setRelayCountry(e.target.value)}
                            className="w-full p-4 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#556822]"
                            placeholder={t('shipping.countryPlaceholder') || 'ex: France'}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            {t('shipping.relayAddress') || 'Adresse / Code postal'}
                          </label>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={relayAddressQuery}
                              onChange={(e) => setRelayAddressQuery(e.target.value)}
                              placeholder={t('shipping.relayPlaceholder') || 'ex: 75001 Paris'}
                              className="flex-1 p-4 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#556822]"
                            />
                            <button
                              type="button"
                              onClick={handleSearchRelay}
                              disabled={relayLoading || !relayAddressQuery.trim()}
                              className="px-4 py-2 rounded-lg bg-[#556822] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
                            >
                              {relayLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                              {t('shipping.search') || 'Rechercher'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {relayError && <div className="mt-3 text-sm text-red-600">{relayError}</div>}
                    </div>

                    {relayPoints.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {t('shipping.relayList') || 'Liste des points relais'}
                        </div>

                        <div className="max-h-80 overflow-auto border border-gray-100 rounded-lg bg-white">
                          {relayPoints.map((p) => {
                            const active = selectedRelay?.id === p.id;
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => setSelectedRelay(p)}
                                className={`w-full p-4 text-left border-b last:border-b-0 hover:bg-gray-50 ${
                                  active ? 'bg-[#556822]/5' : 'bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="font-black text-sm text-gray-900">{p.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {p.street}, {p.postalCode} {p.city}
                                    </div>

                                    {(p.carrier || p.distanceKm != null) && (
                                      <div className="mt-1 text-[11px] text-gray-400 flex gap-2 flex-wrap">
                                        {p.carrier ? <span>{p.carrier}</span> : null}
                                        {p.distanceKm != null ? <span>{p.distanceKm} km</span> : null}
                                      </div>
                                    )}

                                    {p.hours ? (
                                      <div className="mt-2 text-[11px] text-gray-500">
                                        {typeof p.hours === 'string' ? p.hours : t('shipping.hoursAvailable') || 'Horaires disponibles'}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div
                                    className={`mt-1 w-4 h-4 rounded-full border-4 ${
                                      active ? 'border-[#556822]' : 'border-gray-200'
                                    } bg-white`}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {selectedRelay && (
                          <div className="text-sm text-green-700 font-bold">
                            {t('shipping.relaySelected') || 'Relais sélectionné'}: {selectedRelay.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      {t('payment.nameOnCard')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('payment.nameOnCardPlaceholder')}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      {t('payment.cardNumber')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('payment.cardNumberPlaceholder')}
                      className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        {t('payment.expiry')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('payment.expiryPlaceholder')}
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                        {t('payment.cvc')}
                      </label>
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
          <aside className="lg:w-100">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 sticky top-8">
              <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('summary.title')}</h2>

              {/* Cart Items List */}
              <div className="max-h-100 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {cartItems.map((item) => {
                  const imgs = getCartItemImagesLocal(item);
                  const isPkg = item.type === 'package' || !!item.packageId;
                  const hasPackageMainImage =
                    isPkg &&
                    !!(
                      pickUrl(item?.image) ||
                      pickUrl(item?.packageImage) ||
                      pickUrl(item?.package?.image) ||
                      pickUrl(item?.packageId?.image)
                    );
                  const imageUrl = imgs[0] || null;
                  const sourceProduct = item?.product || (typeof item?.productId === 'object' ? item.productId : null);
                  const translatedName = sourceProduct ? getTranslatedProduct(sourceProduct, locale).name : null;
                  const displayName = translatedName || item.name;

                  return (
                    <div key={item._id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0">
                      <div className="w-16 h-16 shrink-0 relative">
                        {item.isFreeItem && (
                          <span className="absolute -top-1 -right-1 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E10C69] text-white shadow-sm">
                            <Gift size={12} />
                          </span>
                        )}
                        {isPkg && !hasPackageMainImage ? (
                          <div className="grid grid-cols-2 gap-1 w-full h-full">
                            {imgs.length > 0 ? (
                              imgs.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="bg-gray-50 overflow-hidden rounded-sm aspect-square">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 row-span-2 bg-gray-100 rounded-lg flex items-center justify-center">
                                <ShoppingBag size={16} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                        ) : imageUrl ? (
                          <img
                            src={imageUrl}
                            className={`w-full h-full rounded-lg ${isPkg ? 'object-cover' : 'object-contain bg-gray-50'}`}
                            alt={displayName}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag size={16} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="grow">
                        <p className="text-sm font-bold text-[#556822] line-clamp-1">{displayName}</p>
                        {item.isFreeItem ? (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-gray-400 line-through">
                              {(item.price * item.quantity).toFixed(2)} €
                            </p>
                            <p className="text-sm font-black text-[#E10C69]">0 €</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-gray-400">
                              {t('summary.qty')}: {item.quantity}
                            </p>
                            <p className="text-sm font-black text-[#E10C69]">
                              {(item.price * item.quantity).toFixed(2)} €
                            </p>
                          </>
                        )}
                      </div>
                      {!item.isFreeItem && (
                        <button onClick={() => removeFromCart(item._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Promo Code Section */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  {t('summary.promoCodeLabel') || 'Code promo'}
                </h3>
                <PromoCodeInput 
                  cartTotal={subtotal} 
                  cartItems={cartItems}
                  onPromoApplied={(promo) => {
                    setPromoDiscount(promo.discount || 0);
                  }}
                />
              </div>

              {/* Totals */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>{t('summary.subtotal')}</span>
                  <span className="text-gray-900">{Number(subtotal).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>{t('summary.shipping')}</span>
                  <span className="text-gray-900">{Number(shipping).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xl font-black pt-4">
                  <span className="text-[#556822] font-[agrandir]">{t('summary.total')}</span>
                  <div className="text-right leading-tight">
                    {promoDiscount > 0 && (
                      <div className="text-xs font-semibold text-gray-400 line-through">{Number(total).toFixed(2)} €</div>
                    )}
                    <span className="text-[#E10C69]">{finalTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>


              <button
                disabled={!canConfirm}
                className="w-full mt-8 py-4 rounded-md text-white font-black text-lg shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
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

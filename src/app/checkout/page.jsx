'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PromoCodeInput from '@/components/PromoCodeInput';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight, MapPin, Home, Loader2, Navigation, Gift } from 'lucide-react';
import Link from 'next/link';
import { getTranslatedProduct } from '@/lib/productTranslations';
import { paymentAPI } from '@/lib/api';

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
  const searchParams = useSearchParams();
  const { cartItems, subtotal, shipping, shippingBaseFee, total, removeFromCart } = useCart();
  const brandGreen = '#556822';

  // ----------------------------
  // Form states
  // ----------------------------
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

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
  const [relayPage, setRelayPage] = useState(1);

  // Geolocation state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Promo code state
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [homeShippingOffers, setHomeShippingOffers] = useState([]);
  const [homeShippingMode, setHomeShippingMode] = useState('all');
  const [selectedHomeShippingOfferCode, setSelectedHomeShippingOfferCode] = useState('');
  const [homeOffersPage, setHomeOffersPage] = useState(1);
  const [homeShippingLoading, setHomeShippingLoading] = useState(false);
  const [homeShippingError, setHomeShippingError] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const quoteRequestRef = useRef(0);

  const buildShippingUrls = (base, suffix) => {
    const normalizedBase = String(base || '').trim().replace(/\/+$/, '');
    const cleanSuffix = String(suffix || '').replace(/^\/+/, '');
    if (!normalizedBase || !cleanSuffix) return [];

    const baseNoApi = normalizedBase.replace(/\/api$/i, '');
    const hasApiSuffix = /\/api$/i.test(normalizedBase);
    const candidates = hasApiSuffix
      ? [`${normalizedBase}/shipping/${cleanSuffix}`]
      : [
          `${normalizedBase}/api/shipping/${cleanSuffix}`,
          `${baseNoApi}/shipping/${cleanSuffix}`,
        ];

    return [...new Set(candidates.filter(Boolean))];
  };

  const fetchShippingWithFallback = async (suffix, fetchOptions) => {
    const urls = buildShippingUrls(apiBase, suffix);
    let lastResponse = null;

    for (const url of urls) {
      const response = await fetch(url, fetchOptions);
      if (response.status !== 404) {
        return response;
      }
      lastResponse = response;
    }

    return lastResponse;
  };

  const searchRelayPoints = async (q) => {
    setRelayLoading(true);
    setRelayError('');
    setRelayPoints([]);
    setSelectedRelay(null);
    setRelayPage(1);

    try {
      if (!apiBase) throw new Error('NEXT_PUBLIC_API_URL is missing');

      const res = await fetchShippingWithFallback('relay-points', {
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
      setRelayPage(1);
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
      setRelayPage(1);

      const res = await fetchShippingWithFallback('relay-points/by-geo', {
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
      setRelayPage(1);
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
  const isHomeAddressValid =
    country.trim() &&
    street.trim() &&
    city.trim() &&
    postalCode.trim();

  const isHomeValid =
    email.trim() &&
    firstName.trim() &&
    lastName.trim() &&
    isHomeAddressValid;

  const isRelayValid =
    email.trim() &&
    firstName.trim() &&
    lastName.trim() &&
    !!selectedRelay;

  const paymentStatus = searchParams.get('payment');
  const returnedSessionId = searchParams.get('session_id');

  const statusBanner = useMemo(() => {
    if (paymentStatus === 'success') {
      return {
        tone: 'success',
        title: t('status.successTitle'),
        body: t('status.successBody'),
      };
    }

    if (paymentStatus === 'cancelled') {
      return {
        tone: 'warning',
        title: t('status.cancelledTitle'),
        body: t('status.cancelledBody'),
      };
    }

    return null;
  }, [paymentStatus, t]);

  const getCheckoutPayload = () => {
    const localePrefix = locale ? `/${locale}` : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const payload = {
      customerEmail: email.trim(),
      customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      promoCode: promoCode || undefined,
      shippingAmount: Number(Number(displayedShipping || 0).toFixed(2)),
      deliveryType,
      locale,
      successUrl: `${origin}${localePrefix}/checkout?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}${localePrefix}/checkout?payment=cancelled`,
    };

    if (deliveryType === 'home') {
      payload.shippingAddress = {
        line1: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      };
    } else {
      payload.relayPoint = selectedRelay;
      payload.shippingAddress = {
        line1: selectedRelay?.street || '',
        city: selectedRelay?.city || '',
        postalCode: selectedRelay?.postalCode || '',
        country: selectedRelay?.country || relayCountry || country || '',
      };
    }

    return payload;
  };

  const handleConfirmOrder = async () => {
    if (!canConfirm) return;

    setCheckoutError('');
    setIsCheckingOut(true);

    try {
      const payload = getCheckoutPayload();
      const response = await paymentAPI.createCheckoutSession(payload);
      const checkoutUrl = response?.data?.url;

      if (!checkoutUrl) {
        throw new Error(t('errors.sessionCreateFailed'));
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      setCheckoutError(error?.message || t('errors.sessionCreateFailed'));
      setIsCheckingOut(false);
    }
  };
  const selectedHomeShippingOffer = useMemo(
    () =>
      homeShippingOffers.find(
        (offer) =>
          String(offer.shippingOfferCode || offer.shippingOfferId || '') ===
          String(selectedHomeShippingOfferCode || '')
      ) || null,
    [homeShippingOffers, selectedHomeShippingOfferCode]
  );

  const classifyHomeOfferMode = (offer) => {
    const carrier = String(offer?.carrier || '').toUpperCase();
    const code = String(offer?.shippingOfferCode || '').toUpperCase();
    const id = String(offer?.shippingOfferId || '').toUpperCase();
    const text = `${carrier} ${code} ${id}`;

    if (/EXPRESS|PRIORITY|PREMIUM|13|12H|SAVER/.test(text)) return 'express';
    return 'normal';
  };

  const formatHomeOfferLabel = (rawCode) => {
    const raw = String(rawCode || '').trim();
    if (!raw) return '';

    // Make transport codes readable: camelCase, snake_case and digit boundaries.
    return raw
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Za-z])(\d)/g, '$1 $2')
      .replace(/(\d)([A-Za-z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getHomeOfferTransitDaysLabel = (offer) => {
    const explicitDaysCandidates = [
      offer?.transitDays,
      offer?.transit_days,
      offer?.deliveryDays,
      offer?.delivery_days,
      offer?.delayDays,
      offer?.delay_days,
    ];

    const explicitDays = explicitDaysCandidates.find((v) => Number.isFinite(Number(v)) && Number(v) >= 0);
    if (explicitDays !== undefined) {
      const n = Math.round(Number(explicitDays));
      if (n === 0) return t('shipping.eta.sameDay');
      if (n === 1) return t('shipping.eta.estimatedRange', { min: 1, max: 2 });
      return t('shipping.eta.estimatedRange', { min: Math.max(1, n - 1), max: n });
    }

    const parseIsoDate = (v) => {
      const text = String(v || '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
      const d = new Date(`${text}T00:00:00Z`);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const collectionDate = parseIsoDate(offer?.collectionDate || offer?.collection_date);
    const deliveryDate = parseIsoDate(offer?.estimatedDeliveryDate || offer?.estimated_delivery_date);

    if (collectionDate && deliveryDate) {
      const diffDays = Math.round((deliveryDate.getTime() - collectionDate.getTime()) / (24 * 60 * 60 * 1000));
      if (Number.isFinite(diffDays) && diffDays >= 0) {
        if (diffDays === 0) return t('shipping.eta.sameDay');
        if (diffDays === 1) return t('shipping.eta.estimatedRange', { min: 1, max: 2 });
        return t('shipping.eta.estimatedRange', { min: Math.max(1, diffDays - 1), max: diffDays });
      }
    }

    return '';
  };

  const filteredHomeShippingOffers = useMemo(() => {
    if (!Array.isArray(homeShippingOffers) || homeShippingOffers.length === 0) return [];

    if (homeShippingMode === 'cheapest') {
      const sorted = [...homeShippingOffers].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      return sorted.slice(0, 1);
    }

    if (homeShippingMode === 'express') {
      const expressOnly = homeShippingOffers.filter((offer) => classifyHomeOfferMode(offer) === 'express');
      return expressOnly.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    if (homeShippingMode === 'normal') {
      const normalOnly = homeShippingOffers.filter((offer) => classifyHomeOfferMode(offer) === 'normal');
      return normalOnly.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }

    return [...homeShippingOffers].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }, [homeShippingOffers, homeShippingMode]);

  const HOME_OFFERS_PAGE_SIZE = 4;
  const totalHomeOffersPages = Math.max(1, Math.ceil(filteredHomeShippingOffers.length / HOME_OFFERS_PAGE_SIZE));
  const safeHomeOffersPage = Math.min(homeOffersPage, totalHomeOffersPages);
  const homeOffersStartIndex = (safeHomeOffersPage - 1) * HOME_OFFERS_PAGE_SIZE;
  const homeOffersEndIndex = Math.min(homeOffersStartIndex + HOME_OFFERS_PAGE_SIZE, filteredHomeShippingOffers.length);
  const visibleHomeShippingOffers = filteredHomeShippingOffers.slice(homeOffersStartIndex, homeOffersEndIndex);

  const hasRealHomeQuote = Number.isFinite(Number(selectedHomeShippingOffer?.price));
  const showHomeOffersPanel = homeShippingLoading || homeShippingOffers.length > 0 || !!homeShippingError;

  const canConfirmBase =
    deliveryType === 'home'
      ? isHomeValid && hasRealHomeQuote && !homeShippingLoading
      : isRelayValid;
  const canConfirm = canConfirmBase && cartItems.length > 0 && !isCheckingOut;

  const RELAY_PAGE_SIZE = 4;
  const totalRelayPages = Math.max(1, Math.ceil(relayPoints.length / RELAY_PAGE_SIZE));
  const safeRelayPage = Math.min(relayPage, totalRelayPages);
  const relayStartIndex = (safeRelayPage - 1) * RELAY_PAGE_SIZE;
  const relayEndIndex = Math.min(relayStartIndex + RELAY_PAGE_SIZE, relayPoints.length);
  const visibleRelayPoints = relayPoints.slice(relayStartIndex, relayEndIndex);

  const getCarrierLabel = (carrier) => {
    const c = String(carrier || '').toUpperCase();
    if (c === 'MONR') return 'mondial relay';
    if (c === 'POFR') return 'colissimo';
    if (c === 'UPSE') return 'pickup';
    if (c === 'CHRP') return 'chronopost';
    return c ? c.toLowerCase() : '';
  };

  const getCarrierLogo = (carrier) => {
    const c = String(carrier || '')
      .toUpperCase()
      .trim()
      .replace(/[_\s-]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    const logoMap = {
      'MONR': '/assets/shipping/mondialrelay.png',
      'MONDIALRELAY': '/assets/shipping/mondialrelay.png',
      'POFR': '/assets/shipping/colissimo.png',
      'COLISSIMO': '/assets/shipping/colissimo.png',
      'UPSE': '/assets/shipping/ups.png',
      'UPS': '/assets/shipping/ups.png',
      'CHRP': '/assets/shipping/chronopost.png',
      'CHRONOPOST': '/assets/shipping/chronopost.png',
      'FEDEX': '/assets/shipping/fedex.png',
      'TNT': '/assets/shipping/tntexpress.png',
      'TNTEXPRESS': '/assets/shipping/tntexpress.png',
      'SODEX': '/assets/shipping/sodexo.png',
      'SODEXO': '/assets/shipping/sodexo.png',
      'SODEXI': '/assets/shipping/sodexo.png',
      'COLISPRIVE': '/assets/shipping/colisprive.png',
      'COLISEPRIVE': '/assets/shipping/colisprive.png',
      'CPRIVE': '/assets/shipping/colisprive.png',
      'RELAISCOLIS': '/assets/shipping/relaiscolis.jpg',
      'RELAIS': '/assets/shipping/relaiscolis.jpg',
      'COLIS': '/assets/shipping/colisprive.png',
    };
    return logoMap[c] || null;
  };

  const getRelayPriceLabel = (point) => {
    const priceCandidates = [
      point?.price,
      point?.raw?.price,
      point?.raw?.price?.value,
      point?.raw?.deliveryPrice,
      point?.raw?.deliveryPrice?.value,
      point?.raw?.deliveryPriceExclTax,
      point?.raw?.deliveryPriceExclTax?.value,
      point?.raw?.deliveryPriceInclTax,
      point?.raw?.deliveryPriceInclTax?.value,
      point?.raw?.parcelPoint?.price,
      point?.raw?.parcelPoint?.price?.value,
      point?.raw?.parcelpoint?.price,
      point?.raw?.parcelpoint?.price?.value,
    ];

    const rawPrice = priceCandidates.find((v) => Number.isFinite(Number(v)));
    const fallbackBaseFee = Number(shippingBaseFee);
    const fallbackShippingPrice = Number(shipping);

    if (rawPrice === undefined) {
      if (Number.isFinite(fallbackBaseFee)) {
        if (fallbackBaseFee <= 0) return 'Gratuit';
        return `${fallbackBaseFee.toFixed(2)} EUR`;
      }
      if (Number.isFinite(fallbackShippingPrice)) {
        if (fallbackShippingPrice <= 0) return 'Gratuit';
        return `${fallbackShippingPrice.toFixed(2)} EUR`;
      }
      return 'Tarif indisponible';
    }

    const price = Number(rawPrice);
    if (price === 0) return 'Gratuit';

    const currency =
      point?.currency ||
      point?.raw?.currency ||
      point?.raw?.price?.currency ||
      point?.raw?.deliveryPrice?.currency ||
      point?.raw?.deliveryPriceExclTax?.currency ||
      point?.raw?.deliveryPriceInclTax?.currency ||
      'EUR';

    const symbol = String(currency).toUpperCase() === 'EUR' ? 'EUR' : String(currency).toUpperCase();
    return `${price.toFixed(2)} ${symbol}`;
  };

  const getRelayNumericPrice = (point) => {
    if (!point || typeof point !== 'object') return null;

    const priceCandidates = [
      point?.price,
      point?.raw?.price,
      point?.raw?.price?.value,
      point?.raw?.deliveryPrice,
      point?.raw?.deliveryPrice?.value,
      point?.raw?.deliveryPriceExclTax,
      point?.raw?.deliveryPriceExclTax?.value,
      point?.raw?.deliveryPriceInclTax,
      point?.raw?.deliveryPriceInclTax?.value,
      point?.raw?.parcelPoint?.price,
      point?.raw?.parcelPoint?.price?.value,
      point?.raw?.parcelpoint?.price,
      point?.raw?.parcelpoint?.price?.value,
    ];

    const raw = priceCandidates.find((v) => Number.isFinite(Number(v)));
    if (raw === undefined) return null;

    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const selectedRelayShippingPrice = useMemo(() => {
    if (selectedRelay) {
      const selectedPrice = getRelayNumericPrice(selectedRelay);
      return selectedPrice !== null ? selectedPrice : 0;
    }
    return 0;
  }, [selectedRelay, shippingBaseFee, shipping]);

  const displayedShipping = useMemo(() => {
    if (deliveryType === 'home') {
      return hasRealHomeQuote ? Number(selectedHomeShippingOffer.price) : 0;
    }
    return selectedRelayShippingPrice;
  }, [deliveryType, hasRealHomeQuote, selectedHomeShippingOffer?.price, selectedRelayShippingPrice]);

  const displayedTotal = useMemo(() => {
    return Number(subtotal || 0) + Number(displayedShipping || 0);
  }, [subtotal, displayedShipping]);

  const finalTotal = Math.max(0, Number(displayedTotal || 0) - Number(promoDiscount || 0));

  const getOpeningDaysRows = (point) => {
    const openingDays = point?.raw?.parcelPoint?.openingDays || point?.raw?.parcelpoint?.openingDays;
    if (!openingDays || typeof openingDays !== 'object') return [];

    const dayMap = {
      MONDAY: 'Lundi',
      TUESDAY: 'Mardi',
      WEDNESDAY: 'Mercredi',
      THURSDAY: 'Jeudi',
      FRIDAY: 'Vendredi',
      SATURDAY: 'Samedi',
      SUNDAY: 'Dimanche',
    };

    return ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => {
      const periods = Array.isArray(openingDays?.[day]) ? openingDays[day] : [];
      if (periods.length === 0) {
        return { dayLabel: dayMap[day], value: 'Fermé' };
      }

      const ranges = periods
        .map((p) => {
          const open = String(p?.openingTime || '').trim();
          const close = String(p?.closingTime || '').trim();
          return open && close ? `${open} - ${close}` : '';
        })
        .filter(Boolean)
        .join('   ');

      return { dayLabel: dayMap[day], value: ranges || 'Fermé' };
    });
  };

  useEffect(() => {
    if (deliveryType !== 'home') {
      setHomeShippingOffers([]);
      setSelectedHomeShippingOfferCode('');
      setHomeShippingLoading(false);
      setHomeShippingError('');
      return;
    }

    if (!isHomeAddressValid) {
      setHomeShippingOffers([]);
      setSelectedHomeShippingOfferCode('');
      setHomeShippingLoading(false);
      setHomeShippingError('');
      return;
    }

    if (!apiBase) {
      setHomeShippingOffers([]);
      setSelectedHomeShippingOfferCode('');
      setHomeShippingError('NEXT_PUBLIC_API_URL is missing');
      setHomeShippingLoading(false);
      return;
    }

    const requestId = quoteRequestRef.current + 1;
    quoteRequestRef.current = requestId;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setHomeShippingLoading(true);
        setHomeShippingError('');

        const headers = { 'Content-Type': 'application/json' };
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
        }

        const response = await fetchShippingWithFallback('home-offers', {
          method: 'POST',
          headers,
          credentials: 'include',
          signal: controller.signal,
          body: JSON.stringify({
            subtotal: Number(subtotal || 0),
            toAddress: {
              firstName: firstName?.trim() || 'Client',
              lastName: lastName?.trim() || 'Client',
              email: email?.trim() || 'client@example.com',
              phone: phone?.trim() || undefined,
              street,
              city,
              postalCode,
              country,
              addressType: 'RESIDENTIAL',
            },
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.error || data?.message || 'Failed to load home shipping offers');
        }

        if (quoteRequestRef.current !== requestId) return;

        const offers = Array.isArray(data?.offers) ? data.offers : [];
        if (offers.length === 0) {
          throw new Error('No home shipping offer available for this address');
        }

        setHomeShippingOffers(offers);
        setHomeOffersPage(1);
        setSelectedHomeShippingOfferCode((current) => {
          if (
            current &&
            offers.some(
              (offer) => String(offer.shippingOfferCode || offer.shippingOfferId || '') === String(current)
            )
          ) {
            return current;
          }
          return String(offers[0]?.shippingOfferCode || offers[0]?.shippingOfferId || '');
        });
        setHomeShippingError('');
      } catch (err) {
        if (controller.signal.aborted) return;
        if (quoteRequestRef.current !== requestId) return;
        setHomeShippingOffers([]);
        setHomeOffersPage(1);
        setSelectedHomeShippingOfferCode('');
        setHomeShippingError(err?.message || 'Failed to estimate home shipping');
      } finally {
        if (quoteRequestRef.current === requestId) {
          setHomeShippingLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    deliveryType,
    isHomeAddressValid,
    apiBase,
    subtotal,
    firstName,
    lastName,
    email,
    phone,
    street,
    city,
    postalCode,
    country,
  ]);

  useEffect(() => {
    if (!Array.isArray(filteredHomeShippingOffers) || filteredHomeShippingOffers.length === 0) {
      if (homeShippingMode !== 'all') {
        setSelectedHomeShippingOfferCode('');
      }
      return;
    }

    const currentExists = filteredHomeShippingOffers.some(
      (offer) =>
        String(offer.shippingOfferCode || offer.shippingOfferId || '') ===
        String(selectedHomeShippingOfferCode || '')
    );

    if (!currentExists) {
      const first = filteredHomeShippingOffers[0];
      setSelectedHomeShippingOfferCode(String(first.shippingOfferCode || first.shippingOfferId || ''));
    }
  }, [filteredHomeShippingOffers, selectedHomeShippingOfferCode, homeShippingMode]);

  useEffect(() => {
    setHomeOffersPage(1);
  }, [homeShippingMode, filteredHomeShippingOffers.length]);

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

        {statusBanner && (
          <div
            className={`mb-8 rounded-xl border p-4 ${
              statusBanner.tone === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <h3 className="text-sm font-black uppercase tracking-wide">{statusBanner.title}</h3>
            <p className="mt-1 text-sm">{statusBanner.body}</p>
            {returnedSessionId && statusBanner.tone === 'success' ? (
              <p className="mt-1 text-xs opacity-80">Session: {returnedSessionId}</p>
            ) : null}
          </div>
        )}

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

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {t('contact.phoneLabel') || 'Telephone'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('contact.phonePlaceholder') || '+33 6 00 00 00 00'}
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

                    {showHomeOffersPanel && (
                      <div className="md:col-span-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold text-gray-700">{t('shipping.homeOffersTitle')}</span>
                            <span className="font-black text-[#556822]">
                              {hasRealHomeQuote
                                ? `${Number(selectedHomeShippingOffer.price).toFixed(2)} ${selectedHomeShippingOffer?.currency || 'EUR'}`
                                : ''}
                            </span>
                          </div>

                          {homeShippingLoading ? (
                            <div className="mt-3 space-y-3 animate-pulse">
                              <div className="flex flex-wrap gap-2 mb-2">
                                <div className="h-7 w-16 rounded-full bg-gray-200" />
                                <div className="h-7 w-24 rounded-full bg-gray-200" />
                                <div className="h-7 w-20 rounded-full bg-gray-200" />
                                <div className="h-7 w-20 rounded-full bg-gray-200" />
                              </div>

                              <div className="max-h-136 overflow-auto border border-gray-300 bg-white">
                                {[0, 1, 2].map((i) => (
                                  <div key={i} className="w-full p-4 border-b border-gray-200">
                                    <div className="flex items-start justify-between gap-4">
                                      <div className="flex items-start gap-3 min-w-0">
                                        <div className="mt-1 h-5 w-5 rounded-full border-2 border-gray-200 bg-gray-100" />
                                        <div className="min-w-0 space-y-2">
                                          <div className="h-5 w-36 bg-gray-200 rounded" />
                                          <div className="h-6 w-28 bg-gray-200 rounded" />
                                          <div className="h-5 w-16 bg-gray-100 rounded-md" />
                                        </div>
                                      </div>
                                      <div className="h-5 w-20 bg-gray-200 rounded mt-1" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : homeShippingOffers.length > 0 ? (
                            <div className="mt-3 space-y-3">
                              <div className="flex flex-wrap gap-2 mb-2">
                                {[
                                  { key: 'all', label: t('shipping.filters.all') },
                                  { key: 'cheapest', label: t('shipping.filters.cheapest') },
                                  { key: 'normal', label: t('shipping.filters.normal') },
                                  { key: 'express', label: t('shipping.filters.express') },
                                ].map((modeOption) => {
                                  const active = homeShippingMode === modeOption.key;
                                  return (
                                    <button
                                      key={modeOption.key}
                                      type="button"
                                      onClick={() => setHomeShippingMode(modeOption.key)}
                                      className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                                        active
                                          ? 'border-[#556822] bg-[#556822]/5 text-[#556822]'
                                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                                      }`}
                                    >
                                      {modeOption.label}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="max-h-136 overflow-auto border border-gray-300 bg-white">
                                {visibleHomeShippingOffers.map((offer) => {
                                  const code = String(offer.shippingOfferCode || offer.shippingOfferId || '');
                                  const codeLabel = formatHomeOfferLabel(code) || code;
                                  const active = selectedHomeShippingOfferCode === code;
                                  const modeKey = classifyHomeOfferMode(offer) === 'express' ? 'express' : 'normal';
                                  const modeLabel = t(`shipping.filters.${modeKey}`);
                                  const transitDaysLabel = getHomeOfferTransitDaysLabel(offer);
                                  const carrierLabel = String(offer.carrier || '').replace(/_/g, ' ').trim() || 'carrier';
                                  const carrierLogoUrl = getCarrierLogo(offer.carrier);

                                  return (
                                    <button
                                      key={code}
                                      type="button"
                                      onClick={() => setSelectedHomeShippingOfferCode(code)}
                                      className={`w-full text-left p-4 border-b border-gray-200 transition-colors ${
                                        active ? 'bg-[#556822]/5' : 'bg-white hover:bg-gray-50/50'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 min-w-0">
                                          <span
                                            className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                              active ? 'border-[#556822]' : 'border-gray-300'
                                            }`}
                                          >
                                            {active ? <span className="h-2.5 w-2.5 rounded-full bg-[#556822]" /> : null}
                                          </span>

                                          <div className="min-w-0">
                                            <div className="font-semibold text-lg leading-tight text-gray-900 truncate">
                                                {codeLabel}
                                            </div>

                                            <div className="mt-1 flex items-center gap-2">
                                              {carrierLogoUrl ? (
                                                <img
                                                  src={carrierLogoUrl}
                                                  alt={carrierLabel}
                                                  className="h-6 object-contain"
                                                />
                                              ) : (
                                                <span className="text-sm text-gray-500 uppercase tracking-wide">
                                                  {carrierLabel}
                                                </span>
                                              )}
                                            </div>

                                            <div className="mt-2 inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-bold lowercase text-gray-700">
                                              {modeLabel}
                                            </div>

                                            {transitDaysLabel ? (
                                              <div className="mt-2 text-sm font-semibold text-gray-700">
                                                {transitDaysLabel}
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>

                                        <div className="pt-1 text-sm font-black uppercase text-black shrink-0">
                                          {Number(offer.price || 0).toFixed(2)} {offer.currency || 'EUR'}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              {!homeShippingLoading && filteredHomeShippingOffers.length === 0 && (
                                <p className="text-xs font-medium text-amber-700">
                                  Aucune offre {homeShippingMode === 'express' ? 'express' : 'normale'} disponible pour cette adresse.
                                </p>
                              )}

                              {filteredHomeShippingOffers.length > HOME_OFFERS_PAGE_SIZE && (
                                <div className="grid grid-cols-3 border border-gray-300 rounded-b-lg overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => setHomeOffersPage((prev) => Math.max(1, prev - 1))}
                                    disabled={safeHomeOffersPage <= 1}
                                    className="h-12 flex items-center justify-center border-r border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Page précédente offres domicile"
                                  >
                                    <ArrowLeft size={18} />
                                  </button>

                                  <div className="h-12 flex items-center justify-center bg-white text-sm font-semibold text-gray-800">
                                    {homeOffersStartIndex + 1} - {homeOffersEndIndex} de {filteredHomeShippingOffers.length} points
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setHomeOffersPage((prev) => Math.min(totalHomeOffersPages, prev + 1))}
                                    disabled={safeHomeOffersPage >= totalHomeOffersPages}
                                    className="h-12 flex items-center justify-center border-l border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    aria-label="Page suivante offres domicile"
                                  >
                                    <ArrowRight size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : null}

                          {homeShippingError ? (
                            <p className="mt-2 text-xs font-medium text-amber-700">
                              {homeShippingError}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}
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
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-black uppercase tracking-wider text-gray-500">
                            {t('shipping.relayList') || 'Liste des points relais'}
                          </div>
                          <div className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                            {relayPoints.length} resultats
                          </div>
                        </div>

                        <div className="max-h-136 overflow-auto border border-gray-300 bg-white">
                          {visibleRelayPoints.map((p) => {
                            const active = selectedRelay?.id === p.id;
                            const dayRows = active ? getOpeningDaysRows(p) : [];
                            const carrierLabel = getCarrierLabel(p.carrier);
                            const carrierLogoUrl = getCarrierLogo(p.carrier);
                            const priceLabel = getRelayPriceLabel(p);

                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => setSelectedRelay(p)}
                                className={`w-full text-left p-4 border-b border-gray-200 transition-colors ${
                                  active ? 'bg-[#556822]/5' : 'bg-white hover:bg-gray-50/50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <span
                                      className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                        active ? 'border-[#556822]' : 'border-gray-300'
                                      }`}
                                    >
                                      {active ? <span className="h-2.5 w-2.5 rounded-full bg-[#556822]" /> : null}
                                    </span>

                                    <div className="min-w-0">
                                      <div className="font-semibold text-lg leading-tight text-gray-900">
                                        {p.name}
                                      </div>

                                      <div className="mt-1 text-sm text-gray-500">
                                        {p.street}, {p.postalCode} {p.city}
                                      </div>

                                      {carrierLogoUrl ? (
                                        <div className="mt-2 flex items-center h-6">
                                          <img
                                            src={carrierLogoUrl}
                                            alt={carrierLabel}
                                            className="h-full object-contain"
                                          />
                                        </div>
                                      ) : carrierLabel ? (
                                        <div className="mt-2 inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-bold lowercase text-gray-700">
                                          {carrierLabel}
                                        </div>
                                      ) : null}

                                      {active && dayRows.length > 0 && (
                                        <div className="mt-4 rounded-md border border-gray-200 bg-white p-3 max-w-lg">
                                          <p className="text-xs font-black text-gray-900 mb-2">Heures d’ouverture</p>
                                          <div className="space-y-1">
                                            {dayRows.map((row) => (
                                              <div key={row.dayLabel} className="grid grid-cols-[80px_1fr] gap-3 text-xs">
                                                <span className="font-semibold text-gray-800">{row.dayLabel}:</span>
                                                <span className="text-gray-700">{row.value}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pt-1 text-sm font-black uppercase text-black shrink-0">
                                    {priceLabel}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {relayPoints.length > RELAY_PAGE_SIZE && (
                          <div className="grid grid-cols-3 border border-gray-300 rounded-b-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setRelayPage((prev) => Math.max(1, prev - 1))}
                              disabled={safeRelayPage <= 1}
                              className="h-12 flex items-center justify-center border-r border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Page précédente"
                            >
                              <ArrowLeft size={18} />
                            </button>

                            <div className="h-12 flex items-center justify-center bg-white text-sm font-semibold text-gray-800">
                              {relayStartIndex + 1} - {relayEndIndex} de {relayPoints.length} points
                            </div>

                            <button
                              type="button"
                              onClick={() => setRelayPage((prev) => Math.min(totalRelayPages, prev + 1))}
                              disabled={safeRelayPage >= totalRelayPages}
                              className="h-12 flex items-center justify-center border-l border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label="Page suivante"
                            >
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        )}

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
                      inputMode="numeric"
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
                        inputMode="numeric"
                        placeholder={t('payment.cvcPlaceholder')}
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#556822] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                  {t('payment.redirectNote')}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider font-bold text-[#556822]">
                  {t('payment.poweredByStripe')}
                </p>
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
                    setPromoCode(promo?.code || null);
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
                  <span className="text-gray-900">{Number(displayedShipping).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-xl font-black pt-4">
                  <span className="text-[#556822] font-[agrandir]">{t('summary.total')}</span>
                  <div className="text-right leading-tight">
                    {promoDiscount > 0 && (
                      <div className="text-xs font-semibold text-gray-400 line-through">{Number(displayedTotal).toFixed(2)} €</div>
                    )}
                    <span className="text-[#E10C69]">{finalTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>


              <button
                disabled={!canConfirm}
                onClick={handleConfirmOrder}
                className="w-full mt-8 py-4 rounded-md text-white font-black text-lg shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: brandGreen }}
              >
                {isCheckingOut ? t('actions.redirecting') : t('actions.confirmOrder')}
              </button>

              {checkoutError ? (
                <p className="text-sm text-red-600 mt-3">{checkoutError}</p>
              ) : null}

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

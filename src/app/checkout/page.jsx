'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/navigation';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { CheckoutProvider } from './CheckoutProvider';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import PromoCodeInput from '@/components/PromoCodeInput';
import { Trash2, ShoppingBag, ArrowLeft, ArrowRight, MapPin, Home, Loader2, Navigation, Gift } from 'lucide-react';
import { getTranslatedProduct } from '@/lib/productTranslations';
import { paymentAPI } from '@/lib/api';
import { classifyHomeOfferMode, getCarrierLogo } from '@/lib/shippingOfferUi';
import {
  resolveShippingPricingForCountry,
  flattenZoneCountryOptions,
} from '@/lib/shippingZonePricing';
import { useAddressAutocomplete } from '@/lib/useAddressAutocomplete';
import { attachGuestIdHeader } from '@/lib/guestId';
import { getAddressCountryMismatchKey } from '@/lib/addressCountryConsistency';
import PhoneInput, {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';

// Helper to match Cart image logic
const pickUrl = (v) => {
  if (!v || v === 'undefined') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.url || v.secure_url || null;
  return null;
};

/** Cart `price` is the unit price; line subtotal = unit × quantity. */
const lineSubtotalFromCartItem = (item) => {
  if (!item || item.isFreeItem) return 0;
  const unit = Number(item.unitPrice ?? item.price ?? 0);
  const q = Math.max(1, Number(item.quantity ?? 1));
  return Number((unit * q).toFixed(2));
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

const PaymentForm = ({
  locale,
  t,
  paymentProcessing,
  setPaymentProcessing,
  paymentError,
  setPaymentError,
  createPaymentIntent,
  customerEmail,
  customerPhone,
  onPaymentFormCompleteChange,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('');
  const cardholderInputRef = useRef(null);
  const [cardCompletion, setCardCompletion] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });

  const cardElementStyle = {
    style: {
      base: {
        fontSize: '15px',
        color: '#32325d',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#a0aec0',
        },
      },
      invalid: {
        color: '#c23d4b',
      },
    },
  };

  useEffect(() => {
    onPaymentFormCompleteChange(
      Boolean(cardCompletion.number && cardCompletion.expiry && cardCompletion.cvc && cardholderName.trim())
    );
  }, [cardCompletion, cardholderName, onPaymentFormCompleteChange]);

  useEffect(() => {
    // Prevent the cardholder name input from appearing focused on initial render.
    // (Stripe Elements may not be focusable at mount, so the browser can focus the first plain input.)
    const el = cardholderInputRef.current;
    if (typeof document === 'undefined' || !el) return;
    if (document.activeElement === el) el.blur();
  }, []);

  const handleSubmitPayment = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Payment system not ready. Please refresh the page.');
      return;
    }

    setPaymentProcessing(true);
    setPaymentError('');

    try {
      const clientSecret = await createPaymentIntent();
      const cardElement = elements.getElement(CardNumberElement);

      if (!cardElement) {
        throw new Error('Payment form not ready. Please refresh the page.');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: customerEmail || undefined,
            name: cardholderName.trim() || undefined,
            phone: customerPhone || undefined,
          },
        },
      });

      if (confirmError) {
        setPaymentError(confirmError.message || 'Payment failed');
        setPaymentProcessing(false);
      } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        window.location.href = `${locale ? `/${locale}` : ''}/checkout/succes?payment_intent=${encodeURIComponent(paymentIntent.id)}`;
      } else {
        setPaymentProcessing(false);
      }
    } catch (err) {
      setPaymentError('Payment processing error: ' + err.message);
      setPaymentProcessing(false);
    }
  };

  return (
    <form id="checkout-payment-form" onSubmit={handleSubmitPayment} className="mt-1">
      <div className="mb-4 sm:mb-6 border border-gray-200 rounded-lg bg-white p-3 sm:p-4">
        <div className="text-base sm:text-[18px] font-semibold text-gray-900">Card</div>

        <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3 bg-white">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">Card information</label>
            <div className="rounded-md border border-gray-300 px-2.5 sm:px-3 py-2.5 sm:py-3 bg-white">
              <CardNumberElement
                options={{
                  ...cardElementStyle,
                  placeholder: '1234 1234 1234 1234',
                  showIcon: true,
                  iconStyle: 'solid',
                  disableLink: true,
                }}
                onChange={(event) => {
                  setCardCompletion((prev) => ({ ...prev, number: Boolean(event?.complete) }));
                  if (event?.error?.message) {
                    setPaymentError(event.error.message);
                  } else {
                    setPaymentError('');
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-md border border-gray-300 px-2.5 sm:px-3 py-2.5 sm:py-3 bg-white">
              <CardExpiryElement
                options={{
                  ...cardElementStyle,
                  placeholder: 'MM / YY',
                }}
                onChange={(event) => {
                  setCardCompletion((prev) => ({ ...prev, expiry: Boolean(event?.complete) }));
                  if (event?.error?.message) {
                    setPaymentError(event.error.message);
                  } else {
                    setPaymentError('');
                  }
                }}
              />
            </div>

            <div className="rounded-md border border-gray-300 px-2.5 sm:px-3 py-2.5 sm:py-3 bg-white">
              <CardCvcElement
                options={{
                  ...cardElementStyle,
                  placeholder: 'CVC',
                }}
                onChange={(event) => {
                  setCardCompletion((prev) => ({ ...prev, cvc: Boolean(event?.complete) }));
                  if (event?.error?.message) {
                    setPaymentError(event.error.message);
                  } else {
                    setPaymentError('');
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">Cardholder name</label>
            <input
              ref={cardholderInputRef}
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Full name on card"
              className="w-full rounded-md border border-gray-300 px-2.5 sm:px-3 py-2.5 sm:py-3 bg-white outline-none"
            />
          </div>

        </div>
      </div>

      {paymentError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p className="font-bold">{t('errors.paymentFailed')}</p>
          <p className="text-sm">{paymentError}</p>
        </div>
      )}

      <p className="text-[11px] sm:text-xs text-gray-500 text-center">
        {t('securityNote')}
      </p>
    </form>
  );
};

const CheckoutPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('Checkout');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { cartItems, subtotal, shipping, shippingBaseFee, total, removeFromCart } = useCart();
  const brandGreen = '#556822';

  // Redirect non-authenticated guests to login
  useEffect(() => {
    if (authLoading) return; // Wait for auth check to complete
    if (!user) {
      const target = pathname || '/checkout';
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.setItem('postLoginRedirect', target);
        } catch {
          // Ignore storage errors.
        }
      }
      router.push(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }
  }, [user, authLoading, router, pathname]);

  // Pre-populate email from authenticated user
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.name) {
      const parts = user.name.split(' ');
      if (parts[0]) setFirstName(parts[0]);
      if (parts[1]) setLastName(parts.slice(1).join(' '));
    }
  }, [user]);

  // ----------------------------
  // Form states
  // ----------------------------
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(() => `+${getCountryCallingCode('FR')}`);
  const [phoneCountry, setPhoneCountry] = useState('FR');
  const [isPhoneCountryMenuOpen, setIsPhoneCountryMenuOpen] = useState(false);
  const phoneCountryMenuRef = useRef(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  /** ISO 3166-1 alpha-2 for home delivery */
  const [countryIso, setCountryIso] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const countryMenuRef = useRef(null);

  // Delivery type: home | relay
  const [deliveryType, setDeliveryType] = useState('home'); // "home" | "relay"
  const [expressDelivery, setExpressDelivery] = useState(false);

  // Relay search + selection (ISO code for zone-based pricing + API)
  const [relayCountryIso, setRelayCountryIso] = useState('');
  const [isRelayCountryDropdownOpen, setIsRelayCountryDropdownOpen] = useState(false);
  const [relayCountrySearchQuery, setRelayCountrySearchQuery] = useState('');
  const relayCountryMenuRef = useRef(null);
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
  const [isPreparingPaymentIntent, setIsPreparingPaymentIntent] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [homeShippingOffers, setHomeShippingOffers] = useState([]);
  const [homeShippingMode, setHomeShippingMode] = useState('all');
  const [selectedHomeShippingOfferCode, setSelectedHomeShippingOfferCode] = useState('');
  const [homeOffersPage, setHomeOffersPage] = useState(1);
  const [homeShippingLoading, setHomeShippingLoading] = useState(false);
  const [homeShippingError, setHomeShippingError] = useState('');
  const [homeOfferAvailabilityLoading, setHomeOfferAvailabilityLoading] = useState(false);
  const [homeAddressHasOffer, setHomeAddressHasOffer] = useState(true);
  const [homeAddressOfferError, setHomeAddressOfferError] = useState('');
  const [homeOfferVerifiedKey, setHomeOfferVerifiedKey] = useState('');
  const [shippingSettings, setShippingSettings] = useState({
    relay: { freeShipping: 40, StandarShippingFee: 4.9 },
    home: {
      freeShipping: 60,
      discountedShipping: 40,
      StandardShippingFee: 7.9,
      discountedShippingFee: 4.9,
      express: 9.9,
    },
    zones: [],
  });

  // Payment states
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isPaymentFormComplete, setIsPaymentFormComplete] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const quoteRequestRef = useRef(0);

  const homeAddressAutocomplete = useAddressAutocomplete({ countryIso, debounceMs: 400 });
  const relayAddressAutocomplete = useAddressAutocomplete({ countryIso: relayCountryIso, debounceMs: 400 });
  const [homeAddrMenuOpen, setHomeAddrMenuOpen] = useState(false);
  const [relayAddrMenuOpen, setRelayAddrMenuOpen] = useState(false);

  const phoneCountryDisplayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale === 'fr' ? 'fr' : 'en'], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);

  const phoneCountryOptions = useMemo(() => {
    const lang = locale === 'fr' ? 'fr' : 'en';
    const collator = new Intl.Collator(lang, { sensitivity: 'base' });

    return getCountries()
      .map((code) => ({
        code,
        name: phoneCountryDisplayNames?.of(code) || code,
        callingCode: getCountryCallingCode(code),
      }))
      .sort((a, b) => {
        const byName = collator.compare(a.name, b.name);
        if (byName !== 0) return byName;
        return a.code.localeCompare(b.code);
      });
  }, [phoneCountryDisplayNames, locale]);

  const regionDisplayNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale === 'fr' ? 'fr' : 'en'], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);

  /** Street (bold) + ", postal city, country" for autocomplete rows — matches compact Nominatim fields. */
  const formatAddressSuggestionLine = (s) => {
    const lineStreet = String(s?.street || '').trim();
    const locality = [s?.postalCode, s?.city].filter(Boolean).join(' ').trim();
    const countryLabel =
      String(s?.countryName || '').trim() ||
      (s?.country ? regionDisplayNames?.of(String(s.country)) : '') ||
      String(s?.country || '');
    return { lineStreet, locality, countryLabel };
  };

  const zoneCountryOptions = useMemo(() => {
    const flat = flattenZoneCountryOptions(shippingSettings?.zones || [], regionDisplayNames);
    if (flat.length > 0) return flat;
    return [
      {
        iso: 'FR',
        label: regionDisplayNames?.of('FR') || 'France',
      },
    ];
  }, [shippingSettings?.zones, regionDisplayNames]);

  const filteredCountryOptions = useMemo(() => {
    const query = String(countrySearchQuery || '').toLowerCase().trim();
    if (!query) return zoneCountryOptions;
    return zoneCountryOptions.filter((opt) =>
      opt.label.toLowerCase().includes(query) || opt.iso.toLowerCase().includes(query)
    );
  }, [zoneCountryOptions, countrySearchQuery]);

  const filteredRelayCountryOptions = useMemo(() => {
    const query = String(relayCountrySearchQuery || '').toLowerCase().trim();
    if (!query) return zoneCountryOptions;
    return zoneCountryOptions.filter((opt) =>
      opt.label.toLowerCase().includes(query) || opt.iso.toLowerCase().includes(query)
    );
  }, [zoneCountryOptions, relayCountrySearchQuery]);

  const effectiveShippingRules = useMemo(() => {
    const iso = deliveryType === 'relay' ? relayCountryIso : countryIso;
    return resolveShippingPricingForCountry(shippingSettings, iso);
  }, [deliveryType, relayCountryIso, countryIso, shippingSettings]);
  const expressAvailable = Number(effectiveShippingRules?.home?.express ?? 0) > 0;

  const selectedPhoneCountryName =
    phoneCountryOptions.find((entry) => entry.code === phoneCountry)?.name || phoneCountry;
  const SelectedPhoneCountryFlag = flags?.[phoneCountry];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!phoneCountryMenuRef.current) return;
      if (!phoneCountryMenuRef.current.contains(event.target)) {
        setIsPhoneCountryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const label = zoneCountryOptions.find((opt) => opt.iso === countryIso)?.label || countryIso;
    setCountrySearchQuery(label);
  }, [countryIso, zoneCountryOptions]);

  useEffect(() => {
    const label = zoneCountryOptions.find((opt) => opt.iso === relayCountryIso)?.label || relayCountryIso;
    setRelayCountrySearchQuery(label);
  }, [relayCountryIso, zoneCountryOptions]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!countryMenuRef.current) return;
      if (!countryMenuRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
        const label = zoneCountryOptions.find((o) => o.iso === countryIso)?.label || countryIso;
        setCountrySearchQuery(label);
      }
    };

    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [isCountryDropdownOpen, zoneCountryOptions, countryIso]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!relayCountryMenuRef.current) return;
      if (!relayCountryMenuRef.current.contains(event.target)) {
        setIsRelayCountryDropdownOpen(false);
        const label = zoneCountryOptions.find((o) => o.iso === relayCountryIso)?.label || relayCountryIso;
        setRelayCountrySearchQuery(label);
      }
    };

    if (isRelayCountryDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
      };
    }
  }, [isRelayCountryDropdownOpen, zoneCountryOptions, relayCountryIso]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${apiBase}/settings`, { credentials: 'include' });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.success && data?.data?.shippingSettings) {
          setShippingSettings((prev) => ({
            ...prev,
            ...data.data.shippingSettings,
            zones: Array.isArray(data.data.shippingSettings.zones)
              ? data.data.shippingSettings.zones
              : prev.zones || [],
          }));
        }
      } catch (_) {
      }
    })();
  }, [apiBase]);

  const buildShippingFetchInit = (init = {}) => {
    const headers = attachGuestIdHeader({
      'Content-Type': 'application/json',
      ...(typeof init.headers === 'object' && init.headers && !Array.isArray(init.headers) ? init.headers : {}),
    });
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // ignore
      }
    }
    return {
      ...init,
      credentials: 'include',
      headers,
    };
  };

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
    const merged = buildShippingFetchInit(fetchOptions || {});

    for (const url of urls) {
      const response = await fetch(url, merged);
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

      const relayCc = String(relayCountryIso || '').trim().toUpperCase();

      const res = await fetchShippingWithFallback('relay-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: relayCc,
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
    const relayCc = String(relayCountryIso || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(relayCc)) {
      setRelayError(t('shipping.selectCountryForRelay') || 'Select a country for relay delivery first.');
      return;
    }
    await searchRelayPoints(q);
  };

  const applyHomeAddressSuggestion = (s) => {
    setStreet(String(s.street || '').trim());
    setCity(String(s.city || '').trim());
    setPostalCode(String(s.postalCode || '').trim());
    homeAddressAutocomplete.clear();
    setHomeAddrMenuOpen(false);
  };

  const applyRelayAddressSuggestion = (s) => {
    const line = [s.postalCode, s.city].filter(Boolean).join(' ').trim();
    setRelayAddressQuery(
      line || String(s.shortLabel || s.displayName || '').trim().slice(0, 200)
    );
    relayAddressAutocomplete.clear();
    setRelayAddrMenuOpen(false);
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
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('Invalid position');
      }

      if (!apiBase) throw new Error('NEXT_PUBLIC_API_URL is missing');

      const countryHint = String(relayCountryIso || '').trim().toUpperCase();
      const payload = {
        lat,
        lng,
        limit: 20,
      };
      if (/^[A-Z]{2}$/.test(countryHint)) {
        payload.country = countryHint;
      }

      setRelayLoading(true);
      setRelayPoints([]);
      setSelectedRelay(null);
      setRelayPage(1);

      const res = await fetchShippingWithFallback('relay-points/by-geo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to load relay points');

      const points = Array.isArray(data?.points) ? data.points : [];
      const detectedRaw = String(data?.detectedCountryIso || '').trim().toUpperCase();
      const allowedIsos = new Set(zoneCountryOptions.map((o) => o.iso));

      if (detectedRaw && !allowedIsos.has(detectedRaw)) {
        setRelayPoints([]);
        setRelayPage(1);
        setRelayError(
          t('shipping.geoOutsideZone', { country: detectedRaw }) ||
            `Relay delivery is not available for your zone (${detectedRaw}).`
        );
        return;
      }

      if (detectedRaw && allowedIsos.has(detectedRaw)) {
        setRelayCountryIso(detectedRaw);
      }

      const loc = data?.location;
      if (loc && (loc.postalCode || loc.city)) {
        const line = [loc.postalCode, loc.city].filter(Boolean).join(' ').trim();
        if (line) setRelayAddressQuery(line);
      }

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
  const isPhoneValid = Boolean(phone) && isValidPhoneNumber(String(phone));

  const handlePhoneChange = (nextValue) => {
    const normalized = String(nextValue || '');
    const nextCallingCode = `+${getCountryCallingCode(phoneCountry)}`;

    if (!normalized.trim()) {
      setPhone(nextCallingCode);
      return;
    }

    try {
      const parsed = parsePhoneNumber(normalized);
      const nationalNumber = String(parsed?.nationalNumber || '').trim();
      setPhone(nationalNumber ? `${nextCallingCode}${nationalNumber}` : nextCallingCode);
    } catch {
      const digitsOnly = normalized.replace(/\D/g, '');
      const prefixDigits = nextCallingCode.replace(/\D/g, '');
      const nationalDigits = digitsOnly.startsWith(prefixDigits)
        ? digitsOnly.slice(prefixDigits.length)
        : digitsOnly;
      setPhone(nationalDigits ? `${nextCallingCode}${nationalDigits}` : nextCallingCode);
    }
  };

  const handlePhoneKeyDown = (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const prefix = `+${getCountryCallingCode(phoneCountry)}`;
    const prefixLength = prefix.length;
    const selectionStart = Number.isInteger(input.selectionStart) ? input.selectionStart : 0;
    const selectionEnd = Number.isInteger(input.selectionEnd) ? input.selectionEnd : 0;

    const selectionTouchesPrefix = selectionStart < prefixLength;
    const selectionRemovesPrefix = selectionTouchesPrefix && selectionEnd <= prefixLength;

    if (event.key === 'Backspace' && selectionStart <= prefixLength) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Delete' && (selectionTouchesPrefix || selectionRemovesPrefix)) {
      event.preventDefault();
      return;
    }
  };

  const handlePhoneCountrySelect = (nextCountryCode) => {
    const code = String(nextCountryCode || '').toUpperCase();
    if (!code) return;

    const nextCallingCode = `+${getCountryCallingCode(code)}`;
    setPhoneCountry(code);
    setIsPhoneCountryMenuOpen(false);

    // Keep behavior explicit: selecting a country should immediately reflect its dialing code.
    setPhone((current) => {
      const currentValue = String(current || '').trim();
      if (!currentValue) return nextCallingCode;

      try {
        const parsed = parsePhoneNumber(currentValue);
        const nationalNumber = String(parsed?.nationalNumber || '').trim();
        return nationalNumber ? `${nextCallingCode}${nationalNumber}` : nextCallingCode;
      } catch {
        return nextCallingCode;
      }
    });
  };

  const isHomeAddressValid =
    Boolean(countryIso) &&
    street.trim() &&
    city.trim() &&
    postalCode.trim();

  const isHomeValid =
    email.trim() &&
    isPhoneValid &&
    firstName.trim() &&
    lastName.trim() &&
    isHomeAddressValid;

  const isRelayValid =
    email.trim() &&
    isPhoneValid &&
    firstName.trim() &&
    lastName.trim() &&
    !!selectedRelay;

  const isShippingReady =
    deliveryType === 'home' ? Boolean(isHomeAddressValid) : Boolean(selectedRelay);

  const homeAddressVerificationKey = useMemo(
    () =>
      [
        String(countryIso || '').trim().toLowerCase(),
        String(street || '').trim().toLowerCase(),
        String(city || '').trim().toLowerCase(),
        String(postalCode || '').trim().toLowerCase(),
        String(firstName || '').trim().toLowerCase(),
        String(lastName || '').trim().toLowerCase(),
        String(email || '').trim().toLowerCase(),
        String(phone || '').trim().toLowerCase(),
        String(Number(subtotal || 0).toFixed(2)),
      ].join('|'),
    [countryIso, street, city, postalCode, firstName, lastName, email, phone, subtotal]
  );

  const normalizeHomeOfferErrorMessage = (rawMessage) => {
    const msg = String(rawMessage || '').trim();
    if (!msg) return '';
    if (/Invalid destination country for home shipping quote/i.test(msg)) {
      return t('shipping.errors.invalidDestinationCountry');
    }
    if (/Missing destination contact fields/i.test(msg)) {
      return t('shipping.errors.missingContactForHomeQuote');
    }
    if (/Missing destination location fields/i.test(msg)) {
      return t('shipping.errors.completeAddressForHomeQuote');
    }
    if (/Address does not match selected country/i.test(msg)) {
      return t('shipping.errors.addressCountryMismatch');
    }
    if (/No shipping offer available/i.test(msg)) {
      return t('shipping.errors.noHomeOfferForAddress');
    }
    return msg;
  };

  const homeQuotePrerequisiteMessage = useMemo(() => {
    if (deliveryType !== 'home') return '';
    if (!countryIso || !street.trim() || !city.trim() || !postalCode.trim()) {
      return t('shipping.errors.completeAddressForHomeQuote');
    }
    if (getAddressCountryMismatchKey(countryIso, postalCode, city)) {
      return t('shipping.errors.addressCountryMismatch');
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      return t('shipping.errors.missingContactForHomeQuote');
    }
    if (!phone.trim()) {
      return t('shipping.errors.missingPhoneForHomeQuote');
    }
    if (!isPhoneValid) {
      return t('contact.phoneInvalid');
    }
    return '';
  }, [
    deliveryType,
    countryIso,
    street,
    city,
    postalCode,
    firstName,
    lastName,
    email,
    phone,
    isPhoneValid,
    t,
  ]);

  const displayHomeQuoteError = homeQuotePrerequisiteMessage || homeAddressOfferError;

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
    const normalizedEmail = email.trim().toLowerCase();

    const payload = {
      customerEmail: normalizedEmail,
      customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      customerFirstName: firstName.trim(),
      customerLastName: lastName.trim(),
      customerPhone: phone.trim(),
      promoCode: promoCode || undefined,
      shippingAmount: Number(Number(displayedShipping || 0).toFixed(2)),
      express:
        deliveryType === 'home' && expressDelivery && expressAvailable
          ? true
          : false,
      deliveryType,
      locale,
      successUrl: `${origin}${localePrefix}/checkout/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}${localePrefix}/checkout?payment=cancelled`,
    };

    if (deliveryType === 'home') {
      payload.shippingAddress = {
        street: street.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: countryIso,
      };
    } else {
      payload.relayPoint = selectedRelay;
      payload.shippingAddress = {
        street: selectedRelay?.street || '',
        city: selectedRelay?.city || '',
        postalCode: selectedRelay?.postalCode || '',
        country: selectedRelay?.country || relayCountryIso || countryIso || '',
      };
    }

    return payload;
  };

  const createPaymentIntent = async () => {
    setIsPreparingPaymentIntent(true);
    setCheckoutError('');

    try {
      if (deliveryType === 'home') {
        if (homeQuotePrerequisiteMessage) {
          setHomeAddressOfferError(homeQuotePrerequisiteMessage);
          setCheckoutError(homeQuotePrerequisiteMessage);
          throw new Error(homeQuotePrerequisiteMessage);
        }
        const homeOffersRes = await fetchShippingWithFallback('home-offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toAddress: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              street: street.trim(),
              city: city.trim(),
              postalCode: postalCode.trim(),
              country: countryIso,
            },
            subtotal: Number(subtotal || 0),
          }),
        });

        const homeOffersPayload = await homeOffersRes.json().catch(() => ({}));
        const homeOffers = Array.isArray(homeOffersPayload?.offers) ? homeOffersPayload.offers : [];
        const isFallbackSource = String(homeOffersPayload?.source || '').trim() === 'fallback-rule-engine';

        if (!homeOffersRes.ok || homeOffers.length === 0 || isFallbackSource) {
          const messageRaw =
            homeOffersPayload?.message ||
            t('shipping.noHomeOffer') ||
            'Aucune offre de livraison domicile n’est disponible pour cette adresse. Veuillez vérifier votre adresse ou choisir un point relais.';
          const message = normalizeHomeOfferErrorMessage(messageRaw);
          setHomeAddressHasOffer(false);
          setHomeAddressOfferError(message);
          setCheckoutError(message);
          throw new Error(message);
        }
        setHomeAddressHasOffer(true);
        setHomeAddressOfferError('');
      }

      const payload = getCheckoutPayload();
      const response = await paymentAPI.createPaymentIntent(payload);

      if (!response?.success || !response?.data?.clientSecret) {
        throw new Error(response?.message || t('errors.sessionCreateFailed'));
      }

      return response.data.clientSecret;
    } finally {
      setIsPreparingPaymentIntent(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!canConfirm || paymentProcessing || isPreparingPaymentIntent) {
      return;
    }

    setCheckoutError('');

    if (!isPaymentFormComplete) {
      setPaymentError(t('errors.paymentFailed'));
      return;
    }

    const paymentForm = document.getElementById('checkout-payment-form');
    if (paymentForm && typeof paymentForm.requestSubmit === 'function') {
      paymentForm.requestSubmit();
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

  const hasRealHomeQuote = true;
  const showHomeOffersPanel = false;

  const canConfirmBase =
    deliveryType === 'home'
      ? isHomeValid
      : isRelayValid;
  const canConfirm =
    canConfirmBase &&
    cartItems.length > 0 &&
    !(
      deliveryType === 'home' &&
      (
        homeQuotePrerequisiteMessage ||
        homeOfferAvailabilityLoading ||
        !homeAddressHasOffer ||
        homeOfferVerifiedKey !== homeAddressVerificationKey
      )
    );
  const shouldShowHomeDeliveryPricing =
    deliveryType === 'home' &&
    isHomeAddressValid &&
    !homeQuotePrerequisiteMessage &&
    !homeOfferAvailabilityLoading &&
    homeAddressHasOffer &&
    homeOfferVerifiedKey === homeAddressVerificationKey &&
    !homeAddressOfferError;

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

  const getRelayPriceLabel = () => {
    const relayFreeThreshold = Number(effectiveShippingRules?.relay?.freeShipping ?? 40);
    const relayBelowPrice = Number(effectiveShippingRules?.relay?.StandarShippingFee ?? 4.9);
    const subtotalValue = Number(subtotal || 0);
    if (subtotalValue >= relayFreeThreshold) return 'Gratuit';
    return `${relayBelowPrice.toFixed(2)} EUR`;
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
    if (!isShippingReady) return 0;

    const subtotalValue = Number(subtotal || 0);
    if (deliveryType === 'relay') {
      const relayFreeThreshold = Number(effectiveShippingRules?.relay?.freeShipping ?? 40);
      const relayBelowPrice = Number(effectiveShippingRules?.relay?.StandarShippingFee ?? 4.9);
      return subtotalValue >= relayFreeThreshold ? 0 : relayBelowPrice;
    }

    const homeFreeThreshold = Number(effectiveShippingRules?.home?.freeShipping ?? 60);
    const homeReducedThreshold = Number(effectiveShippingRules?.home?.discountedShipping ?? 40);
    const homeLowPrice = Number(effectiveShippingRules?.home?.StandardShippingFee ?? 7.9);
    const homeMidPrice = Number(effectiveShippingRules?.home?.discountedShippingFee ?? 4.9);
    const base =
      subtotalValue >= homeFreeThreshold
        ? 0
        : subtotalValue >= homeReducedThreshold
          ? homeMidPrice
          : homeLowPrice;
    if (expressDelivery && expressAvailable) {
      return Number(effectiveShippingRules?.home?.express ?? 9.9);
    }
    return base;
  }, [deliveryType, expressDelivery, isShippingReady, effectiveShippingRules, subtotal, expressAvailable]);

  const displayedTotal = useMemo(() => {
    return Number(subtotal || 0) + Number(displayedShipping || 0);
  }, [subtotal, displayedShipping]);

  const finalTotal = Math.max(0, Number(displayedTotal || 0) - Number(promoDiscount || 0));
  const showHomeReducedShippingInfo =
    Number(effectiveShippingRules?.home?.discountedShipping ?? 40) > 0 &&
    Number(effectiveShippingRules?.home?.discountedShippingFee ?? 4.9) > 0;

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
    // Front office no longer selects Boxtal offers; admin picks offer in back office.
    setHomeShippingOffers([]);
    setSelectedHomeShippingOfferCode('');
    setHomeShippingLoading(false);
    setHomeShippingError('');
    return undefined;
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
    countryIso,
  ]);

  useEffect(() => {
    if (deliveryType !== 'home') {
      setHomeAddressHasOffer(false);
      setHomeAddressOfferError('');
      setHomeOfferAvailabilityLoading(false);
      setHomeOfferVerifiedKey('');
      return;
    }

    if (!isHomeAddressValid) {
      setHomeAddressHasOffer(false);
      setHomeAddressOfferError('');
      setHomeOfferAvailabilityLoading(false);
      setHomeOfferVerifiedKey('');
      return;
    }

    const readyForHomeQuoteFetch =
      Boolean(firstName.trim()) &&
      Boolean(lastName.trim()) &&
      Boolean(email.trim()) &&
      Boolean(phone.trim()) &&
      isPhoneValid;

    if (!readyForHomeQuoteFetch) {
      setHomeAddressHasOffer(false);
      setHomeAddressOfferError('');
      setHomeOfferAvailabilityLoading(false);
      setHomeOfferVerifiedKey('');
      return;
    }

    let cancelled = false;
    // Strict mode: any address change invalidates previous verification immediately.
    setHomeAddressHasOffer(false);
    setHomeAddressOfferError('');
    setHomeOfferVerifiedKey('');
    setHomeOfferAvailabilityLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchShippingWithFallback('home-offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toAddress: {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              street: street.trim(),
              city: city.trim(),
              postalCode: postalCode.trim(),
              country: countryIso,
            },
            subtotal: Number(subtotal || 0),
          }),
        });
        const payload = await res.json().catch(() => ({}));
        const offers = Array.isArray(payload?.offers) ? payload.offers : [];
        const isFallbackSource = String(payload?.source || '').trim() === 'fallback-rule-engine';
        if (cancelled) return;
        if (!res.ok || offers.length === 0 || isFallbackSource) {
          setHomeAddressHasOffer(false);
          setHomeAddressOfferError(
            normalizeHomeOfferErrorMessage(
              payload?.message || t('shipping.errors.noHomeOfferForAddress')
            )
          );
          setHomeOfferVerifiedKey(homeAddressVerificationKey);
        } else {
          setHomeAddressHasOffer(true);
          setHomeAddressOfferError('');
          setHomeOfferVerifiedKey(homeAddressVerificationKey);
        }
      } catch (_) {
        if (cancelled) return;
        setHomeAddressHasOffer(false);
        setHomeAddressOfferError(t('shipping.errors.homeOfferCheckFailed'));
        setHomeOfferVerifiedKey(homeAddressVerificationKey);
      } finally {
        if (!cancelled) setHomeOfferAvailabilityLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    deliveryType,
    isHomeAddressValid,
    firstName,
    lastName,
    email,
    phone,
    isPhoneValid,
    street,
    city,
    postalCode,
    countryIso,
    subtotal,
    homeAddressVerificationKey,
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

  useEffect(() => {
    if (cartItems.length === 0) {
      setIsPaymentFormComplete(false);
      setCheckoutError('');
      setPaymentError('');
    }
  }, [cartItems.length]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderAndBreadcrumbs />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#556822]" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <CheckoutProvider>
      <div className="min-h-screen bg-gray-50 font-[Maison_Neue]">
      <HeaderAndBreadcrumbs />

      <main className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Left Column: Forms */}
          <div className="grow space-y-4 sm:space-y-6">
            {/* Contact Information */}
            <section className="bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg sm:text-xl font-black text-[#556822] mb-4 sm:mb-6 font-[agrandir]">{t('contact.title')}</h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                    {t('contact.emailLabel')} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('contact.emailPlaceholder')}
                    required
                    className="w-full p-3 sm:p-4 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-[#556822] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                    {(t('contact.phoneLabel') || 'Telephone')} <span aria-hidden="true">*</span>
                  </label>
                  <div className="phone-input">
                    <div className="phone-country-picker" ref={phoneCountryMenuRef}>
                      <button
                        type="button"
                        className="phone-country-trigger"
                        onClick={() => setIsPhoneCountryMenuOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={isPhoneCountryMenuOpen}
                        aria-label={selectedPhoneCountryName}
                      >
                        <span className="phone-country-selected-flag" aria-hidden="true">
                          {SelectedPhoneCountryFlag ? (
                            <SelectedPhoneCountryFlag title={selectedPhoneCountryName} />
                          ) : (
                            toFlagEmoji(phoneCountry)
                          )}
                        </span>
                        <span className="phone-country-arrow">▾</span>
                      </button>
                      {isPhoneCountryMenuOpen ? (
                        <div className="phone-country-menu" role="listbox">
                          {phoneCountryOptions.map((option) => (
                            <button
                              key={option.code}
                              type="button"
                              className={`phone-country-option ${
                                option.code === phoneCountry ? 'is-active' : ''
                              }`}
                              onClick={() => handlePhoneCountrySelect(option.code)}
                            >
                              <span className="phone-country-flag">
                                {(() => {
                                  const Flag = flags?.[option.code];
                                  return Flag ? <Flag title={option.name} /> : toFlagEmoji(option.code);
                                })()}
                              </span>
                              <span className="phone-country-name">{option.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <PhoneInput
                      country={phoneCountry}
                      international
                      withCountryCallingCode
                      countryCallingCodeEditable={false}
                      limitMaxLength={true}
                      value={phone}
                      onChange={handlePhoneChange}
                      onKeyDown={handlePhoneKeyDown}
                    
                      required
                      countrySelectComponent={() => null}
                      className="phone-input-field"
                    />
                  </div>
                  {phone && !isPhoneValid ? (
                    <p className="mt-2 text-sm text-red-600">
                      {t('contact.phoneInvalid') || 'Numero de telephone invalide'}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Shipping Information */}
            <section className="bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg sm:text-xl font-black text-[#556822] mb-4 sm:mb-6 font-[agrandir]">{t('shipping.title')}</h2>

              {/* Delivery type toggles */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                  {t('shipping.deliveryType') || 'Livraison'}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryType('home');
                      setSelectedRelay(null);
                      setRelayPoints([]);
                      setRelayError('');
                      setGeoError('');
                    }}
                    className={`p-3 sm:p-4 rounded-lg border text-left transition-all flex items-center justify-between ${
                      deliveryType === 'home'
                        ? 'border-[#556822] bg-[#556822]/5'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Home size={16} className="text-[#556822] sm:h-4.5 sm:w-4.5" />
                      <div>
                        <div className="text-sm sm:text-base font-bold">{t('shipping.home') || "Expédier à l’adresse"}</div>
                        <div className="text-[11px] sm:text-xs text-gray-500">{t('shipping.homeHint') || 'À votre domicile'}</div>
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
                      setExpressDelivery(false);
                      setRelayError('');
                      setGeoError('');
                    }}
                    className={`p-3 sm:p-4 rounded-lg border text-left transition-all flex items-center justify-between ${
                      deliveryType === 'relay'
                        ? 'border-[#556822] bg-[#556822]/5'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <MapPin size={16} className="text-[#556822] sm:h-4.5 sm:w-4.5" />
                      <div>
                        <div className="text-sm sm:text-base font-bold">{t('shipping.relay') || "Expédier au point relais"}</div>
                        <div className="text-[11px] sm:text-xs text-gray-500">{t('shipping.relayHint') || 'Choisir un relais proche'}</div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Name fields */}
                <div className="md:col-span-1">
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                    {t('shipping.firstName')}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t('shipping.firstNamePlaceholder')}
                    className="w-full p-3 sm:p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                    {t('shipping.lastName')}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t('shipping.lastNamePlaceholder')}
                    className="w-full p-3 sm:p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                  />
                </div>

                {/* Home address */}
                {deliveryType === 'home' && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                        {t('shipping.country')}
                      </label>
                      <div ref={countryMenuRef} className="relative">
                        <input
                          type="text"
                          autoComplete="off"
                          aria-autocomplete="list"
                          aria-expanded={isCountryDropdownOpen}
                          value={countrySearchQuery}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCountrySearchQuery(v);
                            if (!String(v).trim()) setCountryIso('');
                            setIsCountryDropdownOpen(true);
                          }}
                          onFocus={() => setIsCountryDropdownOpen(true)}
                          placeholder={t('shipping.searchCountry')}
                          className="w-full p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-[#556822] focus:ring-1 focus:ring-[#556822]"
                        />
                        {isCountryDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
                            {filteredCountryOptions.length > 0 ? (
                              filteredCountryOptions.map((opt) => (
                                <button
                                  key={opt.iso}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => {
                                    setCountryIso(opt.iso);
                                    setCountrySearchQuery(opt.label);
                                    setIsCountryDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                    countryIso === opt.iso
                                      ? 'bg-[#556822]/10 text-gray-900 font-semibold'
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                {t('shipping.noCountriesFound') || 'No countries found'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                        {t('shipping.street')}
                      </label>
                    
                      <div className="relative">
                        <input
                          type="text"
                          value={street}
                          autoComplete="street-address"
                          aria-autocomplete="list"
                          aria-expanded={homeAddrMenuOpen && (homeAddressAutocomplete.suggestions.length > 0 || homeAddressAutocomplete.loading)}
                          onChange={(e) => {
                            const v = e.target.value;
                            setStreet(v);
                            homeAddressAutocomplete.scheduleSearch(v);
                            setHomeAddrMenuOpen(true);
                          }}
                          onFocus={() => setHomeAddrMenuOpen(true)}
                          onBlur={() => {
                            setTimeout(() => setHomeAddrMenuOpen(false), 200);
                          }}
                          placeholder={t('shipping.streetPlaceholder')}
                          className="w-full p-3 sm:p-4 pr-11 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                        />
                        {homeAddressAutocomplete.loading ? (
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Loader2 size={18} className="animate-spin" aria-hidden />
                          </span>
                        ) : null}
                        {homeAddrMenuOpen &&
                        street.trim().length >= 3 &&
                        (homeAddressAutocomplete.suggestions.length > 0 || homeAddressAutocomplete.loading) ? (
                          <ul
                            className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                            role="listbox"
                          >
                            {homeAddressAutocomplete.suggestions.map((s, idx) => {
                              const { lineStreet, locality, countryLabel } = formatAddressSuggestionLine(s);
                              const rest = [locality, countryLabel].filter(Boolean).join(', ');
                              return (
                                <li key={`${s.lat}-${s.lon}-${idx}`} role="option">
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-[#556822]/10"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => applyHomeAddressSuggestion(s)}
                                  >
                                    {lineStreet ? (
                                      <span className="line-clamp-2">
                                        <span className="font-bold text-gray-900">{lineStreet}</span>
                                        {rest ? <span className="font-normal text-gray-500">, {rest}</span> : null}
                                      </span>
                                    ) : (
                                      <span className="line-clamp-2 text-gray-800">
                                        {s.shortLabel || s.displayName}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </div>
                      {homeAddressAutocomplete.error ? (
                        <p className="mt-1.5 text-xs font-medium text-amber-800" role="alert">
                          {homeAddressAutocomplete.error}
                        </p>
                      ) : null}
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                        {t('shipping.city')}
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('shipping.cityPlaceholder')}
                        className="w-full p-3 sm:p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 sm:mb-2">
                        {t('shipping.postalCode')}
                      </label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder={t('shipping.postalCodePlaceholder')}
                        className="w-full p-3 sm:p-4 bg-gray-50 border border-transparent rounded-lg focus:border-[#556822] outline-none"
                      />
                    </div>

                    {showHomeOffersPanel && (
                      <div className="md:col-span-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm">
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
                                    <div key={i} className="w-full p-3 sm:p-4 border-b border-gray-200">
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
                                      className={`w-full text-left p-3 sm:p-4 border-b border-gray-200 transition-colors ${
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
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
                        <div className="text-sm font-black text-[#556822]">
                          {t('shipping.relayTitle') || 'Point relais'}
                        </div>

                        <button
                          type="button"
                          onClick={handleUseMyLocation}
                          disabled={geoLoading}
                          className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
                        >
                          {geoLoading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                          {t('shipping.useMyLocation') || 'Utiliser mon emplacement'}
                        </button>
                      </div>

                      {geoError && <div className="mt-3 text-sm text-red-600">{geoError}</div>}

                      <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
                        <div className="md:col-span-1">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            {t('shipping.country') || 'Pays / région'}
                          </label>
                          <div ref={relayCountryMenuRef} className="relative">
                            <input
                              type="text"
                              autoComplete="off"
                              aria-autocomplete="list"
                              aria-expanded={isRelayCountryDropdownOpen}
                              value={relayCountrySearchQuery}
                              onChange={(e) => {
                                const v = e.target.value;
                                setRelayCountrySearchQuery(v);
                                if (!String(v).trim()) setRelayCountryIso('');
                                setIsRelayCountryDropdownOpen(true);
                              }}
                              onFocus={() => setIsRelayCountryDropdownOpen(true)}
                              placeholder={t('shipping.searchCountry')}
                              className="w-full p-3 sm:p-4 bg-white border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-[#556822] focus:ring-1 focus:ring-[#556822]"
                            />
                            {isRelayCountryDropdownOpen && (
                              <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-50">
                                {filteredRelayCountryOptions.length > 0 ? (
                                  filteredRelayCountryOptions.map((opt) => (
                                    <button
                                      key={opt.iso}
                                      type="button"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => {
                                        setRelayCountryIso(opt.iso);
                                        setRelayCountrySearchQuery(opt.label);
                                        setIsRelayCountryDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                        relayCountryIso === opt.iso
                                          ? 'bg-[#556822]/10 text-gray-900 font-semibold'
                                          : 'text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                    {t('shipping.noCountriesFound') || 'No countries found'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                            {t('shipping.relayAddress') || 'Adresse / Code postal'}
                          </label>
                        

                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={relayAddressQuery}
                                autoComplete="off"
                                aria-autocomplete="list"
                                aria-expanded={
                                  relayAddrMenuOpen &&
                                  (relayAddressAutocomplete.suggestions.length > 0 || relayAddressAutocomplete.loading)
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setRelayAddressQuery(v);
                                  relayAddressAutocomplete.scheduleSearch(v);
                                  setRelayAddrMenuOpen(true);
                                }}
                                onFocus={() => setRelayAddrMenuOpen(true)}
                                onBlur={() => {
                                  setTimeout(() => setRelayAddrMenuOpen(false), 200);
                                }}
                                placeholder={t('shipping.relayPlaceholder') || 'ex: 75001 Paris'}
                                className="w-full p-3 sm:p-4 pr-11 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#556822]"
                              />
                              {relayAddressAutocomplete.loading ? (
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                  <Loader2 size={18} className="animate-spin" aria-hidden />
                                </span>
                              ) : null}
                              {relayAddrMenuOpen &&
                              relayAddressQuery.trim().length >= 3 &&
                              (relayAddressAutocomplete.suggestions.length > 0 || relayAddressAutocomplete.loading) ? (
                                <ul
                                  className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                                  role="listbox"
                                >
                                  {relayAddressAutocomplete.suggestions.map((s, idx) => {
                                    const { lineStreet, locality, countryLabel } = formatAddressSuggestionLine(s);
                                    const rest = [locality, countryLabel].filter(Boolean).join(', ');
                                    return (
                                      <li key={`relay-${s.lat}-${s.lon}-${idx}`} role="option">
                                        <button
                                          type="button"
                                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-[#556822]/10"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => applyRelayAddressSuggestion(s)}
                                        >
                                          {lineStreet ? (
                                            <span className="line-clamp-2">
                                              <span className="font-bold text-gray-900">{lineStreet}</span>
                                              {rest ? (
                                                <span className="font-normal text-gray-500">, {rest}</span>
                                              ) : null}
                                            </span>
                                          ) : (
                                            <span className="line-clamp-2 text-gray-800">
                                              {s.shortLabel || s.displayName}
                                            </span>
                                          )}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={handleSearchRelay}
                              disabled={relayLoading || !relayAddressQuery.trim()}
                              className="w-full sm:w-auto sm:min-w-33 px-4 py-3 sm:py-2 rounded-lg bg-[#556822] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2 shrink-0"
                            >
                              {relayLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                              {t('shipping.search') || 'Rechercher'}
                            </button>
                          </div>
                          {relayAddressAutocomplete.error ? (
                            <p className="mt-1.5 text-xs font-medium text-amber-800" role="alert">
                              {relayAddressAutocomplete.error}
                            </p>
                          ) : null}
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
                                        {[
                                          p.street,
                                          [p.postalCode, p.city].filter(Boolean).join(' ').trim(),
                                        ]
                                          .filter(Boolean)
                                          .join(', ')}
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

              {deliveryType === 'home' && (
                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                  {displayHomeQuoteError ? (
                    <p className="text-sm text-red-600" role="alert">
                      {displayHomeQuoteError}
                    </p>
                  ) : null}
                  {shouldShowHomeDeliveryPricing && expressAvailable && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-100 bg-slate-50/80 p-3 sm:p-4">
                      <input
                        type="checkbox"
                        checked={expressDelivery}
                        onChange={(e) => setExpressDelivery(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#556822] focus:ring-[#556822]"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{t('shipping.expressCheckboxLabel')}</p>
                        <p className="text-xs text-slate-500 mt-1">{t('shipping.expressCheckboxHint')}</p>
                      </div>
                    </label>
                  )}

                  {shouldShowHomeDeliveryPricing && (
                    <div className="rounded-lg border border-[#556822]/20 bg-[#556822]/5 p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#556822]">
                            {t('shipping.appliedFeesTitle')}
                          </p>
                          <p className="text-sm text-slate-700 mt-1">
                            {expressDelivery && expressAvailable
                              ? t('shipping.methodExpress')
                              : t('shipping.homeDeliveryStandard')}
                          </p>
                        </div>
                        <p className="text-lg font-black text-[#556822]">
                          {Number(displayedShipping || 0).toFixed(2)} EUR
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Payment Section */}
            <section className="bg-white p-4 sm:p-8 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg sm:text-xl font-black text-[#556822] mb-4 sm:mb-6 font-[agrandir]">{t('payment.title')}</h2>
              <div className="border border-gray-200 rounded-xl p-3 sm:p-6 bg-white">
                <PaymentForm
                  locale={locale}
                  t={t}
                  paymentProcessing={paymentProcessing}
                  setPaymentProcessing={setPaymentProcessing}
                  paymentError={paymentError}
                  setPaymentError={setPaymentError}
                  createPaymentIntent={createPaymentIntent}
                  customerEmail={email.trim().toLowerCase()}
                  customerPhone={phone.trim()}
                  onPaymentFormCompleteChange={setIsPaymentFormComplete}
                />
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
                              {lineSubtotalFromCartItem({ ...item, isFreeItem: false }).toFixed(2)} €
                            </p>
                            <p className="text-sm font-black text-[#E10C69]">0 €</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-gray-400">x {item.quantity}</p>
                            <p className="text-sm font-black text-[#E10C69]">
                              {lineSubtotalFromCartItem(item).toFixed(2)} €
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
                  <span className="text-gray-900">{Number(isShippingReady ? displayedShipping : 0).toFixed(2)} €</span>
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
                type="button"
                onClick={handleConfirmOrder}
                disabled={
                  !canConfirm ||
                  paymentProcessing ||
                  isPreparingPaymentIntent ||
                  !isPaymentFormComplete
                }
                className="w-full mt-8 py-4 rounded-md text-white font-black text-lg shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-transform active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: brandGreen }}
              >
                {paymentProcessing
                  ? t('actions.paymentProcessing')
                  : isPreparingPaymentIntent
                  ? (t('actions.redirecting') || 'Preparing payment')
                  : t('actions.confirmOrder')}
              </button>

              {checkoutError ? (
                <p className="text-sm text-red-600 mt-3">{checkoutError}</p>
              ) : null}

              <div className="mt-4 rounded-xl border border-[#556822]/15 bg-white p-4 text-left shadow-sm">
                <p className="text-xs font-black uppercase tracking-wider text-[#556822]">{t('shipping.infoCardTitle')}</p>
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {t('shipping.infoLabels.pickupPoint')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#556822]">
                      {t('shipping.infoRelaySimple', {
                        threshold: Number(effectiveShippingRules?.relay?.freeShipping ?? 40).toFixed(0),
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {t('shipping.infoLabels.homeDelivery')}
                    </p>
                    {showHomeReducedShippingInfo ? (
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {t('shipping.infoHomeReducedSimple', {
                          reducedPrice: Number(effectiveShippingRules?.home?.discountedShippingFee ?? 4.9).toFixed(2),
                          reducedThreshold: Number(effectiveShippingRules?.home?.discountedShipping ?? 40).toFixed(0),
                        })}
                      </p>
                    ) : null}
                    <p className="text-sm font-semibold text-[#556822]">
                      {t('shipping.infoHomeFreeSimple', {
                        freeThreshold: Number(effectiveShippingRules?.home?.freeShipping ?? 60).toFixed(0),
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-widest font-bold">
                {t('securityNote')}
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
      <style jsx global>{`
        .phone-input {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: #f9fafb;
          border: 1px solid transparent;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          position: relative;
        }

        .phone-input:focus-within {
          background: #ffffff;
          border-color: #556822;
        }

        .phone-country-picker {
          position: relative;
          flex-shrink: 0;
        }

        .phone-country-trigger {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          border: 0;
          background: transparent;
          color: #111827;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .phone-country-selected-flag {
          width: 1rem;
          height: 0.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 2px;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12);
          line-height: 1;
          font-size: 0.8rem;
        }

        .phone-country-selected-flag svg,
        .phone-country-selected-flag img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .phone-country-arrow {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .phone-country-menu {
          position: absolute;
          z-index: 40;
          left: 0;
          top: calc(100% + 0.4rem);
          width: 17rem;
          max-height: 16rem;
          overflow: auto;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
        }

        .phone-country-option {
          width: 100%;
          border: 0;
          background: #fff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-align: left;
          padding: 0.45rem 0.6rem;
          cursor: pointer;
          font-size: 0.88rem;
        }

        .phone-country-option:hover,
        .phone-country-option.is-active {
          background: #f3f4f6;
        }

        .phone-country-flag {
          width: 1rem;
          height: 0.75rem;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 2px;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.12);
          font-size: 0.8rem;
          line-height: 1;
        }

        .phone-country-flag svg,
        .phone-country-flag img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .phone-country-name {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .phone-input-field {
          flex: 1;
          min-width: 0;
        }

        .phone-input-field .PhoneInputCountry {
          display: none;
        }

        .phone-input-field .PhoneInputInput {
          flex: 1;
          min-width: 0;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 0.95rem;
          line-height: 1.25rem;
        }
      `}</style>
      </div>
    </CheckoutProvider>
  );
};

export default CheckoutPage;

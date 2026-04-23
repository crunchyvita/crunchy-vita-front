'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI, shippingBoxAPI } from '@/lib/api';
import { classifyHomeOfferMode, getCarrierLogo } from '@/lib/shippingOfferUi';
import { ArrowLeft, Loader2, MapPin, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const OFFERS_PAGE_SIZE = 9;
const RELAY_PAGE_SIZE = 12;

function relayRowKey(point) {
  const id = String(point?.id || point?._id || '').trim();
  const carrier = String(point?.carrier || '').trim().toUpperCase();
  return `${id}::${carrier}`;
}

function money(value, currency = 'EUR', localeTag = 'en-US') {
  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency: String(currency || 'EUR').toUpperCase(),
    }).format(Number(value) || 0);
  } catch {
    return `${Number(value || 0).toFixed(2)} EUR`;
  }
}

function OffersGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-100 rounded w-1/4 mb-3" />
          <div className="h-7 bg-slate-100 rounded w-24 mb-3" />
          <div className="h-4 bg-slate-100 rounded w-full mb-2" />
          <div className="h-8 bg-slate-200 rounded w-28" />
        </div>
      ))}
    </div>
  );
}

function RelayListSkeleton() {
  return (
    <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden animate-pulse" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 flex gap-4 bg-white">
          <div className="h-4 w-4 rounded-full bg-slate-200 mt-1 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InnerPage() {
  const ts = useTranslations('admin.orderShipping');
  const locale = useLocale();
  const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-US';
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [offers, setOffers] = useState([]);
  const [relayPoints, setRelayPoints] = useState([]);
  const [deliveryType, setDeliveryType] = useState('home');
  const [selectedOfferCode, setSelectedOfferCode] = useState('');
  const [selectedRelayKey, setSelectedRelayKey] = useState('');
  const [orderLoading, setOrderLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedCodeMissing, setSavedCodeMissing] = useState(false);

  const [offerFilter, setOfferFilter] = useState('all');
  const [offersPage, setOffersPage] = useState(1);
  const [relayPage, setRelayPage] = useState(1);
  const [shippingOfferLocked, setShippingOfferLocked] = useState(false);
  const [parcelSnapshot, setParcelSnapshot] = useState(null);
  const [shippingBoxes, setShippingBoxes] = useState([]);
  const [selectedShippingBoxId, setSelectedShippingBoxId] = useState('');
  const [boxesLoading, setBoxesLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setOrderLoading(true);
        setOffersLoading(true);
        setBoxesLoading(true);
        setError('');
        setSavedCodeMissing(false);

        const boxesRes = await shippingBoxAPI.list({ limit: 100 });
        if (!boxesRes?.success) throw new Error(boxesRes?.message || 'Unable to load shipping boxes');
        setShippingBoxes(Array.isArray(boxesRes.data) ? boxesRes.data : []);

        const orderRes = await orderAPI.getAdminById(id);
        if (!orderRes?.success) throw new Error(orderRes?.message || 'Unable to load order');
        const o = orderRes.data || {};
        const dTypeEarly = String(o?.deliveryType || 'home');
        setOrder(o);
        setDeliveryType(dTypeEarly);
        setOrderLoading(false);

        const offersRes = await orderAPI.getAdminShippingOffers(id);
        if (!offersRes?.success) throw new Error(offersRes?.message || 'Unable to load shipping options');

        const nextOffers = offersRes?.data?.offers || [];
        const nextPoints = offersRes?.data?.relayPoints || [];
        const dType = String(offersRes?.data?.deliveryType || o?.deliveryType || 'home');
        setParcelSnapshot(offersRes?.data?.parcelSnapshot || null);
        setSelectedShippingBoxId(String(offersRes?.data?.selectedShippingBox?.id || ''));

        const savedCode =
          o?.boxtal?.shippingOfferCode ||
          o?.clientShippingOfferCode ||
          '';
        setShippingOfferLocked(
          Boolean(o?.shippingOfferLocked || offersRes?.data?.shippingOfferLocked)
        );
        const clientWantsExpress = o?.expressDelivery === true;

        setOffers(nextOffers);
        setRelayPoints(nextPoints);
        setDeliveryType(dType);
        setOfferFilter(clientWantsExpress && dType === 'home' ? 'express' : 'all');
        setOffersPage(1);
        setRelayPage(1);

        if (dType === 'relay') {
          setSelectedOfferCode('');
          const rp = o?.relayPoint || null;
          const rCarrier = String(rp?.carrier || '').trim();
          const rid = String(rp?.id || rp?._id || rp?.parcelPointId || '').trim();
          const exact =
            rid &&
            nextPoints.find(
              (p) =>
                String(p.id || p._id) === rid &&
                String(p.carrier || '').trim().toUpperCase() === rCarrier.toUpperCase()
            );
          const pick = exact || nextPoints[0];
          setSelectedRelayKey(pick ? relayRowKey(pick) : '');
        } else {
          setSelectedRelayKey('');
          const codeInList =
            savedCode && nextOffers.some((x) => String(x.shippingOfferCode) === String(savedCode));
          if (savedCode && !codeInList) {
            setSavedCodeMissing(true);
            setSelectedOfferCode(nextOffers[0]?.shippingOfferCode || '');
          } else if (codeInList) {
            setSelectedOfferCode(String(savedCode));
          } else {
            setSelectedOfferCode(nextOffers[0]?.shippingOfferCode || '');
          }
        }
      } catch (e) {
        setError(e.message || 'Unable to load shipping options');
        setOrderLoading(false);
      } finally {
        setOffersLoading(false);
        setBoxesLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id || !selectedShippingBoxId) return;
    let cancelled = false;
    (async () => {
      try {
        setOffersLoading(true);
        const offersRes = await orderAPI.getAdminShippingOffers(id, { shippingBoxId: selectedShippingBoxId });
        if (!offersRes?.success) throw new Error(offersRes?.message || 'Unable to load shipping options');
        if (cancelled) return;
        const nextOffers = offersRes?.data?.offers || [];
        const nextPoints = offersRes?.data?.relayPoints || [];
        setParcelSnapshot(offersRes?.data?.parcelSnapshot || null);
        setOffers(nextOffers);
        setRelayPoints(nextPoints);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Unable to load shipping options');
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, selectedShippingBoxId]);

  const filteredOffers = useMemo(() => {
    const sorted = [...offers].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (offerFilter === 'cheapest') return sorted.slice(0, 1);
    if (offerFilter === 'express') {
      return sorted.filter((offer) => classifyHomeOfferMode(offer) === 'express');
    }
    if (offerFilter === 'normal') {
      return sorted.filter((offer) => classifyHomeOfferMode(offer) === 'normal');
    }
    return sorted;
  }, [offers, offerFilter]);

  useEffect(() => {
    setOffersPage(1);
  }, [offerFilter, offers.length]);

  useEffect(() => {
    if (deliveryType !== 'home') return;
    if (filteredOffers.length === 0) return;
    setSelectedOfferCode((prev) => {
      const still = filteredOffers.some((o) => String(o.shippingOfferCode) === String(prev));
      if (still) return prev;
      return filteredOffers[0].shippingOfferCode;
    });
  }, [deliveryType, filteredOffers]);

  const totalOfferPages = Math.max(1, Math.ceil(filteredOffers.length / OFFERS_PAGE_SIZE));
  const safeOfferPage = Math.min(offersPage, totalOfferPages);
  const offerStart = (safeOfferPage - 1) * OFFERS_PAGE_SIZE;
  const visibleOffers = filteredOffers.slice(offerStart, offerStart + OFFERS_PAGE_SIZE);

  const totalRelayPages = Math.max(1, Math.ceil(relayPoints.length / RELAY_PAGE_SIZE));
  const safeRelayPage = Math.min(relayPage, totalRelayPages);
  const relayStart = (safeRelayPage - 1) * RELAY_PAGE_SIZE;
  const visibleRelayPoints = relayPoints.slice(relayStart, relayStart + RELAY_PAGE_SIZE);

  const selectedOffer = useMemo(
    () => offers.find((offer) => String(offer.shippingOfferCode) === String(selectedOfferCode)) || null,
    [offers, selectedOfferCode]
  );
  const selectedRelayPoint = useMemo(
    () => relayPoints.find((p) => relayRowKey(p) === selectedRelayKey) || null,
    [relayPoints, selectedRelayKey]
  );

  const persistOfferSelection = async () => {
    if (!selectedShippingBoxId) throw new Error('Select a shipping box first');
    if (deliveryType === 'relay') {
      if (!selectedRelayPoint) throw new Error('Select a relay point');
      const relayOfferCode = String(selectedRelayPoint.shippingOfferCode || '').trim();
      if (!relayOfferCode) throw new Error('No shipping offer available for this relay point');
      const { raw: _raw, ...relayRest } = selectedRelayPoint;
      await orderAPI.selectAdminShippingOffer(id, {
        shippingOfferCode: relayOfferCode,
        shippingOfferId: selectedRelayPoint.shippingOfferId || null,
        shippingServiceCode: selectedRelayPoint.serviceCode || null,
        shippingOperatorCode: selectedRelayPoint.operatorCode || null,
        carrier: selectedRelayPoint.carrier || null,
        relayPoint: relayRest,
        shippingBoxId: selectedShippingBoxId,
      });
      return;
    }

    if (!selectedOfferCode || !selectedOffer) throw new Error('Select a shipping offer');
    await orderAPI.selectAdminShippingOffer(id, {
      shippingOfferCode: selectedOffer.shippingOfferCode,
      shippingOfferId: selectedOffer.shippingOfferId || null,
      shippingServiceCode: selectedOffer.serviceCode || null,
      shippingOperatorCode: selectedOffer.operatorCode || null,
      carrier: selectedOffer.carrier || null,
      relayPoint: null,
      shippingBoxId: selectedShippingBoxId,
    });
  };

  const validateCommande = async () => {
    if (!id || shippingOfferLocked) return;
    try {
      setSaving(true);
      setError('');
      await persistOfferSelection();
      await orderAPI.validateAdminShippingOffer(id);
      setShippingOfferLocked(true);
      router.push(`/admin/orders/${id}`);
    } catch (e) {
      setError(e.message || ts('validateError'));
    } finally {
      setSaving(false);
    }
  };

  const filterTabs = useMemo(
    () => [
      { key: 'all', label: ts('filterAll') },
      { key: 'cheapest', label: ts('filterCheapest') },
      { key: 'express', label: ts('filterExpress') },
      { key: 'normal', label: ts('filterStandard') },
    ],
    [ts]
  );

  const canSaveHome = Boolean(selectedOfferCode && selectedOffer);
  const canSaveRelay = Boolean(selectedRelayPoint?.shippingOfferCode);
  const canSave = Boolean(selectedShippingBoxId) && (deliveryType === 'relay' ? canSaveRelay : canSaveHome);
  const interactive = !shippingOfferLocked;

  return (
    <>
      <AdminHeader />
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <Link
          href={`/admin/orders/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#556822]"
        >
          <ArrowLeft className="h-4 w-4" />
          {ts('backToOrder')}
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {deliveryType === 'relay' ? ts('titleRelay') : ts('titleHome')}
          </h1>
          <p className="text-sm text-slate-500">
            {ts('subtitleOrder', {
              label: order?.invoiceNumber ? ts('invoiceShort', { invoice: order.invoiceNumber }) : ts('orderWord'),
              delivery: deliveryType === 'relay' ? ts('relayPoint') : ts('homeDelivery'),
            })}
          </p>
          {parcelSnapshot && !orderLoading ? (
            <div className="mt-4 rounded-xl border border-[#556822]/20 bg-[#556822]/5 px-4 py-3 text-sm text-slate-800">
              <p className="font-bold text-[#556822] text-xs uppercase tracking-wide">{ts('parcelForQuote')}</p>
              <p className="text-xs text-slate-600 mt-1">{ts('parcelForQuoteHint')}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-xs tabular-nums">
                <li>
                  <span className="text-slate-500">{ts('parcelColis')}:</span>{' '}
                  <span className="font-semibold">{parcelSnapshot.colisCount ?? 1}</span>
                </li>
                <li>
                  <span className="text-slate-500">{ts('parcelWeight')}:</span>{' '}
                  <span className="font-semibold">
                    {Number(parcelSnapshot.weightKg ?? 0).toFixed(3)} kg
                  </span>
                </li>
                <li className="sm:col-span-2">
                  <span className="text-slate-500">{ts('parcelDims')}:</span>{' '}
                  <span className="font-semibold">
                    {Number(parcelSnapshot.lengthCm ?? 0).toFixed(0)} ×{' '}
                    {Number(parcelSnapshot.widthCm ?? 0).toFixed(0)} ×{' '}
                    {Number(parcelSnapshot.heightCm ?? 0).toFixed(0)} cm
                  </span>
                </li>
                <li>
                  <span className="text-slate-500">{ts('parcelItems')}:</span>{' '}
                  <span className="font-semibold">{parcelSnapshot.itemCount ?? '—'}</span>
                </li>
                <li>
                  <span className="text-slate-500">{ts('parcelValue')}:</span>{' '}
                  <span className="font-semibold">
                    {money(parcelSnapshot.declaredValue, parcelSnapshot.currency || 'EUR', numberLocale)}
                  </span>
                </li>
              </ul>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{ts('shippingBoxTitle')}</h2>
            <p className="text-xs text-slate-500">{ts('shippingBoxHint')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {boxesLoading ? (
              <div className="text-sm text-slate-500">{ts('loadingBoxes')}</div>
            ) : shippingBoxes.length === 0 ? (
              <div className="text-sm text-slate-500">{ts('noBoxes')}</div>
            ) : (
              shippingBoxes.map((box) => {
                const active = String(box._id) === String(selectedShippingBoxId);
                return (
                  <button
                    key={box._id}
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && setSelectedShippingBoxId(String(box._id))}
                    className={`rounded-xl border p-4 text-left transition ${
                      active ? 'border-[#556822] bg-[#556822]/5 ring-2 ring-[#556822]/30' : 'border-slate-200 bg-white hover:bg-slate-50'
                    } ${!interactive ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {active ? (
                      <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#556822] text-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    ) : null}
                    <p className="font-bold text-slate-900 uppercase">{box.code}</p>
                    <p className="text-sm text-slate-600">{box.label}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {Number(box.internalWidth).toFixed(0)} × {Number(box.internalHeight).toFixed(0)} × {Number(box.internalDepth).toFixed(0)} cm
                    </p>
                    <p className="text-xs text-slate-500">{Number(box.emptyWeight).toFixed(3)} kg</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {orderLoading && (
          <div className="text-sm text-slate-500 inline-flex items-center gap-2 py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            {ts('loadingOrder')}
          </div>
        )}
        {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!orderLoading && shippingOfferLocked && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {ts('lockedBanner')}
          </div>
        )}
        {!orderLoading && deliveryType === 'home' && savedCodeMissing && (
          <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {ts('savedMissingBanner')}
          </div>
        )}

        {!orderLoading && deliveryType === 'home' && order?.expressDelivery === true && (
          <div className="rounded-md border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-800">
            {ts('expressBanner')}
          </div>
        )}

        {!orderLoading && offersLoading && deliveryType === 'home' && <OffersGridSkeleton />}

        {!orderLoading && !offersLoading && deliveryType === 'home' && offers.length === 0 && (
          <p className="text-sm text-slate-500">{ts('noOffers')}</p>
        )}

        {!orderLoading && !offersLoading && deliveryType === 'home' && offers.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => {
                const active = offerFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setOfferFilter(tab.key);
                      setOffersPage(1);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-[#556822] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {filteredOffers.length === 0 ? (
              <p className="text-sm text-slate-500">{ts('noOffersFilter')}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleOffers.map((offer) => {
                    const isActive = String(offer.shippingOfferCode) === String(selectedOfferCode);
                    const logoUrl = getCarrierLogo(offer.carrier);
                    const mode = classifyHomeOfferMode(offer);
                    return (
                      <button
                        key={offer.shippingOfferCode}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && setSelectedOfferCode(offer.shippingOfferCode)}
                        className={`relative text-left rounded-xl border p-4 shadow-sm transition ${
                          isActive
                            ? 'border-[#556822] bg-[#556822]/5 ring-2 ring-[#556822]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        } ${!interactive ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {isActive ? (
                          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#556822] text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        ) : null}
                        <div className="min-w-0 pr-8">
                          <p className="text-lg font-bold text-slate-900 truncate">
                            {offer.carrier || ts('carrierFallback')}
                          </p>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">
                            {mode === 'express' ? ts('modeExpress') : ts('modeStandard')}
                          </p>
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="h-7 w-auto max-w-[100px] object-contain mt-2"
                            />
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500 mt-2 font-mono break-all">{offer.shippingOfferCode}</p>
                        <p className="text-xl font-black text-slate-900 mt-2">{money(offer.price, offer.currency, numberLocale)}</p>
                        {offer.transitDays != null ? (
                          <p className="text-sm text-slate-600 mt-1">
                            {ts('estimate', { days: offer.transitDays })}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {totalOfferPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      {ts('rangeOf', {
                        start: offerStart + 1,
                        end: Math.min(offerStart + OFFERS_PAGE_SIZE, filteredOffers.length),
                        total: filteredOffers.length,
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeOfferPage <= 1}
                        onClick={() => setOffersPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {ts('prev')}
                      </button>
                      <span className="text-sm text-slate-600">
                        {ts('pageLabel', { page: safeOfferPage, total: totalOfferPages })}
                      </span>
                      <button
                        type="button"
                        disabled={safeOfferPage >= totalOfferPages}
                        onClick={() => setOffersPage((p) => Math.min(totalOfferPages, p + 1))}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                      >
                        {ts('next')}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!orderLoading && offersLoading && deliveryType === 'relay' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">{ts('relayPoints')}</h2>
            <RelayListSkeleton />
          </div>
        )}

        {!orderLoading && !offersLoading && deliveryType === 'relay' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">{ts('relayPoints')}</h2>
            {relayPoints.length === 0 ? (
              <p className="text-sm text-slate-500">{ts('noRelayPoints')}</p>
            ) : (
              <>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {visibleRelayPoints.map((point) => {
                    const key = relayRowKey(point);
                    const active = key === selectedRelayKey;
                    const logoUrl = getCarrierLogo(point.carrier);
                    const carrierLabel = String(point.carrier || '').trim() || '—';
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && setSelectedRelayKey(key)}
                        className={`w-full text-left p-4 flex items-start justify-between gap-4 transition ${
                          active ? 'bg-[#556822]/5' : 'bg-white hover:bg-slate-50'
                        } ${!interactive ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span
                            className={`mt-1.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                              active ? 'border-[#556822]' : 'border-slate-300'
                            }`}
                          >
                            {active ? <span className="h-2 w-2 rounded-full bg-[#556822]" /> : null}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 uppercase tracking-tight">
                              {point.name}
                            </p>
                        
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="h-5 w-auto max-w-[88px] object-contain mt-1.5" />
                            ) : null}
                            <p className="text-sm text-slate-600 mt-1 inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {[point.street, point.postalCode, point.city].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pt-0.5">
                          {point?.price != null ? (
                            <p className="font-bold text-slate-900">{money(point.price, point.currency || 'EUR', numberLocale)}</p>
                          ) : null}
                          {point?.estimatedTransitDays != null ? (
                            <p className="text-xs text-slate-500">
                              {ts('estimate', { days: point.estimatedTransitDays })}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {totalRelayPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-500">
                      {relayStart + 1}–{Math.min(relayStart + RELAY_PAGE_SIZE, relayPoints.length)} / {relayPoints.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeRelayPage <= 1}
                        onClick={() => setRelayPage((p) => Math.max(1, p - 1))}
                        className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        {ts('prev')}
                      </button>
                      <span className="text-xs text-slate-600">
                        {ts('pageLabel', { page: safeRelayPage, total: totalRelayPages })}
                      </span>
                      <button
                        type="button"
                        disabled={safeRelayPage >= totalRelayPages}
                        onClick={() => setRelayPage((p) => Math.min(totalRelayPages, p + 1))}
                        className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        {ts('next')}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!orderLoading && !offersLoading && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 items-stretch sm:items-center">
            {shippingOfferLocked ? (
              <p className="text-sm text-slate-600 text-right order-2 sm:order-1 sm:mr-auto">
                {ts('validatedFooter')}
              </p>
            ) : null}
            {!shippingOfferLocked ? (
              <>
                <Link
                  href={`/admin/orders/${id}`}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 text-center"
                >
                  {ts('cancel')}
                </Link>
                <button
                  type="button"
                  onClick={validateCommande}
                  disabled={saving || !canSave}
                  className="rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? ts('validating') : ts('validate')}
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

export default function ShippingOffersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <InnerPage />
    </ProtectedRoute>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI } from '@/lib/api';
import { classifyHomeOfferMode, getCarrierLogo } from '@/lib/shippingOfferUi';
import { ArrowLeft, Loader2, MapPin, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const OFFERS_PAGE_SIZE = 9;
const RELAY_PAGE_SIZE = 12;

function relayRowKey(point) {
  const id = String(point?.id || point?._id || '').trim();
  const carrier = String(point?.carrier || '').trim().toUpperCase();
  const offer = String(point?.suggestedShippingOfferCode || point?.matchedRelayOfferCode || '').trim();
  return `${id}::${carrier}::${offer}`;
}

function money(value, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'EUR').toUpperCase(),
    }).format(Number(value) || 0);
  } catch {
    return `${Number(value || 0).toFixed(2)} EUR`;
  }
}

function offerModeLabel(mode) {
  return mode === 'express' ? 'Express' : 'Standard';
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

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setOrderLoading(true);
        setOffersLoading(true);
        setError('');
        setSavedCodeMissing(false);

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

        const savedAdmin = o?.adminShippingOffer && typeof o.adminShippingOffer === 'object' ? o.adminShippingOffer : null;
        const savedCode =
          savedAdmin?.shippingOfferCode ||
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
          const byClient = nextPoints.find((p) => p.clientSelected);
          const pick = exact || byClient || nextPoints[0];
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
      }
    })();
  }, [id]);

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
    if (deliveryType === 'relay') {
      if (!selectedRelayPoint) throw new Error('Select a relay point');
      const code = String(
        selectedRelayPoint.suggestedShippingOfferCode ||
          selectedRelayPoint.matchedRelayOfferCode ||
          ''
      ).trim();
      if (!code) {
        throw new Error('Could not determine the shipping offer code for this carrier.');
      }
      const { raw: _raw, ...relayRest } = selectedRelayPoint;
      await orderAPI.selectAdminShippingOffer(id, {
        shippingOfferCode: code,
        shippingOfferId:
          selectedRelayPoint.suggestedShippingOfferId || selectedRelayPoint.shippingOfferId || null,
        carrier: selectedRelayPoint.carrier || null,
        relayPoint: relayRest,
      });
      return;
    }

    if (!selectedOfferCode || !selectedOffer) throw new Error('Select a shipping offer');
    await orderAPI.selectAdminShippingOffer(id, {
      shippingOfferCode: selectedOffer.shippingOfferCode,
      shippingOfferId: selectedOffer.shippingOfferId || null,
      carrier: selectedOffer.carrier || null,
      relayPoint: null,
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
      setError(e.message || 'Could not validate the order');
    } finally {
      setSaving(false);
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'cheapest', label: 'Cheapest' },
    { key: 'express', label: 'Express' },
    { key: 'normal', label: 'Standard' },
  ];

  const canSaveHome = Boolean(selectedOfferCode && selectedOffer);
  const canSaveRelay = Boolean(
    selectedRelayPoint && (selectedRelayPoint.suggestedShippingOfferCode || selectedRelayPoint.matchedRelayOfferCode)
  );
  const canSave = deliveryType === 'relay' ? canSaveRelay : canSaveHome;
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
          Back to order
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {deliveryType === 'relay' ? 'Relay shipping' : 'Choose a shipping offer'}
          </h1>
          <p className="text-sm text-slate-500">
            {order?.invoiceNumber ? `Order #${order.invoiceNumber}` : 'Order'} —{' '}
            {deliveryType === 'relay' ? 'Relay point' : 'Home delivery'}
          </p>
          {deliveryType === 'relay' && !orderLoading ? (
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              Same location as the customer — one row per carrier (e.g. Colissimo and Chronopost). Pick the row that
              matches how you will ship, then validate.
            </p>
          ) : null}
        </div>

        {orderLoading && (
          <div className="text-sm text-slate-500 inline-flex items-center gap-2 py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading order…
          </div>
        )}
        {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!orderLoading && shippingOfferLocked && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Shipping offer validated — editing is disabled.
          </div>
        )}
        {!orderLoading && deliveryType === 'home' && savedCodeMissing && (
          <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
            The previously saved offer is no longer in the current Boxtal quotes. Select a new offer and validate.
          </div>
        )}

        {!orderLoading && deliveryType === 'home' && order?.expressDelivery === true && (
          <div className="rounded-md border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-800">
            The customer chose <span className="font-semibold">express delivery</span> at checkout — prefer a matching
            offer (use the &quot;Express&quot; filter).
          </div>
        )}

        {!orderLoading && offersLoading && deliveryType === 'home' && <OffersGridSkeleton />}

        {!orderLoading && !offersLoading && deliveryType === 'home' && offers.length === 0 && (
          <p className="text-sm text-slate-500">No shipping offers are available for this order.</p>
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
              <p className="text-sm text-slate-500">No offers for this filter.</p>
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
                            {offer.carrier || 'Carrier'}
                          </p>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">{offerModeLabel(mode)}</p>
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt=""
                              className="h-7 w-auto max-w-[100px] object-contain mt-2"
                            />
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500 mt-2 font-mono break-all">{offer.shippingOfferCode}</p>
                        <p className="text-xl font-black text-slate-900 mt-2">{money(offer.price, offer.currency)}</p>
                        {offer.transitDays != null ? (
                          <p className="text-sm text-slate-600 mt-1">
                            Estimate: {offer.transitDays} day{offer.transitDays === 1 ? '' : 's'}
                          </p>
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {totalOfferPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      {offerStart + 1}–{Math.min(offerStart + OFFERS_PAGE_SIZE, filteredOffers.length)} of{' '}
                      {filteredOffers.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeOfferPage <= 1}
                        onClick={() => setOffersPage((p) => Math.max(1, p - 1))}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </button>
                      <span className="text-sm text-slate-600">
                        Page {safeOfferPage} / {totalOfferPages}
                      </span>
                      <button
                        type="button"
                        disabled={safeOfferPage >= totalOfferPages}
                        onClick={() => setOffersPage((p) => Math.min(totalOfferPages, p + 1))}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                      >
                        Next
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
            <h2 className="text-sm font-semibold text-slate-900">Relay points</h2>
            <RelayListSkeleton />
          </div>
        )}

        {!orderLoading && !offersLoading && deliveryType === 'relay' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Customer relay (same site, possible carriers)</h2>
            {relayPoints.length === 0 ? (
              <p className="text-sm text-slate-500">No relay points found for this order.</p>
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
                              {point.clientSelected ? (
                                <span className="ml-2 align-middle inline-flex rounded-full bg-[#556822]/15 px-2 py-0.5 text-[10px] font-bold normal-case tracking-wide text-[#556822]">
                                  Customer choice
                                </span>
                              ) : null}
                            </p>
                            <span className="text-xs font-bold text-slate-700 lowercase block mt-1">
                              {carrierLabel}
                            </span>
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="h-5 w-auto max-w-[88px] object-contain mt-1.5" />
                            ) : null}
                            <p className="text-sm text-slate-600 mt-1 inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {[point.street, point.postalCode, point.city].filter(Boolean).join(', ')}
                            </p>
                            {active &&
                            (point.suggestedShippingOfferCode || point.matchedRelayOfferCode) ? (
                              <p className="text-[11px] text-slate-400 font-mono mt-2 break-all">
                                Offer:{' '}
                                {point.suggestedShippingOfferCode || point.matchedRelayOfferCode}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right shrink-0 pt-0.5">
                          {point?.price != null ? (
                            <p className="font-bold text-slate-900">{money(point.price, point.currency || 'EUR')}</p>
                          ) : null}
                          {point?.estimatedTransitDays != null ? (
                            <p className="text-xs text-slate-500">
                              Estimate: {point.estimatedTransitDays} day
                              {point.estimatedTransitDays === 1 ? '' : 's'}
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
                        Previous
                      </button>
                      <span className="text-xs text-slate-600">
                        {safeRelayPage} / {totalRelayPages}
                      </span>
                      <button
                        type="button"
                        disabled={safeRelayPage >= totalRelayPages}
                        onClick={() => setRelayPage((p) => Math.min(totalRelayPages, p + 1))}
                        className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        Next
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
                Order validated — shipment sent to Boxtal. Open the order page for tracking.
              </p>
            ) : null}
            {!shippingOfferLocked ? (
              <>
                <Link
                  href={`/admin/orders/${id}`}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={validateCommande}
                  disabled={saving || !canSave}
                  className="rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Validating…' : 'Validate offer'}
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

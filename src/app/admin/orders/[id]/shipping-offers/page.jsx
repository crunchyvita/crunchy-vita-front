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
  const carrier = String(point?.carrier || '').trim();
  return `${id}::${carrier}`;
}

function money(value, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: String(currency || 'EUR').toUpperCase(),
    }).format(Number(value) || 0);
  } catch {
    return `${Number(value || 0).toFixed(2)} EUR`;
  }
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedCodeMissing, setSavedCodeMissing] = useState(false);

  const [offerFilter, setOfferFilter] = useState('all');
  const [offersPage, setOffersPage] = useState(1);
  const [relayPage, setRelayPage] = useState(1);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setSavedCodeMissing(false);

        const [orderRes, offersRes] = await Promise.all([
          orderAPI.getAdminById(id),
          orderAPI.getAdminShippingOffers(id),
        ]);
        if (!orderRes?.success) throw new Error(orderRes?.message || 'Unable to load order');
        if (!offersRes?.success) throw new Error(offersRes?.message || 'Unable to load offers');

        const o = orderRes.data || {};
        const nextOffers = offersRes?.data?.offers || [];
        const nextPoints = offersRes?.data?.relayPoints || [];
        const dType = String(offersRes?.data?.deliveryType || o?.deliveryType || 'home');

        const savedAdmin = o?.adminShippingOffer && typeof o.adminShippingOffer === 'object' ? o.adminShippingOffer : null;
        const savedCode = savedAdmin?.shippingOfferCode || o?.boxtal?.shippingOfferCode || '';
        const clientWantsExpress = o?.expressDelivery === true;

        setOrder(o);
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
              (p) => String(p.id || p._id) === rid && String(p.carrier || '').trim() === rCarrier
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
        setError(e.message || 'Unable to load shipping offers');
      } finally {
        setLoading(false);
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

  const saveSelection = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError('');

      if (deliveryType === 'relay') {
        if (!selectedRelayPoint) return;
        const code = String(
          selectedRelayPoint.suggestedShippingOfferCode ||
            selectedRelayPoint.matchedRelayOfferCode ||
            ''
        ).trim();
        if (!code) {
          setError('Impossible de déterminer le code d’offre pour ce transporteur. Réessayez plus tard.');
          return;
        }
        const { raw: _raw, ...relayRest } = selectedRelayPoint;
        await orderAPI.selectAdminShippingOffer(id, {
          shippingOfferCode: code,
          shippingOfferId:
            selectedRelayPoint.suggestedShippingOfferId || selectedRelayPoint.shippingOfferId || null,
          carrier: selectedRelayPoint.carrier || null,
          price: selectedRelayPoint.price,
          currency: selectedRelayPoint.currency || 'EUR',
          transitDays: selectedRelayPoint.estimatedTransitDays ?? selectedRelayPoint.transitDays,
          relayPoint: relayRest,
        });
        router.push(`/admin/orders/${id}`);
        return;
      }

      if (!selectedOfferCode || !selectedOffer) return;
      await orderAPI.selectAdminShippingOffer(id, {
        shippingOfferCode: selectedOffer.shippingOfferCode,
        shippingOfferId: selectedOffer.shippingOfferId || null,
        carrier: selectedOffer.carrier || null,
        price: selectedOffer.price,
        currency: selectedOffer.currency || 'EUR',
        transitDays: selectedOffer.transitDays,
        relayPoint: null,
      });
      router.push(`/admin/orders/${id}`);
    } catch (e) {
      setError(e.message || 'Unable to save offer');
    } finally {
      setSaving(false);
    }
  };

  const filterTabs = [
    { key: 'all', label: 'Tous' },
    { key: 'cheapest', label: 'Moins cher' },
    { key: 'express', label: 'Express' },
    { key: 'normal', label: 'Standard' },
  ];

  const canSaveHome = Boolean(selectedOfferCode && selectedOffer);
  const canSaveRelay = Boolean(
    selectedRelayPoint && (selectedRelayPoint.suggestedShippingOfferCode || selectedRelayPoint.matchedRelayOfferCode)
  );
  const canSave = deliveryType === 'relay' ? canSaveRelay : canSaveHome;

  return (
    <>
      <AdminHeader />
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        <Link
          href={`/admin/orders/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#556822]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la commande
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {deliveryType === 'relay' ? 'Relais d’expédition' : 'Choisir une offre d’expédition'}
          </h1>
          <p className="text-sm text-slate-500">
            {order?.invoiceNumber ? `Commande #${order.invoiceNumber}` : 'Commande'} —{' '}
            {deliveryType === 'relay' ? 'Point relais' : 'Livraison domicile'}
          </p>
          {deliveryType === 'relay' && !loading ? (
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              Même adresse que le client : une ligne par transporteur (ex. Colissimo et Chronopost). Choisissez la ligne
              correspondant à l’expédition réelle, puis enregistrez.
            </p>
          ) : null}
        </div>

        {loading && (
          <div className="text-sm text-slate-500 inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        )}
        {error && <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!loading && deliveryType === 'home' && savedCodeMissing && (
          <div className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">
            L’offre précédemment enregistrée n’apparaît plus dans les tarifs Boxtal actuels. Sélectionnez une nouvelle offre
            puis enregistrez.
          </div>
        )}

        {!loading && deliveryType === 'home' && order?.expressDelivery === true && (
          <div className="rounded-md border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-slate-800">
            Le client a choisi la <span className="font-semibold">livraison express</span> au paiement — privilégiez une
            offre adaptée (filtre « Express »).
          </div>
        )}

        {!loading && deliveryType === 'home' && offers.length > 0 && (
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
              <p className="text-sm text-slate-500">Aucune offre pour ce filtre.</p>
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
                        onClick={() => setSelectedOfferCode(offer.shippingOfferCode)}
                        className={`relative text-left rounded-xl border p-4 shadow-sm transition ${
                          isActive
                            ? 'border-[#556822] bg-[#556822]/5 ring-2 ring-[#556822]/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        {isActive ? (
                          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#556822] text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        ) : null}
                        <div className="flex items-center gap-3 pr-8">
                          {logoUrl ? (
                            <img src={logoUrl} alt="" className="h-8 w-auto max-w-[100px] object-contain" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-slate-100" />
                          )}
                          <div className="min-w-0">
                            <p className="text-lg font-bold text-slate-900 truncate">
                              {offer.carrier || 'Transporteur'}
                            </p>
                            <p className="text-[10px] font-semibold uppercase text-slate-400">{mode}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-2 font-mono break-all">{offer.shippingOfferCode}</p>
                        <p className="text-xl font-black text-slate-900 mt-2">{money(offer.price, offer.currency)}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          ETA :{' '}
                          {offer.transitDays != null ? `${offer.transitDays} jour(s)` : 'N/A'}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {totalOfferPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-500">
                      {offerStart + 1}–{Math.min(offerStart + OFFERS_PAGE_SIZE, filteredOffers.length)} sur{' '}
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
                        Précédent
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
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!loading && deliveryType === 'relay' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Relais du client (même lieu, transporteurs possibles)</h2>
            {relayPoints.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun point relais trouvé pour cette commande.</p>
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
                        onClick={() => setSelectedRelayKey(key)}
                        className={`w-full text-left p-4 flex items-start justify-between gap-4 transition ${
                          active ? 'bg-[#556822]/5' : 'bg-white hover:bg-slate-50'
                        }`}
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
                                  Choix client
                                </span>
                              ) : null}
                            </p>
                            <p className="text-sm text-slate-600 mt-0.5 inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              {[point.street, point.postalCode, point.city].filter(Boolean).join(', ')}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              {logoUrl ? (
                                <img src={logoUrl} alt="" className="h-5 w-auto max-w-[88px] object-contain" />
                              ) : null}
                              <span className="text-xs font-bold text-slate-700 lowercase">{carrierLabel}</span>
                            </div>
                            {active &&
                            (point.suggestedShippingOfferCode || point.matchedRelayOfferCode) ? (
                              <p className="text-[11px] text-slate-400 font-mono mt-2 break-all">
                                Offre :{' '}
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
                            <p className="text-xs text-slate-500">{point.estimatedTransitDays} j</p>
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
                        Précédent
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
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!loading && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveSelection}
              disabled={saving || !canSave}
              className="rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer l’offre'}
            </button>
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

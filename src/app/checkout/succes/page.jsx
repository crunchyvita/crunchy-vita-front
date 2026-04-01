'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { paymentAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Gift } from 'lucide-react';

function formatMoney(amount, currency = 'eur') {
  const cur = (currency || 'eur').toUpperCase();
  try {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: cur,
      minimumFractionDigits: 2 
    }).format(Number(amount) || 0);
  } catch {
    return `${Number(amount || 0).toFixed(2)} €`;
  }
}

export default function CheckoutSuccessPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations('CheckoutSuccess');
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const sessionId = searchParams.get('session_id');
  const lookupId = paymentIntent || sessionId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    const syncCartFromServer = () => {
      if (typeof window === 'undefined') return;
      window.dispatchEvent(new Event('cartNeedsReload'));
      window.dispatchEvent(new Event('cartUpdated'));
    };

    (async () => {
      if (!lookupId) {
        setLoading(false);
        setError(t('missingReference'));
        return;
      }
      try {
        const res = await paymentAPI.getOrderDetails(
          lookupId,
          sessionId ? 'session' : 'payment_intent',
          { includePaymentDetails: true }
        );
        if (!cancelled && res?.success) {
          setData(res.data);
          // This order is completed; clear any persisted promo so the next checkout starts clean.
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('appliedPromoCode');
            } catch {
              // Ignore storage errors.
            }
            window.dispatchEvent(new Event('promoCodeCleared'));
          }
          // Server cart is cleared when payment finalizes; refresh every useCart() (header badge, etc.)
          syncCartFromServer();
          retryTimer = window.setTimeout(() => {
            if (!cancelled) syncCartFromServer();
          }, 1500);
        } else if (!cancelled) {
          setError(res?.message || t('loadingError'));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || t('loadingError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (retryTimer != null) window.clearTimeout(retryTimer);
    };
  }, [lookupId, sessionId, t]);

  const items = useMemo(() => data?.items || [], [data]);
  const promoFreeItem = useMemo(() => data?.promoDetails?.freeItem || null, [data]);
  const isLineFreeGift = (line) => {
    if (!line) return false;

    const unit = Number(line.unitPrice);
    const totalLine = Number(line.lineTotal);
    const isZeroPriced =
      (Number.isFinite(unit) && unit === 0) || (Number.isFinite(totalLine) && totalLine === 0);

    const promo = promoFreeItem;
    if (promo && typeof promo === 'object') {
      const promoType = String(promo.type || '').toUpperCase();
      const promoId = promo.id ? String(promo.id) : '';
      if (promoType === 'PRODUCT') {
        return Boolean(promoId && String(line.productId || '') === promoId && isZeroPriced);
      }
      if (promoType === 'PACKAGE') {
        return Boolean(promoId && String(line.packageId || '') === promoId && isZeroPriced);
      }
    }

    // Fallback: gift lines are stored with unitPrice 0 in order snapshots.
    return isZeroPriced;
  };

  const displayInvoice = data?.invoiceNumber || data?.orderId || lookupId;
  const subtotal = data?.subtotalAmount ?? 0;
  const shipping = data?.shippingAmount ?? 0;
  const discount = data?.discountAmount ?? 0;
  const total = data?.totalAmount ?? 0;
  const currency = data?.currency || 'eur';

  const shipName = String(data?.customerName || '').trim() || '—';

  const addr = data?.shippingAddress;
  const paymentSummary = String(data?.paymentMethodSummary || '').trim();

  const { cardBrand, cardLast4 } = useMemo(() => {
    const summary = String(data?.paymentMethodSummary || '').trim();
    const fromApiBrand = data?.paymentCardBrand ? String(data.paymentCardBrand).trim() : '';
    const fromApiLast4 = data?.paymentCardLast4 ? String(data.paymentCardLast4).trim() : '';

    let last4 =
      (fromApiLast4 && /^\d{4}$/.test(fromApiLast4) ? fromApiLast4 : null) ||
      (summary.match(/(\d{4})\s*$/)?.[1] ?? null);

    let brand = fromApiBrand || null;
    if (!brand && summary && last4) {
      const head = summary.slice(0, Math.max(0, summary.lastIndexOf(last4))).trim();
      const cleaned = head.replace(/[\s·*•.…]+$/g, '').trim();
      if (cleaned && !/^\d+$/.test(cleaned)) brand = cleaned.toUpperCase();
    }

    return { cardBrand: brand, cardLast4: last4 };
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-[Maison_Neue]">
      <HeaderAndBreadcrumbs />
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-pulse">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0">
              <div className="flex items-start gap-5 mb-10">
                <div className="h-12 w-12 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-2/3 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-100 rounded" />
                </div>
              </div>
              <div className="space-y-6">
                {[0, 1].map((idx) => (
                  <div key={idx} className="flex items-center gap-5">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-md bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-gray-200 rounded" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
              <div className="mt-10 pt-6 border-t border-gray-100 space-y-3">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-6 w-1/3 ml-auto bg-gray-200 rounded" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 space-y-3">
                <div className="h-5 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-28 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 px-6 py-4 text-center">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Order Details */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0">
              <div className="flex items-start gap-5 mb-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f5e9] text-[#4caf50] shrink-0">
                  <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#556822] font-[agrandir] leading-tight">{t('successTitle')}</h1>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('successSubtitle', { invoiceNumber: displayInvoice })}
                  </p>
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-[#556822] mb-4 sm:mb-6 font-[agrandir]">{t('items')}</h2>
              <ul className="space-y-6">
                {items.map((line, idx) => (
                  <li key={idx} className="flex items-center gap-5">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0">
                      {isLineFreeGift(line) && (
                        <span className="absolute -top-2 -right-2 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E10C69] text-white shadow-sm">
                          <Gift size={12} />
                        </span>
                      )}
                      <div className="h-full w-full rounded-md bg-gray-50 overflow-hidden border border-gray-100">
                        {line?.imageUrl ? (
                          <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gray-100" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-[#556822] text-base sm:text-lg break-words">{line?.name || '—'}</p>
                      <p className="text-xs sm:text-sm text-gray-500">x {line?.quantity || 0}</p>
                    </div>
                    <p className="font-black text-[#E10C69] text-base sm:text-lg tabular-nums text-right">
                      {line?.lineTotal != null ? formatMoney(line.lineTotal, currency) : formatMoney(0, currency)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-10 pt-6 border-t border-gray-100 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t('subtotal')}</span>
                  <span className="font-bold text-gray-900 tabular-nums">{formatMoney(subtotal, currency)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>{t('shipping')}</span>
                  <span className="font-bold text-gray-900 tabular-nums">{formatMoney(shipping, currency)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>{t('discount')}</span>
                    <span className="tabular-nums">−{formatMoney(discount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xl font-black pt-4">
                  <span className="text-[#556822]">{t('total')}</span>
                  <span className="text-[#E10C69] tabular-nums">{formatMoney(total, currency)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Metadata */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-black text-[#556822] mb-3 font-[agrandir]">{t('shippingAddress')}</h3>
                <p className="font-bold text-gray-900 mb-2">{shipName}</p>
                {addr && (
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <p>
                      {[addr.line1, addr.line2].filter(Boolean).join(', ')}<br />
                      {[addr.postalCode, addr.city].filter(Boolean).join(' ')}<br />
                      {addr.country || 'France'}
                    </p>
                    {data?.customerPhone ? (
                      <p className="mt-2 text-slate-600">Tel: {data.customerPhone}</p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-lg font-black text-[#556822] mb-4 font-[agrandir]">
                  {t('paymentInfo')}
                </h3>
                <div className="space-y-1.5 text-sm text-gray-600 leading-relaxed">
                  <p>{t('paymentMethod')}</p>
                  {cardLast4 ? (
                    <>
                      {cardBrand ? <p className="uppercase tracking-wide">{cardBrand}</p> : null}
                      <p className="tabular-nums">
                        *** {cardLast4}
                      </p>
                    </>
                  ) : (
                    <p>{paymentSummary || t('paymentFallback')}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Link
                  href="/shop"
                  className="w-full text-center rounded-md py-3 font-bold text-white hover:opacity-90 transition-all"
                  style={{ backgroundColor: '#556822' }}
                >
                  {t('continueShopping')}
                </Link>
                {isAuthenticated && data?.orderId && (
                  <Link
                    href={`/orders/${data.orderId}`}
                    className="w-full text-center rounded-md py-3 font-bold border border-gray-200 bg-white text-[#556822] hover:bg-gray-50 transition-all"
                  >
                    {t('viewOrder')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
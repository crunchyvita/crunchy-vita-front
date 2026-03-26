'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { paymentAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

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
        const res = await paymentAPI.getOrderDetails(lookupId, sessionId ? 'session' : 'payment_intent');
        if (!cancelled && res?.success) {
          setData(res.data);
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
    <div className="min-h-screen flex flex-col bg-[#fdfdfd]">
      <HeaderAndBreadcrumbs />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-pulse">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10">
              <div className="flex items-start gap-5 mb-10">
                <div className="h-14 w-14 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-2/3 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                </div>
              </div>

              <div className="h-3 w-24 bg-slate-200 rounded mb-6" />
              <div className="space-y-6">
                {[...Array(2)].map((_, idx) => (
                  <div key={idx} className="flex items-center gap-5">
                    <div className="h-20 w-20 rounded-xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-slate-200 rounded" />
                      <div className="h-3 w-20 bg-slate-100 rounded" />
                    </div>
                    <div className="h-4 w-16 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50 space-y-3">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-6 w-1/3 ml-auto bg-slate-200 rounded" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-3">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-40 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-28 bg-slate-100 rounded" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-7 w-32 bg-slate-100 rounded" />
              </div>

              <div className="space-y-4">
                <div className="h-12 w-full rounded-2xl bg-slate-200" />
                <div className="h-12 w-full rounded-2xl bg-slate-100" />
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 px-6 py-4 text-center">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Order Details */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 md:p-10">
              <div className="flex items-start gap-5 mb-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5e9] text-[#4caf50] shrink-0">
                  <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('successTitle')}</h1>
                  <p className="text-slate-500 mt-2 leading-relaxed">
                    {t('successSubtitle', { invoiceNumber: displayInvoice })}
                  </p>
                </div>
              </div>

              <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-6">{t('items')}</h2>
              <ul className="space-y-6">
                {items.map((line, idx) => (
                  <li key={idx} className="flex items-center gap-5">
                    <div className="h-20 w-20 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                      {line.imageUrl ? (
                        <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-slate-100" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{line.name || '—'}</p>
                      <p className="text-sm text-slate-500">{t('quantity')} {line.quantity}</p>
                    </div>
                    <p className="font-bold text-slate-900 tabular-nums text-right">
                      {formatMoney(line.lineTotal, currency)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-10 pt-8 border-t border-slate-50 space-y-3">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{t('subtotal')}</span>
                  <span className="tabular-nums">{formatMoney(subtotal, currency)}</span>
                </div>
                
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{t('shipping')}</span>
                  <span className="tabular-nums">{formatMoney(shipping, currency)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>{t('discount')}</span>
                    <span className="tabular-nums">−{formatMoney(discount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xl font-black text-slate-900 pt-4">
                  <span>{t('total')}</span>
                  <span className="tabular-nums">{formatMoney(total, currency)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Metadata */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">{t('shippingAddress')}</h3>
                <p className="font-bold text-slate-900 mb-2">{shipName}</p>
                {addr && (
                  <div className="text-[15px] text-slate-500 leading-relaxed">
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

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 mb-5">
                  {t('paymentInfo')}
                </h3>
                <div className="space-y-1.5 text-[15px] font-normal text-slate-500 leading-relaxed">
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
                  className="w-full text-center rounded-2xl py-4 font-bold text-white shadow-md hover:opacity-90 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#556622' }}
                >
                  {t('continueShopping')}
                </Link>
                {isAuthenticated && data?.orderId && (
                  <Link
                    href={`/orders/${data.orderId}`}
                    className="w-full text-center rounded-2xl py-4 font-bold border-2 border-slate-100 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
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
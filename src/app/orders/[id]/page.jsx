'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI } from '@/lib/api';
import { useBreadcrumbOverride } from '@/context/BreadcrumbContext';

function formatMoney(amount, currency = 'eur') {
  const cur = (currency || 'eur').toUpperCase();
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(
      Number(amount) || 0
    );
  } catch {
    return `€${Number(amount || 0).toFixed(2)}`;
  }
}

function OrderDetailContent() {
  const t = useTranslations('OrderDetail');
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { setLastLabel, clearLastLabel } = useBreadcrumbOverride();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await orderAPI.getMine(id);
        if (res?.success) setOrder(res.data);
        else setError(res?.message || t('notFound'));
      } catch (e) {
        setError(e.message || t('notFound'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  useEffect(() => {
    if (order?.invoiceNumber) setLastLabel(`#${String(order.invoiceNumber)}`);
    else clearLastLabel();
    return () => clearLastLabel();
  }, [order?.invoiceNumber, setLastLabel, clearLastLabel]);

  const shellClass = 'min-h-screen flex flex-col bg-gray-50 font-[Maison_Neue]';
  const mainClass =
    'flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 md:px-6 py-6 sm:py-8';

  if (loading) {
    return (
      <div className={shellClass}>
        <HeaderAndBreadcrumbs />
        <main className={mainClass}>
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-gray-500">
            <div
              className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#556822] mb-4"
              aria-hidden
            />
            <p>{t('loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={shellClass}>
        <HeaderAndBreadcrumbs />
        <main className={mainClass}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sm:p-8">
            <p className="text-red-600 text-sm">{error || t('notFound')}</p>
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 mt-6 rounded-md border border-gray-200 text-[#556822] px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} />
              {t('backLink')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className={shellClass}>
      <HeaderAndBreadcrumbs />
      <main className={mainClass}>
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0 space-y-6 sm:space-y-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#556822] font-[agrandir] leading-tight">
              {t('title', { invoiceNumber: order.invoiceNumber })}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              {order.createdAt ? new Date(order.createdAt).toLocaleString('fr-FR') : ''}
            </p>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-[#556822] mb-4 sm:mb-6 font-[agrandir]">
              {t('itemsSection')}
            </h2>
            <ul className="divide-y divide-gray-100">
              {(order.items || []).map((line, i) => (
                <li key={i} className="flex gap-3 sm:gap-4 py-4 first:pt-0 items-start">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-md bg-gray-50 overflow-hidden border border-gray-100 shrink-0">
                    {line.imageUrl ? (
                      <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ShoppingBag size={22} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#556822] text-base sm:text-lg break-words">{line.name || '—'}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">× {line.quantity}</p>
                  </div>
                  <p className="font-black text-[#E10C69] text-base sm:text-lg tabular-nums shrink-0">
                    {formatMoney(line.lineTotal, order.currency)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 pt-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">{t('subtotal')}</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatMoney(order.subtotalAmount, order.currency)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">{t('shipping')}</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatMoney(order.shippingAmount, order.currency)}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span className="font-medium">{t('discount')}</span>
                  <span className="font-bold tabular-nums">
                    −{formatMoney(order.discountAmount, order.currency)}
                  </span>
                </div>
              )}
              <hr className="border-gray-100 my-3" />
              <div className="flex justify-between text-lg font-black font-[agrandir]">
                <span className="text-[#556822]">{t('total')}</span>
                <span className="text-[#E10C69] tabular-nums">
                  {formatMoney(order.totalAmount, order.currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-black text-[#556822] mb-3 sm:mb-4 font-[agrandir]">
              {t('shippingSection')}
            </h2>
            {addr ? (
              <p className="text-gray-600 text-sm leading-relaxed font-[Maison_Neue]">
                {[addr.line1, addr.line2].filter(Boolean).join(', ')}
                <br />
                {[addr.postalCode, addr.city].filter(Boolean).join(' ')}
                {addr.country ? (
                  <>
                    <br />
                    {addr.country}
                  </>
                ) : null}
              </p>
            ) : null}
            <p className="text-sm text-gray-500 mt-3">{t('status', { status: order.status })}</p>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center gap-2 w-full sm:w-auto justify-center rounded-md border border-gray-200 bg-white text-[#556822] px-6 py-3 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
            {t('allOrders')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN', 'SUPERADMIN']}>
      <OrderDetailContent />
    </ProtectedRoute>
  );
}

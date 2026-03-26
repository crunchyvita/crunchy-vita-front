'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI } from '@/lib/api';

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafafa]">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16 text-slate-500">{t('loading')}</main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafafa]">
        <Header />
        <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
          <p className="text-red-600">{error || t('notFound')}</p>
          <Link href="/orders" className="text-[#556822] font-semibold mt-4 inline-block">
            {t('backLink')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const addr = order.shippingAddress;

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <nav className="text-sm text-slate-500 mb-4">
          <Link href="/shop" className="hover:text-[#556822]">
            {t('breadcrumb.shop')}
          </Link>
          <span className="mx-2">/</span>
          <Link href="/orders" className="hover:text-[#556822]">
            {t('breadcrumb.orders')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{t('breadcrumb.detail')}</span>
        </nav>

        <h1 className="text-2xl font-bold text-slate-900">{t('title', { invoiceNumber: order.invoiceNumber })}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {order.createdAt
            ? new Date(order.createdAt).toLocaleString('fr-FR')
            : ''}
        </p>

        <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">{t('itemsSection')}</h2>
          <ul className="divide-y divide-slate-100">
            {(order.items || []).map((line, i) => (
              <li key={i} className="flex gap-3 py-3">
                <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                  {line.imageUrl ? (
                    <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{line.name || '—'}</p>
                  <p className="text-sm text-slate-500">× {line.quantity}</p>
                </div>
                <p className="font-semibold tabular-nums">{formatMoney(line.lineTotal, order.currency)}</p>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>{t('subtotal')}</span>
              <span>{formatMoney(order.subtotalAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>{t('shipping')}</span>
              <span>{formatMoney(order.shippingAmount, order.currency)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>{t('discount')}</span>
                <span>−{formatMoney(order.discountAmount, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2">
              <span>{t('total')}</span>
              <span>{formatMoney(order.totalAmount, order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">{t('shippingSection')}</h2>
          {addr && (
            <p className="text-slate-600 text-sm leading-relaxed">
              {[addr.line1, addr.line2].filter(Boolean).join(', ')}
              <br />
              {[addr.postalCode, addr.city].filter(Boolean).join(' ')}
              {addr.country ? <><br />{addr.country}</> : null}
            </p>
          )}
          <p className="text-sm text-slate-500 mt-2">{t('status', { status: order.status })}</p>
        </div>

        <Link href="/orders" className="inline-block mt-6 text-[#556822] font-semibold">
          {t('allOrders')}
        </Link>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <OrderDetailContent />
    </ProtectedRoute>
  );
}

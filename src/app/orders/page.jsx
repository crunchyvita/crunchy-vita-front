'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI } from '@/lib/api';

const statusStyle = {
  pending: { dot: 'bg-amber-400', label: 'pending' },
  awaiting_delivery: { dot: 'bg-lime-500', label: 'awaiting_delivery' },
  delivered: { dot: 'bg-emerald-500', label: 'delivered' },
  returned: { dot: 'bg-red-500', label: 'returned' },
  refunded: { dot: 'bg-blue-500', label: 'refunded' },
};

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

function OrdersContent() {
  const t = useTranslations('Orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 3;

  useEffect(() => {
    (async () => {
      try {
        const res = await orderAPI.listMine();
        if (res?.success) setOrders(res.data || []);
        else setError(res?.message || t('error'));
      } catch (e) {
        setError(e.message || t('error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedOrders = orders.slice(startIdx, endIdx);

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesOrderId = order.invoiceNumber?.toString().toLowerCase().includes(query);
    const matchesProduct = (order.items || []).some((item) =>
      item.name?.toLowerCase().includes(query)
    );
    return matchesOrderId || matchesProduct;
  });

  // Recalculate pagination for filtered results
  const filteredTotalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const filteredStartIdx = (currentPage - 1) * itemsPerPage;
  const filteredEndIdx = filteredStartIdx + itemsPerPage;
  const displayedOrders = filteredOrders.slice(filteredStartIdx, filteredEndIdx);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <nav className="text-sm text-slate-500 mb-4">
          <Link href="/shop" className="hover:text-[#556822]">
            {t('breadcrumb.shop')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{t('breadcrumb.orders')}</span>
        </nav>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('title')}</h1>
        <p className="text-slate-600 mb-8">
          {t('description')}
        </p>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by order ID or product name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#556822] focus:border-transparent transition-all"
          />
        </div>

        {loading && <p className="text-slate-500">{t('loading')}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && !orders.length && !error && (
          <p className="text-slate-500">{t('empty')}</p>
        )}

        {!loading && orders.length > 0 && filteredOrders.length === 0 && (
          <p className="text-slate-500">No orders match your search.</p>
        )}

        <div className="space-y-6">
          {displayedOrders.map((order) => {
            const st = statusStyle[order.status] || statusStyle.pending;
            const lines = order.items || [];
            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden flex flex-col md:flex-row"
              >
                <div className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 p-5 bg-slate-100/50">
                  <div className="space-y-4">
                    {/* Order ID */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        {t('list.orderLabel')}
                      </p>
                      <p className="font-mono font-bold text-slate-900">#{order.invoiceNumber}</p>
                    </div>

                    {/* Date */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Date
                      </p>
                      <p className="text-sm text-slate-900 uppercase font-semibold">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>

                    {/* Total Amount */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Total Amount
                      </p>
                      <p className="text-lg font-bold text-slate-900">
                        {formatMoney(order.totalAmount, order.currency)}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Order Status
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                        <span className="text-sm font-medium text-slate-700">{t(`list.status.${st.label}`)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-5">
                  <div className="space-y-4">
                    {lines.slice(0, 4).map((line, i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="h-14 w-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-100 shrink-0">
                          {line.imageUrl ? (
                            <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{line.name}</p>
                          <p className="text-sm text-slate-500">{formatMoney(line.lineTotal, order.currency)}</p>
                        </div>
                        <Link
                          href={line.productId ? `/shop/${line.productId}` : '/shop'}
                          className="text-xs font-semibold text-[#556822] hover:underline shrink-0"
                        >
                          {t('list.viewProduct')}
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-5">
                    <Link
                      href={`/orders/${order._id}`}
                      className="inline-flex items-center rounded-xl px-6 py-2 text-sm font-semibold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {t('list.viewOrder')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTotalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Précédent
            </button>
            <div className="flex gap-1">
              {Array.from({ length: filteredTotalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#556622] text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(filteredTotalPages, prev + 1))}
              disabled={currentPage === filteredTotalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant →
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={['CLIENT']}>
      <OrdersContent />
    </ProtectedRoute>
  );
}

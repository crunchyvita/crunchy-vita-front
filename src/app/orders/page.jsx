'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { ShoppingBag, ArrowRight, Gift } from 'lucide-react';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI } from '@/lib/api';
import {
  formatOrderLineTotalForDisplay,
  formatOrderTotalForDisplay,
} from '@/lib/orderDisplayAmounts';

const statusStyle = {
  pending: { dot: 'bg-amber-400', label: 'pending' },
  awaiting_delivery: { dot: 'bg-lime-500', label: 'awaiting_delivery' },
  delivered: { dot: 'bg-emerald-500', label: 'delivered' },
  returned: { dot: 'bg-red-500', label: 'returned' },
  refunded: { dot: 'bg-blue-500', label: 'refunded' },
};

function idToShopSegment(id) {
  if (id == null) return null;
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id._id != null) return String(id._id);
  return String(id);
}

function shopHrefForLine(line) {
  const pid = idToShopSegment(line?.productId);
  const pkid = idToShopSegment(line?.packageId);
  if (pid) return `/shop/${pid}`;
  if (pkid) return `/shop/packages/${pkid}`;
  return '/shop';
}

const pulse = 'animate-pulse rounded-md bg-gray-200/80';

function OrdersListSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {[0, 1, 2].map((card) => (
        <div
          key={card}
          className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
        >
          <div className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 p-5 bg-gray-50">
            <div className="space-y-4">
              {[0, 1, 2, 3].map((row) => (
                <div key={row}>
                  <div className={`h-3 w-16 mb-2 ${pulse}`} />
                  <div className={`h-5 w-full max-w-[10rem] ${pulse}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-4 sm:p-5">
            <div className="space-y-4">
              {[0, 1].map((line) => (
                <div
                  key={line}
                  className="flex gap-3 sm:gap-4 items-center py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className={`h-16 w-16 sm:h-20 sm:w-20 shrink-0 ${pulse}`} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className={`h-5 w-full max-w-md ${pulse}`} />
                    <div className={`h-4 w-24 ${pulse}`} />
                  </div>
                  <div className={`h-4 w-20 shrink-0 ${pulse}`} />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <div className={`h-10 w-36 rounded-md ${pulse}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersContent() {
  const t = useTranslations('Orders');
  const tCart = useTranslations('Cart');
  const locale = useLocale();
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
      [item?.name, item?.name_en]
        .map((v) => String(v || '').toLowerCase())
        .some((name) => name.includes(query))
    );
    return matchesOrderId || matchesProduct;
  });

  const getLocalizedLineName = (line) => {
    const frName = String(line?.name || '').trim();
    const enName = String(line?.name_en || '').trim();
    if (locale === 'en') return enName || frName || '—';
    return frName || enName || '—';
  };

  const isLineFreeGift = (line, order) => {
    if (!line) return false;

    const unit = Number(line.unitPrice);
    const totalLine = Number(line.lineTotal);
    const isZeroPriced =
      (Number.isFinite(unit) && unit === 0) || (Number.isFinite(totalLine) && totalLine === 0);

    const promoFreeItem = order?.promoDetails?.freeItem || null;
    if (promoFreeItem && typeof promoFreeItem === 'object') {
      const promoType = String(promoFreeItem.type || '').toUpperCase();
      const promoId = promoFreeItem.id ? String(promoFreeItem.id) : '';
      if (promoType === 'PRODUCT') {
        return Boolean(promoId && String(line.productId || '') === promoId && isZeroPriced);
      }
      if (promoType === 'PACKAGE') {
        return Boolean(promoId && String(line.packageId || '') === promoId && isZeroPriced);
      }
    }

    return isZeroPriced;
  };

  // Recalculate pagination for filtered results
  const filteredTotalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const filteredStartIdx = (currentPage - 1) * itemsPerPage;
  const filteredEndIdx = filteredStartIdx + itemsPerPage;
  const displayedOrders = filteredOrders.slice(filteredStartIdx, filteredEndIdx);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-[Maison_Neue]">
      <HeaderAndBreadcrumbs />
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-[#556822] font-[agrandir] leading-tight">
              {t('title')}
            </h1>
            {!loading && orders.length > 0 ? (
              <span className="text-gray-500 text-xs sm:text-sm shrink-0">
                {filteredOrders.length === orders.length
                  ? `${orders.length} ${orders.length === 1 ? t('orderWord') : t('ordersWord')}`
                  : t('countFiltered', { filtered: filteredOrders.length, total: orders.length })}
              </span>
            ) : null}
          </div>

          <p className="text-sm text-gray-500 mb-6">{t('description')}</p>

          <div className="mb-8">
            {loading ? (
              <div className={`h-12 w-full ${pulse} rounded-lg`} aria-hidden />
            ) : (
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#556822] focus:border-transparent transition-all"
              />
            )}
          </div>

          {loading ? (
            <>
              <div className="sr-only" aria-live="polite">
                {t('loading')}
              </div>
              <OrdersListSkeleton />
            </>
          ) : null}
          {!loading && Boolean(error) ? <p className="text-red-600 text-sm">{error}</p> : null}

          {!loading && !orders.length && !error ? (
            <div className="text-center py-16 sm:py-20">
              <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-6">{t('empty')}</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#556822] text-white px-6 py-3 rounded-full font-bold hover:bg-[#3d4617] transition-all"
              >
                {tCart('actions.continueShopping')} <ArrowRight size={18} />
              </Link>
            </div>
          ) : null}

          {!loading && orders.length > 0 && filteredOrders.length === 0 ? (
            <p className="text-gray-500">{t('noSearchResults')}</p>
          ) : null}

          <div className="space-y-6">
            {!loading &&
              displayedOrders.map((order) => {
              const st = statusStyle[order.status] || statusStyle.pending;
              const lines = order.items || [];
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
                >
                  <div className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-gray-100 p-5 bg-gray-50">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {t('list.orderLabel')}
                        </p>
                        <p className="font-mono font-bold text-gray-900">#{order.invoiceNumber}</p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {t('dateLabel')}
                        </p>
                        <p className="text-sm text-gray-900 font-semibold">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {t('totalAmountLabel')}
                        </p>
                        <p className="text-lg font-black text-[#E10C69] tabular-nums">
                          {formatOrderTotalForDisplay(order)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {t('statusLabel')}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                          <span className="text-sm font-medium text-gray-700">
                            {t(`list.status.${st.label}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="space-y-4">
                      {lines.slice(0, 4).map((line, i) => (
                        <div
                          key={i}
                          className="flex gap-3 sm:gap-4 items-center py-3 border-b border-gray-100 last:border-b-0 last:pb-0 first:pt-0"
                        >
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-visible">
                            <div className="h-full w-full bg-gray-50 overflow-hidden rounded-md border border-gray-100">
                              {line.imageUrl ? (
                                <img src={line.imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <ShoppingBag size={20} className="text-gray-300" />
                                </div>
                              )}
                            </div>
                            {isLineFreeGift(line, order) ? (
                              <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E10C69] text-white shadow-sm z-10">
                                <Gift size={12} />
                              </span>
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#556822] text-base sm:text-lg break-words hyphens-auto">
                              {getLocalizedLineName(line)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                              <span className="font-black text-[#E10C69] tabular-nums">
                                {formatOrderLineTotalForDisplay(order, line, i)}
                              </span>
                            </p>
                          </div>
                          <Link
                            href={shopHrefForLine(line)}
                            className="text-xs font-bold text-[#556822] hover:underline shrink-0"
                          >
                            {t('list.viewProduct')}
                          </Link>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end mt-5">
                      <Link
                        href={`/orders/${order._id}`}
                        className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-bold bg-[#556822] text-white hover:opacity-90 transition-opacity"
                      >
                        {t('list.viewOrder')}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!loading && filteredTotalPages > 1 ? (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← {t('prevPage')}
              </button>
              <div className="flex gap-1">
                {Array.from({ length: filteredTotalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-md font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#556822] text-white'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(filteredTotalPages, prev + 1))}
                disabled={currentPage === filteredTotalPages}
                className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('nextPage')} →
              </button>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute allowedRoles={['CLIENT', 'ADMIN', 'SUPERADMIN']}>
      <OrdersContent />
    </ProtectedRoute>
  );
}

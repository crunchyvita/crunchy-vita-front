'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';
import AdminHeader from '@/components/admin/header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI } from '@/lib/api';
import { Search, MoreVertical, Eye, Truck, Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

const badge = (status) => {
  const map = {
    delivered: 'bg-emerald-100 text-emerald-800',
    shipped: 'bg-sky-100 text-sky-800',
    awaiting_delivery: 'bg-lime-100 text-lime-800',
    pending: 'bg-amber-100 text-amber-800',
    returned: 'bg-red-100 text-red-800',
    refunded: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-slate-200 text-slate-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

function AdminOrdersInner() {
  const PAGE_SIZE = 5;
  const t = useTranslations('admin.orders');
  const tcom = useTranslations('admin.common');
  const locale = useLocale();
  const searchParams = useSearchParams();

  const ORDER_STATUS_LABEL = useMemo(
    () => ({
      pending: t('status.pending'),
      awaiting_delivery: t('status.awaiting_delivery'),
      shipped: t('status.shipped'),
      delivered: t('status.delivered'),
      returned: t('status.returned'),
      refunded: t('status.refunded'),
      cancelled: t('status.cancelled'),
    }),
    [t]
  );

  const formatOrderStatus = (status) => ORDER_STATUS_LABEL[status] || status || '—';

  const TABS = useMemo(
    () => [
      { id: 'all', label: t('tabs.all') },
      { id: 'delivered', label: t('tabs.delivered') },
      { id: 'shipped', label: t('tabs.shipped') },
      { id: 'pending', label: t('tabs.pending') },
      { id: 'awaiting_delivery', label: t('tabs.awaiting_delivery') },
      { id: 'returned', label: t('tabs.returned') },
      { id: 'refunded', label: t('tabs.refunded') },
      { id: 'cancelled', label: t('tabs.cancelled') },
    ],
    [t]
  );
  const highlight = searchParams.get('order');

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderAPI.listAdmin({
        status: tab === 'all' ? undefined : tab,
        search: search.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (res?.success) {
        setOrders(res.data || []);
        setListTotal(Number(res.total) || 0);
      } else setError(res?.message || tcom('error'));
    } catch (e) {
      setError(e.message || tcom('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  useEffect(() => {
    setSelectedIds([]);
  }, [tab, page]);

  const pageOrderIds = useMemo(() => orders.map((o) => String(o._id)), [orders]);
  const allPageSelected =
    pageOrderIds.length > 0 && pageOrderIds.every((id) => selectedIds.includes(id));
  const somePageSelected = pageOrderIds.some((id) => selectedIds.includes(id));

  const toggleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageOrderIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageOrderIds])]);
    }
  };

  const toggleRow = (id) => {
    const sid = String(id);
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]
    );
  };

  const handleExportBoxtal = async () => {
    if (selectedIds.length === 0 || exporting) return;
    setExporting(true);
    setError('');
    try {
      const blob = await orderAPI.exportAdminBoxtalXlsx(selectedIds);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boxtal-shipment-import-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.message || t('exportError'));
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(listTotal / PAGE_SIZE));

  return (
    <>
      <AdminHeader />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {t('title')}
              <span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                {tcom('ordersCount', { count: listTotal })}
              </span>
            </div>
            <p className="text-sm text-slate-500">{t('subtitle')}</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">{t('exportBoxtalHint')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
           
            <button
              type="button"
              onClick={handleExportBoxtal}
              disabled={selectedIds.length === 0 || exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#556822] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 shrink-0" />
              {exporting ? t('exporting') : t('exportBoxtal')}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t.id
                    ? 'bg-[#556622] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 max-w-md">
            <Search className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <input
              className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                if (page === 1) void load();
                else setPage(1);
              }}
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">{t('loading')}</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = somePageSelected && !allPageSelected;
                        }}
                        onChange={toggleSelectAllPage}
                        className="h-4 w-4 rounded border-slate-300 text-[#556822] focus:ring-[#556822]"
                        aria-label={t('selectAllPage')}
                      />
                    </th>
                    <th className="px-3 py-3 font-medium">{t('invoice')}</th>
                    <th className="px-3 py-3 font-medium">{tcom('customer')}</th>
                    <th className="px-3 py-3 font-medium">{tcom('date')}</th>
                    <th className="px-3 py-3 font-medium">{tcom('status')}</th>
                    <th className="px-3 py-3 font-medium text-right">{t('items')}</th>
                    <th className="px-3 py-3 font-medium text-right">{t('amount')}</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.map((o) => (
                    <tr
                      key={o._id}
                      className={
                        highlight === o._id ? 'bg-amber-50/80' : 'hover:bg-slate-50/50 transition-colors'
                      }
                    >
                      <td className="px-3 py-4 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(o._id))}
                          onChange={() => toggleRow(o._id)}
                          className="h-4 w-4 rounded border-slate-300 text-[#556822] focus:ring-[#556822]"
                          aria-label={t('selectOrder', { invoice: o.invoiceNumber })}
                        />
                      </td>
                      <td className="px-3 py-4 font-mono font-medium text-slate-900">{o.invoiceNumber}</td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">{o.customerName || '—'}</div>
                        <div className="text-xs text-slate-500">{o.customerEmail}</div>
                      </td>
                      <td className="px-3 py-4 text-slate-600 whitespace-nowrap">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                          : '—'}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badge(
                            o.status
                          )}`}
                        >
                          {formatOrderStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums text-slate-700">
                        {typeof o.totalItemCount === 'number' ? o.totalItemCount : '—'}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-slate-900 tabular-nums">
                        {(Number(o.totalAmount) || 0).toFixed(2)} €
                      </td>
                      <td className="px-3 py-4 text-right relative">
                        <button
                          type="button"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          onClick={() =>
                            setMenuOpenFor((current) => (current === o._id ? null : o._id))
                          }
                          aria-label={t('actionsAria')}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {menuOpenFor === o._id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                            <Link
                              href={`/admin/orders/${o._id}`}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              onClick={() => setMenuOpenFor(null)}
                            >
                              <Eye className="h-4 w-4" />
                              {t('viewDetails')}
                            </Link>
                            {!o.shippingOfferLocked ? (
                              <Link
                                href={`/admin/orders/${o._id}/shipping-offers`}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 whitespace-nowrap"
                                onClick={() => setMenuOpenFor(null)}
                              >
                                <Truck className="h-4 w-4" />
                                {t('editShipping')}
                              </Link>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && orders.length === 0 && (
            <div className="py-20 text-center text-sm text-slate-500">{t('empty')}</div>
          )}
        </div>

        {!loading && listTotal > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {tcom('pageOf', { page, total: totalPages })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
              >
                {tcom('previous')}
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
              >
                {tcom('next')}
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminOrdersInner />
    </ProtectedRoute>
  );
}

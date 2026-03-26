'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { orderAPI } from '@/lib/api';
import { Search, MoreVertical, Eye, Pencil, Truck } from 'lucide-react';

const ORDER_STATUS_LABEL = {
  pending: 'Pending',
  awaiting_delivery: 'Awaiting delivery',
  shipped: 'Shipped',
  delivered: 'Delivered',
  returned: 'Returned',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const formatOrderStatus = (status) => ORDER_STATUS_LABEL[status] || status || '—';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'pending', label: 'Pending' },
  { id: 'awaiting_delivery', label: 'Awaiting delivery' },
  { id: 'returned', label: 'Returned' },
  { id: 'refunded', label: 'Refunded' },
  { id: 'cancelled', label: 'Cancelled' },
];

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
  const searchParams = useSearchParams();
  const highlight = searchParams.get('order');

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [page, setPage] = useState(1);
  const [editOrder, setEditOrder] = useState(null);
  const [nextStatus, setNextStatus] = useState('pending');

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
      } else setError(res?.message || 'Error');
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  const totalPages = Math.max(1, Math.ceil(listTotal / PAGE_SIZE));

  const statusOptions = [
    { value: 'pending', label: ORDER_STATUS_LABEL.pending },
    { value: 'awaiting_delivery', label: ORDER_STATUS_LABEL.awaiting_delivery },
    { value: 'shipped', label: ORDER_STATUS_LABEL.shipped },
    { value: 'delivered', label: ORDER_STATUS_LABEL.delivered },
    { value: 'returned', label: ORDER_STATUS_LABEL.returned },
    { value: 'refunded', label: ORDER_STATUS_LABEL.refunded },
    { value: 'cancelled', label: ORDER_STATUS_LABEL.cancelled },
  ];

  const changeStatus = async (id, status) => {
    setUpdating(id);
    try {
      await orderAPI.updateAdminStatus(id, status);
      await load();
    } catch (e) {
      setError(e.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const openEditModal = (order) => {
    setEditOrder(order);
    setNextStatus(order?.status || 'pending');
    setMenuOpenFor(null);
  };

  const submitEditStatus = async () => {
    if (!editOrder?._id) return;
    await changeStatus(editOrder._id, nextStatus);
    setEditOrder(null);
  };

  return (
    <>
      <AdminHeader />
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              Orders
              <span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
                {listTotal} order{listTotal !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-slate-500">Keep track of order status</p>
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
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  tab === t.id
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
              placeholder="Search by invoice, customer, email..."
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
              <div className="py-10 text-center text-sm text-slate-500">Loading orders...</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Invoice</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-right">Items</th>
                    <th className="px-3 py-3 font-medium text-right">Amount</th>
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
                      <td className="px-3 py-4 font-mono font-medium text-slate-900">{o.invoiceNumber}</td>
                      <td className="px-3 py-4">
                        <div className="font-medium text-slate-900">{o.customerName || '—'}</div>
                        <div className="text-xs text-slate-500">{o.customerEmail}</div>
                      </td>
                      <td className="px-3 py-4 text-slate-600 whitespace-nowrap">
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString('en-GB', {
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
                        {new Intl.NumberFormat('en-GB', {
                          style: 'currency',
                          currency: (o.currency || 'eur').toUpperCase(),
                        }).format(Number(o.totalAmount) || 0)}
                      </td>
                      <td className="px-3 py-4 text-right relative">
                        <button
                          type="button"
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          onClick={() =>
                            setMenuOpenFor((current) => (current === o._id ? null : o._id))
                          }
                          aria-label="Actions"
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
                              View details
                            </Link>
                            {!o.shippingOfferLocked ? (
                              <Link
                                href={`/admin/orders/${o._id}/shipping-offers`}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                                onClick={() => setMenuOpenFor(null)}
                              >
                                <Truck className="h-4 w-4" />
                                Edit shipping offer
                              </Link>
                            ) : null}
                            <button
                              type="button"
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 border-t border-slate-100 transition-colors"
                              onClick={() => openEditModal(o)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit status
                            </button>
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
            <div className="py-20 text-center text-sm text-slate-500">No orders found</div>
          )}
        </div>

        {!loading && listTotal > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} 
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {editOrder && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Edit status</h3>
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-slate-700"
                  onClick={() => setEditOrder(null)}
                >
                  Close
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Order #{editOrder.invoiceNumber}</p>
                <select
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  disabled={updating === editOrder._id}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700"
                    onClick={() => setEditOrder(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-[#556622] text-white text-sm disabled:opacity-60"
                    onClick={submitEditStatus}
                    disabled={updating === editOrder._id}
                  >
                    Save
                  </button>
                </div>
              </div>
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

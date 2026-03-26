'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { paymentAdminAPI } from '@/lib/api';

const PAGE_SIZE = 7;

function AdminCheckoutInner() {
  const [page, setPage] = useState(1);
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentAdminAPI.listSessions({
        page,
        limit: PAGE_SIZE,
      });
      if (res?.success) {
        setSessions(res.data || []);
        setTotal(Number(res.total) || 0);
      } else {
        setError(res?.message || 'Failed to load');
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminHeader />
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Checkout </h1>
          <p className="text-sm text-slate-500 mt-1">
            Successful payments only. Open the linked order for full details.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Payment intent</th>
                    <th className="px-3 py-3 font-medium">Order</th>
                    <th className="px-3 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap text-slate-600">
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleString('en-GB', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-3 py-4">
                        <div className="max-w-[200px] truncate text-slate-900">
                          {s.customerEmail || '—'}
                        </div>
                      </td>
                      <td className="px-3 py-4 font-mono text-xs max-w-[160px] truncate">
                        {s.paymentIntentId || '—'}
                      </td>
                      <td className="px-3 py-4">
                        {s.order?._id ? (
                          <Link
                            href={`/admin/orders/${s.order._id}`}
                            className="text-[#556822] hover:underline font-medium"
                          >
                            {s.order.invoiceNumber || s.order._id}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold tabular-nums">
                        {new Intl.NumberFormat('en-GB', {
                          style: 'currency',
                          currency: (s.currency || 'eur').toUpperCase(),
                        }).format(Number(s.totalAmount) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && sessions.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-500">No paid checkout sessions</div>
          )}
        </div>

        {!loading && total > 0 && (
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
      </div>
    </>
  );
}

export default function AdminCheckoutPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminCheckoutInner />
    </ProtectedRoute>
  );
}

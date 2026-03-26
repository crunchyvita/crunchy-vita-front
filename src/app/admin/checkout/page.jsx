'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { paymentAdminAPI } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';

const PAGE_SIZE = 7;

function AdminCheckoutInner() {
  const t = useTranslations('admin.checkout');
  const tcom = useTranslations('admin.common');
  const locale = useLocale();
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
        setError(res?.message || t('loadError'));
      }
    } catch (e) {
      setError(e.message || t('loadError'));
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
          <h1 className="text-2xl font-semibold text-slate-900">{t('title')}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                    <th className="px-3 py-3 font-medium">{tcom('date')}</th>
                    <th className="px-3 py-3 font-medium">{tcom('email')}</th>
                    <th className="px-3 py-3 font-medium">{t('paymentIntent')}</th>
                    <th className="px-3 py-3 font-medium">{t('order')}</th>
                    <th className="px-3 py-3 font-medium text-right">{t('amount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sessions.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap text-slate-600">
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
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
                        {new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
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
            <div className="py-16 text-center text-sm text-slate-500">{t('empty')}</div>
          )}
        </div>

        {!loading && total > 0 && (
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

export default function AdminCheckoutPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminCheckoutInner />
    </ProtectedRoute>
  );
}

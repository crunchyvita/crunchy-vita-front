'use client';

import { useState, useEffect, useMemo } from 'react';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import {
  Search,
  Edit2,
  AlertCircle,
  Package,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Link } from '@/navigation';
import AdminHeader from '@/components/admin/header';
import { useLocale, useTranslations } from 'next-intl';

export default function PromoCodesPage() {
  const tp = useTranslations('admin.promoCodes');
  const tcom = useTranslations('admin.common');
  const locale = useLocale();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Fetch promo codes
  useEffect(() => {
    fetchPromoCodes();
    fetchStats();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promo-codes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setPromoCodes(result.data);
      }
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      setError(tp('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promo-codes/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promo-codes/${selectedCode._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(tp('deleteSuccess'));
        setShowDeleteModal(false);
        setSelectedCode(null);
        fetchPromoCodes();
        fetchStats();
      } else {
        setError(` ${result.message}`);
      }
    } catch (err) {
      setError(` ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  const formatPromoDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredPromoCodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return promoCodes;

    return promoCodes.filter((code) => {
      const name = String(code?.name || '').toLowerCase();
      const rouletteCodes = Array.isArray(code?.rouletteGeneratedCodes)
        ? code.rouletteGeneratedCodes.map((entry) => String(entry?.code || '').toLowerCase()).join(' ')
        : '';
      const discountType = String(code?.discountType || '').toLowerCase();
      return name.includes(q) || rouletteCodes.includes(q) || discountType.includes(q);
    });
  }, [promoCodes, search]);

  useEffect(() => {
    // When search changes, restart pagination so the user doesn't get an empty page.
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredPromoCodes.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedPromoCodes = filteredPromoCodes.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {tp('title')}
            </div>
            <p className="text-sm text-slate-500">{tp('subtitle')}</p>
          </div>
          <Link
            href="/admin/promo-codes/create"
            className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: '#556622' }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#3d4617')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#556622')}
          >
            <Plus size={18} />
            {tp('newCode')}
          </Link>
        </div>

        <div className="space-y-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{tp('statTotal')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalCodes}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{tp('statActive')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activeCodes}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{tp('statExpired')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.expiredCodes}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{tp('statUsages')}</p>
                <p className="text-2xl font-bold text-slate-900">{stats.totalUsages}</p>
              </div>
            </div>
          </div>
        )}
        {/* Promo Codes Table */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex w-full items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={tp('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {error ? (
            <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-3">
              <CheckCircle2 size={20} />
              <span>{success}</span>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">{tp('loading')}</div>
            ) : filteredPromoCodes.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                {promoCodes.length === 0 ? tp('emptyNone') : tp('emptySearch')}
              </div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-3 py-3 font-medium">{tp('colPromotion')}</th>
                    <th className="px-3 py-3 font-medium">{tp('colDiscount')}</th>
                    <th className="px-3 py-3 font-medium text-center">{tp('colUsages')}</th>
                    <th className="px-3 py-3 font-medium text-center">{tp('colExpiration')}</th>
                    <th className="px-3 py-3 font-medium text-center">{tp('colStatus')}</th>
                    <th className="px-3 py-3 font-medium text-right">{tp('colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedPromoCodes.map((code) => {
                    const expired = isExpired(code.expirationDate);
                    const active = Boolean(code.isActive) && !expired;
                    return (
                      <tr
                        key={code._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-3 py-4 font-medium text-slate-900">
                          {code.name || '-'}
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {code.discountType === 'PERCENTAGE'
                            ? `${code.discountValue}%`
                            : code.discountType === 'FREE_ITEM'
                            ? code.freeItemType === 'PACKAGE'
                              ? tp('discountFreePackage')
                              : tp('discountFreeProduct')
                            : '-'}
                        </td>
                        <td className="px-3 py-4 text-center text-slate-500">
                          {code.usageCount}/{code.usageLimit || '∞'}
                        </td>
                        <td className="px-3 py-4 text-center text-slate-700">
                          <span className={expired ? 'text-red-600 font-bold' : 'text-slate-700 font-medium'}>
                            {formatPromoDate(code.expirationDate)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {active ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            {active ? tp('statusActive') : tp('statusInactive')}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === code._id ? null : code._id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openDropdown === code._id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                              <Link
                                href={`/admin/promo-codes/${code._id}`}
                                className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors w-full text-left"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Edit2 className="h-4 w-4" />
                                {tp('edit')}
                              </Link>
                              <button
                                onClick={() => {
                                  setSelectedCode(code);
                                  setShowDeleteModal(true);
                                  setOpenDropdown(null);
                                }}
                                className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                {tp('delete')}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination (outside the list/table card, like Stock page) */}
        {!loading && filteredPromoCodes.length > 0 ? (
          <div className="flex items-center justify-between text-sm text-slate-500 mt-4">
            <p>
              {tcom('pageOf', { page: safePage, total: totalPages })}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                {tcom('previous')}
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-50"
              >
                {tcom('next')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!selectedCode}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCode(null);
        }}
        onConfirm={handleDelete}
        title={tp('deleteTitle')}
        itemName={selectedCode?.name || '-'}
        description={tp('deleteDescription')}
        isDeleting={deleting}
      />
    </div>
    </div>
    
  );
}

'use client';

import { useState, useEffect } from 'react';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { AlertCircle, CheckCircle2, Plus, Trash2, Edit2, MoreVertical } from 'lucide-react';
import Link from 'next/link';

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

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
      setError('Error loading promo codes');
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
        setSuccess('✅ Promo code deleted!');
        setShowDeleteModal(false);
        setSelectedCode(null);
        fetchPromoCodes();
        fetchStats();
      } else {
        setError(`❌ ${result.message}`);
      }
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  const formatFrenchDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const months = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">Promo Codes</h1>
              <p className="text-gray-600 text-lg">Manage promo codes and discounts</p>
            </div>
            <Link
              href="/admin/promo-codes/create"
              className="flex items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              style={{backgroundColor: '#556622'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}
            >
              <Plus size={20} />
              New Code
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Total Codes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCodes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Active</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeCodes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Expired</p>
              <p className="text-3xl font-bold text-red-600">{stats.expiredCodes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Usages</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsages}</p>
            </div>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-700">
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Promo Codes Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              Loading...
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">No promo code created.</p>
            
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Promotion</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Discount</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Usages</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Expiration</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map(code => (
                  <tr key={code._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold text-gray-900">{code.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {code.discountType === 'PERCENTAGE'
                        ? `${code.discountValue}%`
                        : code.discountType === 'FREE_ITEM'
                        ? (code.freeItemType === 'PACKAGE' ? 'Free package' : 'Free product')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {code.usageCount}/{code.usageLimit || '∞'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <span className={isExpired(code.expirationDate) ? 'text-red-600 font-bold' : ''}>
                        {formatFrenchDate(code.expirationDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        code.isActive && !isExpired(code.expirationDate)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {code.isActive && !isExpired(code.expirationDate) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === code._id ? null : code._id)}
                          className="inline-flex items-center rounded-md p-1 text-slate-600 transition hover:bg-slate-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {openDropdown === code._id && (
                          <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-slate-200 bg-white shadow-lg">
                            <Link
                              href={`/admin/promo-codes/${code._id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedCode(code);
                                setShowDeleteModal(true);
                                setOpenDropdown(null);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!selectedCode}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCode(null);
        }}
        onConfirm={handleDelete}
        title="Delete this promo code?"
        itemName={selectedCode?.name || selectedCode?.code}
        description="This action cannot be undone. All data associated with this code will be deleted."
        isDeleting={deleting}
      />
    </div>
  );
}

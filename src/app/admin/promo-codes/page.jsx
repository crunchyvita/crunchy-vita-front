'use client';

import { useState, useEffect } from 'react';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { AlertCircle, CheckCircle2, Plus, Trash2, Edit2, Eye } from 'lucide-react';
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
      setError('Erreur lors du chargement des codes promo');
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
        setSuccess('✅ Code promo supprimé!');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">Codes Promo</h1>
              <p className="text-gray-600 text-lg">Gérez les codes promo et les réductions</p>
            </div>
            <Link
              href="/admin/promo-codes/create"
              className="flex items-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              style={{backgroundColor: '#556622'}}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}
            >
              <Plus size={20} />
              Nouveau Code
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
              <p className="text-gray-600 text-sm mb-2">Actifs</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeCodes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Expirés</p>
              <p className="text-3xl font-bold text-red-600">{stats.expiredCodes}</p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm mb-2">Utilisations</p>
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-600">
              Chargement...
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">Aucun code promo créé.</p>
            
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Réduction</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Utilisations</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Expiration</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.map(code => (
                  <tr key={code._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{code.code}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {code.discountType === 'PERCENTAGE'
                        ? `${code.discountValue}%`
                        : `€${code.discountValue}`}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {code.usageCount}/{code.usageLimit || '∞'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <span className={isExpired(code.expirationDate) ? 'text-red-600 font-bold' : ''}>
                        {new Date(code.expirationDate).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        code.isActive && !isExpired(code.expirationDate)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {code.isActive && !isExpired(code.expirationDate) ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Link
                        href={`/admin/promo-codes/${code._id}?mode=view`}
                        className="text-white font-bold p-2 rounded-lg transition-colors"
                        style={{backgroundColor: '#556622'}}
                        title="Voir les détails"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/promo-codes/${code._id}`}
                        className="text-amber-600 hover:text-amber-800 font-bold p-2 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Éditer"
                      >
                        <Edit2 size={18} />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedCode(code);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-800 font-bold p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        title="Supprimer ce code promo?"
        itemName={selectedCode?.code}
        description="Cette action ne peut pas être annulée. Toutes les données associées à ce code seront supprimées."
        isDeleting={deleting}
      />
    </div>
  );
}

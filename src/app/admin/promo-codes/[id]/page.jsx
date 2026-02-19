'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';

export default function PromoCodeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchaseAmount: '0',
    usageLimit: '',
    expirationDate: '',
    isActive: true,
  });

  const [promoCode, setPromoCode] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPromoCode();
    // Determine if it's a view or edit based on URL query parameter
    const mode = searchParams.get('mode');
    setIsViewOnly(mode === 'view');
  }, [id, searchParams]);

  const fetchPromoCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promo-codes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setPromoCode(result.data);
        setFormData({
          code: result.data.code,
          discountType: result.data.discountType,
          discountValue: result.data.discountValue.toString(),
          minPurchaseAmount: result.data.minPurchaseAmount.toString(),
          usageLimit: result.data.usageLimit?.toString() || '',
          expirationDate: result.data.expirationDate.split('T')[0],
          isActive: result.data.isActive,
        });
      }
    } catch (err) {
      setError('Erreur lors du chargement du code promo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    if (isViewOnly) return; // Empêcher la modification en mode lecture seule
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewOnly) return; // Empêcher la soumission en mode lecture seule
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      const payload = {
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        expirationDate: formData.expirationDate,
        isActive: formData.isActive,
      };

      const response = await fetch(`${API_URL}/promo-codes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('✅ Code promo mis à jour avec succès!');
        setPromoCode(result.data);
        setTimeout(() => {
          router.push('/admin/promo-codes');
        }, 1500);
      } else {
        setError(`❌ ${result.message}`);
      }
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promo-codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('✅ Code promo supprimé!');
        setTimeout(() => {
          router.push('/admin/promo-codes');
        }, 1500);
      } else {
        setError(`❌ ${result.message}`);
        setShowDeleteModal(false);
      }
    } catch (err) {
      setError(`❌ ${err.message}`);
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin/promo-codes" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium mb-4 transition">
            <ArrowLeft size={18} />
            Retour
          </Link>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{formData.code}</h1>
              <p className="text-sm text-slate-500 mt-1">{isViewOnly ? 'Consultation' : 'Édition du code promo'}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              promoCode?.isActive && !isExpired(formData.expirationDate)
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {promoCode?.isActive && !isExpired(formData.expirationDate) ? 'Actif' : 'Inactif'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-6">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3 text-green-700 text-sm">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-slate-600 text-xs font-medium uppercase tracking-wide mb-1">Réduction</p>
            <p className="text-2xl font-bold text-slate-900">
              {formData.discountType === 'PERCENTAGE'
                ? `${formData.discountValue}%`
                : `€${formData.discountValue}`}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-slate-600 text-xs font-medium uppercase tracking-wide mb-1">Utilisations</p>
            <p className="text-2xl font-bold text-slate-900">{promoCode?.usageCount || 0}/{promoCode?.usageLimit || '∞'}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-slate-600 text-xs font-medium uppercase tracking-wide mb-1">Minimum d'achat</p>
            <p className="text-2xl font-bold text-slate-900">€{formData.minPurchaseAmount}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <p className="text-slate-600 text-xs font-medium uppercase tracking-wide mb-1">Expire</p>
            <p className="text-2xl font-bold text-slate-900">{new Date(formData.expirationDate).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Code Promo</label>
                <div className="px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 font-mono">
                  {formData.code}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type de Réduction</label>
                <div className={`px-4 py-3 border border-slate-300 rounded-lg ${
                  isViewOnly 
                    ? 'bg-slate-50 text-slate-600' 
                    : 'bg-white'
                }`}>
                  {isViewOnly ? (
                    <span>{formData.discountType === 'PERCENTAGE' ? 'Pourcentage (%)' : 'Montant Fixe (€)'}</span>
                  ) : (
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                    >
                      <option value="PERCENTAGE">Pourcentage (%)</option>
                      <option value="FIXED">Montant Fixe (€)</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Valeur de Réduction</label>
                {isViewOnly ? (
                  <div className="px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600">
                    {formData.discountType === 'PERCENTAGE'
                      ? `${formData.discountValue}%`
                      : `€${formData.discountValue}`}
                  </div>
                ) : (
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Montant Min. d'Achat (€)</label>
                {isViewOnly ? (
                  <div className="px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600">
                    €{formData.minPurchaseAmount}
                  </div>
                ) : (
                  <input
                    type="number"
                    name="minPurchaseAmount"
                    value={formData.minPurchaseAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Limite d'Utilisation</label>
                {isViewOnly ? (
                  <div className="px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600">
                    {formData.usageLimit ? `${formData.usageLimit} utilisations` : 'Illimité'}
                  </div>
                ) : (
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="Illimité si vide"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date d'Expiration</label>
                {isViewOnly ? (
                  <div className="px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600">
                    {new Date(formData.expirationDate).toLocaleDateString('fr-FR')}
                  </div>
                ) : (
                  <input
                    type="date"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
                    required
                  />
                )}
              </div>
            </div>

            {/* Status Checkbox */}
            <div className="pt-4 border-t border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  disabled={isViewOnly}
                  className="w-5 h-5 text-slate-600 rounded focus:ring-2"
                />
                <span className="text-sm font-medium text-slate-700">Code actif</span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-6 flex gap-3 border-t border-slate-200">
              {!isViewOnly && (
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-2.5 px-4 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: saving ? '#999999' : '#556622',
                  }}
                  onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#3d4617')}
                  onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#556622')}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </button>
              )}
              <Link
                href="/admin/promo-codes"
                className="flex-1 flex items-center justify-center font-medium py-2.5 px-4 rounded-lg transition-all"
                style={{
                  backgroundColor: isViewOnly ? '#556622' : '#e2e8f0',
                  color: isViewOnly ? 'white' : '#334155'
                }}
              >
                {isViewOnly ? 'Fermer' : 'Annuler'}
              </Link>
              {!isViewOnly && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  title="Supprimer ce code"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer ce code?"
        itemName={formData.code}
        isDeleting={deleting}
      />
    </div>
  );
}

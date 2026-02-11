'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatePromoCodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchaseAmount: '0',
    usageLimit: '',
    expirationDate: '',
    isActive: true,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      };

      const response = await fetch(`${API_URL}/promo-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('✅ Code promo créé avec succès!');
        setTimeout(() => {
          router.push('/admin/promo-codes');
        }, 1500);
      } else {
        setError(`❌ ${result.message}`);
      }
    } catch (err) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/promo-codes" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold mb-4">
            <ArrowLeft size={20} />
            Retour aux codes promo
          </Link>
          <h1 className="text-4xl font-black text-gray-900">Créer un nouveau code promo</h1>
          <p className="text-gray-600 text-lg mt-2">Remplissez les informations ci-dessous pour créer un code promo</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
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

        {/* Form */}
        <div className="bg-white p-8 rounded-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Code Promo *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="PROMO2024"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">Lettres et chiffres uniquement. Sera automatiquement en majuscules.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Type de Réduction *</label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PERCENTAGE">Pourcentage (%)</option>
                  <option value="FIXED">Montant Fixe (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Valeur de Réduction *</label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '5'}
                  step={formData.discountType === 'PERCENTAGE' ? '1' : '0.01'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <p className="text-xs text-gray-600 mt-1">{formData.discountType === 'PERCENTAGE' ? '0-100%' : 'Montant en euros'}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Montant Min. d'Achat (€)</label>
                <input
                  type="number"
                  name="minPurchaseAmount"
                  value={formData.minPurchaseAmount}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-600 mt-1">Montant minimum de panier requis pour utiliser ce code</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Limite d'Utilisation</label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  placeholder="Ex: 100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-600 mt-1">Laisser vide pour illimité</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date d'Expiration *</label>
                <input
                  type="date"
                  name="expirationDate"
                  value={formData.expirationDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2"
                />
                <span className="text-sm font-bold text-gray-700">Activer ce code promo immédiatement</span>
              </label>
            </div>

            <div className="pt-6 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                style={{
                  backgroundColor: loading ? '#999999' : '#556622',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#3d4617')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#556622')}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  'Créer le code promo'
                )}
              </button>
              <Link
                href="/admin/promo-codes"
                className="flex-1 flex items-center justify-center bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

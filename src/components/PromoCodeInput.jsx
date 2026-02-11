'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

export default function PromoCodeInput({ cartTotal, onPromoApplied }) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleValidatePromo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/promo-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          cartTotal: parseFloat(cartTotal),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAppliedPromo(result.data);
        setDiscount(parseFloat(result.data.discount));
        if (onPromoApplied) {
          onPromoApplied({
            code: result.data.code,
            discount: parseFloat(result.data.discount),
          });
        }
        setPromoCode('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur lors de la validation du code promo');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setPromoCode('');
    if (onPromoApplied) {
      onPromoApplied({ code: null, discount: 0 });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Code Promo</h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {appliedPromo ? (
        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-green-900">Code promo appliqué ✓</span>
              <button
                onClick={handleRemovePromo}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-sm text-green-700 mb-2">Code: {appliedPromo.code}</p>
            <div className="text-sm text-green-700 space-y-1">
              <p>Réduction: -€{appliedPromo.discount}</p>
              <p className="font-bold">Nouveau total: €{appliedPromo.finalTotal}</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleValidatePromo} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Entrez votre code promo"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !promoCode}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors"
            >
              {loading ? 'Vérification...' : 'Appliquer'}
            </button>
          </div>
          <p className="text-xs text-gray-600">
            Entrez votre code promo pour bénéficier d'une réduction
          </p>
        </form>
      )}

      {/* Display savings */}
      {discount > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
          <p className="text-sm font-bold text-blue-900">
            Vous économisez €{discount.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}

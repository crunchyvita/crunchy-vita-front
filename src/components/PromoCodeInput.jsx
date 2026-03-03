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
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {appliedPromo ? (
        <div className="p-4 rounded-lg bg-[#556822]/10 border border-[#556822]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#556822]">Code promo appliqué ✓</span>
            <button
              onClick={handleRemovePromo}
              className="text-red-600 hover:text-red-800 transition-colors"
              title="Retirer le code promo"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-1">Code: <span className="font-bold">{appliedPromo.code}</span></p>
          <p className="text-sm text-[#556822] font-bold">Réduction: -{appliedPromo.discount} €</p>
        </div>
      ) : (
        <form onSubmit={handleValidatePromo} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Entrez votre code promo"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-[#556822] focus:ring-2 focus:ring-[#556822]/20 outline-none transition-all text-sm"
            />
            <button
              type="submit"
              disabled={loading || !promoCode}
              className="px-5 py-3 bg-[#556822] hover:bg-[#556822]/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all text-sm"
            >
              {loading ? 'Vérification...' : 'Appliquer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

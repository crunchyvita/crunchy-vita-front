'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Tag, X } from 'lucide-react';

export default function PromoCodeInput({ cartTotal, cartItems = [], onPromoApplied }) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const translatePromoErrorMessage = (message) => {
    const raw = String(message || '').trim();
    const normalized = raw.toLowerCase();

    if (normalized.includes('already used') || normalized.includes('already been used')) {
      return 'Vous avez deja utilise ce code promo';
    }

    return raw;
  };

  // Load promo from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appliedPromoCode');
      if (saved) {
        try {
          setAppliedPromo(JSON.parse(saved));
        } catch (e) {
          localStorage.removeItem('appliedPromoCode');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!onPromoApplied || !appliedPromo) return;

    onPromoApplied({
      code: appliedPromo.code || null,
      discount: Number(appliedPromo.discount || 0),
      discountType: appliedPromo.discountType,
      freeItem: appliedPromo.freeItem || null,
      autoAddedItem: appliedPromo.autoAddedItem || null,
    });
  }, [appliedPromo, onPromoApplied]);

  useEffect(() => {
    const handlePromoCodeCleared = () => {
      setAppliedPromo(null);
      setPromoCode('');
      setError('');
      if (onPromoApplied) {
        onPromoApplied({ code: null, discount: 0 });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('promoCodeCleared', handlePromoCodeCleared);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('promoCodeCleared', handlePromoCodeCleared);
      }
    };
  }, [onPromoApplied]);

  const handleValidatePromo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await fetch(`${API_URL}/promo-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          code: promoCode,
          cartTotal: parseFloat(cartTotal),
          cartItems: Array.isArray(cartItems) ? cartItems : [],
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Save promo to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('appliedPromoCode', JSON.stringify(result.data));
        }
        setAppliedPromo(result.data);

        if (result.data?.autoAddedItem && typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cartNeedsReload'));
        }

        if (onPromoApplied) {
          onPromoApplied({
            code: result.data.code,
            discount: Number(result.data.discount || 0),
            discountType: result.data.discountType,
            freeItem: result.data.freeItem || null,
            autoAddedItem: result.data.autoAddedItem || null,
          });
        }
        setPromoCode('');
      } else {
        setError(translatePromoErrorMessage(result.message));

        const normalizedMessage = String(result?.message || '').toLowerCase();
        const isAlreadyUsedError =
          normalizedMessage.includes('already been used')
          || normalizedMessage.includes('deja utilise')
          || normalizedMessage.includes('déjà utilisé');

        if (isAlreadyUsedError) {
          setPromoCode('');
        }
      }
    } catch (err) {
      setError('Erreur lors de la validation du code promo');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromo = async () => {
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('appliedPromoCode');
    }

    // Remove free gifted items from cart when promo is removed
    const freeItems = Array.isArray(cartItems)
      ? cartItems.filter((item) => item?.isFreeItem === true && item?._id)
      : [];

    if (freeItems.length > 0) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        await Promise.all(
          freeItems.map((item) =>
            fetch(`${API_URL}/cart/items/${item._id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              credentials: 'include',
            })
          )
        );
      } catch (err) {
        console.error('Failed to remove gifted item(s) after promo removal:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartNeedsReload'));
      window.dispatchEvent(new Event('promoCodeCleared'));
    }

    setAppliedPromo(null);
    setPromoCode('');
    setError('');
    if (onPromoApplied) {
      onPromoApplied({ code: null, discount: 0 });
    }
  };

  return (
    <div className="space-y-4">
      {!appliedPromo && (
        <form onSubmit={handleValidatePromo} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                if (error) setError('');
              }}
              placeholder="Discount code or gift card"
              disabled={loading}
              className="flex-1 px-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:bg-white focus:border-[#556822] focus:ring-2 focus:ring-[#556822]/20 outline-none transition-all text-[15px] disabled:bg-gray-100 disabled:text-gray-400"
            />
            <button
              type="submit"
              disabled={loading || !promoCode.trim()}
              className="px-5 py-3.5 bg-[#556822] hover:bg-[#44591a] disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-[15px] min-w-24"
            >
              {loading ? 'Checking...' : 'Apply'}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[#F7EFE5] border border-[#EDCFAB] flex items-start justify-between gap-3 text-[#4C3820] text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-[#4C3820]/70 hover:text-[#4C3820] transition-colors"
            aria-label="Dismiss promo code error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {appliedPromo && (
        <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 border border-gray-200">
          <Tag size={16} className="text-[#556822]" />
          <span className="font-semibold text-gray-800">{appliedPromo.code}</span>
          <button
            type="button"
            onClick={handleRemovePromo}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Remove promo code"
          >
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
}

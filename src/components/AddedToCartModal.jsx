'use client';

import React, { useEffect } from 'react';
import { X, ShoppingBag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

const pickUrl = (value) => {
  if (!value || value === 'undefined') return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value.url || value.secure_url || null;
  return null;
};

export default function AddedToCartModal({ isOpen, onClose, product, quantity }) {
  const locale = useLocale();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isPackage = product.type === 'package' || !!product.packageId;

  const imageUrl = isPackage
    ? pickUrl(product.image) ||
      pickUrl(product.packageImage) ||
      pickUrl(product.package?.image) ||
      pickUrl(product.packageId?.image) ||
      pickUrl(product.imageUrl) ||
      pickUrl(product.packageImages?.[0])
    : pickUrl(product.image) ||
      pickUrl(product.imageUrl) ||
      pickUrl(product.media?.[0]?.url) ||
      pickUrl(product.productImage);

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-end p-4 pointer-events-none">
      <div className="relative w-full max-w-sm bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right duration-300 font-[Maison_Neue] pointer-events-auto mt-16">
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#556822]">
            <CheckCircle2 size={16} />
            <span className="font-bold text-[10px] uppercase tracking-widest">Added to cart</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 flex gap-4 items-start">
          <div className="shrink-0">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className={`w-full h-full ${isPackage ? 'object-cover' : 'object-contain p-1'}`}
                />
              ) : (
                <ShoppingBag size={24} className="text-gray-200" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#556822] leading-tight mb-0.5 font-[agrandir] truncate">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mb-1">
              Qty: <span className="font-bold text-gray-900">{quantity}</span>
            </p>
            {product.price && (
              <p className="text-xs font-bold text-[#E10C69]">
                {(Number(product.price) * Number(quantity)).toFixed(2)} €
              </p>
            )}
          </div>
        </div>

        <div className="p-3 bg-gray-50 flex flex-col gap-2">
          <Link
            href={`/${locale}/cart`}
            onClick={onClose}
            style={{ backgroundColor: '#556822' }}
            className="w-full text-white py-2.5 rounded-full font-black text-center text-[13px] tracking-widest hover:opacity-90 transition-opacity"
          >
            View Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
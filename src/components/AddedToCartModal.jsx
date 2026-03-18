'use client';

import React, { useEffect } from 'react';
import { X, ShoppingBag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export default function AddedToCartModal({ isOpen, onClose, product, quantity }) {
    const locale = useLocale();

    const pickUrl = (v) => {
        if (!v || v === 'undefined') return null;
        if (typeof v === 'string') return v;
        if (typeof v === 'object') return v.url || v.secure_url || null;
        return null;
    };

    // Auto-dismiss after 3 seconds
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen || !product) return null;

    // Check if it's a package item
    const isPackage = product.type === 'package' || !!product.packageId;

    // Main package image (preferred display for package)
    const packageMainImage = pickUrl(product.image) || pickUrl(product.imageUrl);

    // Grid fallback images when package has no main image
    const packageImages = isPackage
        ? [
            ...(Array.isArray(product.packageImages) ? product.packageImages : []),
            ...(Array.isArray(product.selectedProducts)
                ? product.selectedProducts
                    .map((sp) => pickUrl(sp?.image) || pickUrl(sp?.product?.image) || pickUrl(sp?.product?.imageUrl))
                    .filter(Boolean)
                : []),
        ]
        : [];

    const uniquePackageImages = [...new Set(packageImages)].slice(0, 4);

    // Get single image for products
    const imageUrl = product.image ||
        product.imageUrl ||
        (product.media && product.media[0]?.url) ||
        (product.productImage);

    return (
        <div className="fixed inset-0 z-[1000] flex items-start justify-end p-4 pointer-events-none">
            {/* Modal Container */}
            <div
                className="relative w-full max-w-sm bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right duration-300 font-[Maison_Neue] pointer-events-auto mt-16"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-[#556822]">
                        <CheckCircle2 size={16} />
                        <span className="font-bold text-[10px] uppercase tracking-widest">Added to cart</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Product Content */}
                <div className="p-4 flex gap-4 items-start">
                    {/* Images Section */}
                    <div className="shrink-0">
                        {isPackage ? (
                            packageMainImage ? (
                                <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-gray-50 rounded">
                                    <img
                                        src={packageMainImage}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-1"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-1 w-20">
                                    {uniquePackageImages.length > 0 ? (
                                        <>
                                            {uniquePackageImages.map((img, idx) => (
                                                <div key={idx} className="bg-gray-50 overflow-hidden rounded-sm aspect-square">
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="col-span-2 row-span-2 bg-gray-100 rounded-md flex items-center justify-center h-20">
                                            <ShoppingBag size={20} className="text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            )
                        ) : (
                            // Single product image
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-gray-50 rounded">
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-contain p-1"
                                    />
                                ) : (
                                    <ShoppingBag size={24} className="text-gray-200" />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
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

                {/* Action Buttons */}
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
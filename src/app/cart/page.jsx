'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/navigation';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PromoBadge from '@/components/PromoBadge';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// ✅ Safe extraction (Cloudinary string OR object)
const pickUrl = (v) => {
  if (!v || v === 'undefined') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.url || v.secure_url || null;
  return null;
};

// ✅ Same priority as your shop/page
const getProductImageUrlSafe = (product) => {
  if (!product) return null;
  return (
    pickUrl(product.image) ||
    pickUrl(product.imageUrl) ||
    pickUrl(product.media?.[0]?.url) ||
    pickUrl(product.media?.[0]) ||
    pickUrl(product.productImage) ||
    null
  );
};

export default function CartPage() {
  const t = useTranslations('Cart');
  const locale = useLocale(); // keep
  const router = useRouter(); // keep
  const { cartItems, removeFromCart, updateQuantity, subtotal, shipping, total, isLoading } = useCart();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#556822]"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 font-[Maison_Neue]">
      <Header />
      <PromoBadge />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-500 mb-8">{t('breadcrumb')}</nav>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-grow bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-black text-[#556822] font-[agrandir]">{t('title')}</h1>
              <span className="text-gray-500 text-sm">
                {isEmpty ? (
                  <span>{t('emptyTitle')}</span>
                ) : (
                  <span>
                    {cartItems.length} {cartItems.length === 1 ? t('item') : t('items')}
                  </span>
                )}
              </span>
            </div>

            {isEmpty ? (
              <div className="text-center py-20">
                <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-6">{t('emptyTitle')}</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-[#556822] text-white px-6 py-3 rounded-full font-bold hover:bg-[#3d4617] transition-all"
                >
                  {t('actions.continueShopping')} <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const isPackage =
                    item?.type === 'package' ||
                    Boolean(item?.packageId) ||
                    (Array.isArray(item?.selectedProducts) && item.selectedProducts.length > 0);

                  // ✅ Package cover image (from package page fix)
                  const coverImage = pickUrl(item?.image);

                  // ✅ Thumbnails from selectedProducts (your saved structure)
                  const thumbs = isPackage
                    ? (item.selectedProducts || [])
                        .map((sp) => {
                          // 1) explicit saved thumbnail
                          const direct = pickUrl(sp?.image);
                          if (direct) return direct;

                          // 2) fallback from product object
                          const prod = sp?.product || sp?.productId || null;
                          return getProductImageUrlSafe(prod);
                        })
                        .filter(Boolean)
                    : [];

                  // Regular product image
                  const normalImage = pickUrl(item?.image);

                  return (
                    <div key={item._id} className="py-6 flex items-center gap-4">
                      {/* ✅ IMAGES */}
                      {isPackage ? (
                        <div className="flex gap-3 flex-shrink-0">
                          {/* Cover */}
                          <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {coverImage ? (
                              <img src={coverImage} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <ShoppingBag size={32} className="text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Thumbnails */}
                          <div className="hidden sm:flex gap-1 items-center">
                            {thumbs.slice(0, 3).map((img, idx) => (
                              <div
                                key={`${item._id}-thumb-${idx}`}
                                className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden"
                              >
                                <img src={img} alt={`thumb-${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {thumbs.length > 3 && (
                              <div className="w-10 h-10 bg-gray-900/80 rounded-md flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">+{thumbs.length - 3}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {normalImage ? (
                            <img src={normalImage} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ShoppingBag size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-grow">
                        <h3 className="font-black text-[#556822] mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {t('products.price')}: €{item.price.toFixed(2)}
                        </p>
                      </div>

                      {/* Qty */}
                      <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                          className="text-gray-500 hover:text-black transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="text-gray-500 hover:text-black transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Total */}
                      <div className="w-20 text-right font-black text-[#E10C69]">
                        €{(item.price * item.quantity).toFixed(2)}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title={t('actions.remove')}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('summary.title')}</h2>

              {isEmpty ? (
                <p className="text-sm text-gray-500">{t('summary.empty')}</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{t('summary.subtotal')}</span>
                    <span className="font-bold text-gray-900">€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{t('summary.shipping')}</span>
                    <span className="font-bold text-gray-900">€{shipping.toFixed(2)}</span>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="flex justify-between text-lg font-black text-[#556822] pb-4">
                    <span>{t('summary.total')}</span>
                    <span className="text-[#E10C69]">€{total.toFixed(2)}</span>
                  </div>

                  <button
                    style={{ backgroundColor: '#556822' }}
                    disabled={isEmpty}
                    className="w-full text-white py-3 rounded-md font-bold hover:opacity-90 transition-opacity mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('actions.checkout')}
                  </button>

                  <Link
                    href="/shop"
                    className="block w-full bg-white border border-gray-200 text-[#556822] py-3 rounded-md font-bold hover:bg-gray-50 transition-colors text-center"
                  >
                    {t('actions.continueShopping')}
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

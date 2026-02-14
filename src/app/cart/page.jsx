'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/navigation';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PromoBadge from '@/components/PromoBadge';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// ✅ Helpers (Kept as is for functionality)
const pickUrl = (v) => {
  if (!v || v === 'undefined') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.url || v.secure_url || null;
  return null;
};

const getProductImageUrl = (product) => {
  if (!product) return null;
  const direct = pickUrl(product.imageUrl) || pickUrl(product.image) || pickUrl(product.productImage);
  if (direct) return direct;
  const media = product.media;
  if (Array.isArray(media) && media.length > 0) {
    const first = media[0];
    return pickUrl(first?.url) || pickUrl(first) || pickUrl(first?.secure_url) || null;
  }
  const images = product.images;
  if (Array.isArray(images) && images.length > 0) {
    return pickUrl(images[0]?.url) || pickUrl(images[0]) || null;
  }
  return null;
};

const isPackageItem = (item) => {
  if (!item) return false;
  return item.type === 'package' || !!item.packageId || (Array.isArray(item.selectedProducts) && item.selectedProducts.length > 0);
};

const extractPackageProductIds = (item) => {
  const sp = item?.selectedProducts;
  if (!Array.isArray(sp) || sp.length === 0) return [];
  if (typeof sp[0] === 'string') return sp.filter(Boolean);
  return sp.map((x) => {
    if (!x) return null;
    if (typeof x === 'string') return x;
    const pid = x.productId;
    if (typeof pid === 'string') return pid;
    if (typeof pid === 'object' && pid?._id) return pid._id;
    if (x?.product?._id) return x.product._id;
    if (x?._id) return x._id;
    return null;
  }).filter(Boolean);
};

const getCartItemImagesLocal = (item) => {
  const isPackage = isPackageItem(item);
  if (!isPackage) {
    const one = pickUrl(item?.image);
    return one ? [one] : [];
  }
  let imgs = Array.isArray(item?.packageImages) ? item.packageImages.map(pickUrl).filter(Boolean) : [];
  if (imgs.length === 0 && Array.isArray(item?.selectedProducts)) {
    imgs = item.selectedProducts.map((sp) => {
      const direct = pickUrl(sp?.image);
      if (direct) return direct;
      return getProductImageUrl(sp?.product);
    }).filter(Boolean);
  }
  const seen = new Set();
  const unique = [];
  for (const u of imgs) {
    if (!seen.has(u)) {
      seen.add(u);
      unique.push(u);
    }
  }
  return unique;
};

export default function CartPage() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const router = useRouter();
  const { cartItems, removeFromCart, updateQuantity, subtotal, shipping, total, isLoading } = useCart();
  const [remotePackageImages, setRemotePackageImages] = useState({});

  const API_URL = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', []);

  useEffect(() => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;
    let cancelled = false;
    const loadMissingPackageImages = async () => {
      const packagesNeedingFetch = cartItems.filter((item) => {
        if (!isPackageItem(item)) return false;
        return getCartItemImagesLocal(item).length === 0 && !remotePackageImages[item._id];
      });
      if (packagesNeedingFetch.length === 0) return;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const results = await Promise.all(packagesNeedingFetch.map(async (item) => {
          const ids = extractPackageProductIds(item);
          if (ids.length === 0) return [item._id, []];
          const prods = await Promise.all(ids.slice(0, 12).map(async (id) => {
            try {
              const res = await fetch(`${API_URL}/products/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: 'no-store',
              });
              if (!res.ok) return null;
              const json = await res.json();
              return json?.data || json;
            } catch { return null; }
          }));
          const imgs = prods.filter(Boolean).map((p) => getProductImageUrl(p)).filter(Boolean);
          const seen = new Set();
          const unique = [];
          for (const u of imgs) { if (!seen.has(u)) { seen.add(u); unique.push(u); } }
          return [item._id, unique];
        }));
        if (cancelled) return;
        setRemotePackageImages((prev) => {
          const next = { ...prev };
          for (const [key, imgs] of results) { next[key] = imgs; }
          return next;
        });
      } catch {}
    };
    loadMissingPackageImages();
    return () => { cancelled = true; };
  }, [cartItems, API_URL]);

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
                {isEmpty ? t('emptyTitle') : `${cartItems.length} ${cartItems.length === 1 ? t('item') : t('items')}`}
              </span>
            </div>

            {isEmpty ? (
              <div className="text-center py-20">
                <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-6">{t('emptyTitle')}</p>
                <Link href="/shop" className="inline-flex items-center gap-2 bg-[#556822] text-white px-6 py-3 rounded-full font-bold hover:bg-[#3d4617] transition-all">
                  {t('actions.continueShopping')} <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const isPackage = isPackageItem(item);
                  const localImgs = getCartItemImagesLocal(item);
                  const images = isPackage && localImgs.length === 0 ? (remotePackageImages[item._id] || []) : localImgs;

                  return (
                    <div key={item._id} className="py-6 flex items-center gap-6">
                      
                      {/* --- START UPDATED IMAGE DISPLAY --- */}
                      <div className="flex-shrink-0 flex items-center justify-center bg-transparent">
                        {isPackage ? (
                          <div className="grid grid-cols-2 gap-1 w-28">
                            {images.length > 0 ? (
                              <>
                                {images.map((img, idx) => (
                                  <div key={idx} className="bg-gray-50 overflow-hidden rounded-sm">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="col-span-2 row-span-2 bg-gray-100 rounded-md flex items-center justify-center">
                                <ShoppingBag size={24} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-20 h-24 bg-transparent overflow-hidden">
                            {images[0] ? (
                              <img src={images[0]} alt={item.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                <ShoppingBag size={24} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {/* --- END UPDATED IMAGE DISPLAY --- */}

                      <div className="flex-grow">
                        <h3 className="font-bold text-[#556822] text-lg mb-0.5">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {t('products.price')}: €{Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <button onClick={() => updateQuantity(item._id, Math.max(1, (item.quantity || 1) - 1))} className="text-gray-400 hover:text-black">
                          <Minus size={14} />
                        </button>
                        <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)} className="text-gray-400 hover:text-black">
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="w-24 text-right font-black text-[#E10C69] text-lg">
                        €{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                      </div>

                      <button onClick={() => removeFromCart(item._id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('summary.title')}</h2>
              {!isEmpty && (
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{t('summary.subtotal')}</span>
                    <span className="font-bold text-gray-900">€{Number(subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{t('summary.shipping')}</span>
                    <span className="font-bold text-gray-900">€{Number(shipping || 0).toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-lg font-black text-[#556822] pb-4">
                    <span>{t('summary.total')}</span>
                    <span className="text-[#E10C69]">€{Number(total || 0).toFixed(2)}</span>
                  </div>
                  <Link
                    href={`/${locale}/checkout`}
                    style={{ backgroundColor: '#556822' }}
                    className="block w-full text-white py-3 rounded-md font-bold hover:opacity-90 transition-opacity mb-3 text-center"
                  >
                    {t('actions.checkout')}
                  </Link>
                  <Link href="/shop" className="block w-full bg-white border border-gray-200 text-[#556822] py-3 rounded-md font-bold hover:bg-gray-50 transition-colors text-center">
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
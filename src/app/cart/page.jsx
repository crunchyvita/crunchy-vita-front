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

// ✅ same mechanism, safer extraction for string/object
const pickUrl = (v) => {
  if (!v || v === 'undefined') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.url || v.secure_url || null;
  return null;
};

const getProductImageUrl = (product) => {
  if (!product) return null;

  const direct =
    pickUrl(product.imageUrl) ||
    pickUrl(product.image) ||
    pickUrl(product.productImage);

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

// ✅ IMPORTANT FIX: package detection (because "type" might be lost in storage/useCart)
const isPackageItem = (item) => {
  if (!item) return false;
  return (
    item.type === 'package' ||
    !!item.packageId ||
    (Array.isArray(item.selectedProducts) && item.selectedProducts.length > 0)
  );
};

// ✅ get product ids from ANY package selectedProducts shape
const extractPackageProductIds = (item) => {
  const sp = item?.selectedProducts;
  if (!Array.isArray(sp) || sp.length === 0) return [];

  // case A: ["id1","id2"]
  if (typeof sp[0] === 'string') return sp.filter(Boolean);

  // case B: [{productId:"id1"}, ...] OR [{productId:{_id:"id1"}}] OR [{product:{_id:"id1"}}]
  const ids = sp
    .map((x) => {
      if (!x) return null;
      if (typeof x === 'string') return x;

      const pid = x.productId;
      if (typeof pid === 'string') return pid;
      if (typeof pid === 'object' && pid?._id) return pid._id;

      if (x?.product?._id) return x.product._id;
      if (x?._id) return x._id;

      return null;
    })
    .filter(Boolean);

  return ids;
};

// ✅ build images for cart item (package: multi, product: single) from local stored data only
const getCartItemImagesLocal = (item) => {
  const isPackage = isPackageItem(item);

  if (!isPackage) {
    const one = pickUrl(item?.image);
    return one ? [one] : [];
  }

  // 1) BEST: packageImages stored by package page
  let imgs = Array.isArray(item?.packageImages)
    ? item.packageImages.map(pickUrl).filter(Boolean)
    : [];

  // 2) fallback: selectedProducts images (each sp.image or product fields)
  if (imgs.length === 0 && Array.isArray(item?.selectedProducts)) {
    imgs = item.selectedProducts
      .map((sp) => {
        const direct = pickUrl(sp?.image);
        if (direct) return direct;

        const product = sp?.product;
        if (!product) return null;

        return getProductImageUrl(product);
      })
      .filter(Boolean);
  }

  // dedupe while keeping order
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

  // ✅ remote images loaded for packages when local data doesn't have images
  const [remotePackageImages, setRemotePackageImages] = useState({}); // key: item._id -> [urls]

  const API_URL = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    []
  );

  useEffect(() => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;

    let cancelled = false;

    const loadMissingPackageImages = async () => {
      const packagesNeedingFetch = cartItems.filter((item) => {
        if (!isPackageItem(item)) return false;

        const localImgs = getCartItemImagesLocal(item);
        const already = remotePackageImages[item._id];

        // fetch only if we have no local images AND not already fetched
        return localImgs.length === 0 && !already;
      });

      if (packagesNeedingFetch.length === 0) return;

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const results = await Promise.all(
          packagesNeedingFetch.map(async (item) => {
            const ids = extractPackageProductIds(item);
            if (ids.length === 0) return [item._id, []];

            const prods = await Promise.all(
              ids.slice(0, 12).map(async (id) => {
                try {
                  // ✅ IMPORTANT: use your real endpoint (you have productAPI.getById => /products/:id)
                  const res = await fetch(`${API_URL}/products/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    cache: 'no-store',
                  });
                  if (!res.ok) return null;
                  const json = await res.json();
                  return json?.data || json;
                } catch {
                  return null;
                }
              })
            );

            const imgs = prods
              .filter(Boolean)
              .map((p) => getProductImageUrl(p))
              .filter(Boolean);

            // dedupe
            const seen = new Set();
            const unique = [];
            for (const u of imgs) {
              if (!seen.has(u)) {
                seen.add(u);
                unique.push(u);
              }
            }

            return [item._id, unique];
          })
        );

        if (cancelled) return;

        setRemotePackageImages((prev) => {
          const next = { ...prev };
          for (const [key, imgs] of results) {
            next[key] = imgs;
          }
          return next;
        });
      } catch {
        // ignore errors, UI will fallback to placeholder
      }
    };

    loadMissingPackageImages();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, API_URL]); // keep as-is

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
                  const isPackage = isPackageItem(item);

                  // ✅ 1) local images
                  const localImgs = getCartItemImagesLocal(item);

                  // ✅ 2) remote fetched images if local missing
                  const images =
                    isPackage && localImgs.length === 0
                      ? (remotePackageImages[item._id] || [])
                      : localImgs;

                  return (
                    <div key={item._id} className="py-6 flex items-center gap-4">
                      {/* Image(s) */}
                      {isPackage ? (
                        <div className="flex gap-1 flex-shrink-0">
                          {images.length > 0 ? (
                            <>
                              {images.slice(0, 4).map((img, idx) => (
                                <div
                                  key={`${item._id}_${idx}`}
                                  className="w-16 h-20 bg-gray-100 rounded-md overflow-hidden"
                                >
                                  <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {images.length > 4 && (
                                <div className="w-16 h-20 bg-gray-900/80 rounded-md flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">+{images.length - 4}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                              <ShoppingBag size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {images[0] ? (
                            <img src={images[0]} alt={item?.name || 'Product'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <ShoppingBag size={32} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-grow">
                        <h3 className="font-black text-[#556822] mb-1">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {t('products.price')}: €{Number(item.price || 0).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item._id, Math.max(1, (item.quantity || 1) - 1))}
                          className="text-gray-500 hover:text-black transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)}
                          className="text-gray-500 hover:text-black transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="w-20 text-right font-black text-[#E10C69]">
                        €{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                      </div>

                      {/* Remove Button */}
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

          {/* Order Summary */}
          <aside className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-black text-[#556822] mb-6 font-[agrandir]">{t('summary.title')}</h2>

              {isEmpty ? (
                <p className="text-sm text-gray-500">{t('summary.empty')}</p>
              ) : (
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

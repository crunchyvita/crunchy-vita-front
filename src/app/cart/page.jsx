'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PromoBadge from '@/components/PromoBadge';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslatedProduct } from '@/lib/productTranslations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  return (
    item.type === 'package' ||
    !!item.packageId ||
    (Array.isArray(item.selectedProducts) && item.selectedProducts.length > 0)
  );
};

const extractPackageProductIds = (item) => {
  const sp = item?.selectedProducts;
  if (!Array.isArray(sp) || sp.length === 0) return [];
  if (typeof sp[0] === 'string') return sp.filter(Boolean);
  return sp
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
};

const getCartItemImagesLocal = (item) => {
  const isPackage = isPackageItem(item);
  if (!isPackage) {
    const one = pickUrl(item?.image);
    return one ? [one] : [];
  }
  let imgs = Array.isArray(item?.packageImages)
    ? item.packageImages.map(pickUrl).filter(Boolean)
    : [];
  if (imgs.length === 0 && Array.isArray(item?.selectedProducts)) {
    imgs = item.selectedProducts
      .map((sp) => {
        const direct = pickUrl(sp?.image);
        if (direct) return direct;
        return getProductImageUrl(sp?.product);
      })
      .filter(Boolean);
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

const getItemAvailableStock = async (item, API_URL) => {
  // ✅ Fetch FRESH stock data (never use stale snapshots from cart)
  const productId = (typeof item?.productId === 'object' ? item.productId?._id : item?.productId) || null;
  if (!productId) return null;

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_URL}/products/${productId}/stock`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!response.ok) return null;
    const result = await response.json();
    const stock = result?.data || result;
    if (!stock) return null;

    // Return the TOTAL quantity (absolute max for this product)
    return {
      quantityTotal: Number(stock.quantity || 0),
      availableQuantity: stock.availableQuantity !== undefined 
        ? Number(stock.availableQuantity || 0)
        : Math.max(0, Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0))
    };
  } catch (err) {
    console.error('Failed to fetch stock:', err);
    return null;
  }
};

export default function CartPage() {
  const t = useTranslations('Cart');
  const locale = useLocale();
  const { cartItems, removeFromCart, updateQuantity, subtotal, shipping, total, isLoading, error, stockAlertTick } =
    useCart();

  const [remotePackageImages, setRemotePackageImages] = useState({});
  const [stockAlertOpen, setStockAlertOpen] = useState(false);
  const [stockAlertMessage, setStockAlertMessage] = useState('');
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  // ✅ instant UI quantity map (fix successive clicks)
  const [uiQty, setUiQty] = useState({});
  const itemCooldownUntilRef = useRef(new Map());

  // ✅ Cache fresh stock data for each item to show accurate maxAllowed
  const [freshStockData, setFreshStockData] = useState({});

  const API_URL = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api', []);

  // ✅ sync uiQty with cartItems (server/optimistic)
  useEffect(() => {
    const next = {};
    for (const it of cartItems || []) {
      if (it?._id) next[it._id] = Number(it.quantity || 1);
    }
    setUiQty(next);
  }, [cartItems]);

  // ✅ Fetch fresh stock data for all cart items (for accurate max validation)
  useEffect(() => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) return;
    let cancelled = false;

    const loadFreshStock = async () => {
      const updates = {};
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      for (const item of cartItems) {
        if (!item?._id) continue;

        // For product items, fetch stock for the product
        if (!isPackageItem(item)) {
          const productId = typeof item?.productId === 'object' ? item.productId?._id : item?.productId;
          if (!productId) continue;

          try {
            const res = await fetch(`${API_URL}/products/${productId}/stock`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              credentials: 'include',
            });
            if (res.ok) {
              const result = await res.json();
              const stock = result?.data || result;
              if (stock) {
                updates[item._id] = {
                  quantityTotal: Number(stock.quantity || 0),
                  availableQuantity: stock.availableQuantity !== undefined 
                    ? Number(stock.availableQuantity || 0)
                    : Math.max(0, Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0))
                };
              }
            }
          } catch (err) {
            console.error(`Failed to fetch stock for product ${productId}:`, err);
          }
        } else {
          // ✅ For package items: validate each product considering its quantity per package
          const selectedProducts = item.selectedProducts || [];
          if (selectedProducts.length === 0) continue;

          let minMaxAllowed = Infinity;
          const currentPackageQty = item.quantity || 1;

          for (const sp of selectedProducts) {
            const productId = typeof sp.productId === 'string' ? sp.productId : sp.productId?._id;
            if (!productId) continue;

            const qtyPerPackage = sp.quantity || 1;
            const currentReservedByThisPackage = currentPackageQty * qtyPerPackage;

            try {
              const res = await fetch(`${API_URL}/products/${productId}/stock`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                credentials: 'include',
              });
              if (res.ok) {
                const result = await res.json();
                const stock = result?.data || result;
                if (stock) {
                  const available = stock.availableQuantity !== undefined 
                    ? Number(stock.availableQuantity || 0)
                    : Math.max(0, Number(stock.quantity || 0) - Number(stock.reservedQuantity || 0));
                  
                  // ✅ Calculate max packages: (available + already reserved by this package) / qty per package
                  const maxPackagesForThisProduct = Math.floor((available + currentReservedByThisPackage) / qtyPerPackage);
                  minMaxAllowed = Math.min(minMaxAllowed, maxPackagesForThisProduct);
                }
              }
            } catch (err) {
              console.error(`Failed to fetch stock for package product ${productId}:`, err);
            }
          }

          if (minMaxAllowed !== Infinity) {
            updates[item._id] = {
              quantityTotal: minMaxAllowed,
              availableQuantity: Math.max(0, minMaxAllowed - currentPackageQty)
            };
          }
        }
      }

      if (!cancelled && Object.keys(updates).length > 0) {
        setFreshStockData(prev => ({ ...prev, ...updates }));
      }
    };

    loadFreshStock();
    return () => { cancelled = true; };
  }, [cartItems, API_URL]);

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

        const results = await Promise.all(
          packagesNeedingFetch.map(async (item) => {
            const ids = extractPackageProductIds(item);
            if (ids.length === 0) return [item._id, []];

            const prods = await Promise.all(
              ids.slice(0, 12).map(async (id) => {
                try {
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
          for (const [key, imgs] of results) next[key] = imgs;
          return next;
        });
      } catch {}
    };

    loadMissingPackageImages();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, API_URL]);

  // ✅ keep your server stock error alert (only if backend rejects)
  useEffect(() => {
    if (!error || typeof error !== 'string') return;
    if (!error.toLowerCase().includes('insufficient stock')) return;

    setStockAlertMessage(error);
    setStockAlertOpen(true);

    const timer = setTimeout(() => {
      setStockAlertOpen(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [error, stockAlertTick]);

  useEffect(() => {
    if (!isLoading && !hasInitialLoad) {
      setHasInitialLoad(true);
    }
  }, [isLoading, hasInitialLoad]);

  if (!hasInitialLoad && isLoading) {
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

        {stockAlertOpen && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stock limit reached</AlertTitle>
            <AlertDescription>{stockAlertMessage || 'Insufficient stock for this product'}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="grow bg-white rounded-lg shadow-sm p-6">
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

                  const localImgs = getCartItemImagesLocal(item);
                  const images =
                    isPackage && localImgs.length === 0 ? remotePackageImages[item._id] || [] : localImgs;

                  const sourceProduct = item?.product || (typeof item?.productId === 'object' ? item.productId : null);
                  const translatedName = sourceProduct ? getTranslatedProduct(sourceProduct, locale).name : null;
                  const displayName = translatedName || item.name;

                  const currentQty = uiQty[item._id] ?? Number(item.quantity || 1);

                  // ✅ Use fresh stock data (fetched async) for accurate max validation
                  const stockInfo = freshStockData[item._id];
                  // ✅ CORRECT: maxAllowed = available + current (since current is already reserved)
                  const maxAllowed = stockInfo 
                    ? (stockInfo.availableQuantity || 0) + currentQty
                    : null;

                  // ✅ BLOCK MODE: disable + at max
                  const atMax = maxAllowed !== null && Number(currentQty) >= Number(maxAllowed);

                  return (
                    <div key={item._id} className="py-6 flex items-center gap-6">
                      {/* Images */}
                      <div className="shrink-0 flex items-center justify-center bg-transparent">
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

                      <div className="grow">
                        <h3 className="font-bold text-[#556822] text-lg mb-0.5">{displayName}</h3>
                        <p className="text-sm text-gray-500">
                          {t('products.price')}: {Number(item.price || 0).toFixed(2)} €
                        </p>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <button
                          onClick={async () => {
                            const nextQty = Math.max(1, (uiQty[item._id] ?? (item.quantity || 1)) - 1);
                            setUiQty((prev) => ({ ...prev, [item._id]: nextQty }));
                            const ok = await updateQuantity(item._id, nextQty);
                            if (!ok) {
                              setUiQty((prev) => ({ ...prev, [item._id]: uiQty[item._id] ?? (item.quantity || 1) }));
                            }
                          }}
                          className="text-gray-400 hover:text-black"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="w-4 text-center font-bold text-sm">{currentQty}</span>

                        <button
                          // ✅ SOFT BLOCK: if at max, show alert (no visual disabled state for better UX)
                          onClick={async () => {
                            if (atMax) {
                              setStockAlertMessage('Insufficient stock for this product');
                              setStockAlertOpen(true);
                              setTimeout(() => setStockAlertOpen(false), 3000);
                              return;
                            }

                            const now = Date.now();
                            const cooldownUntil = itemCooldownUntilRef.current.get(item._id) || 0;
                            if (now < cooldownUntil) return;
                            itemCooldownUntilRef.current.set(item._id, now + 500);

                            const baseQty = uiQty[item._id] ?? (item.quantity || 1);
                            const nextQty = Number(baseQty) + 1;

                            // ✅ Clamp to maxAllowed (safety measure: should not be needed since hook also validates)
                            const clampedQty = maxAllowed === null ? nextQty : Math.min(nextQty, maxAllowed);

                            // if clamp didn’t change => already at max => do nothing
                            if (clampedQty === baseQty) return;

                            setUiQty((prev) => ({ ...prev, [item._id]: clampedQty }));
                            const ok = await updateQuantity(item._id, clampedQty);
                            if (!ok) {
                              setUiQty((prev) => ({ ...prev, [item._id]: baseQty }));
                            }
                          }}
                          disabled={false}
                          className="text-gray-400 hover:text-black"
                          title="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="w-24 text-right font-black text-[#E10C69] text-lg">
                        {(Number(item.price || 0) * Number(currentQty || 0)).toFixed(2)} €
                      </div>

                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
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
                    <span className="font-bold text-gray-900">{Number(subtotal || 0).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{t('summary.shipping')}</span>
                    <span className="font-bold text-gray-900">{Number(shipping || 0).toFixed(2)} €</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-lg font-black text-[#556822] pb-4">
                    <span>{t('summary.total')}</span>
                    <span className="text-[#E10C69]">{Number(total || 0).toFixed(2)} €</span>
                  </div>
                  <Link
                    href={`/${locale}/checkout`}
                    style={{ backgroundColor: '#556822' }}
                    className="block w-full text-white py-3 rounded-md font-bold hover:opacity-90 transition-opacity mb-3 text-center"
                  >
                    {t('actions.checkout')}
                  </Link>
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
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import Footer from '@/components/footer';
import PromoBadge from '@/components/PromoBadge';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle, Gift } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTranslatedPackage, getTranslatedProduct } from '@/lib/productTranslations';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ✅ Helpers (Kept as is for functionality)
const pickUrl = (v) => {
  if (!v || v === 'undefined') return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.url || v.secure_url || null;
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

const getCartItemImagesLocal = (item) => {
  const isPackage = isPackageItem(item);
  const one = pickUrl(item?.image);

  if (!isPackage) {
    return one ? [one] : [];
  }

  // Prefer package main image for package items
  if (one) {
    return [one];
  }

  const packageMainImage =
    pickUrl(item?.packageImage) ||
    pickUrl(item?.package?.image) ||
    pickUrl(item?.packageId?.image);
  if (packageMainImage) {
    return [packageMainImage];
  }

  let imgs = [];
  if (Array.isArray(item?.packageImages)) {
    imgs = item.packageImages.map((img) => pickUrl(img)).filter(Boolean);
  }

  if (Array.isArray(item?.selectedProducts)) {
    imgs = [
      ...imgs,
      ...item.selectedProducts
        .map((sp) => {
          const direct = pickUrl(sp?.image);
          if (direct) return direct;

          const product = sp?.product || (typeof sp?.productId === 'object' ? sp.productId : null);
          if (!product) return null;

          const fromProduct =
            pickUrl(product?.image) ||
            pickUrl(product?.imageUrl) ||
            pickUrl(product?.productImage) ||
            pickUrl(product?.media?.[0]?.url) ||
            pickUrl(product?.media?.[0]);

          return fromProduct;
        })
        .filter(Boolean),
    ];
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
        <HeaderAndBreadcrumbs />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#556822]"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isEmpty = cartItems.length === 0;
  const displayedCartShipping = 0;
  const displayedCartTotal = Number(subtotal || 0) + displayedCartShipping;

  return (
    <div className="min-h-screen bg-gray-50 font-[Maison_Neue]">
      <HeaderAndBreadcrumbs />
      <PromoBadge />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
        {stockAlertOpen && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stock limit reached</AlertTitle>
            <AlertDescription>{stockAlertMessage || 'Insufficient stock for this product'}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch">
          <div className="grow bg-white rounded-lg shadow-sm p-4 sm:p-6 min-w-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-[#556822] font-[agrandir] leading-tight">{t('title')}</h1>
              <span className="text-gray-500 text-xs sm:text-sm shrink-0">
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
              <div>
                {cartItems.map((item) => {
                  const isPackage = isPackageItem(item);
                  const hasPackageMainImage =
                    isPackage &&
                    !!(
                      pickUrl(item?.image) ||
                      pickUrl(item?.packageImage) ||
                      pickUrl(item?.package?.image) ||
                      pickUrl(item?.packageId?.image)
                    );

                  const localImgs = getCartItemImagesLocal(item);
                  const images = localImgs;

                  const sourceProduct = item?.product || (typeof item?.productId === 'object' ? item.productId : null);
                  const sourcePackage = item?.package || (typeof item?.packageId === 'object' ? item.packageId : null);
                  const translatedName = isPackage
                    ? (sourcePackage ? getTranslatedPackage(sourcePackage, locale).name : null)
                    : (sourceProduct ? getTranslatedProduct(sourceProduct, locale).name : null);
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
                    <div
                      key={item._id}
                      className="py-5 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 md:gap-6 relative border-b border-gray-100 last:border-b-0"
                    >
                      {/* Top row (mobile): image + details + delete */}
                      <div className="flex items-start gap-3 sm:gap-4 w-full min-w-0 sm:w-auto sm:flex-1 sm:items-center">
                        {/* Images */}
                        <div className="shrink-0 relative">
                          {item.isFreeItem && (
                            <span className="absolute top-1 -right-1 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E10C69] text-white shadow-sm">
                              <Gift size={12} />
                            </span>
                          )}
                          {isPackage && !hasPackageMainImage ? (
                            <div className="grid grid-cols-2 gap-1 w-[4.5rem] sm:w-28">
                              {images.length > 0 ? (
                                <>
                                  {images.slice(0, 4).map((img, idx) => (
                                    <div key={idx} className="bg-gray-50 overflow-hidden rounded-sm aspect-square">
                                      <img src={img} alt="" className="w-full h-full object-cover" />
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <div className="col-span-2 row-span-2 bg-gray-100 rounded-md flex items-center justify-center min-h-[4.5rem] sm:min-h-0">
                                  <ShoppingBag size={20} className="text-gray-300 sm:w-6 sm:h-6" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-20 sm:w-20 sm:h-24 bg-transparent overflow-hidden rounded-md">
                              {images[0] ? (
                                <img
                                  src={images[0]}
                                  alt={displayName}
                                  className={`w-full h-full ${isPackage ? 'object-cover' : 'object-contain'}`}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                                  <ShoppingBag size={20} className="text-gray-300 sm:w-6 sm:h-6" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grow min-w-0 pr-1 sm:pr-2">
                          <h3 className="font-bold text-[#556822] text-base sm:text-lg mb-0.5 break-words hyphens-auto">
                            {displayName}
                          </h3>
                          {!item.isFreeItem && (
                            <p className="text-xs sm:text-sm text-gray-500">
                              {t('products.price')}:
                              <span className="whitespace-nowrap"> {Number(item.price || 0).toFixed(2)} €</span>
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item._id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0 sm:hidden touch-manipulation"
                          aria-label={t('actions.remove') || 'Remove'}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {/* Bottom row (mobile): qty + line total; inline from sm */}
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-3 sm:flex-nowrap sm:shrink-0 w-full sm:w-auto">
                      {!item.isFreeItem && (
                        <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-2.5 sm:px-3 py-1 rounded-full border border-gray-100 touch-manipulation">
                          <button
                            type="button"
                            onClick={async () => {
                              const nextQty = Math.max(1, (uiQty[item._id] ?? (item.quantity || 1)) - 1);
                              setUiQty((prev) => ({ ...prev, [item._id]: nextQty }));
                              const ok = await updateQuantity(item._id, nextQty);
                              if (!ok) {
                                setUiQty((prev) => ({ ...prev, [item._id]: uiQty[item._id] ?? (item.quantity || 1) }));
                              }
                            }}
                            className="text-gray-400 hover:text-black p-0.5 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="min-w-[1.5rem] text-center font-bold text-sm tabular-nums">{currentQty}</span>

                          <button
                            type="button"
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
                            className="text-gray-400 hover:text-black p-0.5 min-h-[40px] min-w-[40px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                            title="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}

                      {item.isFreeItem ? (
                        <div className="text-right sm:w-24 sm:shrink-0">
                          <p className="text-xs text-gray-400 line-through">
                            {(Number(item.price || 0) * Number(currentQty || 0)).toFixed(2)} €
                          </p>
                          <p className="font-black text-[#E10C69] text-base sm:text-lg">0 €</p>
                        </div>
                      ) : (
                        <div className="text-right font-black text-[#E10C69] text-base sm:text-lg sm:w-24 sm:shrink-0 tabular-nums">
                          {(Number(item.price || 0) * Number(currentQty || 0)).toFixed(2)} €
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id)}
                        className="hidden sm:block p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0 touch-manipulation"
                        aria-label={t('actions.remove') || 'Remove'}
                      >
                        <Trash2 size={20} />
                      </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="w-full lg:w-80 shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-20 xl:top-24">
              <h2 className="text-lg sm:text-xl font-black text-[#556822] mb-4 sm:mb-6 font-[agrandir]">{t('summary.title')}</h2>
              {!isEmpty && (
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{t('summary.subtotal')}</span>
                    <span className="font-bold text-gray-900">{Number(subtotal || 0).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{t('summary.shipping')}</span>
                    <span className="font-bold text-gray-900">{displayedCartShipping.toFixed(2)} €</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-lg font-black text-[#556822] pb-4">
                    <span>{t('summary.total')}</span>
                    <span className="text-[#E10C69]">{displayedCartTotal.toFixed(2)} €</span>
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
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
  if (!isPackage) {
    const one = pickUrl(item?.image);
    return one ? [one] : [];
  }
  const packageImage =
    pickUrl(item?.image) ||
    pickUrl(item?.packageImage) ||
    pickUrl(item?.package?.image) ||
    pickUrl(item?.packageId?.image) ||
    pickUrl(item?.packageImages?.[0]);

  return packageImage ? [packageImage] : [];
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
                  const images = localImgs;

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
                        <div className="w-20 h-24 bg-transparent overflow-hidden">
                          {images[0] ? (
                            <img
                              src={images[0]}
                              alt={displayName}
                              className={`w-full h-full ${isPackage ? 'object-cover' : 'object-contain'}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                              <ShoppingBag size={24} className="text-gray-300" />
                            </div>
                          )}
                        </div>
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
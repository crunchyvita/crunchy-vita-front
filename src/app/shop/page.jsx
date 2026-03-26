'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Link } from '@/navigation';
import {
  ImageIcon, ShoppingCart, Heart, Star, Package,
  Search, X, ArrowRight, Loader2
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import ProductDetailModal from '@/components/detailProduct';
import AddedToCartModal from '@/components/AddedToCartModal';
import Footer from '@/components/footer';
import HeaderAndBreadcrumbs from '@/components/HeaderAndBreadcrumbs';
import PromoBadge from '@/components/PromoBadge';
import { useLocale, useTranslations } from 'next-intl';
import { getTranslatedPackage, getTranslatedProduct } from '@/lib/productTranslations';

// --- UTILS ---
const getProductImageUrl = (product) => {
  if (!product) return null;
  const url =
    product.image ||
    product.imageUrl ||
    (product.media?.[0]?.url || product.media?.[0]) ||
    product.productImage;
  if (!url || url === 'undefined') return null;
  return url;
};

const getPackageImageUrl = (pkg) => {
  if (!pkg) return null;
  const url = pkg.image;
  if (!url || url === 'undefined') return null;
  return url;
};

const getProductPrice = (product) => {
  if (!product) return 0;
  const history = product.pricingHistory;
  return (history && history.length > 0)
    ? history[history.length - 1]?.price
    : product.price || 0;
};

const getAvailableStock = (stock) => {
  if (!stock) return 0;
  return stock.availableQuantity ?? ((stock.quantity || 0) - (stock.reservedQuantity || 0));
};

// --- COMPONENTS ---

function PremiumPackageCard({
  pkg,
  onToggleFavorite,
  isFavorite,
  favoritesLoading,
  fallbackProducts
}) {
  const t = useTranslations('Shop');
  const locale = useLocale();
  const translatedPackage = getTranslatedPackage(pkg, locale);

  const allProducts = pkg.products || [];
  const resolvedType = pkg.packageType || 'CUSTOM';
  const packageImageUrl = getPackageImageUrl(pkg);
  const customBadgeLabel = locale === 'fr' ? 'Personnalise' : 'Custom';

  // Placeholder images
  const placeholderSource = resolvedType === 'FIXED' ? allProducts : (fallbackProducts || []);
  const placeholderItems = placeholderSource
    .map((item) => {
      const prod = item?.productId || item;
      const imageUrl = getProductImageUrl(prod);
      return imageUrl ? { imageUrl } : null;
    })
    .filter(Boolean);

  // ✅ Robust out-of-stock detection for FIXED packs
  const isOutOfStockFixed = useMemo(() => {
    if (resolvedType !== 'FIXED') return false;

    // Backend boolean fields (if exist)
    if (typeof pkg.inStock === 'boolean') return !pkg.inStock;
    if (typeof pkg.isInStock === 'boolean') return !pkg.isInStock;

    // Package stock object (if exist)
    if (pkg.stock) {
      const avail = getAvailableStock(pkg.stock);
      if (Number.isFinite(avail)) return avail <= 0;
    }

    // Fallback: check products inside fixed pack
    const items = pkg.products || [];
    if (!items.length) return false;

    return items.some((it) => {
      const prod = it?.productId || it;
      const avail = getAvailableStock(prod?.stock);
      return avail <= 0;
    });
  }, [pkg, resolvedType]);

  return (
    <Link
      href={`/shop/packages/${pkg._id}`}
      prefetch={true}
      className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-[#E1FBD9] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
    >
      {/* Favorites + Custom badge */}
      <div className="absolute top-6 right-6 z-40 flex items-center gap-2">
        {resolvedType === 'CUSTOM' && (
          <span className="bg-[#556822] text-white text-[11px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-xl backdrop-blur">
            {customBadgeLabel}
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(pkg);
          }}
          className="p-3 rounded-full bg-white/95 shadow-xl transition-colors text-[#E10C69] hover:bg-[#FCE7F2]"
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={18} className={isFavorite ? 'fill-[#E10C69] text-[#E10C69]' : 'text-[#E10C69]'} />
        </button>
      </div>

      <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity text-[#556822]">
        <Package size={120} />
      </div>

      <div className="relative h-72 bg-[#F2F8EE] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#B3C800]/10 via-transparent to-[#EF8EB8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {packageImageUrl ? (
          <img
            src={packageImageUrl}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : placeholderItems.length > 0 ? (
          <div className="relative w-full h-80 bg-[#F2F8EE] flex items-center justify-center p-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.8)_0%,_transparent_100%)]" />

            <div
              className={`relative z-10 grid gap-3 w-full max-w-70 transition-transform duration-500 group-hover:scale-105 ${
                placeholderItems.length <= 4 ? 'grid-cols-2' : 'grid-cols-2'
              }`}
            >
              {placeholderItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-all duration-500 ${
                    idx % 2 === 0 ? 'translate-y-2 group-hover:translate-y-0' : '-translate-y-2 group-hover:translate-y-0'
                  }`}
                >
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#556822]/0 group-hover:bg-[#556822]/5 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#B3C800] opacity-30">
            <ImageIcon size={40} />
          </div>
        )}

        {/* Discount badge */}
        {pkg.discountPercentage > 0 && (
          <div className="absolute top-6 left-6 z-40">
            <span className="bg-[#E10C69] text-white text-[12px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-xl">
              -{pkg.discountPercentage}%
            </span>
          </div>
        )}

        {/* ✅ Out of stock overlay always visible and doesn't block clicks */}
        {resolvedType === 'FIXED' && isOutOfStockFixed && (
          <div className="absolute inset-0 z-30 pointer-events-none">
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center">
                <p className="text-white font-black text-sm uppercase tracking-widest">
                  RUPTURE DE STOCK
                </p>
                <p className="text-white text-xs mt-2 font-medium">
                  Certains produits ne sont pas disponibles
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 flex flex-col flex-1 relative">
        <h3 className="text-2xl font-black font-[Agrandir] text-[#556822] mb-2 leading-tight group-hover:text-[#E10C69] transition-colors">
          {translatedPackage.name}
        </h3>

        <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6">
          {translatedPackage.description || t('packages.descriptionFallback')}
        </p>

        <div className="mt-auto pt-6 border-t border-[#F2F8EE] flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-[#556822]">
            {t('packages.discover')}
          </span>

          <button
            className={`h-12 w-12 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-all duration-300 shadow-lg ${
              resolvedType === 'FIXED' && isOutOfStockFixed
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#556822] group-hover:bg-[#E10C69]'
            }`}
            disabled={resolvedType === 'FIXED' && isOutOfStockFixed}
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProductCard({ product, onOpenDetail, onToggleFavorite, isFavorite, favoritesLoading }) {
  const t = useTranslations('Shop');
  const locale = useLocale();
  const productName = getTranslatedProduct(product, locale).name;
  const price = getProductPrice(product);
  const stock = getAvailableStock(product.stock);
  const imageUrl = getProductImageUrl(product);

  const avgRating = product.ratings?.length
    ? product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length
    : null;

  return (
    <div className="group bg-white rounded-[2rem] shadow-sm border border-[#E1FBD9] overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-[#F2F8EE]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#B3C800] opacity-30">
            <ImageIcon size={40} />
          </div>
        )}

        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={() => onToggleFavorite(product)}
            className="p-3 bg-white rounded-full shadow-md transition-colors text-[#E10C69] hover:bg-[#FCE7F2]"
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={18} className={isFavorite ? 'fill-[#E10C69] text-[#E10C69]' : 'text-[#E10C69]'} />
          </button>

          {stock > 0 && (
            <button
              onClick={() => onOpenDetail(product)}
              className="p-3 bg-white rounded-full shadow-md text-[#556822] hover:bg-[#556822] hover:text-white transition-colors"
            >
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {avgRating && (
          <div className="flex items-center gap-1 mb-4">
            <div className="flex items-center gap-0.5">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter mr-2">
                {avgRating.toFixed(1)}
              </span>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter ml-2">
              ({product.ratings.length})
            </span>
          </div>
        )}

        <div className="mb-3">
          <h3 className="font-black text-[#556822] text-lg mb-2">{productName}</h3>
          <div className="flex items-center justify-between">
            <h4 className="font-black text-[#E10C69] text-xl">{price.toFixed(2)} €</h4>
          </div>
        </div>

        <Link
          href={`/shop/${product.id || product._id}`}
          className="block w-full py-3.5 rounded-xl bg-[#F2F8EE] text-[#556822] font-black text-[10px] uppercase tracking-[0.5] text-center hover:bg-[#556822] hover:text-white transition-all"
        >
          {t('products.viewProduct')}
        </Link>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
function ClientShop() {
  const t = useTranslations('Shop');
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, '').endsWith('/api')
    ? rawApiBaseUrl.replace(/\/$/, '')
    : `${rawApiBaseUrl.replace(/\/$/, '')}/api`;

  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState(null);
  const [cartModalQuantity, setCartModalQuantity] = useState(1);

  const [favoritesIds, setFavoritesIds] = useState(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const [packageFavoritesIds, setPackageFavoritesIds] = useState(new Set());
  const [packageFavoritesLoading, setPackageFavoritesLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'packages') setActiveTab('packages');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();

    return products.filter((product) => {
      const translatedName = getTranslatedProduct(product, locale).name;
      const nameMatch = translatedName?.toLowerCase().includes(query);

      let tagsMatch = false;
      if (product.tags) {
        if (Array.isArray(product.tags)) {
          tagsMatch = product.tags.some((tag) => tag?.toLowerCase().includes(query));
        } else if (typeof product.tags === 'string') {
          tagsMatch = product.tags.split(',').map((t) => t.trim()).some((tag) => tag.toLowerCase().includes(query));
        }
      }

      if (!tagsMatch && product.tag) {
        if (Array.isArray(product.tag)) {
          tagsMatch = product.tag.some((tag) => tag?.toLowerCase().includes(query));
        } else if (typeof product.tag === 'string') {
          const tagsArray = product.tag.split(',').map((t) => t.trim());
          tagsMatch = tagsArray.some((tag) => tag.toLowerCase().includes(query));
        }
      }

      const categoryMatch = product.categoryId?.name?.toLowerCase().includes(query);

      return nameMatch || tagsMatch || categoryMatch;
    });
  }, [products, searchQuery, locale]);

  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return packages;
    const query = searchQuery.toLowerCase();

    return packages.filter((pkg) => {
      const translated = getTranslatedPackage(pkg, locale);
      const nameMatch = translated.name?.toLowerCase().includes(query);
      const descMatch = translated.description?.toLowerCase().includes(query);

      const productMatch = pkg.products?.some((item) => {
        const product = item.productId || item;
        const productName = getTranslatedProduct(product, locale).name;
        return productName?.toLowerCase().includes(query);
      });

      return nameMatch || descMatch || productMatch;
    });
  }, [packages, searchQuery, locale]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, pkgRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/packages')
        ]);

        if (pRes.ok) {
          const d = await pRes.json();
          setProducts(
            (d.data || d).filter(
              (p) => p.status === 'ACTIVE' && p.showInShop !== false
            )
          );
        }

        if (pkgRes.ok) {
          const d = await pkgRes.json();
          setPackages((d.data || d).filter((p) => p.isActive));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoritesIds(new Set());
      setPackageFavoritesIds(new Set());
      return;
    }

    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem('token');

        const [productRes, packageRes] = await Promise.all([
          fetch(`${apiBaseUrl}/users/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBaseUrl}/users/favorites/packages`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const productResult = await productRes.json();
        const packageResult = await packageRes.json();

        if (productRes.ok) {
          const ids = new Set((productResult.data || []).map((item) => item._id));
          const pendingRaw = localStorage.getItem('pendingFavorites');
          const pending = pendingRaw ? JSON.parse(pendingRaw) : [];

          if (pending.length > 0) {
            for (const productId of pending) {
              if (ids.has(productId)) continue;
              try {
                const res = await fetch(`${apiBaseUrl}/users/favorites`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ productId }),
                });
                if (res.ok) ids.add(productId);
              } catch (err) {
                console.error('Failed to sync pending favorite', err);
              }
            }
            localStorage.removeItem('pendingFavorites');
          }

          setFavoritesIds(ids);
        }

        if (packageRes.ok) {
          const ids = new Set((packageResult.data || []).map((item) => item._id));
          const pendingRaw = localStorage.getItem('pendingFavoritesPackages');
          const pending = pendingRaw ? JSON.parse(pendingRaw) : [];

          if (pending.length > 0) {
            for (const packageId of pending) {
              if (ids.has(packageId)) continue;
              try {
                const res = await fetch(`${apiBaseUrl}/users/favorites/packages`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ packageId }),
                });
                if (res.ok) ids.add(packageId);
              } catch (err) {
                console.error('Failed to sync pending package favorite', err);
              }
            }
            localStorage.removeItem('pendingFavoritesPackages');
          }

          setPackageFavoritesIds(ids);
        }
      } catch (error) {
        console.error('Failed to load favorites', error);
      }
    };

    loadFavorites();
  }, [user, apiBaseUrl]);

  const handleToggleFavorite = async (product) => {
    if (!product?._id) return;

    if (!user) {
      const pendingRaw = localStorage.getItem('pendingFavorites');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
      if (!pending.includes(product._id)) {
        pending.push(product._id);
        localStorage.setItem('pendingFavorites', JSON.stringify(pending));
      }
      setFavoritesIds((prev) => new Set(prev).add(product._id));
      router.push('/auth/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const isFav = favoritesIds.has(product._id);

      if (isFav) {
        const response = await fetch(`${apiBaseUrl}/users/favorites/${product._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to remove favorite');

        setFavoritesIds((prev) => {
          const next = new Set(prev);
          next.delete(product._id);
          return next;
        });
      } else {
        const response = await fetch(`${apiBaseUrl}/users/favorites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product._id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to add favorite');

        setFavoritesIds((prev) => new Set(prev).add(product._id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTogglePackageFavorite = async (pkg) => {
    if (!pkg?._id) return;

    if (!user) {
      const pendingRaw = localStorage.getItem('pendingFavoritesPackages');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : [];
      if (!pending.includes(pkg._id)) {
        pending.push(pkg._id);
        localStorage.setItem('pendingFavoritesPackages', JSON.stringify(pending));
      }
      setPackageFavoritesIds((prev) => new Set(prev).add(pkg._id));
      router.push('/auth/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const isFav = packageFavoritesIds.has(pkg._id);

      if (isFav) {
        const response = await fetch(`${apiBaseUrl}/users/favorites/packages/${pkg._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to remove package favorite');

        setPackageFavoritesIds((prev) => {
          const next = new Set(prev);
          next.delete(pkg._id);
          return next;
        });
      } else {
        const response = await fetch(`${apiBaseUrl}/users/favorites/packages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ packageId: pkg._id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Failed to add package favorite');

        setPackageFavoritesIds((prev) => new Set(prev).add(pkg._id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3ED] font-[Maison Neue]">
      <HeaderAndBreadcrumbs />
      <PromoBadge />

      <main className="max-w-7xl mx-auto px-6 py-16 font-[Agrandir]">
        {/* Search Bar */}
        <section className="mb-20 font-[Maison Neue]">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#556822]" size={22} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-16 pr-12 py-7 rounded-[2.5rem] bg-white shadow-2xl shadow-[#556822]/5 border-0 focus:ring-4 focus:ring-[#B3C800]/20 transition-all text-[#556822] placeholder:text-gray-300 font-bold text-lg font-[Maison Neue Book]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-[#556822]/50 hover:text-[#E10C69] transition-colors font-[Maison Neue Mono]"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {searchQuery && (
            <p className="mt-4 text-center text-[#556822] font-medium font-[Maison Neue]">
              {activeTab === 'products'
                ? t('search.resultsProducts', { count: filteredProducts.length, query: searchQuery })
                : t('search.resultsPackages', { count: filteredPackages.length, query: searchQuery })}
            </p>
          )}
        </section>

        {/* Tabs */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex bg-white/50 backdrop-blur-sm p-2 rounded-[2rem] mb-12 border border-white">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'products' ? 'bg-[#E10c69] text-white shadow-lg' : 'text-[#556822] hover:bg-white/50'
              }`}
            >
              {t('tabs.products')}
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'packages' ? 'bg-[#E10C69] text-white shadow-lg' : 'text-[#556822] hover:bg-white/50'
              }`}
            >
              {t('tabs.packages')}
            </button>
          </div>

          <div className="text-center max-w-2xl">
            <h2 className="text-6xl font-black text-[#556822] mb-6 tracking-tighter">
              {activeTab === 'products' ? t('heading.productsTitle') : t('heading.packagesTitle')}
            </h2>
            <div className="w-20 h-1.5 bg-[#EF8EB8] mx-auto rounded-full mb-6" />
            <p className="text-[#556822]/70 font-bold text-xl">
              {activeTab === 'products' ? t('heading.productsSubtitle') : t('heading.packagesSubtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/50 animate-pulse h-96 rounded-[2.5rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {activeTab === 'products' ? (
              filteredProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onOpenDetail={(prod) => {
                    setSelectedProduct(prod);
                    setIsDetailModalOpen(true);
                  }}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={favoritesIds.has(p._id)}
                />
              ))
            ) : (
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredPackages.map((pkg) => (
                  <PremiumPackageCard
                    key={pkg._id}
                    pkg={pkg}
                    onToggleFavorite={handleTogglePackageFavorite}
                    isFavorite={packageFavoritesIds.has(pkg._id)}
                    fallbackProducts={products}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        getProductImageUrl={getProductImageUrl}
        getProductPrice={getProductPrice}
        getAvailableStock={getAvailableStock}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedProduct ? favoritesIds.has(selectedProduct._id) : false}
        onShowCartModal={(product, quantity) => {
          setCartModalProduct(product);
          setCartModalQuantity(quantity);
          setShowCartModal(true);
          setIsDetailModalOpen(false);
        }}
      />

      <AddedToCartModal
        isOpen={showCartModal}
        onClose={() => {
          setShowCartModal(false);
          setCartModalProduct(null);
        }}
        product={cartModalProduct}
        quantity={cartModalQuantity}
      />

      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F3ED] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#556822]" />
        </div>
      }
    >
      <ClientShop />
    </Suspense>
  );
}

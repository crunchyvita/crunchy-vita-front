'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/navigation';
import { Heart, Loader2, AlertCircle, ShoppingCart, Package, ArrowRight, Star } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PromoBadge from '@/components/PromoBadge';
import { useAuth } from '@/context/AuthContext';
import { useLocale, useTranslations } from 'next-intl';
import { getTranslatedPackage, getTranslatedProduct } from '@/lib/productTranslations';

const getProductImageUrl = (product) => {
    if (!product) return null;
    const url = product.imageUrl || product.image || product.productImage || (product.media?.[0]?.url || product.media?.[0]);
    if (!url || url === 'undefined') return null;
    return url;
};

const getProductPrice = (product) => {
    if (!product) return 0;
    const history = product.pricingHistory;
    return (history && history.length > 0) ? history[history.length - 1]?.price : product.price || 0;
};

const getAvailableStock = (stock) => {
    if (!stock) return 0;
    return stock.availableQuantity ?? ((stock.quantity || 0) - (stock.reservedQuantity || 0));
};

const getPackageImageUrl = (pkg) => {
    if (!pkg) return null;
    const url = pkg.image || pkg.imageUrl || (pkg.media?.[0]?.url || pkg.media?.[0]);
    if (!url || url === 'undefined') return null;
    return url;
};

export default function FavoritesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const locale = useLocale();
    const t = useTranslations('Favorites');
    const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, '').endsWith('/api')
        ? rawApiBaseUrl.replace(/\/$/, '')
        : `${rawApiBaseUrl.replace(/\/$/, '')}/api`;

    const [favorites, setFavorites] = useState([]);
    const [favoritePackages, setFavoritePackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('products');
    const [removingId, setRemovingId] = useState(null);
    const [removingPackageId, setRemovingPackageId] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/auth/login');
            return;
        }

        const loadFavorites = async () => {
            try {
                setLoading(true);
                setError('');
                const token = localStorage.getItem('token');

                const [productRes, packageRes] = await Promise.all([
                    fetch(`${apiBaseUrl}/users/favorites`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`${apiBaseUrl}/users/favorites/packages`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                const productResult = await productRes.json();
                const packageResult = await packageRes.json();

                if (!productRes.ok) {
                    throw new Error(productResult.message || t('errors.loadFavorites'));
                }
                if (!packageRes.ok) {
                    throw new Error(packageResult.message || t('errors.loadPackageFavorites'));
                }
                setFavorites(productResult.data || []);
                setFavoritePackages(packageResult.data || []);
            } catch (err) {
                setError(err.message || t('errors.generic'));
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [user, authLoading, apiBaseUrl, router]);

    const handleRemoveFavorite = async (productId) => {
        if (!productId) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/users/favorites/${productId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Impossible de retirer le favori.');
            setFavorites((prev) => prev.filter((item) => item._id !== productId));
        } catch (err) {
            setError(err.message || t('errors.removeFavorite'));
        } finally {
            setRemovingId(null);
        }
    };

    const handleRemovePackageFavorite = async (packageId) => {
        if (!packageId) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiBaseUrl}/users/favorites/packages/${packageId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Impossible de retirer le pack favori.');
            setFavoritePackages((prev) => prev.filter((item) => item._id !== packageId));
        } catch (err) {
            setError(err.message || t('errors.removePackageFavorite'));
        } finally {
            setRemovingPackageId(null);
        }
    };

    // No client-side search/filtering — show saved favorites directly

    const hasFavorites = favorites.length > 0;
    const hasPackageFavorites = favoritePackages.length > 0;

    return (
        <div className="min-h-screen bg-[#F5F3ED] font-[Maison Neue]">
            <Header />
            <PromoBadge />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-black font-[agrandir] text-[#556822] uppercase">
                        {t('title')}
                    </h1>
                    <p className="text-gray-500 mt-2">{t('subtitle')}</p>
                </div>

                {/* Search removed — display favorites directly */}

                <div className="flex flex-col items-center mb-12">
                    <div className="flex bg-white/50 backdrop-blur-sm p-2 rounded-[2rem] border border-white">
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-[#E10c69] text-white shadow-lg' : 'text-[#556822] hover:bg-white/50'}`}
                        >
                            {t('tabs.products')}
                        </button>
                        <button
                            onClick={() => setActiveTab('packages')}
                            className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'packages' ? 'bg-[#E10C69] text-white shadow-lg' : 'text-[#556822] hover:bg-white/50'}`}
                        >
                            {t('tabs.packages')}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#556822]" />
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                ) : !(hasFavorites || hasPackageFavorites) ? (
                    <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
                        <Heart className="h-10 w-10 text-[#E10C69] mx-auto mb-3" />
                        <p className="text-slate-700 font-semibold">{t('empty.title')}</p>
                        <Link href="/shop" className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E10C69] px-6 py-3 text-white font-bold">
                            {t('empty.cta')}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {activeTab === 'products' && hasFavorites && (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {favorites.map((product) => {
                                        const price = getProductPrice(product);
                                        const stock = getAvailableStock(product.stock);
                                        const imageUrl = getProductImageUrl(product);
                                        const translatedProduct = getTranslatedProduct(product, locale);
                                        const productName = translatedProduct.name || product.name;
                                        return (
                                            <div
                                                key={product._id}
                                                className="group bg-white rounded-[2rem] shadow-sm border border-[#E1FBD9] overflow-hidden hover:shadow-xl transition-all duration-300"
                                            >
                                                <div className="relative aspect-square overflow-hidden bg-[#F2F8EE]">
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-[#B3C800] opacity-30">
                                                            <Heart size={40} />
                                                        </div>
                                                    )}

                                                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                                        <button
                                                            onClick={() => handleRemoveFavorite(product._id)}
                                                            disabled={removingId === product._id}
                                                            className={`p-3 bg-white rounded-full shadow-md transition-colors text-[#E10C69] hover:bg-[#FCE7F2] ${removingId === product._id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                            title={t('actions.removeFavorite')}
                                                        >
                                                            <Heart size={18} className="fill-[#E10C69] text-[#E10C69]" />
                                                        </button>
                                                        {stock > 0 && (
                                                            <button
                                                                onClick={() => router.push(`/shop/${product._id}`)}
                                                                className="p-3 bg-white rounded-full shadow-md text-[#556822] hover:bg-[#556822] hover:text-white transition-colors"
                                                                title={t('actions.viewProduct')}
                                                            >
                                                                <ShoppingCart size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-6">
                                                    {product.ratings && product.ratings.length > 0 && (
                                                        <div className="flex items-center gap-1 mb-4">
                                                            <div className="flex items-center gap-0.5">
                                                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter mr-2">
                                                                    {(product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length).toFixed(1)}
                                                                </span>
                                                                {[...Array(5)].map((_, i) => {
                                                                    const avgRating = product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length;
                                                                    return (
                                                                        <Star
                                                                            key={i}
                                                                            className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter ml-2">
                                                                ({product.ratings.length})
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="mb-3">
                                                        <h3 className="font-black text-[#556822] text-lg mb-2">{productName}</h3>
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-black text-[#E10C69] text-xl">€{price.toFixed(2)}</h4>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={`/shop/${product._id}`}
                                                        className="block w-full py-3.5 rounded-xl bg-[#F2F8EE] text-[#556822] font-black text-[10px] uppercase tracking-[0.5] text-center hover:bg-[#556822] hover:text-white transition-all"
                                                    >
                                                        {t('actions.viewProduct')}
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'packages' && hasPackageFavorites && (
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {favoritePackages.map((pkg) => {
                                        const resolvedType = pkg.packageType || 'CUSTOM';
                                        const imageUrl = getPackageImageUrl(pkg);
                                        const translatedPackage = getTranslatedPackage(pkg, locale);
                                        const packageName = translatedPackage.name || pkg.name;
                                        const packageDescription = translatedPackage.description || pkg.description;
                                        return (
                                            <Link
                                                key={pkg._id}
                                                href={`/shop/packages/${pkg._id}`}
                                                prefetch={true}
                                                className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-[#E1FBD9] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleRemovePackageFavorite(pkg._id);
                                                    }}
                                                    disabled={removingPackageId === pkg._id}
                                                    className={`absolute top-6 right-6 z-20 p-3 rounded-full bg-white shadow-lg transition-colors text-[#E10C69] hover:bg-[#FCE7F2] ${removingPackageId === pkg._id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    title={t('actions.removeFavorite')}
                                                >
                                                    <Heart size={18} className="fill-[#E10C69] text-[#E10C69]" />
                                                </button>
                                                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity text-[#556822]">
                                                    <Package size={120} />
                                                </div>

                                                <div className="relative h-64 bg-[#F2F8EE] flex items-center justify-center overflow-hidden">
                                                    <div className="absolute inset-0 bg-linear-to-br from-[#B3C800]/10 via-transparent to-[#EF8EB8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={packageName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="relative w-full h-full flex items-center justify-center">
                                                            <Package size={48} className="text-[#B3C800] opacity-30" />
                                                        </div>
                                                    )}

                                                    {pkg.discountPercentage > 0 && (
                                                        <div className="absolute top-6 left-6">
                                                            <span className="bg-[#E10C69] text-white text-[12px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-lg">
                                                                -{pkg.discountPercentage}%
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="absolute top-6 right-20">
                                                        <span className={`text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest shadow-lg ${resolvedType === 'FIXED' ? 'bg-[#556822]' : 'bg-[#005085]'}`}>
                                                            {resolvedType === 'FIXED' ? 'FIXED' : 'CUSTOM'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-8 flex flex-col flex-1 relative">
                                                    <h3 className="text-2xl font-black font-[Agrandir] text-[#556822] mb-2 leading-tight group-hover:text-[#E10C69] transition-colors">
                                                        {packageName}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6">
                                                        {packageDescription || t('packages.descriptionFallback')}
                                                    </p>

                                                    <div className="mt-auto pt-6 border-t border-[#F2F8EE] flex items-center justify-between">
                                                        <span className="text-xs font-black uppercase tracking-widest text-[#556822]">{t('actions.viewPack')}</span>
                                                        <span className="h-12 w-12 bg-[#556822] rounded-full flex items-center justify-center text-white group-hover:bg-[#E10C69] group-hover:scale-110 transition-all duration-300 shadow-lg">
                                                            <ArrowRight size={20} />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

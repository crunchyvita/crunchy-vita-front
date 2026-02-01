'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ImageIcon, ShoppingCart, Heart, Star, Package,
  ShoppingBag, CheckCircle2, Search, X,
  ArrowRight
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import ProductDetailModal from '@/components/detailProduct';
import Footer from '@/components/footer';
import Header from '@/components/header';
import PromoBadge from '@/components/PromoBadge';

// --- UTILS ---
const getProductImageUrl = (product) => {
  if (!product) return null;
  const url = product.image || product.imageUrl || (product.media?.[0]?.url || product.media?.[0]) || product.productImage;
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

// --- COMPONENTS ---

/** * PREMIUM PACKAGE CARD - Style CrunchyVita
 */
function PremiumPackageCard({ pkg }) {
  const productPreviews = pkg.products?.slice(0, 3) || [];

  return (
    <Link
      href={`/shop/packages/${pkg._id}`}
      prefetch={true}
      className="group relative bg-white rounded-[2.5rem] overflow-hidden border border-[#E1FBD9] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity text-[#556822]">
        <Package size={120} />
      </div>

      <div className="relative h-64 bg-[#F2F8EE] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#B3C800]/10 via-transparent to-[#EF8EB8]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {pkg.image ? (
          <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {productPreviews.map((item, idx) => {
              const prod = item.productId || item;
              return (
                <div key={idx} className="absolute transition-all duration-700 ease-out group-hover:scale-110"
                  style={{
                    transform: `translateX(${(idx - 1) * 50}px) translateY(${idx === 1 ? -15 : 0}px) rotate(${(idx - 1) * 12}deg)`,
                    zIndex: idx === 1 ? 20 : 10,
                  }}>
                  <div className="p-1 bg-white rounded-2xl shadow-xl border border-[#E1FBD9]">
                    <img src={getProductImageUrl(prod)} alt="" className="w-28 h-28 rounded-xl object-cover" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pkg.discountPercentage > 0 && (
          <div className="absolute top-6 left-6">
            <span className="bg-[#E10C69] text-white text-[12px] font-black px-4 py-1.5 rounded-full tracking-widest shadow-lg">
              -{pkg.discountPercentage}%
            </span>
          </div>
        )}
      </div>

      <div className="p-8 flex flex-col flex-1 relative">
        <h3 className="text-2xl font-black font-[Agrandir] text-[#556822] mb-2 leading-tight group-hover:text-[#E10C69] transition-colors">
          {pkg.name}
        </h3>
        <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6">
          {pkg.description || "Une sélection gourmande et craquante pour vos moments de plaisir."}
        </p>

        <div className="mt-auto pt-6 border-t border-[#F2F8EE] flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-[#556822]">Découvrir le pack</span>
          <button className="h-12 w-12 bg-[#556822] rounded-full flex items-center justify-center text-white group-hover:bg-[#E10C69] group-hover:scale-110 transition-all duration-300 shadow-lg">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </Link>
  );
}

/** * PRODUCT CARD - Style CrunchyVita
 */
function ProductCard({ product, onOpenDetail }) {
  const price = getProductPrice(product);
  const stock = getAvailableStock(product.stock);
  const imageUrl = getProductImageUrl(product);
  const avgRating = product.ratings?.length ? product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length : null;

  return (
    <div className="group bg-white rounded-[2rem] shadow-sm border border-[#E1FBD9] overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-[#F2F8EE]">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#B3C800] opacity-30"><ImageIcon size={40} /></div>
        )}

        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <button className="p-3 bg-white rounded-full shadow-md text-[#E10C69] hover:bg-[#E10C69] hover:text-white transition-colors"><Heart size={18} /></button>
          {stock > 0 && (
            <button onClick={() => onOpenDetail(product)} className="p-3 bg-white rounded-full shadow-md text-[#556822] hover:bg-[#556822] hover:text-white transition-colors">
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
                  className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-tighter ml-2">
            ({product.ratings.length})
            </span>
          </div>
        )}
    <div className="mb-3">
  <h3 className="font-black text-[#556822] text-lg mb-2">{product.name}</h3>
  <div className="flex items-center justify-between">
    <h4 className="font-black text-[#E10C69] text-xl">${price.toFixed(2)}</h4>
  </div>
</div>


        <Link
          href={`/shop/${product.id || product._id}`}
          className="block w-full py-3.5 rounded-xl bg-[#F2F8EE] text-[#556822] font-black text-[10px] uppercase tracking-[0.5] text-center hover:bg-[#556822] hover:text-white transition-all"
        >
          Voir le produit
        </Link>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

function ClientShop() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- SEARCH FUNCTIONALITIES ---
  const [searchQuery, setSearchQuery] = useState('');

  // Product search filtering function
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(product => {
      // Search by product name
      const nameMatch = product.name?.toLowerCase().includes(query);

      // Search by tags - handle both string and array formats
      let tagsMatch = false;
      if (product.tags) {
        if (Array.isArray(product.tags)) {
          // Tags is an array
          tagsMatch = product.tags.some(tag =>
            tag?.toLowerCase().includes(query)
          );
        } else if (typeof product.tags === 'string') {
          // Tags is a comma-separated string
          tagsMatch = product.tags.split(',').map(t => t.trim()).some(tag =>
            tag.toLowerCase().includes(query)
          );
        }
      }
      // Also check product.tag (singular) if it exists
      if (!tagsMatch && product.tag) {
        if (Array.isArray(product.tag)) {
          tagsMatch = product.tag.some(tag =>
            tag?.toLowerCase().includes(query)
          );
        } else if (typeof product.tag === 'string') {
          const tagsArray = product.tag.split(',').map(t => t.trim());
          tagsMatch = tagsArray.some(tag =>
            tag.toLowerCase().includes(query)
          );
        }
      }

      // Search by category
      const categoryMatch = product.categoryId?.name?.toLowerCase().includes(query);

      return nameMatch || tagsMatch || categoryMatch;
    });
  }, [products, searchQuery]);

  // Package search filtering function
  const filteredPackages = useMemo(() => {
    if (!searchQuery.trim()) return packages;

    const query = searchQuery.toLowerCase();
    return packages.filter(pkg => {
      const nameMatch = pkg.name?.toLowerCase().includes(query);
      const descMatch = pkg.description?.toLowerCase().includes(query);

      // Search by product names included in the package
      const productMatch = pkg.products?.some(item => {
        const product = item.productId || item;
        return product?.name?.toLowerCase().includes(query);
      });

      return nameMatch || descMatch || productMatch;
    });
  }, [packages, searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, pkgRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/packages')
        ]);
        if (pRes.ok) {
          const d = await pRes.json();
          setProducts((d.data || d).filter(p => p.status === 'ACTIVE'));
        }
        if (pkgRes.ok) {
          const d = await pkgRes.json();
          setPackages((d.data || d).filter(p => p.isActive));
        }
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F3ED] font-[Maison Neue]">
      <Header />
      <PromoBadge />

      <main className="max-w-7xl mx-auto px-6 py-16 font-[Agrandir]">
        {/* Search Bar Premium - With extracted functionalities */}
        <section className="mb-20 font-[Maison Neue]">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#556822]" size={22} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom de produit, tag ou catégorie..."
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
                ? `Trouvé ${filteredProducts.length} produit(s) pour "${searchQuery}"`
                : `Trouvé ${filteredPackages.length} coffret(s) pour "${searchQuery}"`}
            </p>
          )}
        </section>

        {/* Tab Navigation */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex bg-white/50 backdrop-blur-sm p-2 rounded-[2rem] mb-12 border border-white">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-[#E10c69] text-white shadow-lg' : 'text-[#556822] hover:bg-white/50'}`}
            >
              Tous nos produits
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-10 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'packages' ? 'bg-[#E10C69] text-white shadow-lg' : 'text-[#556822] hover:bg-white/50'}`}
            >
              Crunchy Packs
            </button>
          </div>

          <div className="text-center max-w-2xl">
            <h2 className="text-6xl font-black text-[#556822] mb-6 tracking-tighter">
              {activeTab === 'products' ? 'La Boutique.' : 'Les Coffrets.'}
            </h2>
            <div className="w-20 h-1.5 bg-[#EF8EB8] mx-auto rounded-full mb-6" />
            <p className="text-[#556822]/70 font-bold text-xl">
              {activeTab === 'products'
                ? 'Le meilleur des fruits lyophilisés, sans aucun additif.'
                : 'Composez votre mix parfait et profitez de réductions exclusives.'}
            </p>
          </div>
        </div>

        {/* Grid Content - Using filtered data */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map(i => <div key={i} className="bg-white/50 animate-pulse h-96 rounded-[2.5rem]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {activeTab === 'products' ? (
              filteredProducts.map(p => (
                <ProductCard key={p._id} product={p} onOpenDetail={(prod) => { setSelectedProduct(prod); setIsDetailModalOpen(true); }} />
              ))
            ) : (
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredPackages.map((pkg) => (
                  <PremiumPackageCard key={pkg._id} pkg={pkg} />
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
      />
      <Footer />
    </div>
  );
}

export default ClientShop;
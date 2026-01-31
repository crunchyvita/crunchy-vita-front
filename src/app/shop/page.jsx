'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ImageIcon, ChevronLeft, ChevronRight, Eye,
  ShoppingCart, Heart, Star, Package,
  LogOut, ShoppingBag, CheckCircle2, Search, X, Check, Gift,
  ArrowRight, Sparkles, Layers, Plus, MousePointer2
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import ProductDetailModal from '@/components/detailProduct';
import Footer from '@/components/footer';
import Header from '@/components/header';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getProductImageUrl = (product) => {
  if (!product) return null;
  const url = product.imageUrl || (product.media?.[0]?.url || product.media?.[0]) || product.productImage || product.image;
  if (!url || url === 'undefined') return null;
  return url.startsWith('http') ? url : `${backendUrl}${url}`;
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

/** * PREMIUM PACKAGE CARD
 */
function PremiumPackageCard({ pkg }) {
  const productPreviews = pkg.products?.slice(0, 3) || [];
  
  return (
    <Link 
      href={`/shop/packages/${pkg._id}`}
      className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full"
    >
      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
        <Package size={120} />
      </div>

      {/* Visual Header */}
      <div className="relative h-64 bg-[#F8F9FA] flex items-center justify-center overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {productPreviews.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {productPreviews.map((item, idx) => {
              const prod = item.productId || item;
              return (
                <div 
                  key={idx}
                  className="absolute transition-all duration-700 ease-out group-hover:scale-110"
                  style={{
                    transform: `translateX(${(idx - (productPreviews.length - 1) / 2) * 50}px) translateY(${idx === 1 ? -15 : 0}px) rotate(${(idx - 1) * 12}deg)`,
                    zIndex: idx === 1 ? 20 : 10,
                    filter: idx !== 1 ? 'grayscale(20%) opacity(0.8)' : 'none'
                  }}
                >
                  <div className="p-1 bg-white rounded-2xl shadow-xl border border-gray-100">
                    <img 
                      src={getProductImageUrl(prod)} 
                      alt="" 
                      className="w-28 h-28 rounded-xl object-cover"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-green-900 group-hover:rotate-12 transition-transform duration-500">
                <Plus size={32} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Custom Collection</p>
          </div>
        )}

        {/* Discount Badge */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
       
            {pkg.discountPercentage > 0 && (
                <span className="bg-gray-900 text-white text-[12px] font-black px-3 py-1 rounded-full  tracking-widest w-fit shadow-lg flex items-center gap-1">
                    Save {pkg.discountPercentage}%
                </span>
            )}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-8 flex flex-col flex-1 relative bg-white">
        <div className="mb-4">
          <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight group-hover:text-green-900 transition-colors">
            {pkg.name}
          </h3>
          <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">
            {pkg.description || "Curate your perfect selection with our signature premium packaging."}
          </p>
        </div>

       

        {/* Action Button */}
        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-end">
          
          
          <button className="h-14 w-14 bg-gray-900 rounded-full flex items-center justify-center text-white group-hover:bg-green-900 group-hover:scale-110 transition-all duration-300 shadow-xl shadow-gray-200">
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </Link>
  );
}

function ProductCard({ product, onOpenDetail }) {
    const router = useRouter();
    const price = getProductPrice(product);
    const stock = getAvailableStock(product.stock);
    const imageUrl = getProductImageUrl(product);
    const avgRating = product.ratings?.length ? product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length : null;
  
    return (
      <div className="group bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300"><ImageIcon size={40} /></div>
          )}
          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
            <button className="p-2.5 bg-white rounded-full shadow-lg hover:text-red-500"><Heart size={18} /></button>
            {stock > 0 && (
              <button onClick={() => onOpenDetail(product)} className="p-2.5 bg-white rounded-full shadow-lg hover:text-emerald-600"><ShoppingCart size={18} /></button>
            )}
          </div>
        </div>
        <div className="p-5">
          {avgRating && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-1 text-yellow-500">
                <span className="text-sm text-gray-600 ml-2">{avgRating.toFixed(1)}</span>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(avgRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 ml-2"> ({product.ratings.length})</span>
            </div>
          )}
          <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{product.name}</h3>
          <p className="text-lg font-black text-gray-900 mb-4">${price.toFixed(2)}</p>
          <button onClick={() => router.push(`/shop/${product.id || product._id}`)} className="w-full py-3 rounded-xl bg-gray-50 text-gray-700 font-bold hover:bg-green-900 hover:text-white transition-all text-xs uppercase tracking-widest">
            View Detail
          </button>
        </div>
      </div>
    );
  }

// --- MAIN PAGE ---

function ClientShop() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    const tab = searchParams.get('tab');
    if (tab && (tab === 'products' || tab === 'packages')) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, pkgRes] = await Promise.all([fetch('/api/products'), fetch('/api/packages')]);
        if (pRes.ok) {
          const d = await pRes.json();
          setProducts((Array.isArray(d) ? d : d.data || []).filter(p => p.status === 'ACTIVE'));
        }
        if (pkgRes.ok) {
          const d = await pkgRes.json();
          setPackages((Array.isArray(d) ? d : d.data || []).filter(p => p.isActive));
        }
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFB]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Modern Search */}
        <section className="mb-20">
          <div className="relative max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, tag, or category..."
                className="w-full pl-12 pr-12 py-6 rounded-[2rem] bg-white shadow-xl shadow-gray-100/50 border-0 focus:ring-2 focus:ring-emerald-500 transition-all text-gray-800 placeholder:text-gray-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="mt-3 text-sm text-gray-600 text-center">
                Found {activeTab === 'products' ? filteredProducts.length : filteredPackages.length} product(s) for "{searchQuery}"
              </p>
            )}
          </div>
        </section>

        {/* Main Navigation */}
        <div className="flex flex-col items-center mb-16">
          <div className="flex bg-gray-100 p-1.5 rounded-[1.5rem] mb-12 shadow-inner">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-10 py-3.5 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'products' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              All Products 
            </button>
            <button
              onClick={() => setActiveTab('packages')}
              className={`px-10 py-3.5 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'packages' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Crunchy Vita Packs 
            </button>
          </div>
          
          <div className="text-center max-w-2xl">
             <h2 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter leading-none">
               {activeTab === 'products' ? 'Our Products.' : 'The Collection.'}
             </h2>
             <p className="text-gray-400 font-medium text-lg">
                {activeTab === 'products' 
                    ? 'Each piece is a masterpiece.' 
                    : 'Customize your own pack, choose your favorites, and enjoy exclusive discounts..'}
             </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-pulse">
            {[1,2,3].map(i => <div key={i} className="bg-gray-200 h-[500px] rounded-[2rem]" />)}
          </div>
        ) : (
          <>
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map(p => (
                  <ProductCard key={p._id} product={p} onOpenDetail={(prod) => { setSelectedProduct(prod); setIsDetailModalOpen(true); }} />
                ))}
              </div>
            )}

            {activeTab === 'packages' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredPackages.map((pkg) => (
                  <PremiumPackageCard key={pkg._id} pkg={pkg} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => { setIsDetailModalOpen(false); }}
        getProductImageUrl={getProductImageUrl}
        getProductPrice={getProductPrice}
        getAvailableStock={getAvailableStock}
      />
      <Footer />
    </div>
  );
}

export default ClientShop;
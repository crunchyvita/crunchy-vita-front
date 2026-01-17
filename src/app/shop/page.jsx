'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ImageIcon, ChevronLeft, ChevronRight, Eye,
  ShoppingCart, Heart, Star, Package,
  LogOut, ShoppingBag, CheckCircle2, Search, X
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import ProductDetailModal from '@/components/detailProduct';
import Footer from '@/components/footer';
import Header from '@/components/header';

// --- UTILS ---
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const getProductImageUrl = (product) => {
  if (!product) return null;
  const url = product.imageUrl ||
    (product.media?.[0]?.url || product.media?.[0]) ||
    product.productImage ||
    product.image;

  if (!url || url === 'undefined') return null;
  return url.startsWith('http') ? url : `${backendUrl}${url}`;
};

const getProductPrice = (product) => {
  if (!product) return 0;
  const history = product.pricingHistory;
  const price = (history && history.length > 0)
    ? history[history.length - 1]?.price
    : product.price;
  return Number(price) || 0;
};

const getAvailableStock = (stock) => {
  if (!stock) return 0;
  return stock.availableQuantity ?? ((stock.quantity || 0) - (stock.reservedQuantity || 0));
};

// --- COMPONENTS ---

/** * Carousel pour les Packages 
 */
function PackageImageCarousel({ packageData }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = useMemo(() => {
    const imgs = [];
    packageData.products?.forEach(item => {
      const p = item.productId || item;
      const url = getProductImageUrl(p);
      if (url) imgs.push({ url, name: p.name });
    });
    if (imgs.length === 0) {
      const pkgUrl = getProductImageUrl(packageData);
      if (pkgUrl) imgs.push({ url: pkgUrl, name: packageData.name });
    }
    return imgs;
  }, [packageData]);

  useEffect(() => {
    if (images.length <= 1) return;
    const itv = setInterval(() => setCurrentIndex(p => (p + 1) % images.length), 4000);
    return () => clearInterval(itv);
  }, [images]);

  if (images.length === 0) return (
    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
      <Package size={48} />
    </div>
  );

  return (
    <div className="relative w-full h-full group overflow-hidden">
      {images.map((img, i) => (
        <img
          key={i}
          src={img.url}
          alt={img.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {images.length > 1 && (
        <>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** * Carte Produit Individuelle 
 */
function ProductCard({ product, onOpenDetail }) {
  const router = useRouter();
  const price = getProductPrice(product);
  const stock = getAvailableStock(product.stock);
  const imageUrl = getProductImageUrl(product);
  const avgRating = product.ratings?.length
    ? product.ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / product.ratings.length
    : null;
  const ratingCount = product.ratings?.length || 0;


  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <ImageIcon size={40} />
            <span className="text-xs mt-2">No image</span>
          </div>
        )}

        {/* Floating Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
          <button className="p-2.5 bg-white rounded-full shadow-lg hover:text-red-500 transition-colors">
            <Heart size={18} />
          </button>
          {stock > 0 && (
            <button
              onClick={() => onOpenDetail(product)}
              className="p-2.5 bg-white rounded-full shadow-lg hover:text-green-600 transition-colors"
            >
              <ShoppingCart size={18} />
            </button>
          )}
        </div>

        {stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-gray-800 line-clamp-1 flex-1">{product.name}</h3>
          {avgRating && (
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(avgRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-lg font-bold text-gray-900 mb-4">${price.toFixed(2)}</p>

        <button
          onClick={() => router.push(`/shop/${product.id || product._id}`)}
          className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-green-900 hover:text-white hover:border-gray-900 transition-all duration-200 flex items-center justify-center gap-2 text-sm opacity-0 group-hover:opacity-100"
        >
          <Eye size={16} />
          View Details
        </button>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---

function ClientShop() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products based on search query
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
          const tagsArray = product.tags.split(',').map(t => t.trim());
          tagsMatch = tagsArray.some(tag => 
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

  // Filter packages based on search query
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
        setLoading(true);
        const [pRes, pkgRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/packages')
        ]);

        if (pRes.ok) {
          const d = await pRes.json();
          setProducts((Array.isArray(d) ? d : d.data || []).filter(p => p.status === 'ACTIVE'));
        }
        if (pkgRes.ok) {
          const d = await pkgRes.json();
          setPackages((Array.isArray(d) ? d : d.data || []).filter(p => p.isActive));
        }
      } catch (err) {
        setError('Failed to connect to the store');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
      <div className="min-h-screen bg-[#FBFBFB] text-gray-900">

        <Header />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Search Bar Section */}
          <section className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by product name, tag, or category..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-gray-200 focus:border-green-600 focus:outline-none text-gray-900 placeholder:text-gray-400 bg-white shadow-sm"
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
                  Found {activeTab === 'products' ? filteredProducts.length : filteredPackages.length} result(s) for "{searchQuery}"
                </p>
              )}
            </div>
          </section>

          {/* Tabs Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                All Products ({filteredProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('packages')}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'packages' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Packages ({filteredPackages.length})
              </button>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-80 rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : (
            <>
              {activeTab === 'products' && (
                <>
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No products found</p>
                      <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredProducts.map(p => (
                        <ProductCard
                          key={p._id || p.id}
                          product={p}
                          onOpenDetail={(prod) => { setSelectedProduct(prod); setIsDetailModalOpen(true); }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'packages' && (
                <>
                  {filteredPackages.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No packages found</p>
                      <p className="text-sm text-gray-500 mt-2">Try adjusting your search terms</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {filteredPackages.map((pkg, pkgIndex) => (
                        <div key={pkg._id || pkg.id || `package-${pkgIndex}`} className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row">
                          <div className="md:w-2/5 h-64 md:h-auto">
                            <PackageImageCarousel packageData={pkg} />
                          </div>
                          <div className="p-8 md:w-3/5 flex flex-col">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-green-900 mb-2">
                                <ShoppingBag size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">Special Package</span>
                              </div>
                              <h3 className="text-2xl font-bold mb-3">{pkg.name}</h3>
                              <p className="text-gray-500 text-sm line-clamp-2 mb-4">{pkg.description}</p>

                              <div className="space-y-2 mb-6">
                                {pkg.products?.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle2 size={14} className="text-green-900" />
                                    <span>{item.productId?.name || item.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t">
                              <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-tighter">Package Price</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-black text-gray-900">${Number(pkg.price).toFixed(2)}</span>
                                  {pkg.originalPrice}
                                </div>
                              </div>
                              <button className="bg-[#064E3B] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#065F46] transition-colors shadow-lg shadow-gray-200">
                                Add To cart
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        <ProductDetailModal
          product={selectedProduct}
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setTimeout(() => setSelectedProduct(null), 300); }}
          getProductImageUrl={getProductImageUrl}
          getProductPrice={getProductPrice}
          getAvailableStock={getAvailableStock}
        />

        <Footer />
      </div>
  );
}

export default ClientShop;
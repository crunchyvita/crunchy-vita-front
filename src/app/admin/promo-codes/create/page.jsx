'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Info, ShieldCheck, Ticket, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import AdminHeader from '@/components/admin/header';

export default function CreatePromoCodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    freeItemType: 'PRODUCT',
    freeProduct: '',
    freePackage: '',
    minPurchaseAmount: '0',
    usageLimit: '',
    expirationDate: '',
    isActive: true,
    isRouletteEligible: false,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchGiftOptions();
  }, []);

  const fetchGiftOptions = async () => {
    try {
      const [productsRes, packagesRes] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/packages`),
      ]);

      const [productsData, packagesData] = await Promise.all([
        productsRes.json(),
        packagesRes.json(),
      ]);

      if (productsData.success) setProducts(productsData.data || []);
      if (packagesData.success) setPackages(packagesData.data || []);
    } catch (err) {
      console.error('Error loading products/packages:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: formData.discountType === 'FREE_ITEM' ? 0 : parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      };

      const response = await fetch(`${API_URL}/promo-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('✅ Promo code created successfully!');
        setTimeout(() => router.push('/admin/promo-codes'), 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8 bg-slate-50 min-h-screen">
        
        {/* --- TOP NAVIGATION --- */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/promo-codes"
              className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to promo codes
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Create a new promo code
            </h1>
          </div>
        </div>

        {/* Feedback messages */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <AlertTriangle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Ticket size={18} className="text-blue-500" />
                  Code Details
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Promo Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="PROMO2024"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Discount Type</label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FREE_ITEM">Free Product/Package</option>
                    </select>
                  </div>

                  {formData.discountType === 'PERCENTAGE' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Value (%) *</label>
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        placeholder="10"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        required
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Gift Type</label>
                      <select
                        name="freeItemType"
                        value={formData.freeItemType}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      >
                        <option value="PRODUCT">Product</option>
                        <option value="PACKAGE">Package</option>
                      </select>
                    </div>
                  )}

                  {formData.discountType === 'FREE_ITEM' && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Free Item *</label>
                      <select
                        name={formData.freeItemType === 'PRODUCT' ? 'freeProduct' : 'freePackage'}
                        value={formData.freeItemType === 'PRODUCT' ? formData.freeProduct : formData.freePackage}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                        required
                      >
                        <option value="">Choose an item...</option>
                        {(formData.freeItemType === 'PRODUCT' ? products : packages).map((item) => (
                          <option key={item._id} value={item._id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Minimum Purchase ( € )</label>
                    <input
                      type="number"
                      name="minPurchaseAmount"
                      value={formData.minPurchaseAmount}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Usage Limit</label>
                    <input
                      type="number"
                      name="usageLimit"
                      placeholder="Unlimited"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Expiration Date *</label>
                    <input
                      type="date"
                      name="expirationDate"
                      value={formData.expirationDate}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-6 bg-blue-50 border-t border-blue-100 flex gap-4">
                <div className="h-12 w-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <Info size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-base mb-1">Information</h4>
                  <p className="text-blue-700/80 text-sm leading-relaxed">
                    Promo codes are unique. Make sure this code is not already used by another campaign.
                    Codes expire at 11:59 PM on the selected date.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Side Settings (Sidebar style like Stock) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-slate-400" size={24} />
                <h3 className="font-bold text-slate-800 text-lg">Status </h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Active Code</span>
                    <span className="text-xs text-slate-400">Usable immediately</span>
                  </div>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-6 h-6 rounded accent-[#556622] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-all group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">Roulette Eligible</span>
                    <span className="text-xs text-slate-400">Add to roulette rewards</span>
                  </div>
                  <input
                    type="checkbox"
                    name="isRouletteEligible"
                    checked={formData.isRouletteEligible}
                    onChange={handleInputChange}
                    className="w-6 h-6 rounded accent-[#556622] cursor-pointer"
                  />
                </label>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full text-white py-4 rounded-lg font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{backgroundColor: '#556622'}}
                  onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#3d4617')}
                  onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#556622')}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create promo code'
                  )}
                </button>
                
                <Link
                  href="/admin/promo-codes"
                  className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-lg font-semibold text-sm transition-all"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
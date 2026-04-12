'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import AdminHeader from '@/components/admin/header';
import {
  ArrowLeft,
  Info,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Ticket,
  Loader2,
  Save
} from 'lucide-react';

export default function PromoCodeDetailPage() {
  const t = useTranslations('admin.promoCodesForm');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
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

  const [promoCode, setPromoCode] = useState(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const formatDisplayDate = useCallback((dateString) => {
    if (!dateString) return '–';
    try {
      return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch {
      return '–';
    }
  }, [locale]);

  const fetchGiftOptions = async () => {
    try {
      const [productsRes, packagesRes] = await Promise.all([
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/packages`),
      ]);
      const [productsData, packagesData] = await Promise.all([productsRes.json(), packagesRes.json()]);
      if (productsData.success) setProducts(productsData.data || []);
      if (packagesData.success) setPackages(packagesData.data || []);
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const fetchPromoCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/promo-codes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        setPromoCode(result.data);
        const exp = result.data.expirationDate;
        setFormData({
          name: result.data.name || '',
          discountType: result.data.discountType,
          discountValue: result.data.discountValue.toString(),
          freeItemType: result.data.freeItemType || 'PRODUCT',
          freeProduct: result.data.freeProduct || '',
          freePackage: result.data.freePackage || '',
          minPurchaseAmount: result.data.minPurchaseAmount.toString(),
          usageLimit: result.data.usageLimit?.toString() || '',
          expirationDate: typeof exp === 'string' ? exp.split('T')[0] : '',
          isActive: result.data.isActive,
          isRouletteEligible: result.data.isRouletteEligible || false,
        });
      }
    } catch {
      setError(t('loadError'));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchPromoCode(), fetchGiftOptions()]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, t]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        name: formData.name?.trim(),
        discountValue: formData.discountType === 'FREE_ITEM' ? 0 : parseFloat(formData.discountValue),
        minPurchaseAmount: parseFloat(formData.minPurchaseAmount) || 0,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      };

      const response = await fetch(`${API_URL}/promo-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(t('successUpdate'));
        setPromoCode(result.data);
        setTimeout(() => router.push('/admin/promo-codes'), 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">{t('loading')}</p>
      </div>
    );
  }

  const isExpired = formData.expirationDate ? new Date(formData.expirationDate) < new Date() : false;

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/admin/promo-codes"
              className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              {t('back')}
            </Link>
            <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              {formData.name || '-'}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                formData.isActive && !isExpired ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}>
                {formData.isActive && !isExpired ? t('badgeActive') : t('badgeInactiveExpired')}
              </span>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('statUsages')}</p>
              <p className="text-3xl font-bold text-slate-900">
                {promoCode?.usageCount || 0} <span className="text-lg text-slate-400 font-normal">/ {formData.usageLimit || '∞'}</span>
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Ticket size={28} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('statMinPurchase')}</p>
              <p className="text-3xl font-bold text-slate-900">{formData.minPurchaseAmount} €</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Calendar size={28} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('statExpiration')}</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatDisplayDate(formData.expirationDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Info size={18} className="text-blue-500" />
                  {t('couponConfig')}
                </h3>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">{t('promotionName')}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('discountType')}</label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="PERCENTAGE">{t('optionPercentage')}</option>
                    <option value="FREE_ITEM">{t('optionFreeItem')}</option>
                  </select>
                </div>

                {formData.discountType === 'PERCENTAGE' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{t('valuePercentShort')}</label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{t('giftType')}</label>
                    <select
                      name="freeItemType"
                      value={formData.freeItemType}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                      <option value="PRODUCT">{t('optionProduct')}</option>
                      <option value="PACKAGE">{t('optionPackage')}</option>
                    </select>
                  </div>
                )}

                {formData.discountType === 'FREE_ITEM' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700">{t('selectFreeItem')}</label>
                    <select
                      name={formData.freeItemType === 'PRODUCT' ? 'freeProduct' : 'freePackage'}
                      value={formData.freeItemType === 'PRODUCT' ? formData.freeProduct : formData.freePackage}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    >
                      <option value="">{t('chooseShort')}</option>
                      {(formData.freeItemType === 'PRODUCT' ? products : packages).map((item) => (
                        <option key={item._id} value={item._id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('minPurchase')}</label>
                  <input
                    type="number"
                    name="minPurchaseAmount"
                    step="0.01"
                    value={formData.minPurchaseAmount}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('usageLimit')}</label>
                  <input
                    type="number"
                    name="usageLimit"
                    placeholder={t('unlimitedIfEmpty')}
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('expirationDate')}</label>
                  <input
                    type="date"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-slate-400" size={24} />
                <h3 className="font-bold text-slate-800 text-lg">{t('activationSettings')}</h3>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <span className="text-sm font-semibold text-slate-700">{t('activeCode')}</span>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-[#556622] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <span className="text-sm font-semibold text-slate-700">{t('rouletteEligible')}</span>
                  <input
                    type="checkbox"
                    name="isRouletteEligible"
                    checked={formData.isRouletteEligible}
                    onChange={handleInputChange}
                    className="w-5 h-5 accent-[#556622] cursor-pointer"
                  />
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full text-white py-4 rounded-lg font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: '#556622' }}
                onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#3d4617')}
                onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#556622')}
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? t('updating') : t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

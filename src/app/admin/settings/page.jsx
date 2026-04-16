"use client";

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


export default function AdminSettingsPage() {
  const ts = useTranslations('admin.settings');
  const [settings, setSettings] = useState({
    emailNotifications: { contactMessages: true, stockAlerts: false, newOrders: true },
    features: { rouletteEnabled: false },
    professionalSpace: { productFormats: '1kg, 2kg, 10kg' },
  });
  const [loading, setLoading] = useState(true);
  const [savingFormats, setSavingFormats] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/settings`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings({
            emailNotifications: {
              contactMessages: data.data.emailNotifications?.contactMessages ?? true,
              stockAlerts: data.data.emailNotifications?.stockAlerts ?? false,
              newOrders: data.data.emailNotifications?.newOrders !== false,
            },
            features: {
              rouletteEnabled: data.data.features?.rouletteEnabled ?? false,
            },
            professionalSpace: {
              productFormats: data.data.professionalSpace?.productFormats ?? '1kg, 2kg, 10kg',
            },
          });
        }
      } else {
        toast.error(ts('toastLoadError'));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error(ts('toastLoadGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (category, key) => {
    const previousSettings = settings;
    const newSettings = {
      ...settings,
      [category]: { ...settings[category], [key]: !settings[category][key] }
    };

    // Optimistically update UI immediately
    setSettings(newSettings);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error(ts('toastUnauth'));
        setSettings(previousSettings);
        return;
      }

      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        toast.success(ts('toastSaved'));
      } else {
        setSettings(previousSettings);
        toast.error(ts('toastSaveError'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSettings(previousSettings);
      toast.error(ts('toastSaveError'));
    }
  };

  const handleFormatsSave = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error(ts('toastUnauth'));
        return;
      }

      setSavingFormats(true);

      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          professionalSpace: {
            productFormats: settings.professionalSpace.productFormats,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings((prev) => ({
            ...prev,
            professionalSpace: {
              productFormats: data.data.professionalSpace?.productFormats ?? prev.professionalSpace.productFormats,
            },
          }));
        }
        toast.success(ts('toastFormatsSaved'));
      } else {
        toast.error(ts('toastFormatsError'));
      }
    } catch (error) {
      console.error('Error saving product formats:', error);
      toast.error(ts('toastFormatsError'));
    } finally {
      setSavingFormats(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="space-y-6 p-6 lg:p-8">
          <div className="py-10 text-center text-sm text-slate-500">{ts('loading')}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            {ts('title')}
          </div>
          <p className="text-sm text-slate-500">{ts('subtitle')}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">{ts('emailSection')}</h2>
            <p className="mt-1 text-xs text-slate-500">{ts('emailSectionDesc')}</p>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              { id: 'contactMessages', label: ts('notifContactLabel'), desc: ts('notifContactDesc'), cat: 'emailNotifications' },
              { id: 'stockAlerts', label: ts('notifStockLabel'), desc: ts('notifStockDesc'), cat: 'emailNotifications' },
              { id: 'newOrders', label: ts('notifOrdersLabel'), desc: ts('notifOrdersDesc'), cat: 'emailNotifications' }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(item.cat, item.id)}
                  aria-pressed={settings[item.cat][item.id]}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#556822]/40 ${
                    settings[item.cat][item.id]
                      ? 'border-[#556822] bg-linear-to-r from-[#556822] to-[#43521b]'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      settings[item.cat][item.id] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">{ts('featuresSection')}</h2>
            <p className="mt-1 text-xs text-slate-500">{ts('featuresSectionDesc')}</p>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-slate-900">{ts('rouletteLabel')}</p>
              <p className="text-sm text-slate-500">{ts('rouletteDesc')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('features', 'rouletteEnabled')}
              aria-pressed={settings.features.rouletteEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#556822]/40 ${
                settings.features.rouletteEnabled
                  ? 'border-[#556822] bg-linear-to-r from-[#556822] to-[#43521b]'
                  : 'border-gray-300 bg-gray-100'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  settings.features.rouletteEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">{ts('proSection')}</h2>
            <p className="mt-1 text-xs text-slate-500">{ts('proSectionDesc')}</p>
          </div>

          <div className="py-4 space-y-3">
            <label htmlFor="productFormats" className="text-sm font-medium text-slate-900">
              {ts('productFormatsLabel')}
            </label>
            <input
              id="productFormats"
              type="text"
              value={settings.professionalSpace.productFormats}
              onChange={(e) => {
                setSettings((prev) => ({
                  ...prev,
                  professionalSpace: {
                    ...prev.professionalSpace,
                    productFormats: e.target.value,
                  },
                }));
              }}
              placeholder={ts('placeholderFormats')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#556822] focus:outline-none focus:ring-2 focus:ring-[#556822]/20"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFormatsSave}
                disabled={savingFormats}
                className="rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#44591a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingFormats ? ts('saving') : ts('save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
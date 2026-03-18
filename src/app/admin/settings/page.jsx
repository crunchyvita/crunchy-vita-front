"use client";

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: { contactMessages: true, stockAlerts: false },
    features: { rouletteEnabled: false },
    professionalSpace: { productFormats: '1kg, 2kg, 10kg' },
    promoBadge: {
      highlightedValue: '40 €',
    },
  });
  const [loading, setLoading] = useState(true);
  const [savingFormats, setSavingFormats] = useState(false);
  const [savingPromoBadge, setSavingPromoBadge] = useState(false);

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
            },
            features: {
              rouletteEnabled: data.data.features?.rouletteEnabled ?? false,
            },
            professionalSpace: {
              productFormats: data.data.professionalSpace?.productFormats ?? '1kg, 2kg, 10kg',
            },
            promoBadge: {
              highlightedValue: data.data.promoBadge?.highlightedValue ?? '40 €',
            },
          });
        }
      } else {
        toast.error('Erreur de chargement des paramètres');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (category, key) => {
    const newSettings = {
      ...settings,
      [category]: { ...settings[category], [key]: !settings[category][key] }
    };
    
    // Optimistically update UI
    setSettings(newSettings);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Non authentifié');
        setSettings(settings); // Revert
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
        toast.success('Paramètre enregistré');
      } else {
        // Revert on error
        setSettings(settings);
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Revert on error
      setSettings(settings);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleFormatsSave = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Non authentifié');
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
        toast.success('Formats enregistrés');
      } else {
        toast.error('Erreur lors de la sauvegarde des formats');
      }
    } catch (error) {
      console.error('Error saving product formats:', error);
      toast.error('Erreur lors de la sauvegarde des formats');
    } finally {
      setSavingFormats(false);
    }
  };

  const handlePromoBadgeSave = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Non authentifié');
        return;
      }

      setSavingPromoBadge(true);

      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          promoBadge: {
            highlightedValue: settings.promoBadge.highlightedValue,
          },
        }),
      });

      const responseData = await response.json().catch(() => null);

      if (response.ok && responseData?.success) {
        const savedValue =
          responseData?.data?.promoBadge?.highlightedValue
          ?? settings.promoBadge.highlightedValue;

        setSettings((prev) => ({
          ...prev,
          promoBadge: {
            ...prev.promoBadge,
            highlightedValue: savedValue,
          },
        }));

        toast.success('Promo badge enregistré');
      } else {
        toast.error('Erreur lors de la sauvegarde du promo badge');
      }
    } catch (error) {
      console.error('Error saving promo badge settings:', error);
      toast.error('Erreur lors de la sauvegarde du promo badge');
    } finally {
      setSavingPromoBadge(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="space-y-6 p-6 lg:p-8">
          <div className="py-10 text-center text-sm text-slate-500">Loading settings...</div>
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
            Settings
          </div>
          <p className="text-sm text-slate-500">Manage notifications and feature visibility. Changes are saved automatically.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Email Notifications</h2>
            <p className="mt-1 text-xs text-slate-500">Configure email alerts for admin messages and stock monitoring.</p>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              { id: 'contactMessages', label: 'Contact Messages', desc: 'Email alerts for new contact form submissions', cat: 'emailNotifications' },
              { id: 'stockAlerts', label: 'Stock Alerts', desc: 'Email alerts when product stock is running low', cat: 'emailNotifications' }
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
            <h2 className="text-sm font-semibold text-slate-900">Features</h2>
            <p className="mt-1 text-xs text-slate-500">Control storefront feature visibility.</p>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Roulette Widget</p>
              <p className="text-sm text-slate-500">Show or hide the roulette widget on the home page</p>
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
            <h2 className="text-sm font-semibold text-slate-900">Professional Space</h2>
            <p className="mt-1 text-xs text-slate-500">Update product formats shown on the Professional Space page.</p>
          </div>

          <div className="py-4 space-y-3">
            <label htmlFor="productFormats" className="text-sm font-medium text-slate-900">
              Product formats text
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
              placeholder="1kg, 2kg, 10kg"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#556822] focus:outline-none focus:ring-2 focus:ring-[#556822]/20"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleFormatsSave}
                disabled={savingFormats}
                className="rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#44591a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingFormats ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Promo Badge</h2>
            <p className="mt-1 text-xs text-slate-500">Update only the highlighted amount shown in the floating delivery promo badge.</p>
          </div>

          <div className="py-4 space-y-3">
            <label htmlFor="promoBadgeHighlightedValue" className="text-sm font-medium text-slate-900">
              Highlighted value
            </label>
            <input
              id="promoBadgeHighlightedValue"
              type="text"
              value={settings.promoBadge.highlightedValue}
              onChange={(e) => {
                setSettings((prev) => ({
                  ...prev,
                  promoBadge: {
                    ...prev.promoBadge,
                    highlightedValue: e.target.value,
                  },
                }));
              }}
              placeholder="40 €"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#556822] focus:outline-none focus:ring-2 focus:ring-[#556822]/20"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePromoBadgeSave}
                disabled={savingPromoBadge}
                className="rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#44591a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPromoBadge ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
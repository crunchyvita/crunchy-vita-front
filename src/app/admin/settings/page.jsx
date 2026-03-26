"use client";

import { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/header';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const formatEuro = (value) => {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(2).replace('.', ',')} € TTC`;
};

const handleNumberInputFocus = (e) => {
  e.target.select();
};

const parseNumberInput = (rawValue) => {
  if (rawValue === '') return '';
  const numeric = Number(rawValue);
  return Number.isNaN(numeric) ? '' : numeric;
};

const toNumberOrFallback = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) return fallback;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? fallback : numeric;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: { contactMessages: true, stockAlerts: false, newOrders: true },
    features: { rouletteEnabled: false },
    professionalSpace: { productFormats: '1kg, 2kg, 10kg' },
    promoBadge: {
      highlightedValue: '40 €',
    },
    shippingSettings: {
      marginMultiplier: 1,
      relay: { freeThreshold: 40, belowThresholdPrice: 4.9 },
      home: {
        freeThreshold: 60,
        reducedThreshold: 40,
        belowReducedPrice: 6.9,
        betweenReducedAndFreePrice: 4.9,
      },
      express: { enabled: true, addonPrice: 9.9 },
    },
  });
  const [loading, setLoading] = useState(true);
  const [savingFormats, setSavingFormats] = useState(false);
  const [savingPromoBadge, setSavingPromoBadge] = useState(false);
  const [savingShippingSettings, setSavingShippingSettings] = useState(false);

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
            promoBadge: {
              highlightedValue: data.data.promoBadge?.highlightedValue ?? '40 €',
            },
            shippingSettings: {
              marginMultiplier: data.data.shippingSettings?.marginMultiplier ?? 1,
              relay: {
                freeThreshold: data.data.shippingSettings?.relay?.freeThreshold ?? 40,
                belowThresholdPrice: data.data.shippingSettings?.relay?.belowThresholdPrice ?? 4.9,
              },
              home: {
                freeThreshold: data.data.shippingSettings?.home?.freeThreshold ?? 60,
                reducedThreshold: data.data.shippingSettings?.home?.reducedThreshold ?? 40,
                belowReducedPrice: data.data.shippingSettings?.home?.belowReducedPrice ?? 6.9,
                betweenReducedAndFreePrice:
                  data.data.shippingSettings?.home?.betweenReducedAndFreePrice ?? 4.9,
              },
              express: {
                enabled: data.data.shippingSettings?.express?.enabled ?? true,
                addonPrice: data.data.shippingSettings?.express?.addonPrice ?? 9.9,
              },
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
        toast.error('Non authentifié');
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
        toast.success('Paramètre enregistré');
      } else {
        setSettings(previousSettings);
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setSettings(previousSettings);
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
        const data = await response.json();
        if (data.success && data.data) {
          setSettings((prev) => ({
            ...prev,
            professionalSpace: {
              productFormats: data.data.professionalSpace?.productFormats ?? prev.professionalSpace.productFormats,
            },
          }));
        }
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

  const handleShippingSettingsSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Non authentifié');
        return;
      }

      const normalizedShippingSettings = {
        marginMultiplier: toNumberOrFallback(settings.shippingSettings.marginMultiplier, 1),
        relay: {
          freeThreshold: toNumberOrFallback(settings.shippingSettings.relay.freeThreshold, 0),
          belowThresholdPrice: toNumberOrFallback(settings.shippingSettings.relay.belowThresholdPrice, 0),
        },
        home: {
          freeThreshold: toNumberOrFallback(settings.shippingSettings.home.freeThreshold, 0),
          reducedThreshold: toNumberOrFallback(settings.shippingSettings.home.reducedThreshold, 0),
          belowReducedPrice: toNumberOrFallback(settings.shippingSettings.home.belowReducedPrice, 0),
          betweenReducedAndFreePrice: toNumberOrFallback(settings.shippingSettings.home.betweenReducedAndFreePrice, 0),
        },
        express: {
          ...settings.shippingSettings.express,
          addonPrice: toNumberOrFallback(settings.shippingSettings.express.addonPrice, 0),
        },
      };

      setSavingShippingSettings(true);
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          shippingSettings: normalizedShippingSettings,
        }),
      });

      if (!response.ok) {
        toast.error('Erreur lors de la sauvegarde des frais de livraison');
        return;
      }

      const data = await response.json();
      if (data?.success) {
        setSettings((prev) => ({
          ...prev,
          shippingSettings: data?.data?.shippingSettings ?? prev.shippingSettings,
          promoBadge: data?.data?.promoBadge ?? prev.promoBadge,
        }));
        toast.success('Frais de livraison enregistrés');
      } else {
        toast.error('Erreur lors de la sauvegarde des frais de livraison');
      }
    } catch (error) {
      console.error('Error saving shipping settings:', error);
      toast.error('Erreur lors de la sauvegarde des frais de livraison');
    } finally {
      setSavingShippingSettings(false);
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
              { id: 'stockAlerts', label: 'Stock Alerts', desc: 'Email alerts when product stock is running low', cat: 'emailNotifications' },
              { id: 'newOrders', label: 'New orders', desc: 'Email admins when a payment succeeds and an order is created', cat: 'emailNotifications' }
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

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-semibold text-slate-900">Shipping Settings</h2>
            <p className="mt-1 text-xs text-slate-500">
              Configure checkout pricing rules shown in front office. Prices are TTC.
            </p>
          </div>

          <div className="py-4 space-y-6">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Front-office explanation (customer view)</h3>
              <p className="mt-1 text-xs text-slate-500">This summary helps admins verify exactly what customers see at checkout.</p>

              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Point relais</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                    <li>{formatEuro(settings.shippingSettings.relay.belowThresholdPrice)} - panier &lt; {settings.shippingSettings.relay.freeThreshold} €</li>
                    <li>GRATUIT - des {settings.shippingSettings.relay.freeThreshold} €</li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Livraison domicile</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                    <li>{formatEuro(settings.shippingSettings.home.belowReducedPrice)} - panier &lt; {settings.shippingSettings.home.reducedThreshold} €</li>
                    <li>{formatEuro(settings.shippingSettings.home.betweenReducedAndFreePrice)} - {toNumberOrFallback(settings.shippingSettings.home.reducedThreshold, 0)} € a {Math.max(toNumberOrFallback(settings.shippingSettings.home.reducedThreshold, 0), toNumberOrFallback(settings.shippingSettings.home.freeThreshold, 0) - 1)} €</li>
                    <li>GRATUIT - des {settings.shippingSettings.home.freeThreshold} €</li>
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Express (option)</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                    <li>{formatEuro(settings.shippingSettings.express.addonPrice)}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Point Relais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Free shipping from cart amount (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.relay.freeThreshold}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          relay: {
                            ...prev.shippingSettings.relay,
                            freeThreshold: parseNumberInput(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Price when cart is below threshold (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.relay.belowThresholdPrice}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          relay: {
                            ...prev.shippingSettings.relay,
                            belowThresholdPrice: parseNumberInput(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="4.90"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Livraison Domicile</h3>
              <p className="text-xs text-slate-500">Rule: below reduced threshold = low tier, between thresholds = mid tier, from free threshold = free.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Reduced-price threshold (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.home.reducedThreshold}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          home: {
                            ...prev.shippingSettings.home,
                            reducedThreshold: parseNumberInput(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="40"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Free shipping threshold (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.home.freeThreshold}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          home: {
                            ...prev.shippingSettings.home,
                            freeThreshold: parseNumberInput(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="60"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Price below reduced threshold (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.home.belowReducedPrice}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          home: {
                            ...prev.shippingSettings.home,
                            belowReducedPrice: parseNumberInput(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="7.90"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Price between reduced and free thresholds (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.home.betweenReducedAndFreePrice}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          home: {
                            ...prev.shippingSettings.home,
                            betweenReducedAndFreePrice: parseNumberInput(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="4.90"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Express Add-on</h3>
              <p className="text-xs text-slate-500">Optional extra fee added to the selected delivery mode.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Express add-on fee (EUR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.express.addonPrice}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          express: {
                            ...prev.shippingSettings.express,
                            addonPrice: parseNumberInput(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="9.90"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Boxtal margin multiplier (back office quotes)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.shippingSettings.marginMultiplier}
                    onFocus={handleNumberInputFocus}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        shippingSettings: {
                          ...prev.shippingSettings,
                          marginMultiplier: parseNumberInput(e.target.value),
                        },
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="1.00"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleShippingSettingsSave}
                disabled={savingShippingSettings}
                className="rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#44591a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingShippingSettings ? 'Saving...' : 'Save Shipping Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
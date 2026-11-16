// Free-shipping thresholds for France, read from the admin shipping settings (zone containing FR).
// Defaults mirror the current settings so the UI stays sensible if settings can't be loaded.
const DEFAULTS = { relayFree: 25, homeFree: 59 };

const positive = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function getFranceShippingThresholds(settings) {
  const zones = settings?.shippingSettings?.zones || [];
  const france = zones.find((zone) => (zone.countries || []).some((c) => c?.iso === 'FR'));
  return {
    relayFree: positive(france?.relay?.freeShipping) ?? DEFAULTS.relayFree,
    homeFree: positive(france?.home?.freeShipping) ?? DEFAULTS.homeFree,
  };
}

/** "25 €" / "24,90 €" */
export const formatEuros = (amount) =>
  `${Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2, maximumFractionDigits: 2 })} €`;

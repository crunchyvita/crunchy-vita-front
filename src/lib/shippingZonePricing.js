/**
 * Mirrors backend shippingZoneService.resolveShippingPricingForCountry for checkout UI.
 */

const round2 = (v) => Number((Number(v || 0)).toFixed(2));

/** ISO from legacy string or { iso, label } — mirrors backend shippingZoneService.zoneCountryIso */
export function zoneCountryIso(c) {
  if (c == null) return '';
  if (typeof c === 'string') {
    const s = String(c).trim().toUpperCase();
    return s.length === 2 ? s : '';
  }
  if (typeof c === 'object') {
    const s = String(c.iso || c.code || '').trim().toUpperCase();
    return s.length === 2 ? s : '';
  }
  return '';
}

export function normalizeCountryEntry(c) {
  const iso = zoneCountryIso(c);
  if (!iso) return null;
  const label =
    typeof c === 'object' && c !== null
      ? String(c.label || c.name || '').trim()
      : '';
  return { iso, label };
}

const toNonNegative = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const defaultPricing = () => ({
  marginMultiplier: 1,
  relay: {
    freeShipping: 40,
    StandarShippingFee: 4.9,
  },
  home: {
    freeShipping: 60,
    discountedShipping: 40,
    StandardShippingFee: 7.9,
    discountedShippingFee: 4.9,
    express: 9.9,
  },
});

const normalizeBlock = (raw, defaults) => {
  const d = defaults || defaultPricing();
  const relayFreeShipping = toNonNegative(
    raw?.relay?.freeShipping ?? raw?.relay?.freeThreshold,
    d.relay.freeShipping
  );
  const homeDiscountedShipping = toNonNegative(
    raw?.home?.discountedShipping ?? raw?.home?.reducedThreshold,
    d.home.discountedShipping
  );
  const homeFreeShipping = toNonNegative(
    raw?.home?.freeShipping ?? raw?.home?.freeThreshold,
    d.home.freeShipping
  );

  return {
    marginMultiplier: toNonNegative(raw?.marginMultiplier, d.marginMultiplier) || 1,
    relay: {
      freeShipping: relayFreeShipping,
      StandarShippingFee: round2(
        toNonNegative(
          raw?.relay?.StandarShippingFee ?? raw?.relay?.belowThresholdPrice,
          d.relay.StandarShippingFee
        )
      ),
    },
    home: {
      freeShipping: Math.max(homeFreeShipping, homeDiscountedShipping),
      discountedShipping: Math.min(homeDiscountedShipping, homeFreeShipping),
      StandardShippingFee: round2(
        toNonNegative(
          raw?.home?.StandardShippingFee ?? raw?.home?.belowReducedPrice,
          d.home.StandardShippingFee
        )
      ),
      discountedShippingFee: round2(
        toNonNegative(
          raw?.home?.discountedShippingFee ?? raw?.home?.betweenReducedAndFreePrice,
          d.home.discountedShippingFee
        )
      ),
      express: round2(
        toNonNegative(raw?.home?.express, raw?.express?.addonPrice ?? d.home.express)
      ),
    },
  };
};

export function resolveShippingPricingForCountry(shippingSettings, countryIso) {
  const raw = String(countryIso || '').trim();
  const iso = /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : '';
  const base = normalizeBlock(shippingSettings || {}, defaultPricing());
  const zones = Array.isArray(shippingSettings?.zones) ? shippingSettings.zones : [];

  if (!iso) {
    return base;
  }

  const zone =
    iso &&
    zones.find((z) => {
      const list = Array.isArray(z?.countries) ? z.countries : [];
      return list.some((c) => zoneCountryIso(c) === iso);
    });

  if (zone) {
    return normalizeBlock(
      {
        marginMultiplier: shippingSettings?.marginMultiplier,
        relay: { ...base.relay, ...(zone.relay || {}) },
        home: { ...base.home, ...(zone.home || {}) },
      },
      base
    );
  }

  if (zones.length > 0) {
    const first = zones[0];
    return normalizeBlock(
      {
        marginMultiplier: shippingSettings?.marginMultiplier,
        relay: { ...base.relay, ...(first.relay || {}) },
        home: { ...base.home, ...(first.home || {}) },
      },
      base
    );
  }

  return base;
}

export function getPromoBadgeThresholds(shippingSettings) {
  const ss = shippingSettings || {};
  const base = normalizeBlock(ss, defaultPricing());
  const promoBadgeZoneId = ss.promoBadgeZoneId ?? ss.shippingSettings?.promoBadgeZoneId ?? null;

  if (!promoBadgeZoneId) {
    return {
      relayFree: base.relay.freeShipping,
      homeFree: base.home.freeShipping,
    };
  }

  const zones = Array.isArray(ss.zones) ? ss.zones : Array.isArray(ss.shippingSettings?.zones) ? ss.shippingSettings.zones : [];
  const zone = zones.find((z) => String(z?._id ?? z?.id ?? '') === String(promoBadgeZoneId));
  if (!zone) {
    return {
      relayFree: base.relay.freeShipping,
      homeFree: base.home.freeShipping,
    };
  }

  const merged = normalizeBlock(
    {
      relay: { ...base.relay, ...(zone.relay || {}) },
      home: { ...base.home, ...(zone.home || {}) },
    },
    base
  );
  return {
    relayFree: merged.relay.freeShipping,
    homeFree: merged.home.freeShipping,
  };
}

/**
 * Zone that contains this ISO (no fallback to first zone — use for display-only UIs).
 */
export function findShippingZoneForCountry(shippingSettings, countryIso) {
  const raw = String(countryIso || '').trim();
  const iso = /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : '';
  if (!iso) return null;
  const zones = Array.isArray(shippingSettings?.zones) ? shippingSettings.zones : [];
  return (
    zones.find((z) => {
      const list = Array.isArray(z?.countries) ? z.countries : [];
      return list.some((c) => zoneCountryIso(c) === iso);
    }) || null
  );
}

/**
 * Raw relay/home objects from the matched zone only (not merged with defaults).
 */
export function getZoneShippingLayersForCountry(shippingSettings, countryIso) {
  const zone = findShippingZoneForCountry(shippingSettings, countryIso);
  if (!zone) return { zone: null, relay: null, home: null };
  return {
    zone,
    relay: zone.relay && typeof zone.relay === 'object' ? zone.relay : null,
    home: zone.home && typeof zone.home === 'object' ? zone.home : null,
  };
}

const finitePositive = (n) => {
  const x = Number(n);
  return Number.isFinite(x) && x > 0;
};

/** Sidebar: show relay free threshold line only if the zone defines it. */
export function shouldShowShippingInfoRelay(zoneRelay) {
  if (!zoneRelay) return false;
  return finitePositive(zoneRelay.freeShipping);
}

/** Sidebar: show reduced-tier line only if the zone defines both discounted fields. */
export function shouldShowShippingInfoHomeDiscounted(zoneHome) {
  if (!zoneHome) return false;
  if (
    !Object.prototype.hasOwnProperty.call(zoneHome, 'discountedShipping') ||
    !Object.prototype.hasOwnProperty.call(zoneHome, 'discountedShippingFee')
  ) {
    return false;
  }
  const th = Number(zoneHome.discountedShipping);
  const fee = Number(zoneHome.discountedShippingFee);
  return finitePositive(th) && Number.isFinite(fee) && fee >= 0;
}

/** Sidebar: show free-from threshold line only if the zone defines free shipping threshold. */
export function shouldShowShippingInfoHomeFree(zoneHome) {
  if (!zoneHome) return false;
  return finitePositive(zoneHome.freeShipping);
}

export function flattenZoneCountryOptions(zones, displayNames) {
  const list = [];
  const seen = new Set();
  for (const z of Array.isArray(zones) ? zones : []) {
    for (const c of Array.isArray(z?.countries) ? z.countries : []) {
      const iso = zoneCountryIso(c);
      if (!iso || seen.has(iso)) continue;
      seen.add(iso);
      const custom =
        typeof c === 'object' && c !== null && String(c.label || '').trim()
          ? String(c.label).trim()
          : '';
      list.push({
        iso,
        label: custom || displayNames?.of(iso) || iso,
      });
    }
  }
  list.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  return list;
}

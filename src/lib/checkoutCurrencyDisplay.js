/**
 * Client-side EUR → destination display (Frankfurter ECB rates; aligns with backend fallback).
 */

const ZERO_DECIMAL = new Set([
  'bif',
  'clp',
  'djf',
  'gnf',
  'jpy',
  'kmf',
  'krw',
  'mga',
  'pyg',
  'rwf',
  'ugx',
  'vnd',
  'vuv',
  'xaf',
  'xof',
  'xpf',
]);

const round2 = (v) => Number((Number(v || 0)).toFixed(2));

/**
 * @param {number} amountEur
 * @param {number} eurToDestRate units of destination per 1 EUR
 * @param {string} currencyLower
 * @returns {number|null} major units in destination, or null if invalid
 */
export function convertEurToDestinationMajor(amountEur, eurToDestRate, currencyLower) {
  const c = String(currencyLower || 'eur').trim().toLowerCase();
  const a = Number(amountEur);
  if (!Number.isFinite(a)) return 0;
  if (c === 'eur') return round2(a);
  const r = Number(eurToDestRate);
  if (!Number.isFinite(r) || r <= 0) return null;
  if (ZERO_DECIMAL.has(c)) return Math.round(a * r);
  return round2(a * r);
}

export function formatDestinationMoney(amountMajor, currencyLower, locale) {
  const c = String(currencyLower || 'eur').trim().toLowerCase();
  const upper = c.toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: upper,
      minimumFractionDigits: ZERO_DECIMAL.has(c) ? 0 : 2,
      maximumFractionDigits: ZERO_DECIMAL.has(c) ? 0 : 2,
    }).format(Number(amountMajor));
  } catch {
    return `${Number(amountMajor).toFixed(ZERO_DECIMAL.has(c) ? 0 : 2)} ${upper}`;
  }
}

/**
 * Direct Frankfurter (often blocked by CORS in the browser — prefer fetchEurToDestinationRate).
 */
async function fetchFrankfurterEurToDestinationRate(destinationCurrencyUpper) {
  const cur = String(destinationCurrencyUpper || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(cur)) {
    throw new Error('Invalid currency');
  }
  if (cur === 'EUR') return 1;
  const res = await fetch(
    `https://api.frankfurter.app/latest?from=EUR&to=${encodeURIComponent(cur)}`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) {
    throw new Error(`Frankfurter ${res.status}`);
  }
  const data = await res.json();
  const r = data?.rates?.[cur];
  const n = Number(r);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error('No rate');
  }
  return n;
}

const apiBaseUrl = () =>
  String(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

/**
 * EUR→destination rate (same logic as payment). Uses backend `/payment/fx-rate` so it works
 * when the browser cannot call Frankfurter (CORS). Falls back to Frankfurter on serverless/SSR.
 */
export async function fetchEurToDestinationRate(destinationCurrencyUpper) {
  const cur = String(destinationCurrencyUpper || '').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(cur)) {
    throw new Error('Invalid currency');
  }
  if (cur === 'EUR') return 1;

  if (typeof window !== 'undefined') {
    try {
      const url = `${apiBaseUrl()}/payment/fx-rate?currency=${encodeURIComponent(cur)}`;
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const body = await res.json();
        const rate = body?.data?.rate ?? body?.rate;
        const n = Number(rate);
        if (Number.isFinite(n) && n > 0) return n;
      }
    } catch {
      // fall through
    }
  }

  return fetchFrankfurterEurToDestinationRate(cur);
}

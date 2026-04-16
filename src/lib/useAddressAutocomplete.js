import { useCallback, useEffect, useRef, useState } from 'react';
import { shippingAPI } from '@/lib/api';

const dedupeByCompactLabel = (rows) => {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = String(row.shortLabel || row.displayName || '')
      .trim()
      .toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
};

/**
 * Debounced Nominatim search via backend (country-scoped).
 */
export function useAddressAutocomplete({ countryIso, debounceMs = 400, minLength = 3 }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const seqRef = useRef(0);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    seqRef.current += 1;
    setSuggestions([]);
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => {
    clear();
  }, [countryIso, clear]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );

  const scheduleSearch = useCallback(
    (rawQuery) => {
      const q = String(rawQuery || '').trim();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      if (!countryIso || q.length < minLength) {
        setSuggestions([]);
        setError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      timerRef.current = setTimeout(async () => {
        const seq = ++seqRef.current;
        const ac = new AbortController();
        abortRef.current = ac;
        try {
          const data = await shippingAPI.addressAutocomplete(q, countryIso, { signal: ac.signal });
          if (seq !== seqRef.current) return;
          const raw = Array.isArray(data?.results) ? data.results : [];
          setSuggestions(dedupeByCompactLabel(raw));
        } catch (e) {
          if (e?.name === 'AbortError') return;
          if (seq !== seqRef.current) return;
          setSuggestions([]);
          setError(typeof e?.message === 'string' && e.message.trim() ? e.message : 'Address search failed');
        } finally {
          if (seq === seqRef.current) setLoading(false);
        }
      }, debounceMs);
    },
    [countryIso, debounceMs, minLength]
  );

  return { suggestions, loading, error, scheduleSearch, clear };
}

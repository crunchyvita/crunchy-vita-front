'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatEuros, getFranceShippingThresholds } from '@/lib/shippingThresholds';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

/** "X € more for free pickup-point delivery" bar, based on the admin's France thresholds. */
export default function FreeShippingProgress({ subtotal, packOnly = false }) {
  const t = useTranslations('Cart.freeShipping');
  const [thresholds, setThresholds] = useState(() => getFranceShippingThresholds(null));

  useEffect(() => {
    fetch(`${API_URL}/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.data && setThresholds(getFranceShippingThresholds(data.data)))
      .catch(() => {});
  }, []);

  const amount = Number(subtotal) || 0;
  if (packOnly) {
    return (
      <div className="rounded-lg bg-[#F2F8EE] p-3 text-sm font-bold text-[#556822]">{t('packOnly')}</div>
    );
  }
  const { relayFree, homeFree } = thresholds;
  const remaining = Math.max(0, relayFree - amount);
  const progress = Math.min(100, (amount / relayFree) * 100);

  return (
    <div className="rounded-lg bg-[#F2F8EE] p-3 text-sm">
      <p className="font-bold text-[#556822] mb-2">
        {remaining > 0
          ? t('remaining', { amount: formatEuros(remaining) })
          : amount >= homeFree
            ? t('reachedHome')
            : t('reachedRelay', { home: formatEuros(homeFree) })}
      </p>
      <div className="h-2 rounded-full bg-white overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-[#556822] transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

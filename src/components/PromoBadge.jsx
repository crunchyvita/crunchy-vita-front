'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const DEFAULT_RELAY_THRESHOLD = 40;
const DEFAULT_HOME_THRESHOLD = 60;

const formatThreshold = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0 €';
  const rounded = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
  return `${rounded}€`;
};

export default function PromoBadge() {
  const [visible, setVisible] = useState(false);
  const [relayThreshold, setRelayThreshold] = useState(DEFAULT_RELAY_THRESHOLD);
  const [homeThreshold, setHomeThreshold] = useState(DEFAULT_HOME_THRESHOLD);
  const t = useTranslations('PromoBadge');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1000);

    let isMounted = true;
    const abortController = new AbortController();

    const fetchShippingThresholds = async () => {
      try {
        const response = await fetch(`${API_URL}/settings?t=${Date.now()}`, {
          cache: 'no-store',
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        const relay = Number(data?.data?.shippingSettings?.relay?.freeThreshold);
        const home = Number(data?.data?.shippingSettings?.home?.freeThreshold);
        if (!isMounted) return;
        if (Number.isFinite(relay)) setRelayThreshold(relay);
        if (Number.isFinite(home)) setHomeThreshold(home);
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    };

    fetchShippingThresholds();
    const intervalId = setInterval(fetchShippingThresholds, 5000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
      transition={{
        opacity: { duration: 0.6 },
        x: { duration: 0.6 },
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="absolute top-28 right-6 z-[999] hidden lg:block"
    >
      {/* Utilisation du Magenta de la palette pour un impact maximal */}
      <div className="bg-[#E10C69] text-white px-6 py-5 rounded-[2rem] shadow-2xl border-4 border-[#B3C800] max-w-[280px] font-[Maison Neue]">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-black text-sm uppercase  mb-1 font-[Agrandir]">
              {t('title')}
            </h3>
            <p className="text-[11px] font-bold leading-tight opacity-90 uppercase tracking-wide ">
              {t('description', {
                relay: formatThreshold(relayThreshold),
                home: formatThreshold(homeThreshold),
              })}
            </p>
          </div>
        </div>
        {/* Petit badge décoratif Pistachio en bas */}
        <div className="absolute -bottom-2 -right-2 bg-[#B3C800] text-[#556822] text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest font-[Maison Neue Mono]">
          {t('cta')}
        </div>
      </div>
    </motion.div>
  );
}
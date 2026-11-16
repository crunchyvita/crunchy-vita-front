'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

// The Meta Pixel is an advertising tracker: under CNIL rules it may only load after the visitor
// agrees. Vercel Analytics is cookieless and aggregate, so it is not gated here.
const STORAGE_KEY = 'cv_cookie_consent';
const META_PIXEL_ID = '26743132138705184';
const MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000; // ask again after ~6 months
export const MANAGE_COOKIES_EVENT = 'cv:manage-cookies';

function readConsent() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    if (!stored || Date.now() - Number(stored.at) > MAX_AGE_MS) return null;
    return stored.value === 'granted' || stored.value === 'denied' ? stored.value : null;
  } catch {
    return null;
  }
}

function saveConsent(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: Date.now() }));
  } catch {
    // Storage unavailable (private mode…): the banner will simply show again next visit.
  }
}

function loadMetaPixel() {
  if (window.fbq) return;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
}

export default function CookieConsent() {
  const t = useTranslations('Cookies');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const consent = readConsent();
    if (consent === 'granted') loadMetaPixel();
    if (!consent) setOpen(true);

    const reopen = () => setOpen(true);
    window.addEventListener(MANAGE_COOKIES_EVENT, reopen);
    return () => window.removeEventListener(MANAGE_COOKIES_EVENT, reopen);
  }, []);

  const choose = (value) => {
    saveConsent(value);
    setOpen(false);
    if (value === 'granted') {
      loadMetaPixel();
    } else if (window.fbq) {
      // Withdrawn after having accepted: the script is already loaded for this page, so reload
      // to drop it immediately.
      window.location.reload();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
    >
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-gray-100">
        <p className="font-black text-[#556822] mb-2">{t('title')}</p>
        <p className="text-sm text-gray-600 mb-4">
          {t('text')}{' '}
          <Link href="/politique-confidentialite" className="underline text-[#556822]">
            {t('learnMore')}
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="rounded-full border-2 border-[#556822] px-6 py-2.5 text-sm font-black text-[#556822]"
          >
            {t('refuse')}
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="rounded-full border-2 border-[#556822] bg-[#556822] px-6 py-2.5 text-sm font-black text-white"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}

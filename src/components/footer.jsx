'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { MANAGE_COOKIES_EVENT } from '@/components/CookieConsent';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export default function Footer() {
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('idle'); // idle | loading | success | error
  const t = useTranslations('Footer');
  const locale = useLocale();

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setNewsletterStatus('loading');
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer', locale }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNewsletterStatus('success');
      setEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  };

  return (
    <footer className="bg-[#EF8EB8] text-slate-100">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Top Section: Company Info & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div >
              <Image
                src="/assets/images/logo2_green.png"
                alt="Crunchy Vita Logo"
                width={280}
                height={120}
                className="h-40 w-auto"
              />
            </div>
            <div className="-mt-3 mb-4 flex items-center justify-start gap-1">
              <Image
                src="/assets/images/certipack.jpg"
                alt="Certification Agriculture Biologique"
                width={220}
                height={140}
                className="h-14 w-16 object-contain"
              />
              <Image
                src="/assets/images/ab.jpg"
                alt="Certification Agriculture Biologique"
                width={220}
                height={140}
                className="h-12 w-14 object-contain -ml-2"
              />
            </div>
            <p className="text-sm text-gray-900 leading-relaxed mb-6">
              {t('about')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:contact@crunchyvita.com" className="flex items-center gap-2 text-sm text-gray-900 hover:text-[#556822] transition">
                <Mail size={16} />
                {t('email')}
              </a>

              <div className="flex items-start gap-2 text-sm text-gray-900">
                <MapPin size={16} className="shrink-0 mt-1" />
                <div>

                  <p>{t('address.line3')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-bold text-[#E10C69] mb-6">{t('nav.title')}</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('nav.home')}</Link></li>
              <li><Link href="/shop" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('nav.products')}</Link></li>
              <li><Link href="/fruits-lyophilises-bio" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('nav.organicFruit')}</Link></li>
              <li><Link href="/#engagements" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('nav.commitments')}</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('nav.contact')}</Link></li>
              <li><Link href="/blogs" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('nav.blog')}</Link></li>
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h3 className="text-lg font-bold text-[#E10C69] mb-6">{t('help.title')}</h3>
            <ul className="space-y-3">
              <li><Link href="/politique-retour" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('help.returns')}</Link></li>
              <li><Link href="/politique-livraison" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('help.shipping')}</Link></li>
            </ul>
          </div>

          {/* CrunchyVita */}
          <div>
            <h3 className="text-lg font-bold text-[#E10C69] mb-6">{t('brand.title')}</h3>
            <ul className="space-y-3">
              <li><Link href="/about-us" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('brand.about')}</Link></li>
              <li><Link href="/about-us/#lyophilisation" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('brand.lyo')}</Link></li>
              <li><Link href="/about-us/#clients-b2b" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('brand.b2b')}</Link></li>
              <li><Link href="/about-us/#collaboration-sponsoring" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('brand.collab')}</Link></li>
            </ul>
          </div>

          {/* Informations légales */}
          <div>
            <h3 className="text-lg font-bold text-[#E10C69] mb-6">{t('legal.title')}</h3>
            <ul className="space-y-3">
              <li><Link href="/mentions-legales" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('legal.mentions')}</Link></li>
              <li><Link href="/cgu" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('legal.cgu')}</Link></li>
              <li><Link href="/cgv" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('legal.cgv')}</Link></li>
              <li><Link href="/politique-confidentialite" className="text-sm text-gray-900 hover:text-[#556822] transition">{t('legal.privacy')}</Link></li>
              <li>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event(MANAGE_COOKIES_EVENT))}
                  className="text-sm text-gray-900 hover:text-[#556822] transition"
                >
                  {t('legal.cookies')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mx-auto max-w-xl text-center">
          <h3 className="text-lg font-bold text-[#E10C69] mb-2">{t('newsletter.title')}</h3>
          <p className="text-sm text-gray-900 mb-4">{t('newsletter.description')}</p>
          {newsletterStatus === 'success' ? (
            <p className="text-sm font-bold text-[#556822] bg-white/80 rounded-full px-4 py-3">{t('newsletter.success')}</p>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">{t('newsletter.placeholder')}</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#556822]"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="rounded-full bg-[#556822] px-6 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {newsletterStatus === 'loading' ? t('newsletter.loading') : t('newsletter.submit')}
              </button>
            </form>
          )}
          {newsletterStatus === 'error' && (
            <p className="mt-2 text-sm font-bold text-red-700">{t('newsletter.error')}</p>
          )}
          <p className="mt-3 text-xs text-gray-800">{t('newsletter.consent')}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 my-12" />


        {/* Copyright */}
        <div className="pt-2 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <a
              href="https://www.facebook.com/profile.php?id=61585718055254" target="_blank"
              aria-label="Facebook"
              className="text-gray-900 hover:text-[#556822] transition"
            >
              <Image
                src="/assets/socialMedia/facebook.svg"
                alt="Facebook"
                width={18}
                height={18}
                className="h-6 w-6"
              />
            </a>
            <a
              href="https://www.instagram.com/crunchyvita/" target="_blank"
              aria-label="Instagram"
              className="text-gray-900 hover:text-[#556822] transition"
            >
              <Image
                src="/assets/socialMedia/logoinstagram.svg"
                alt="Instagram"
                width={18}
                height={18}
                className="h-6 w-6"
              />
            </a>
            <a
              href="https://www.tiktok.com/@crunchyvita" target="_blank"
              aria-label="TikTok"
              className="text-gray-900 hover:text-[#556822] transition"
            >
              <Image
                src="/assets/socialMedia/tiktok.svg"
                alt="TikTok"
                width={18}
                height={18}
                className="h-6 w-6"
              />
            </a>
            <a
              href=" https://www.linkedin.com/in/alteora-france-798a6b36a/"target="_blank"
              aria-label="LinkedIn"
              className="text-gray-900 hover:text-[#556822] transition"
            >
              <Image
                src="/assets/socialMedia/linkedin.svg"
                alt="LinkedIn"
                width={18}
                height={18}
                className="h-6 w-6"
              />
            </a>
          </div>
          <p className="text-[#E10C69] text-xs">© {t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}

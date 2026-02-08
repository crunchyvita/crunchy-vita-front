'use client';

import { useState, useRef, useEffect } from 'react';
import { Link, usePathname } from '@/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
// Added Globe and ChevronDown
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import '../app/fonts.css';

export default function HeaderHome() {
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // State for Language Dropdown
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langRef = useRef(null);

  const t = useTranslations('HeaderHome');
  const locale = useLocale();
  const pathname = usePathname();

  const navLinks = [
    { key: 'home', href: '/' },
    { key: 'products', href: '/shop' },
    { key: 'commitments', href: '/#engagements' },
    { key: 'blog', href: '/blogs' },
    { key: 'contact', href: '/contact' },
  ];

  // Handle clicks outside for language dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to get current flag image path
  const getCurrentFlag = () => locale === 'fr' ? '/assets/images/fr.png' : '/assets/images/en.png';

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 fixed top-0 z-50 shadow-sm w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/images/logo.png"
              alt="Crunchy Vita Logo"
              width={250}
              height={100}
              className="h-24 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-[#556822] font-medium text-sm transition-colors"
                style={{ fontFamily: 'Maison Neue, sans-serif' }}
              >
                {t(`nav.${link.key}`)}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* LANGUAGE SWITCHER - DROPDOWN LIST */}
            <div className="relative" ref={langRef}>
                <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 transition-all hover:bg-slate-50 hover:border-slate-300"
                >
                <img 
                    src={getCurrentFlag()} 
                    alt="Current Language" 
                    className="w-5 h-5 rounded-full object-cover border border-slate-200" 
                />
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 overflow-hidden">
                    <ul className="flex flex-col">
                    <li>
                        <Link
                        href={pathname}
                        locale="en"
                        onClick={() => setIsLangMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${locale === 'en' ? 'font-bold text-[#556822] bg-slate-50/50' : 'text-slate-600'}`}
                        >
                        <img src="/assets/images/en.png" alt="English" className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                        English
                        </Link>
                    </li>
                    <li>
                        <Link
                        href={pathname}
                        locale="fr"
                        onClick={() => setIsLangMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${locale === 'fr' ? 'font-bold text-[#556822] bg-slate-50/50' : 'text-slate-600'}`}
                        >
                        <img src="/assets/images/fr.png" alt="Français" className="w-5 h-5 rounded-full object-cover border border-slate-100" />
                        Français
                        </Link>
                    </li>
                    </ul>
                </div>
                )}
            </div>

            {isAuthenticated ? (
              <Link
                href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/shop'}
                className="px-6 py-2 bg-[#556822] hover:bg-[#556822] text-white font-bold rounded-lg transition-colors text-sm"
              >
                {user?.role === 'ADMIN' ? t('dashboard') : t('order')}
              </Link>
            ) : (
              <Link
                href="/shop"
                className="px-6 py-2 bg-[#556822]  text-white font-bold rounded-lg transition-colors text-sm"
              >
                {t('order')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            {isMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                style={{ fontFamily: 'Maison Neue, sans-serif' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {t(`nav.${link.key}`)}
              </Link>
            ))}

            {/* Mobile Language Switcher */}
            <div className="flex gap-4 px-4 py-2 border-t border-slate-100 mt-2 pt-4">
                <Link href={pathname} locale="en" className="flex items-center gap-2 text-sm text-slate-600">
                <img src="/assets/images/en.png" alt="English" className="w-6 h-6 rounded-full object-cover border border-slate-100" />
                English
                </Link>
                <Link href={pathname} locale="fr" className="flex items-center gap-2 text-sm text-slate-600">
                <img src="/assets/images/fr.png" alt="Français" className="w-6 h-6 rounded-full object-cover border border-slate-100" />
                Français
                </Link>
            </div>

            <div className="px-4 pt-2">
              {isAuthenticated ? (
                <Link
                  href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/shop'}
                  className="block w-full px-6 py-2 bg-[#556822] hover:bg-[#556822] text-white font-bold rounded-lg transition-colors text-sm text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user?.role === 'ADMIN' ? t('dashboard') : t('order')}
                </Link>
              ) : (
                <Link
                  href="/shop"
                  className="block w-full px-6 py-2 bg-[#556822] hover:bg-[#556822] text-white font-bold rounded-lg transition-colors text-sm text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('order')}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
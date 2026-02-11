'use client';

import { useState, useRef, useEffect } from 'react';
import { Link, useRouter, usePathname } from '@/navigation';
import { LogOut, ShoppingCart, Heart, User, Package, Menu, X, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import '../app/fonts.css';

const NAV_LINKS = [
  { key: 'home', href: '/' },
  { key: 'products', href: '/shop' },
  {key : 'espace professionnel', href: '/espace-professionnel'},
  { key: 'blog', href: '/blogs' },
  { key: 'contact', href: '/contact' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Header');
  
  // State for User Dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // State for Language Dropdown
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle clicks outside for both dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
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
    <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo Section */}
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src="/assets/images/logo.png" alt="Logo" className="h-16 w-auto" />
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-slate-700 hover:text-[#556822] font-medium text-sm transition-colors">
              {t(`nav.${link.key}`)}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => router.push('/orders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" title={t('orders')}>
            <Package size={20} className="text-gray-700" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" title={t('cart')}>
            <ShoppingCart size={20} className="text-gray-700" />
          </button>

          <button className="hidden sm:flex p-2 hover:bg-gray-100 rounded-full transition-colors relative" title={t('wishlist')}>
            <Heart size={20} className="text-gray-700" />
          </button>

          {/* LANGUAGE SWITCHER - DROPDOWN LIST WITH IMAGES */}
          <div className="relative hidden sm:block" ref={langRef}>
            <button 
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 transition-all hover:bg-gray-50 hover:border-gray-300"
            >
              <img 
                src={getCurrentFlag()} 
                alt="Current Language" 
                className="w-5 h-5 rounded-full object-cover border border-gray-200" 
              />
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 overflow-hidden">
                <ul className="flex flex-col">
                  <li>
                    <Link
                      href={pathname}
                      locale="en"
                      onClick={() => setIsLangMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${locale === 'en' ? 'font-bold text-[#556822] bg-gray-50/50' : 'text-gray-600'}`}
                    >
                      <img src="/assets/images/en.png" alt="English" className="w-5 h-5 rounded-full object-cover border border-gray-100" />
                      English
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={pathname}
                      locale="fr"
                      onClick={() => setIsLangMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${locale === 'fr' ? 'font-bold text-[#556822] bg-gray-50/50' : 'text-gray-600'}`}
                    >
                      <img src="/assets/images/fr.png" alt="Français" className="w-5 h-5 rounded-full object-cover border border-gray-100" />
                      Français
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* User Profile */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 border-l border-gray-200 pl-2 sm:pl-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {user?.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : <User size={20} />}
                </div>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={() => router.push('/profile')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User size={18} /> {t('account')}
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut size={18} /> {t('logout')}
                    </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => router.push('/auth/register')} className="hidden sm:block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              {t('signIn')}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg font-medium">
              {t(`nav.${link.key}`)}
            </Link>
          ))}
          
          {/* Mobile Language Switcher */}
          <div className="flex gap-4 px-4 py-2 border-t border-gray-50 mt-2 pt-4">
             <Link href={pathname} locale="en" className="flex items-center gap-2 text-sm text-gray-600">
               <img src="/assets/images/en.png" alt="English" className="w-6 h-6 rounded-full object-cover border border-gray-100" />
               English
             </Link>
             <Link href={pathname} locale="fr" className="flex items-center gap-2 text-sm text-gray-600">
               <img src="/assets/images/fr.png" alt="Français" className="w-6 h-6 rounded-full object-cover border border-gray-100" />
               Français
             </Link>
          </div>

          {!user && (
             <button onClick={() => router.push('/auth/register')} className="w-full mt-2 bg-[#556822] text-white py-3 rounded-lg font-bold">
               {t('signIn')}
             </button>
          )}
        </div>
      )}
    </nav>
  );
}
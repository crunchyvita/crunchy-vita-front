'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, usePathname, useRouter } from '@/navigation';
import Image from 'next/image';
// Added Globe and ChevronDown
import { Menu, X, ShoppingCart, ChevronDown, Globe, User, LogOut } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import '../app/fonts.css';

export default function HeaderHome() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // State for Language Dropdown in profile menu
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const t = useTranslations('HeaderHome');
  const locale = useLocale();
  const pathname = usePathname();
  const { cartItems, loadCart } = useCart();

  const cartUnitCount = useMemo(
    () =>
      (Array.isArray(cartItems) ? cartItems : []).reduce(
        (sum, item) => sum + Math.max(1, Number(item?.quantity) || 0),
        0
      ),
    [cartItems]
  );

  const navLinks = [
    { key: 'home', href: '/' },
    { key: 'products', href: '/shop' },
    { key: 'espace professionnel', href: '/espace-professionnel' },
    { key: 'commitments', href: '/#engagements' },
    { key: 'blog', href: '/blogs' },
    { key: 'contact', href: '/contact' },
  ];

  // Handle clicks outside for profile/language dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const sync = () => {
      void loadCart();
    };
    window.addEventListener('cartUpdated', sync);
    return () => window.removeEventListener('cartUpdated', sync);
  }, [loadCart]);

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
          <div className="flex items-center gap-2 md:gap-4">
            {/* Cart Icon - visible on all screen sizes */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Cart"
              aria-label={cartUnitCount > 0 ? `Cart (${cartUnitCount})` : 'Cart'}
            >
              <ShoppingCart size={18} className="text-gray-700 sm:w-5 sm:h-5" strokeWidth={2} />
              {cartUnitCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-[1.05rem] min-w-[1.05rem] sm:h-4.5 sm:min-w-4.5 items-center justify-center rounded-full bg-red-500 px-0.5 sm:px-1 text-[9px] sm:text-[10px] font-bold tabular-nums leading-none text-white shadow-sm ring-2 ring-white">
                  {cartUnitCount > 99 ? '99+' : cartUnitCount}
                </span>
              ) : null}
            </Link>

            {/* Profile Dropdown - Desktop only */}
            <div className="hidden md:flex relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 sm:gap-2 border-l border-gray-200 pl-1.5 sm:pl-4 touch-manipulation"
                aria-expanded={showDropdown}
              >
                <div className="w-7 h-7 sm:w-10 sm:h-10 shrink-0 rounded-full hover:bg-gray-100 overflow-hidden flex items-center justify-center">
                  {user?.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />}
                </div>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  {user ? (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-3">
                      <Globe size={18} />
                      {t('language')}
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isLangMenuOpen && (
                    <div className="px-2 pb-2">
                      <Link
                        href={pathname}
                        locale="fr"
                        onClick={() => {
                          setIsLangMenuOpen(false);
                          setShowDropdown(false);
                        }}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${locale === 'fr' ? 'font-bold text-[#556822] bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        <img src="/assets/images/fr.png" alt="Français" className="w-5 h-5 rounded-full object-cover border border-gray-100" />
                        {t('languageFrench')}
                      </Link>
                      <Link
                        href={pathname}
                        locale="en"
                        onClick={() => {
                          setIsLangMenuOpen(false);
                          setShowDropdown(false);
                        }}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${locale === 'en' ? 'font-bold text-[#556822] bg-gray-50/50' : 'text-gray-600'}`}
                      >
                        <img src="/assets/images/en.png" alt="English" className="w-5 h-5 rounded-full object-cover border border-gray-100" />
                        {t('languageEnglish')}
                      </Link>
                    </div>
                  )}

                  {user ? (
                    <>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push('/profile');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User size={18} /> {t('account')}
                      </button>
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={18} /> {t('logout')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/auth/register');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <User size={18} /> {t('signIn')}
                    </button>
                  )}
                </div>
              )}
            </div>
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
              {t('languageEnglish')}
                </Link>
                <Link href={pathname} locale="fr" className="flex items-center gap-2 text-sm text-slate-600">
                <img src="/assets/images/fr.png" alt="Français" className="w-6 h-6 rounded-full object-cover border border-slate-100" />
              {t('languageFrench')}
                </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
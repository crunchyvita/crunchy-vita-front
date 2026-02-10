'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShoppingCart, Heart, User, Settings, Package, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import '../app/fonts.css';

const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Nos produits", href: "/shop" },
  { label: "Blog", href: "/blogs" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => router.push('/orders')} className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" title="Orders">
            <Package size={20} className="text-gray-700" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative" title="Shopping Cart">
            <ShoppingCart size={20} className="text-gray-700" />
          </button>

          <button
            onClick={() => router.push('/favorites')}
            className="hidden sm:flex p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            title="Wishlist"
          >
            <Heart size={20} className="text-gray-700" />
          </button>

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
                     <User size={18} /> Account
                   </button>
                   <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                     <LogOut size={18} /> Log Out
                   </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => router.push('/auth/register')} className="hidden sm:block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Sign In
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
              {link.label}
            </Link>
          ))}
          {!user && (
             <button onClick={() => router.push('/auth/register')} className="w-full mt-2 bg-[#556822] text-white py-3 rounded-lg font-bold">
               Sign In
             </button>
          )}
        </div>
      )}
    </nav>
  );
}
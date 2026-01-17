'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShoppingCart, Heart, User, Settings, Package } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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
        {/* Logo */}
        <button 
          onClick={() => router.push('/shop')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">CrunchyVita</h1>
        </button>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Orders */}
          <button 
            onClick={() => router.push('/orders')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            title="Orders"
          >
            <Package size={20} className="text-gray-700" />
          </button>

          {/* Cart Icon */}
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            title="Shopping Cart"
          >
            <ShoppingCart size={20} className="text-gray-700" />
           
          </button>

          {/* Wishlist Icon */}
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            title="Wishlist"
          >
            <Heart size={20} className="text-gray-700" />
          </button>

          {/* User Profile with Dropdown */}
          <div className="hidden sm:block relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:bg-gray-50 py-2 px-3 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900">
                <User size={20} />
              </div>
             
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Profile Section */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Customer'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || 'customer@crunchyvita.com'}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      router.push('/profile');
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={18} />
                    <span className="font-medium">Account</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      router.push('/settings');
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={18} />
                    <span className="font-medium">Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 pt-2">
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

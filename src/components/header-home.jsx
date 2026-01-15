'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function HeaderHome() {
  const { isAuthenticated, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Nos produits', href: '/#produits' },
    { label: 'Nos engagements', href: '/#engagements' },
    { label: 'Contact', href: '/#contact' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#469165] rounded-full flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <span className="text-xl font-bold text-slate-900">
              Crunchy<span className="text-[#469165]">Vita</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-700 hover:text-green-600 font-medium text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/shop'}
                className="px-6 py-2 bg-[#469165] hover:bg-[#3a7a4a] text-white font-bold rounded-lg transition-colors text-sm"
              >
                {user?.role === 'ADMIN' ? 'Tableau de bord' : 'Mon compte'}
              </Link>
            ) : (
              <Link
                href="/shop"
                className="px-6 py-2 bg-[#469165] hover:bg-[#3a7a4a] text-white font-bold rounded-lg transition-colors text-sm"
              >
                Commander
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
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              {isAuthenticated ? (
                <Link
                  href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/account'}
                  className="block w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user?.role === 'ADMIN' ? 'Tableau de bord' : 'Mon compte'}
                </Link>
              ) : (
                <Link
                  href="/client/shop"
                  className="block w-full px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-sm text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Commander
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

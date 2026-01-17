'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      // Add your newsletter subscription API here
      console.log('Subscribing:', email);
      setEmail('');
    } catch (error) {
      console.error('Error subscribing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#32241B] text-slate-100">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Top Section: Company Info & Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-white mb-4">
              Crunchy<span className="text-[#469165]">Vita</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Fruits lyophilisés bio, croquants et 100% naturels. Le snack sain qui vous accompagne au quotidien.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:contact@crunchyvita.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#469165] transition">
                <Mail size={16} />
                contact@crunchyvita.com
              </a>
              <a href="tel:+33745150788" className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#469165] transition">
                <Phone size={16} />
                +33 7 45 15 07 88
              </a>
              <div className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin size={16} className="flex-shrink-0 mt-1" />
                <div>
                  <p>1460 Chemin des Terriers</p>
                  <p>Bâtiment B-04</p>
                  <p>06600 Antibes, France</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Navigation</h3>
            <ul className="space-y-3">
              <li><a href="/" className="text-sm text-slate-400 hover:text-[#469165] transition">Accueil</a></li>
              <li><a href="/#produits" className="text-sm text-slate-400 hover:text-[#469165] transition">Nos produits</a></li>
              <li><a href="/#engagements" className="text-sm text-slate-400 hover:text-[#469165] transition">Nos engagements</a></li>
              <li><a href="/#contact" className="text-sm text-slate-400 hover:text-[#469165] transition">Contact</a></li>
            </ul>
          </div>

          {/* Aide */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Aide</h3>
            <ul className="space-y-3">
              <li><a href="/politique-retour" className="text-sm text-slate-400 hover:text-[#469165] transition">Retours</a></li>
              <li><a href="/politique-livraison" className="text-sm text-slate-400 hover:text-[#469165] transition">Informations sur les livraisons</a></li>
              <li><a href="/cgv/#paiement" className="text-sm text-slate-400 hover:text-[#469165] transition">Moyens de paiement</a></li>
            </ul>
          </div>

          {/* CrunchyVita */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">CrunchyVita</h3>
            <ul className="space-y-3">
              <li><a href="/about-us" className="text-sm text-slate-400 hover:text-[#469165] transition">À propos de nous</a></li>
              <li><a href="/about-us/#lyophilisation" className="text-sm text-slate-400 hover:text-[#469165] transition">La lyophilisation</a></li>
              <li><a href="/about-us/#clients-b2b" className="text-sm text-slate-400 hover:text-[#469165] transition">Clients Professionnels B2B</a></li>
              <li><a href="/about-us/#collaboration-sponsoring" className="text-sm text-slate-400 hover:text-[#469165] transition">Collaboration & Sponsoring</a></li>
            </ul>
          </div>

          {/* Informations légales */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">Informations légales</h3>
            <ul className="space-y-3">
              <li><a href="/mentions-legales" className="text-sm text-slate-400 hover:text-[#469165] transition">Mentions légales</a></li>
              <li><a href="/cgu" className="text-sm text-slate-400 hover:text-[#469165] transition">CGU</a></li>
              <li><a href="/cgv" className="text-sm text-slate-400 hover:text-[#469165] transition">CGV</a></li>
              <li><a href="/politique-confidentialite" className="text-sm text-slate-400 hover:text-[#469165] transition">Politique de confidentialité</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 my-12" />

        {/* Newsletter Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-white mb-2">Newsletter</h3>
          <p className="text-slate-400 text-sm mb-6">
            Inscrivez-vous pour recevoir nos offres exclusives et nouveautés.
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-full bg-[#fcfaf8] text-slate-900 placeholder-slate-500 border border-slate-700 focus:border-green-500 focus:outline-none transition text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#469165] hover:bg-[#3a7a4a] text-white font-bold rounded-full transition-colors text-sm whitespace-nowrap disabled:opacity-50"
            >
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700" />

        {/* Copyright */}
        <div className="pt-8 text-center">
          <p className="text-slate-500 text-xs">
            © 2026 CrunchyVita - ALTERORA SAS. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

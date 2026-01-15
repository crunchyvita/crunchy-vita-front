'use client';

import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-16">À Propos de Nous</h1>

        {/* La lyophilisation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">La lyophilisation</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            La lyophilisation est une technique de conservation qui consiste à retirer l'eau d'un produit par sublimation. Cette technique permet de préserver au maximum les qualités nutritionnelles, le goût et la texture des fruits frais.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4">
            Contrairement aux techniques traditionnelles comme le séchage par la chaleur ou la lyophilisation s'effectue à basse température, ce qui permet de conserver jusqu'à 97% des vitamines et minéraux présents dans le fruit frais.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Le résultat ? Des fruits ultra-croquants, naturellement sucrés, légers et faciles à conserver, tout en gardant leur saveur intense et leurs bienfaits nutritionnels.
          </p>
        </section>

        {/* Notre mission */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Notre mission</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Chez CrunchyVita, nous croyons que le snacking peut être à la fois délicieux et sain. Notre mission est de proposer des encas 100% naturels, sans sucres ajoutés ni conservateurs, au comportement à base de fruits frais de qualité.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Nous sélectionnons nos fruits avec soin, issue de cultures biologiques certifiées, pour vous offrir le meilleur de la nature dans chaque sachet.
          </p>
        </section>

        {/* Collaboration & Sponsoring */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Collaboration & Sponsoring</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Vous êtes un influenceur, youtubeur ou professionnel du bien-être ? Nous serions ravis de collaborer avec vous !
          </p>
          <p className="text-slate-700 leading-relaxed">
            Pour toute demande de partenariat ou de sponsoring, contactez-nous à:{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
        </section>

        {/* Clients Professionnels B2B */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Clients Professionnels B2B</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Vous êtes un professionnel (hôtel, restaurant, salle de sport, magasin bio...) et souhaitez proposer nos produits à vos clients ?
          </p>
          <p className="text-slate-700 leading-relaxed">
            Contactez notre équipe commerciale pour découvrir nos offres dédiées aux professionnels :{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

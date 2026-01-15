'use client';

import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-4xl font-bold text-slate-900 mb-12">Mentions Légales</h1>

        {/* Utilisation du site */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Utilisation du site</h2>
          <p className="text-slate-700 leading-relaxed">
            L'accès et l'utilisation du site www.crunchyvita.fr sont soumis au respect des Conditions Générales de Vente, des présentes Mentions légales et de la Politique de Confidentialité.
          </p>
        </section>

        {/* Éditeur du site */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Éditeur du site</h2>
          <p className="text-slate-700 font-semibold mb-4">ALTERORA</p>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <p className="text-slate-700 mb-2">
              Société par actions simplifiée au capital de 25 000 euros
            </p>
            <p className="text-slate-700 mb-2">
              Immatriculée au Registre du Commerce et des Sociétés d'Antibes sous le numéro 903 112 952
            </p>
            <p className="text-slate-700 mb-2">
              Siège social: 1460 Chemin des Terriers Bâtiment B-04 06600 Antibes, France
            </p>
            <p className="text-slate-700 mb-2">
              Numéro de l'IVA intracommunautaire : FR0793531952
            </p>
            <p className="text-slate-700 mb-4">
              Téléphone : +33 7 45 15 07 88
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">E-mail :</span>{' '}
              <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700">
                contact@crunchyvita.com
              </a>
            </p>
          </div>
        </section>

        {/* Directeur de la publication */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Directeur de la publication</h2>
          <p className="text-slate-700">
            Le directeur de la publication est Monsieur HOUSSEM BEN MESSAOUD.
          </p>
        </section>

        {/* Hébergeur du site */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Hébergeur du site</h2>
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
            <p className="text-slate-700 mb-2">
              Le site www.crunchyvita.fr est hébergé par :
            </p>
            <p className="text-slate-700 mb-2 font-semibold">OVHcloud</p>
            <p className="text-slate-700 mb-2">
              2 rue Kellermann
            </p>
            <p className="text-slate-700 mb-2">
              59100 Roubaix – France
            </p>
            <p className="text-slate-700 mb-4">
              Téléphone : 1007
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">Site web :</span>{' '}
              <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                www.ovhcloud.com
              </a>
            </p>
          </div>
        </section>

      
      </main>

      <Footer />
    </div>
  );
}

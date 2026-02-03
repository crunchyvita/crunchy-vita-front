'use client';

import HeaderHome from '@/components/header';
import Footer from '@/components/footer';
import { Truck } from 'lucide-react';
import '../fonts.css';

export default function PolitiqueLivraison() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-16 font-[agrandir]">Politique de Livraison pourquoi crunchy vita</h1>

        {/* Préparation et expédition */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Préparation et expédition</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Les colis sont préparés et expédiés dans un délai de 48 heures suivant la commande (hors samedi, dimanche et jours fériés). Dès le colis est confié au transporteur, vous recevez un email de confirmation du numéro de suivi de votre colis.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Un période de forte activité, le délai de préparation peut être réduit à 72 heures. La livraison est assurée par les services de Mondial Relay, qui livrent les commandes à domicile, sur le lieu de travail du Client ou en point relais.
          </p>
        </section>

        {/* En cas d'absence */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">En cas d'absence</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Si le Client est absent au moment de la livraison, un avis de passage sera laissé au transporteur prendra contact avec lui.
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Le Client peut aussi laisser des instructions précisées au livreur. En cas de non-retrait du colis dans les délais impartis, celui-ci sera retourné à notre entrepôt.
          </p>
        </section>

        {/* Absence d'informations ou coordonnées incomplètes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Absence d'informations ou coordonnées incomplètes</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Le Client est tenu de fournir toutes les informations nécessaires à la bonne livraison (adresse exacte, numéro de téléphone, code d'accès, etc.).
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            En cas de manquement, notre société sera dégagée de toute responsabilité d'un défaut de livraison. Les produits seront alors retournés à notre entrepôt et le Client devra contacter le service clientèle pour convenir d'une nouvelle livraison, qui sera facturée au Client.
          </p>
        </section>

        {/* Problèmes de livraison */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Problèmes de livraison</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Les produits voyagent aux risques et périls de notre société, sauf cas particuliers.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Le Client doit vérifier l'état du colis et le nombre de produits à la réception. Toute réserve (avarie, produit manquant, emballage endommagé) doit être mentionnée sur le bon de livraison, dont le Client doit conserver un exemplaire.
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Toute réclamation concernant la livraison doit être formulée dans un délai de 3 jours ouvrés suivant la réception des produits, par e-mail à :{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
        </section>

        {/* Livraison offerte */}
        <section className="mb-12">
          <div className="bg-green-50 border-2 border-green-600 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Truck className="text-green-600 shrink-0 mt-1" size={24} />
              <p className="text-slate-900 font-semibold">
                🎉 Livraison offerte en France en point relais Chronopost dès 40€ d'achats !
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

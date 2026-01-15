'use client';

import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';

export default function CGV() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">Conditions Générales de Vente (CGV)</h1>
        <p className="text-sm text-slate-600 mb-12">Alterora – www.crunchyvita.fr | Mise à jour le 2026</p>

        {/* Préambule */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Préambule</h2>
          <p className="text-slate-700 leading-relaxed">
            Le présent Préambule fait partie intégrante des Conditions générales de Vente.
          </p>
        </section>

        {/* Article 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 1. Parties au présent acte</h2>
          <ul className="space-y-3 text-slate-700">
            <li>
              <span className="font-semibold">1° La Société Alterora</span> : Société par actions simplifiée au capital de 10 000 euros, immatriculée au Registre du commerce et des sociétés d'Antibes sous le numéro 903112952, dont le siège social est situé à 1460 Chemin des Terriers Bâtiment B-04 06600 Antibes et ayant comme numéro de l'IVA FR0793931952, ci-après dénommée la « Vendeur ».
            </li>
            <li>
              <span className="font-semibold">2° Toute personne physique</span> souhaitant réaliser un achat sur le site internet du Vendeur, ci-après dénommée « Acheteur ».
            </li>
          </ul>
        </section>

        {/* Article 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 2. Objet</h2>
          <p className="text-slate-700 leading-relaxed">
            Le Vendeur a pour activité la vente en ligne des produits sous la marque CrunchyVita (Fruits lyophilisés) via le site www.crunchyvita.fr.
          </p>
        </section>

        {/* Article 2.1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 2.1. Précautions d'usage</h2>
          <p className="text-slate-700 leading-relaxed">
            Les paquets CrunchyVita doivent être conservés dans leur sachet bien refermé afin de préserver leur texture croquante. Même remplies, ils restent consommables, avis d'une texture puis le sac.
          </p>
        </section>

        {/* Article 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 3. Définitions</h2>
          <ul className="space-y-3 text-slate-700">
            <li>
              <span className="font-semibold">Vendeur :</span> Alterora, société par actions simplifiée immatriculée au RCS d'Antibes sous le n°903112952.
            </li>
            <li>
              <span className="font-semibold">Acheteur :</span> toute personne physique souhaitant réaliser un achat sur le Site.
            </li>
            <li>
              <span className="font-semibold">Produit :</span> tout produit proposé à la vente, dans la limite des stocks disponibles.
            </li>
            <li>
              <span className="font-semibold">Livraison :</span> transférer à l'Acheteur de la possession physique ou du contrôle du Produit.
            </li>
            <li>
              <span className="font-semibold">Site :</span> www.crunchyvita.fr.
            </li>
          </ul>
        </section>

        {/* Article 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 4. Prix</h2>
          <p className="text-slate-700 leading-relaxed mb-3">
            Les prix sont indiqués en euros TTC (toutes taxes comprises), hors frais de traitement et d'expédition.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Le Vendeur peut modifier ses prix à tout moment, mais le tarif appliqué est celui en vigueur lors de la validation de la commande.
          </p>
        </section>

        {/* Article 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 5. Commande</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Pour passer commande, l'Acheteur doit fournir :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>Adresse e-mail</li>
            <li>Prénom et nom</li>
            <li>Adresse postale</li>
            <li>Numéro de téléphone</li>
            <li>Informations de paiement</li>
          </ul>
        </section>

        {/* Article 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 7. Paiement</h2>
          <p className="text-slate-700 leading-relaxed">
            Le paiement s'effectue au moment de la commande, par carte bancaire (Carte Bleue, Visa, Mastercard, etc.) via Stripe.
          </p>
        </section>

        {/* Article 10 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 10. Livraison</h2>
          <p className="text-slate-700 leading-relaxed mb-3">
            La livraison est effectuée à l'adresse indiquée par l'Acheteur.
          </p>
          <p className="text-slate-700 leading-relaxed font-semibold mb-2">
            Livraison offerte en France en point relais Chronopost dès 40€ d'achats.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Suivi colis communiqué par e-mail.
          </p>
        </section>

        {/* Article 12 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 12. Rétractation</h2>
          <p className="text-slate-700 leading-relaxed mb-3">
            Conformément à l'article L221-18 du Code de la consommation, l'Acheteur dispose de 14 jours à compter de la réception pour se rétracter. Les frais de retour sont à la charge de l'Acheteur.
          </p>
          <p className="text-slate-700 leading-relaxed font-semibold mb-2">
            Adresse de retour :
          </p>
          <p className="text-slate-700 leading-relaxed mb-3">
            Alterora, 1460 Chemin des Terriers Bâtiment B-04 06600 Antibes.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Le remboursement est effectué sous 14 jours, via le même moyen de paiement.
          </p>
        </section>

        {/* Article 13 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 13. Garanties</h2>
          <p className="text-slate-700 leading-relaxed mb-3">
            Les Produits bénéficient de :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-3">
            <li>La garantie légale de conformité (articles L217-4 et suivants du Code de la consommation)</li>
            <li>De la garantie contre les vices cachés (articles 1641 et suivants du Code civil)</li>
          </ul>
        </section>

        {/* Article 21 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Article 21. Litiges</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            En cas de litige :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            <li>L'Acheteur contacte le service client (contact@crunchyvita.com)</li>
            <li>À défaut de réponse, il peut saisir le Médiateur de l'e-commerce de la FEVAD (www.mediateur-fevad.fr)</li>
            <li>À défaut d'accord, compétence est attribuée aux tribunaux français</li>
          </ul>
        </section>
      </main>

      <Footer />
    </div>
  );
}

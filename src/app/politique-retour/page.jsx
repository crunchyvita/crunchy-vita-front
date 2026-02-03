'use client';

import HeaderHome from '@/components/header';
import Footer from '@/components/footer';
import '../fonts.css';

export default function PolitiqueRetour() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-16 font-[agrandir]">Politique de Retour</h1>

        {/* Retour */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Retour</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Auprès de notre société, le Client pourra retourner le ou les produits concernés (dans leur état d'origine et accompagnées de l'ensemble des documents commerciaux joints à la livraison).
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Les frais de retour sont à la charge du Client, sauf dans le cas où le produit présenterait un défaut de fabrication ou ne correspondrait pas à la commande initiale. Seul prix du ou des produits retournés sera remboursé. Le remboursement s'effectuera dans les meilleurs délais et au plus tard dans les 14 jours suivant la réception des produits par notre société, le remboursement sera effectué selon le mode de paiement choisi lors de l'achat.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Le droit de rétractation peut s'exercer dès la passation de la commande, ayant reçu la livraison des produits au Client. Les critères désormais sont rapportés aux sur deux origines initial et dans un état permettant leur remise en vente. Aussi ce réserve le droit de refuser les produits ne remplissant pas ces conditions de retour et de les renvoyer au Client les conditions sus échelon.
          </p>
        </section>

        {/* Procédure de retour */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Procédure de retour</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Afin d'assurer le traitement optimal de votre retour, merci de suivre la procédure suivante :
          </p>
          
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="font-bold text-slate-900 mb-2 font-[agrandir]">1. Contacter le service client par email à contact@crunchyvita.com</h3>
              <p className="text-slate-700 leading-relaxed ml-4 font-[maison-neue-book]">
                en précisant le numéro de la facture et les produits concernés.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 mb-2 font-[agrandir]">2. Préparer les produits concernés</h3>
              <p className="text-slate-700 leading-relaxed ml-4 font-[maison-neue-book]">
                dans leur emballage d'origine, accompagnées de la facture.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-slate-900 mb-2 font-[agrandir]">3. Retourner le colis à l'adresse suivante :</h3>
              <p className="text-slate-700 leading-relaxed ml-4 font-semibold">
                Alterora, 1460 Chemin des Terriers Bâtiment B-04 06600 Antibes.
              </p>
              <p className="text-slate-700 leading-relaxed ml-4 mt-2 font-[maison-neue-book]">
                Le colis doit être déposé dans un bureau de poste dans un délai de 14 jours à compter de la date d'autorisation de retour.
              </p>
            </div>
          </div>

          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            À réception de votre colis, notre service qualité vérifiera l'intégrité du retour et les conditions d'acceptation. Si les conditions sont respectées, nous procéderons au remboursement ou au remplacement et l'envoi des produits dans un délai de 3 à 5 jours ouvrés à compter de la prise en charge de votre retour par notre entrepôt.
          </p>
        </section>

        {/* Remboursement */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Remboursement</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Les remboursements sont effectués selon la méthode de paiement et la devise utilisées lors de l'achat.
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Nous procéderons au remboursement de votre article retourné dans les plus brefs délais après sa réception. Le crédit sur votre compte bancaire sera effectif dans un délai de 7 à 10 jours ouvrés.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

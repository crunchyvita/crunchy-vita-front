'use client';

import HeaderHome from '@/components/header';
import Footer from '@/components/footer';
import '../fonts.css';

export default function CGU() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-8 font-[agrandir]">Conditions Générales d'Utilisation (CGU)</h1>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Conditions d'utilisation</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Les présentes conditions générales d'utilisation (ci-après les « CGU ») ont pour objet de définir les modalités et conditions d'accès et d'utilisation du site internet et du Compte – tels que définis ci-après – mis à disposition par la société Alteora, société par actions simplifiée au capital de 10 000 euros, immatriculée au Registre du commerce et des sociétés d'Antibes sous le numéro 903112952, dont le siège social est situé à 1460 Chemin des Terriers Bâtiment B-04 06600 Antibes (ci-après la « Vendeur »), ainsi que les droits et obligations de toute personne physique ou juridique susceptible d'exploiter commercialement ou professionnellement, ou d'en droit franchisé, accédant, visitant et/ou utilisant le site, quel que soit le réseau ou le moyen utilisé (ci-après l'« Utilisateur »).
          </p>
        </section>

        {/* Article 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 1 - Objet du site</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Le site www.crunchyvita.fr (ci-après le « Site ») est un site marchand qui propose la vente en ligne de paquets de fruits lyophilisés (ci-après les « Produits »). Le Site permet à l'Utilisateur, notamment aux moyens d'un Compte dont il fixera les conditions de fonctionnement. Le Site est accessible gratuitement à toute personne disposant d'un accès à Internet. Tous les frais liés à cet accès (matériel, logiciel, connexion internet) sont à la charge exclusive de l'Utilisateur, lequel est seul responsable du bon fonctionnement de son équipement et de son accès ou réseau.
          </p>
        </section>

        {/* Article 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 2 - Acceptation des CGU</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            L'accès et l'utilisation du Site et/ou du Compte impliquent l'acceptation pleine et entière des présentes CGU par l'Utilisateur, sans restriction ni réserve.
          </p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            En acceptation de ces conditions et dans le cas contraire le Vendeur repousse l'utilisation l'Utilisateur recevra le CGU et les accepter. En cas de désaccord, il doit immédiatement cesser d'utiliser le Site.
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Le Vendeur se réserve le droit de modifier les CGU à tout moment et depuis une version en vigueur, disponible sur le Site.
          </p>
        </section>

        {/* Article 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 3 - Création et utilisation du Compte</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            Pour accéder au Compte, l'Utilisateur doit créer un compte qui lui permettra notamment de renseigner ses informations de livraison, d'effectuer un paiement, de suivre ses commandes et de gérer d'éventuels retours.
          </p>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            La création de identifiants de connexion (adresse e-mail et mot de passe) sont strictement personnels et confidentiels. L'Utilisateur s'engage à les conserver secrets et à ne pas les communiquer à des tiers.
          </p>
        </section>

        {/* Article 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 4 - Disponibilité du Site</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Le site est accessible 24h/24, 7j/7, sauf en cas de force majeure, d'événement hors du contrôle du Vendeur ou d'interruptions nécessaires à des opérations de maintenance, de mise à jour ou pour toute autre raison technique.
          </p>
        </section>

        {/* Article 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 5 - Garanties et responsabilités</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            Le Vendeur s'efforce de maintenir le Site à jour et de diffuser des informations fiables, toutefois, il ne garantit ni l'exactitude, ni l'exhaustivité, ni l'actualité des contenus.
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Le site est mis à disposition « en l'état » - sans aucune garantie implicite ou explicite.
          </p>
        </section>

        {/* Article 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 6 - Liens hypertextes</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Le Site peut contenir des liens vers des sites tiers. Le Vendeur n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, produits, services ou données.
          </p>
        </section>

        {/* Article 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 7 - Propriété intellectuelle</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Le Site, sa structure, ses contenus, marques, logos, bases de données et tout autre élément protégé sont la propriété exclusive du Vendeur ou de tiers ayant autorisé son exploitation.
          </p>
        </section>

        {/* Article 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 8 - Durée</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Les CGU s'appliquent à compter de leur acceptation par l'Utilisateur et pendant toute la durée d'utilisation du Site et/ou du Compte.
          </p>
        </section>

        {/* Article 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 9 - Droit applicable</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            Les CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux français seront compétents.
          </p>
        </section>

        {/* Article 10 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-3 font-[agrandir]">Article 10 - Contact</h2>
          <p className="text-slate-700 leading-relaxed mb-3 font-[maison-neue-book]">
            📧 par email :{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700 font-semibold">
              contact@crunchyvita.com
            </a>
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            📬 par courrier : Alteora, 1460 Chemin des Terriers Bâtiment B-04 06600 Antibes
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

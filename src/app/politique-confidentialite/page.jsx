'use client';

import HeaderHome from '@/components/header';
import Footer from '@/components/footer';
import '../fonts.css';

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderHome />
      
      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
        <h1 className="text-5xl font-bold text-slate-900 mb-8 font-[agrandir]">Politique de Confidentialité</h1>

        {/* Introduction */}
        <p className="text-slate-700 leading-relaxed mb-12">
          La présente Politique de confidentialité aborde la manière dont vos informations personnelles sont recueillies, utilisées et partagées lorsque vous consultez le site crunchyvita.fr ou y effectuez un achat.
        </p>

        {/* Informations personnelles recueillies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Informations personnelles recueillies</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Lorsque vous visitez le site, nous collectons automatiquement certaines informations concernant votre appareil, notamment votre navigateur web, votre adresse IP, votre fuseau horaire ainsi que certains cookies installés sur votre appareil.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            En outre, lors de votre navigation, nous recueillons des informations sur :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 mb-4 font-[maison-neue-book]">
            <li>Les pages visitées (produits consultés)</li>
            <li>Les sites ou termes de recherche qui vous ont conduit vers le site</li>
            <li>La manière dont vous interagissez avec le site</li>
          </ul>
        </section>

        {/* Cookies utilisés */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 font-[agrandir]">Cookies utilisés</h2>
          
          <div className="space-y-6">
            {/* Cookies strictement nécessaires */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">1. Cookies strictement nécessaires</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
                Ces cookies sont indispensables au fonctionnement du site et du processus de commande. Ils ne nécessitent pas de consentement préalable.
              </p>
            </div>

            {/* Cookies techniques */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">2. Cookies techniques</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
                Ces cookies assurent le fonctionnement général du site (navigation, sécurité, accès aux espaces sécurisés).
              </p>
            </div>

            {/* Cookies de mesure d'audience */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">3. Cookies de mesure d'audience</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
                Ces cookies permettent d'analyser la fréquentation du site afin d'en améliorer les performances. Ils ne sont disposés qu'après consentement de l'utilisateur.
              </p>
            </div>

            {/* Cookies marketing */}
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 font-[agrandir]">4. Cookies marketing</h3>
              <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
                Ces cookies peuvent être utilisés à des fins publicitaires ou de remarketing. Ils sont disposés uniquement avec le consentement explicite de l'utilisateur.
              </p>
            </div>
          </div>
        </section>

        {/* Gestion et paramétrage des cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Gestion et paramétrage des cookies</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Lors de votre première visite sur le site, un bandeau de gestion des cookies vous informe de l'utilisation et vous permet d'accepter tous les cookies, de refuser les non nécessaires ou de personnaliser vos préférences.
          </p>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Vous pouvez modifier vos choix à tout moment via le lien « Gérer mes cookies » disponible sur le site.
          </p>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Durée de conservation : les cookies sont conservés pour une durée maximale de 13 mois, conformément aux recommandations de la CNIL.
          </p>
        </section>

        {/* Utilisation des informations personnelles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Utilisation des informations personnelles</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Nous utilisons vos informations personnelles pour :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>Traiter vos commandes (paiement, expédition, facturation, confirmation)</li>
            <li>Communiquer avec vous</li>
            <li>Évaluer les fraudes ou risques potentiels</li>
            <li>Vous transmettre, si vous l'avez accepté, des informations sur nos offres relatives à nos produits et services</li>
          </ul>
        </section>

        {/* Partage des informations personnelles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Partage des informations personnelles</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Nous partageons vos informations personnelles avec des tiers qui nous aident dans notre traitement :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>OVH (hébergement de la boutique en ligne)</li>
            <li>Google Analytics (analyse de l'utilisation du site)</li>
          </ul>
        </section>

        {/* Vos droits */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Vos droits</h2>
          <p className="text-slate-700 leading-relaxed mb-4 font-[maison-neue-book]">
            Si vous êtes résident(e) de l'Espace économique européen, vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 font-[maison-neue-book]">
            <li>Accès à vos informations personnelles</li>
            <li>Correction, mise à jour ou suppression de vos données</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4 font-[maison-neue-book]">
            Pour exercer ces droits, contactez-nous aux coordonnées indiquées ci-dessous.
          </p>
        </section>

        {/* Nous contacter */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 font-[agrandir]">Nous contacter</h2>
          <p className="text-slate-700 leading-relaxed font-[maison-neue-book]">
            Pour toute question, plainte, réclamation ou demande liée à vos données personnelles, vous pouvez nous écrire à :
          </p>
          <p className="text-slate-700 font-semibold mt-4 font-[maison-neue-book]">
            📧{' '}
            <a href="mailto:contact@crunchyvita.com" className="text-green-600 hover:text-green-700">
              contact@crunchyvita.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

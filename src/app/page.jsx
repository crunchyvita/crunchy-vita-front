'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'CLIENT') {
        router.push('/client/shop');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">🌿</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Crunchy<span className="text-green-700">Vita</span></span>
          </div>
          <div className="hidden space-x-8 md:flex items-center">
            <Link href="/" className="text-gray-700 hover:text-green-600 font-medium">
              Accueil
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-green-600 font-medium">
              Nos produits
            </Link>
            <Link href="/commitments" className="text-gray-700 hover:text-green-600 font-medium">
              Nos engagements
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 font-medium">
              Contact
            </Link>
            <Link
              href="*"
              className="rounded-full bg-green-600 px-6 py-2 text-white hover:bg-green-700 transition-colors font-medium"
            >
              Commander
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-[#f5f3ed] py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="mb-6 text-5xl font-bold text-gray-900 leading-tight">
                Croquez la nature<br />
                avec <br/><span className="text-green-700">CrunchyVita</span>
              </h1>
              <p className="mb-8 text-lg text-gray-700
              ">
                Naturellement croquant, irrésistiblement bon.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="https://localhost:3000/shop"
                  className="rounded-full bg-green-600 px-8 py-3 text-center font-semibold text-white hover:bg-green-700 transition-colors"
                >
                  Découvrir nos produits
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-full border-2 border-gray-400 px-8 py-3 text-center font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Rejoindre notre communauté
                </Link>
              </div>
            </div>
            <div className="relative h-[400px]">
              <Image
                src="/assets/images/pic3.png"
                alt="CrunchyVita Products"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose CrunchyVita */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
            Pourquoi choisir <span className="text-green-700">CrunchyVita</span> ?
          </h2>
          <p className="mb-16 text-center text-gray-600 max-w-3xl mx-auto">
            Découvrez ce qui rend nos fruits lyophilisés uniques et pourquoi ils sont le snack<br/> préferé des amateurs de bien-être
            .
          </p>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* 100% fruits, 100% Naturel */}
            <div className="rounded-2xl bg-gray-50 p-8 text-center transition-all hover:shadow-lg">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50">
                  <svg className="h-10 w-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2c-1.5 0-2.5 1-3 2.5-.5 1.5 0 3.5 2 4.5 0-1.5.5-3 1-4z" />
                    <path d="M12 2c1.5 0 2.5 1 3 2.5.5 1.5 0 3.5-2 4.5 0-1.5-.5-3-1-4z" />
                    <ellipse cx="12" cy="14" rx="6" ry="8" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">100% fruits, 100% Naturel</h3>
              <p className="mb-4 text-sm text-gray-600">
                Uniquement des fruits, rien d'autre.
              </p>
              <div className="inline-flex flex-col items-center">
                <Link href="#" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  En savoir plus
                </Link>
                <span className="text-green-600 text-lg">→</span>
              </div>
            </div>

            {/* Certifié BIO */}
            <div className="rounded-2xl bg-gray-50 p-8 text-center transition-all hover:shadow-lg">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-50">
                  <svg className="h-10 w-10 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M12 2v12" />
                    <path d="M12 14l-3 8h6l-3-8z" />
                    <path d="M8.5 6l7 4M15.5 6l-7 4" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">Certifié BIO</h3>
              <p className="mb-4 text-sm text-gray-600">
                Des fruits & ingrédients sélectionnés avec soin.
              </p>
              <div className="inline-flex flex-col items-center">
                <Link href="#" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  En savoir plus
                </Link>
                <span className="text-green-600 text-lg">→</span>
              </div>
            </div>

            {/* Ultra-croquant & gourmand */}
            <div className="rounded-2xl bg-gray-50 p-8 text-center transition-all hover:shadow-lg">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-50">
                  <svg className="h-10 w-10 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">Ultra-croquant & gourmand</h3>
              <p className="mb-4 text-sm text-gray-600">
                Un texture unique, naturellement sucrée.
              </p>
              <div className="inline-flex flex-col items-center">
                <Link href="#" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  En savoir plus
                </Link>
                <span className="text-green-600 text-lg">→</span>
              </div>
            </div>

            {/* Pratique au quotidien */}
            <div className="rounded-2xl bg-gray-50 p-8 text-center transition-all hover:shadow-lg">
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-pink-50">
                  <svg className="h-10 w-10 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="4" width="14" height="17" rx="2" />
                    <path d="M9 2v4M15 2v4" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">Pratique au quotidien</h3>
              <p className="mb-4 text-sm text-gray-600">
                À emporter partout, travail ,sport ,école.
              </p>
              <div className="inline-flex flex-col items-center">
                <Link href="#" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  En savoir plus
                </Link>
                <span className="text-green-600 text-lg">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Products */}
      <section className="bg-[#f5f3ed] py-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
            Nos fruits <span className="text-green-700">lyophilisés</span>
          </h2>
          <p className="mb-16 text-center text-gray-600 max-w-3xl mx-auto">
            Découvrez nos fruits lyophilisés BIO, parfaits pour un snack sain ou pour sublimer<br/> vos recettes du quotidien.
          </p>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                
                desc: "	Dans un yaourt ou un bowl ",
                image: "/assets/images/bowl.png"
              },
              {
              
                desc: "En snack sain à tout moment",
                image: "/assets/images/snack.png"
              },
              {
             
                desc: "En topping dur un desserts",
                image: "/assets/images/dessert.png"
              },
              {
              
                desc: "Idéral pour petits et grands ",
                image: "/assets/images/kids.png"
              }
            ].map((item, index) => (
              <div key={index} className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                  <p className="text-sm text-gray-200">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Preference Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-gray-900">
                Le préféré de <span className="text-green-700">nos clients</span>
              </h2>
              <p className="mb-8 text-gray-600 leading-relaxed">
                Découvrez notre coffret découverte, idéal pour gouter plusieurs fruits</p>
              <Link
                href="/products"
                className="inline-block rounded-full bg-green-600 px-8 py-3 font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Decouvrer les produits
              </Link>
            </div>
            <div className="relative h-[400px]">
              <Image
                src="/assets/images/coffret.png"
                alt="Produits préférés"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="py-20 bg-[#f5f3ed]">
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
            Nos <span className="text-green-700">engagements</span>
          </h2>
          <p className="mb-16 text-center text-gray-600 max-w-3xl mx-auto">
            Chez CrunchyVita, nous nous engageons à vous offrir le meilleur de la nature, sans compromis sur la qualité ni sur vos valeurs.
          </p>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                icon: "🚫",
                title: "Sans additifs",
                desc: "Aucun additif, aucun conservateur.juste des fruits purs et naturels pour une alimentation saine."
              },
              {
                icon: "😊",
                title: "Sans sucre ajouté",
                desc: "Le goût sucré provient uniquement des fruits. Pas de sucres ajoutés, pas de compromis."
              },
              {
                icon: "🌿",
                title: "100% Bio et naturel",
                desc: "Tous nos fruits sont issus de l'agriculture biologique certifiée, respectueuse de l'environnement."
              }
            ].map((item, index) => (
              <div key={index} className="text-center bg-white rounded-2xl p-8 shadow-lg">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-4xl">
                  {item.icon}
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
              Une question ? <span className="text-green-700">Contactez-nous</span>
            </h2>
            <p className="mb-12 text-center text-gray-600">
              Notre équipe est à votre écoute pour répondre à toutes vos questions sur nos produits et notre démarche.
            </p>
            
            <form className="space-y-6 bg-gray-50 p-8 rounded-2xl shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">Votre nom</label>
                </div>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6l-10 5L2 6" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">Votre email</label>
                </div>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="jean.dupont@email.com"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">Votre message</label>
                </div>
                <textarea
                  rows={5}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
                  placeholder="Écrire votre message ici..."
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-green-600 py-3 font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#3d2f28] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4 mb-12">
            {/* Company Info */}
            <div>
              <h3 className="mb-6 text-2xl font-bold">CrunchyVita</h3>
              <p className="mb-6 text-gray-300 text-sm leading-relaxed">
                Découvrez nos fruits lyophilisés bio, parfaits pour sublimer vos recettes ou comme snack naturel.
              </p>
              <div className="space-y-3 text-sm">
                <p className="flex items-start">
                  <span className="mr-3">📍</span>
                  <span className="text-gray-300">123 rue de la Nature, 75001 Paris</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-3">📞</span>
                  <span className="text-gray-300">+33 (0)1 23 45 67 89</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-3">✉️</span>
                  <span className="text-gray-300">contact@crunchyvita.fr</span>
                </p>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="mb-6 text-lg font-bold">Nos produits</h4>
              <ul className="space-y-3 text-sm">
                {['Fruits lyophilisés', 'Coffrets découverte', 'Nouveautés', 'Meilleures ventes'].map((item, index) => (
                  <li key={index}>
                    <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="mb-6 text-lg font-bold">Aide</h4>
              <ul className="space-y-3 text-sm">
                {['FAQ', 'Livraison', 'Retours', 'Service client'].map((item, index) => (
                  <li key={index}>
                    <Link href="#" className="text-gray-300 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="mb-6 text-lg font-bold">Newsletter</h4>
              <p className="mb-4 text-gray-300 text-sm">
                Inscrivez-vous pour recevoir nos dernières offres et nouveautés.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-grow rounded-l-full px-4 py-2 text-gray-900 text-sm focus:outline-none"
                />
                <button className="rounded-r-full bg-green-600 px-6 py-2 hover:bg-green-700 transition-colors font-medium text-sm">
                  S'inscrire
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2025 CrunchyVita - Tous droits réservés</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
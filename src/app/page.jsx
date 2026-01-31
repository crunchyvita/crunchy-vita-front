'use client';

import Link from 'next/link';
import Image from 'next/image';
import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';
import { 
  Leaf,
  Ban,        
  CandyOff,
  Award,
  Sparkle,
  MapPinHouse
} from 'lucide-react';

// Composant FeatureCard avec rectangles arrondis
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  iconColorClass,
  bgColorClass,
  borderColorClass
}) {
  return (
    <div className={`rounded-2xl bg-white p-8 text-center border ${borderColorClass} feature-card-hover`}>
      <div className="mb-6 flex justify-center">
        <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${bgColorClass} border-2 ${borderColorClass}`}>
          <Icon className={`h-10 w-10 ${iconColorClass}`} strokeWidth={1.8} />
        </div>
      </div>      <h3 className="mb-4 text-xl font-bold text-gray-900 leading-tight">
        {title}
      </h3>
      
      <p className="mb-6 text-base text-gray-600 leading-relaxed">
        {description}
      </p>
      
     
    </div>
  );
}

// Composant 
function FeaturesSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <FeatureCard
        icon={Leaf}
        title="100% fruits, 100% Naturel"
        description="Uniquement des fruits, rien d'autre."
        iconColorClass="text-[#556822]"
        bgColorClass="bg-green-50"
        borderColorClass="border-green-100"
      />
      
      <FeatureCard
        icon={Award}
        title="Certifié BIO"
        description="Des fruits & ingrédients sélectionnés avec soin."
        iconColorClass="text-teal-600"
        bgColorClass="bg-teal-50"
        borderColorClass="border-teal-100"
      />
      
      <FeatureCard
        icon={Sparkle}
        title="Ultra-croquant & gourmand"
        description="Une texture unique, naturellement sucrée."
        iconColorClass="text-amber-500"
        bgColorClass="bg-amber-50"
        borderColorClass="border-amber-100"
      />
      
      <FeatureCard
        icon={MapPinHouse}
        title="Pratique au quotidien"
        description="À emporter partout : travail, sport, école."
        iconColorClass="text-pink-500"
        bgColorClass="bg-pink-50"
        borderColorClass="border-pink-100"
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <HeaderHome />

      {/* Hero Section */}
      <section className="bg-[#f5f3ed] py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="mb-6 text-5xl font-bold text-gray-900 leading-tight">
                Croquez la nature<br />
                avec <br/><span className="text-[#556822] font-bold ">Crunchy Vita</span>
              </h1>
              <p className="mb-8 text-lg text-gray-700">
                Naturellement croquant, irrésistiblement bon.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="https://localhost:3000/shop"
                  className="rounded-full bg-[#556822] px-8 py-3 text-center font-semibold text-white hover:bg-[#3d4d18] transition-colors"
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
            <div className="relative h-100">
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

      {/* Why Choose CrunchyVita  */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
            Pourquoi choisir <span className="text-[#556822]">CrunchyVita</span> ?
          </h2>
          <p className="mb-16 text-center text-gray-600 max-w-3xl mx-auto">
            Découvrez ce qui rend nos fruits lyophilisés uniques et pourquoi ils sont le snack<br/> préferé des amateurs de bien-être
            .
          </p>
          
          {/* Utilisation du composant FeaturesSection */}
          <FeaturesSection />
        </div>
      </section>

      {/* Our Products */}
      <section id="produits" className="bg-[#f5f3ed] py-20">
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
            Nos fruits <span className="text-[#556822]">lyophilisés</span>
          </h2>
          <p className="mb-16 text-center text-gray-600 max-w-3xl mx-auto">
            Découvrez nos fruits lyophilisés BIO, parfaits pour un snack sain ou pour sublimer<br/> vos recettes du quotidien.
          </p>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                desc: "Dans un yaourt ou un bowl",
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
                desc: "Idéral pour petits et grands",
                image: "/assets/images/kids.png"
              }
            ].map((item, index) => (
              <div key={index} className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <Image
                  src={item.image}
                  alt={item.desc}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
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
                Le préféré de <span className="text-[#556822]">nos clients</span>
              </h2>
              <p className="mb-8 text-gray-600 leading-relaxed">
                Découvrez notre coffret découverte, idéal pour gouter plusieurs fruits</p>
              <Link
                href="/products"
                className="inline-block rounded-full bg-[#556822] px-8 py-3 font-semibold text-white hover:bg-[#3d4d18] transition-colors"
              >
                Decouvrer les produits
              </Link>
            </div>
            <div className="relative h-100">
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

      {/* Commitments avec icônes React Lucide */}
      <section id="engagements" className="py-20 bg-[#f5f3ed]">
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
            Nos <span className="text-[#556822]">engagements</span>
          </h2>
          <p className="mb-16 text-center text-gray-600 max-w-3xl mx-auto">
            Chez CrunchyVita, nous nous engageons à vous offrir le meilleur de la nature, sans compromis sur la qualité ni sur vos valeurs.
          </p>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                icon: <Ban className="h-10 w-10 text-red-500" strokeWidth={1.8} />,
                title: "Sans additifs",
                desc: "Aucun additif, aucun conservateur. Juste des fruits purs et naturels pour une alimentation saine."
              },
              {
                icon: <CandyOff className="h-10 w-10 text-yellow-500" strokeWidth={1.8} />,
                title: "Sans sucre ajouté",
                desc: "Le goût sucré provient uniquement des fruits. Pas de sucres ajoutés, pas de compromis."
              },
              {
                icon: <Leaf className="h-10 w-10 text-[#556822]" strokeWidth={1.8} />,
                title: "100% Bio et naturel",
                desc: "Tous nos fruits sont issus de l'agriculture biologique certifiée, respectueuse de l'environnement."
              }
            ].map((item, index) => (
              <div key={index} className="text-center bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                  {item.icon}
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    
    </div>
  );
}
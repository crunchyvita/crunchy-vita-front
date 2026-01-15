'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';
import { 
  Leaf,
  BadgeCheck,
  Cookie,
  ShoppingBag,
  OctagonX,
  CandyOff,
  Flower2,
  Ban,        
  CircleOff,
  User,
  Mail,
  MessageSquare,
  Forbidden,ban,Award,Sparkle,MapPinHouse
} from 'lucide-react';

// Composant ContactForm
function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-8 rounded-2xl shadow-lg">
      {success && (
        <div className="p-4 bg-green-50 border border-green-300 rounded-lg text-green-700">
           Message envoyé avec succès ! Nous vous répondrons très bientôt.
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
           {error}
        </div>
      )}
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User className="h-4 w-4 text-[#469165]" strokeWidth={2} />
          <label className="text-sm font-medium text-gray-700">Votre nom</label>
        </div>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
          placeholder="Jean Dupont"
          required
        />
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-[#469165]" strokeWidth={2} />
          <label className="text-sm font-medium text-gray-700">Votre email</label>
        </div>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
          placeholder="jean.dupont@email.com"
          required
        />
      </div>
      
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-[#469165]" strokeWidth={2} />
          <label className="text-sm font-medium text-gray-700">Votre message</label>
        </div>
        <textarea
          rows={5}
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-200 bg-white p-3 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 transition-all"
          placeholder="Écrire votre message ici..."
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[#469165] py-3 font-semibold text-white hover:bg-[#3a7a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Envoi en cours...' : 'Envoyer le message'}
      </button>
    </form>
  );
}

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
        iconColorClass="text-green-600"
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
      <HeaderHome />

      {/* Hero Section */}
      <section className="bg-[#f5f3ed] py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="mb-6 text-5xl font-bold text-gray-900 leading-tight">
                Croquez la nature<br />
                avec <br/><span className="text-[#469165] font-bold ">CrunchyVita</span>
              </h1>
              <p className="mb-8 text-lg text-gray-700">
                Naturellement croquant, irrésistiblement bon.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="https://localhost:3000/shop"
                  className="rounded-full bg-[#469165] px-8 py-3 text-center font-semibold text-white hover:bg-green-700 transition-colors"
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

      {/* Why Choose CrunchyVita  */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
            Pourquoi choisir <span className="text-green-700">CrunchyVita</span> ?
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
            Nos fruits <span className="text-green-700">lyophilisés</span>
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
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
                Le préféré de <span className="text-green-700">nos clients</span>
              </h2>
              <p className="mb-8 text-gray-600 leading-relaxed">
                Découvrez notre coffret découverte, idéal pour gouter plusieurs fruits</p>
              <Link
                href="/products"
                className="inline-block rounded-full bg-[#469165] px-8 py-3 font-semibold text-white hover:bg-[#3a7a4a] transition-colors"
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

      {/* Commitments avec icônes React Lucide */}
      <section id="engagements" className="py-20 bg-[#f5f3ed]">
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
                icon: <Leaf className="h-10 w-10 text-green-600" strokeWidth={1.8} />,
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

      {/* Contact Section   */}
      <section id="contact" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-center text-4xl font-bold text-gray-900">
              Une question ? <span className="text-green-700">Contactez-nous</span>
            </h2>
            <p className="mb-12 text-center text-gray-600">
              Notre équipe est à votre écoute pour répondre à toutes vos questions sur nos produits et notre démarche.
            </p>
            
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    
    </div>
  );
}
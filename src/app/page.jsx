'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from '@/navigation';
import Image from 'next/image';
import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';
import PreferredItemDisplay from '@/components/PreferredItemDisplay';
import RouletteModal from '@/components/RouletteModal';
import { motion } from 'framer-motion';
import './fonts.css';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import {
  Leaf,
  Ban,
  CandyOff,
  Award,
  Sparkle,
  MapPinHouse
} from 'lucide-react';

// --- Variantes d'animation ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 50, damping: 20 } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const popIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 10 }
  }
};

export default function Home() {
  const { user } = useAuth();
  const t = useTranslations('Home');
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [isRouletteEnabled, setIsRouletteEnabled] = useState(false);
  const hasAutoOpenedRoulette = useRef(false);
  const rouletteUserKey = user?._id || user?.id || user?.email || 'guest';

  // Fetch settings from backend to check if roulette is enabled
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setIsRouletteEnabled(data.data.features?.rouletteEnabled ?? false);
          } else {
            setIsRouletteEnabled(false);
          }
        } else {
          setIsRouletteEnabled(false);
        }
      } catch (error) {
        console.error('Error reading settings:', error);
        setIsRouletteEnabled(false);
      }
    };
    
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isRouletteEnabled || hasAutoOpenedRoulette.current) return;

    const seenKey = `roulette_seen_${rouletteUserKey}`;
    const hasSeenRoulette = typeof window !== 'undefined' && localStorage.getItem(seenKey) === 'true';

    if (!hasSeenRoulette) {
      hasAutoOpenedRoulette.current = true;
      setIsRouletteOpen(true);
      localStorage.setItem(seenKey, 'true');
    }
  }, [isRouletteEnabled, rouletteUserKey]);

  return (
    <div className="min-h-screen bg-[#F5F3ED] selection:bg-[#E10C69] selection:text-white overflow-x-hidden pt-20">
      <HeaderHome />

      {/* Hero Section */}
      <section className="pt-12 pb-20 lg:py-24 relative overflow-hidden bg-[url('/assets/images/pack.png')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Text Content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.h1 
                variants={fadeInUp}
                className="mb-6 text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tighter uppercase drop-shadow-lg"
                style={{ fontFamily: 'Agrandir, sans-serif' }}
              >
                {t('hero.titleLine1')}<br />
                {t('hero.titleLine2')} <br/><span className="text-[#E10C69]" style={{ fontFamily: 'Agrandir, sans-serif' }}>{t('hero.brand')}</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="mb-8 lg:mb-10 text-lg lg:text-xl text-white/90 font-bold italic drop-shadow-md"
                style={{ fontFamily: 'Maison Neue, sans-serif' }}
              >
                {t('hero.subtitle')}
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/shop"
                    className="block rounded-full bg-[#E10C69] px-8 lg:px-10 py-4 text-center font-black uppercase tracking-widest text-white shadow-lg shadow-[#E10C69]/30 transition-all text-sm lg:text-base"
                  >
                    {t('hero.ctaDiscover')}
                  </Link>
                </motion.div>
                {!user && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/auth/register"
                      className="block rounded-full border-2 bg-white/10 border-white px-8 lg:px-10 py-4 text-center font-black uppercase tracking-widest text-white hover:bg-white hover:text-[#E10C69] transition-all text-sm lg:text-base"
                    >
                      {t('hero.ctaJoin')}
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 lg:py-28 bg-[#F5F3ED]">
        <div className="container mx-auto px-6">
          
          {/* Header de section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="mb-4 text-4xl md:text-5xl font-black text-[#556822] uppercase tracking-tighter" style={{ fontFamily: 'Agrandir, sans-serif' }}>
              {t('why.title')}
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 100 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="h-2 bg-[#EF8EB8] mx-auto rounded-full" 
            />
          </motion.div>

          {/* Grille de cartes */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: <Leaf size={32} />, title: t('why.cards.card1.title'), desc: t('why.cards.card1.desc') },
              { icon: <Award size={32} />, title: t('why.cards.card2.title'), desc: t('why.cards.card2.desc') },
              { icon: <Sparkle size={32} />, title: t('why.cards.card3.title'), desc: t('why.cards.card3.desc') },
              { icon: <MapPinHouse size={32} />, title: t('why.cards.card4.title'), desc: t('why.cards.card4.desc') }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={popIn}
                whileHover={{ y: -10 }}
                className="bg-white rounded-[2.5rem] p-10 text-center shadow-[0_10px_30px_rgba(85,104,34,0.08)] border-b-8 border-[#556822]/10 hover:border-[#E10C69] transition-all duration-300 group"
              >
                {/* Icône avec fond rose au survol */}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#556822]/5 text-[#556822] group-hover:bg-[#E10C69] group-hover:text-white transition-colors duration-300">
                  {item.icon}
                </div>
                
                <h3 className="mb-3 text-lg font-black text-[#556822] uppercase group-hover:text-[#E10C69] transition-colors" style={{ fontFamily: 'Maison Neue, sans-serif' }}>
                  {item.title}
                </h3>
                
                <p className="text-gray-500 text-sm font-semibold leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* nos fruits  lyophilisés */}
      <section id="produits" className="py-6 lg:py-24 bg-[#F5F3ED]/30 scroll-mt-24">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl text-center font-black text-[#556822] uppercase mb-12  tracking-tighter"
            style={{ fontFamily: 'Agrandir, sans-serif' }}
          >
            {t('products.title')}
          </motion.h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { desc: t('products.cards.card1'), image: "/assets/images/bowl3.png" },
              { desc: t('products.cards.card2'), image: "/assets/images/snack2.png" },
              { desc: t('products.cards.card3'), image: "/assets/images/test.png" },
              { desc: t('products.cards.card4'), image: "/assets/images/kids3.png" }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group relative h-87.5 lg:h-112.5 rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden border-4 border-white shadow-lg"
              >
                <Image src={item.image} alt={item.desc} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-linear-to-t from-[#556822]/90 via-transparent to-transparent opacity-70" />
                <div className="absolute bottom-0 p-6 lg:p-8 w-full">
                  <p className="text-white font-black uppercase italic text-lg lg:text-xl leading-tight" style={{ fontFamily: 'Maison Neue, sans-serif' }}>
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Preference */}

      <PreferredItemDisplay />

      {/* Commitments */}
      <section id="engagements" className="py-4 lg:py-32 bg-[#F5F3ED] relative overflow-hidden scroll-mt-24">
        {/* Motif de fond subtil */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none "></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <h2 className="text-4xl md:text-6xl font-black text-[#556822] uppercase tracking-tighter leading-none" style={{ fontFamily: 'Agrandir, sans-serif' }}>
                {t('commitments.title')} </h2>
            </motion.div>
           
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 ">
            {[
              { 
                icon: <Ban size={40} />, 
                title: t('commitments.cards.card1.title'), 
                desc: t('commitments.cards.card1.desc'),
                color: "bg-[#EF8EB8]" 
              },
              { 
                icon: <CandyOff size={40} />, 
                title: t('commitments.cards.card2.title'), 
                desc: t('commitments.cards.card2.desc'),
                color: "bg-[#EF8EB8]" 
              },
              { 
                icon: <Leaf size={40} />, 
                title: t('commitments.cards.card3.title'), 
                desc: t('commitments.cards.card3.desc'),
                color: "bg-[#EF8EB8]" 
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, type: "spring", stiffness: 60 }}
                whileHover={{ y: -15 }}
                className="relative  bg-white p-10 lg:p-12 rounded-[3rem] shadow-[20px_20px_0px_0px_rgba(85,104,34,0.05)] hover:shadow-[20px_20px_0px_0px_rgba(225,12,105,0.1)] transition-all duration-500 group"
              >
          

                <motion.div 
                  className={`w-20 h-20 ${item.color}  text-white rounded-full flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 group-hover:rotate-6  transition-transform duration-300`}
                >
                  {item.icon}
                </motion.div>

                <h3 className="mb-4 text-2xl lg:text-3xl font-black text-[#556822] uppercase tracking-tight group-hover:text-[#E10C69] transition-colors" style={{ fontFamily: 'Maison Neue, sans-serif' }}>
                  {item.title}
                </h3>
                
                <p className="text-gray-600 text-base lg:text-lg leading-relaxed font-medium" style={{ fontFamily: 'Maison Neue, sans-serif' }}>
                  {item.desc}
                </p>

                
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Roulette Modal - Open automatically on page load when enabled */}
      {isRouletteEnabled && (
        <RouletteModal
          isOpen={isRouletteOpen}
          onClose={() => setIsRouletteOpen(false)}
          userEmail={user?.email || ''}
        />
      )}
    </div>
  );
}
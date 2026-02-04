'use client';

import Link from 'next/link';
import Image from 'next/image';
import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';
import { motion } from 'framer-motion';
import './fonts.css';
import { useAuth } from '@/context/AuthContext';
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
                Croquez la nature<br />
                avec <br/><span className="text-[#E10C69]" style={{ fontFamily: 'Agrandir, sans-serif' }}>Crunchy Vita</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="mb-8 lg:mb-10 text-lg lg:text-xl text-white/90 font-bold italic drop-shadow-md"
                style={{ fontFamily: 'Maison Neue, sans-serif' }}
              >
                Naturellement croquant, irrésistiblement bon
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/shop"
                    className="block rounded-full bg-[#E10C69] px-8 lg:px-10 py-4 text-center font-black uppercase tracking-widest text-white shadow-lg shadow-[#E10C69]/30 transition-all text-sm lg:text-base"
                  >
                    Découvrir nos produits
                  </Link>
                </motion.div>
                {!user && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/auth/register"
                      className="block rounded-full border-2 bg-white/10 border-white px-8 lg:px-10 py-4 text-center font-black uppercase tracking-widest text-white hover:bg-white hover:text-[#E10C69] transition-all text-sm lg:text-base"
                    >
                      Rejoindre la communauté
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
              Pourquoi choisir CrunchyVita ?
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
              { icon: <Leaf size={32} />, title: "100% fruits", desc: "Uniquement des fruits, rien d'autre." },
              { icon: <Award size={32} />, title: "Certifié BIO", desc: "Des fruits sélectionnés avec soin." },
              { icon: <Sparkle size={32} />, title: "Ultra-croquant", desc: "Une texture unique, naturellement sucrée." },
              { icon: <MapPinHouse size={32} />, title: "Pratique", desc: "À emporter partout : travail, sport, école." }
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
            Nos fruits lyophilisés
          </motion.h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { desc: "Dans un yaourt ou un bowl", image: "/assets/images/bowl.png" },
              { desc: "En snack sain à tout moment", image: "/assets/images/snack.png" },
              { desc: "En topping sur vos desserts", image: "/assets/images/dessert.png" },
              { desc: "Idéal pour petits et grands", image: "/assets/images/kids.png" }
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
      <section className="py-10 lg:py-20 relative overflow-hidden">

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
            

              <h2 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-black text-[#556822] uppercase tracking-tighter leading-[0.9]" style={{ fontFamily: 'Agrandir, sans-serif' }}>
                Le préféré de <br/>
                <span className="text-[#E10C69] inline-block hover:scale-105 transition-transform duration-300 cursor-default" style={{ fontFamily: 'Agrandir, sans-serif' }}>nos clients</span>
              </h2>

              <p className="mb-10 text-gray-600 text-lg lg:text-xl font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed" style={{ fontFamily: 'Maison Neue, sans-serif' }}>
                Découvrez notre coffret découverte, le mix parfait pour goûter à l'explosion de saveurs Crunchy Vita.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
                <Link
                  href="/shop?tab=packages"
                  className="group relative inline-flex items-center gap-3 rounded-full bg-[#E10C69] px-10 py-5 font-black uppercase tracking-widest text-white shadow-[0_15px_30px_rgba(225,12,105,0.3)] transition-all hover:bg-[#C40A5B] hover:-translate-y-1"
                >
                  Découvrir le coffret
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Link>

               
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 60 }}
              className="relative h-100 lg:h-162.5 order-1 lg:order-2 group"
            >
              
              <Image 
                src="/assets/images/products.png" 
                alt="Coffret Crunchy Vita avec fruits volants" 
                fill 
                className="object-contain drop-shadow-[0_45px_45px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover:scale-105" 
                priority
              />
            </motion.div>

          </div>  
        </div>
      </section>

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
                Nos engagements </h2>
            </motion.div>
           
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 ">
            {[
              { 
                icon: <Ban size={40} />, 
                title: "Zéro Additifs", 
                desc: "Ni conservateurs, ni colorants, ni arômes artificiels. Juste la pureté brute du fruit lyophilisé.",
                color: "bg-[#EF8EB8]" 
              },
              { 
                icon: <CandyOff size={40} />, 
                title: "Sucre Naturel", 
                desc: "Zéro sucre ajouté. Seulement le sucre naturel des fruits BIO.",
                color: "bg-[#EF8EB8]" 
              },
              { 
                icon: <Leaf size={40} />, 
                title: "Excellence BIO", 
                desc: "Tous nos fruits sont issus de l'agriculture biologique.",
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
    </div>
  );
}
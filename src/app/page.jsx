'use client';

import Link from 'next/link';
import Image from 'next/image';
import HeaderHome from '@/components/header-home';
import Footer from '@/components/footer';
import { motion } from 'framer-motion';
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
  return (
    <div className="min-h-screen bg-[#F5F3ED] selection:bg-[#E10C69] selection:text-white overflow-x-hidden">
      <HeaderHome />

      {/* Hero Section */}
      <section className="pt-12 pb-20 lg:py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Text Content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left z-10"
            >
              <motion.h1 
                variants={fadeInUp}
                className="mb-6 text-4xl md:text-5xl lg:text-6xl font-black text-[#E10C69] leading-[1.1] tracking-tighter uppercase"
              >
                Croquez la nature<br />
                avec <br/><span className="text-[#556822]">Crunchy Vita</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="mb-8 lg:mb-10 text-lg lg:text-xl text-[#556822]/80 font-bold italic"
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
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/auth/register"
                    className="block rounded-full border-2 border-[#E10C69] px-8 lg:px-10 py-4 text-center font-black uppercase tracking-widest text-[#E10C69] hover:bg-[#E10C69] hover:text-white transition-all text-sm lg:text-base"
                  >
                    Rejoindre la communauté
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Hero Image */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative h-75 md:h-112.5 lg:h-150 mt-8 lg:mt-0"
            >
              <Image 
                src="/assets/images/products.png" 
                alt="Products" 
                fill 
                className="object-contain drop-shadow-2xl"  
                priority 
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 lg:mb-20"
          >
            <h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-black text-[#556822] uppercase tracking-tighter">
              Pourquoi choisir CrunchyVita ?
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="h-1.5 bg-[#EF8EB8] mx-auto rounded-full" 
            />
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
          >
            {[
              { icon: <Leaf />, title: "100% fruits", desc: "Uniquement des fruits, rien d'autre." },
              { icon: <Award />, title: "Certifié BIO", desc: "Des fruits sélectionnés avec soin." },
              { icon: <Sparkle />, title: "Ultra-croquant", desc: "Une texture unique, naturellement sucrée." },
              { icon: <MapPinHouse />, title: "Pratique", desc: "À emporter partout : travail, sport, école." }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={popIn}
                whileHover={{ scale: 1.05, y: -10, transition: { duration: 0.3 } }}
                className="bg-[#F5F3ED] rounded-[2.5rem] lg:rounded-[3rem] p-8 lg:p-10 text-center group"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-white text-[#E10C69] shadow-md">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-base lg:text-lg font-black text-[#E10C69] uppercase">{item.title}</h3>
                <p className="text-gray-500 text-xs lg:text-sm font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Grid Section */}
      <section id="produits" className="py-16 lg:py-24 bg-[#F5F3ED]/30">
        <div className="container mx-auto px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl text-center font-black text-[#556822] uppercase mb-12 lg:text-5xl tracking-tighter"
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
                className="group relative h-[350px] lg:h-[450px] rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden border-4 border-white shadow-lg"
              >
                <Image src={item.image} alt={item.desc} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#556822]/90 via-transparent to-transparent opacity-70" />
                <div className="absolute bottom-0 p-6 lg:p-8 w-full">
                  <p className="text-white font-black uppercase italic text-lg lg:text-xl leading-tight">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Preference */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <h2 className="mb-6 text-4xl md:text-5xl lg:text-6xl font-black text-[#556822] uppercase tracking-tighter">
                Le préféré de <br/><span className="text-[#E10C69]">nos clients</span>
              </h2>
              <p className="mb-8 text-gray-600 text-base lg:text-lg font-medium max-w-md mx-auto lg:mx-0">
                Découvrez notre coffret découverte, le mix parfait pour goûter à l'explosion de saveurs Crunchy Vita.
              </p>
              <Link
                href="/shop?tab=packages"
                className="inline-block rounded-full bg-[#E10C69] px-10 lg:px-12 py-4 lg:py-5 font-black uppercase tracking-widest text-white hover:bg-[#C40A5B] shadow-lg transition-all text-sm lg:text-base"
              >
                Découvrir le coffret
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative h-[300px] lg:h-[500px]"
            >
              <Image src="/assets/images/pack.png" alt="Box" fill className="object-contain drop-shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section id="engagements" className="py-16 lg:py-24 bg-[#F5F3ED]">
        <div className="container mx-auto px-6">
          <motion.h2 className="mb-12 lg:mb-16 text-3xl md:text-4xl lg:text-5xl font-black text-center text-[#556822] uppercase tracking-tighter">
            Nos engagements
          </motion.h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <Ban size={32} className="lg:w-10 lg:h-10" />, title: "Sans additifs", desc: "Aucun additif, aucun conservateur. Juste des fruits purs." },
              { icon: <CandyOff size={32} className="lg:w-10 lg:h-10" />, title: "Sans sucre", desc: "Le goût sucré provient uniquement des fruits." },
              { icon: <Leaf size={32} className="lg:w-10 lg:h-10" />, title: "100% Bio", desc: "Tous nos fruits sont issus de l'agriculture biologique." }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 50 }}
                whileHover={{ scale: 1.05, y: -10, transition: { duration: 0.3 } }}
                className="bg-white p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] shadow-md border-b-[6px] border-[#556822]/60  hover:border-[#E10C69] text-center group"
              >
                <motion.div 
                  className="text-[#E10C69]  mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300"
                >
                  {item.icon}
                </motion.div>
                <h3 className="mb-3 text-xl lg:text-2xl font-black text-[#E10C69] uppercase group-hover:text-[#556822] transition-colors">{item.title}</h3>
                <p className="text-gray-500 text-sm lg:text-base font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
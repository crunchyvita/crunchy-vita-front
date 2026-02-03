'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PromoBadge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
      transition={{
        opacity: { duration: 0.6 },
        x: { duration: 0.6 },
        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }}
      className="absolute top-28 right-6 z-[999] hidden lg:block"
    >
      {/* Utilisation du Magenta de la palette pour un impact maximal */}
      <div className="bg-[#E10C69] text-white px-6 py-5 rounded-[2rem] shadow-2xl border-4 border-[#B3C800] max-w-[280px] font-[Maison Neue]">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h3 className="font-black text-sm uppercase  mb-1 font-[Agrandir]">
              Livraison Offerte !
            </h3>
            <p className="text-[10px] font-bold leading-tight opacity-90 uppercase tracking-wide font-[Maison Neue Book]">
              Dès <span className="text-base font-black underline font-[Agrandir]">40€</span> d'achats en point relais
            </p>
          </div>
        </div>
        {/* Petit badge décoratif Pistachio en bas */}
        <div className="absolute -bottom-2 -right-2 bg-[#B3C800] text-[#556822] text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest font-[Maison Neue Mono]">
          Profitez-en
        </div>
      </div>
    </motion.div>
  );
}
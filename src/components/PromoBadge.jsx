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
      className="fixed top-24 right-6 z-50 hidden lg:block"
    >
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-4 rounded-3xl shadow-2xl border border-emerald-300/30 max-w-xs">
        <div className="flex items-start gap-3">
          <motion.span
            animate={{ rotate: [0, 12, -12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-2xl shrink-0"
          >
            🚚
          </motion.span>
          
          <div className="flex-1">
            <h3 className="font-black text-base leading-tight mb-1">
              Livraison offerte en France 
            </h3>
            <p className="text-xs font-bold opacity-95">
              Point relais Chronopost dès <span className="underline font-black">40€</span> d'achats
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

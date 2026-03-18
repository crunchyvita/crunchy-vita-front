'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

export default function PreferredItemDisplay() {
  const t = useTranslations('PreferredItem');
  const locale = useLocale();
  const [preferredLink, setPreferredLink] = useState('/shop');

  useEffect(() => {
    const fetchPreferredItem = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/preferred-item`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const item = result.data.fullItem || result.data;
          const itemId = item._id || result.data.itemId;
          const itemType = result.data.itemType;
          
          // Set link based on item type
          if (itemType === 'PRODUCT' && itemId) {
            setPreferredLink(`/shop/${itemId}`);
          } else if (itemType === 'PACKAGE' && itemId) {
            setPreferredLink(`/shop/packages/${itemId}`);
          } else {
            setPreferredLink('/shop');
          }
        }
      } catch (error) {
        console.error('Error fetching preferred item:', error);
      }
    };

    fetchPreferredItem();
  }, []);

  return (
    <section className="py-10 lg:py-20 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <h2 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-black text-[#556822] uppercase tracking-tighter leading-[0.9]" style={{ fontFamily: 'Agrandir, sans-serif' }}>
              {t('titleLine1')} <br/>
              <span className="text-[#E10C69] inline-block hover:scale-105 transition-transform duration-300 cursor-default" style={{ fontFamily: 'Agrandir, sans-serif' }}>
                {t('titleLine2')}
              </span>
            </h2>


            <p className="mb-10 text-gray-600 text-lg lg:text-xl font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed" style={{ fontFamily: 'Maison Neue, sans-serif' }}>
              {t('description')}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start">
              <Link
                href={`/${locale}${preferredLink}`}
                className="group relative inline-flex items-center gap-3 rounded-full bg-[#E10C69] px-10 py-5 font-black uppercase tracking-widest text-white shadow-[0_15px_30px_rgba(225,12,105,0.3)] transition-all hover:bg-[#C40A5B] hover:-translate-y-1"
              >
                {t('cta')}
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </Link>
            </div>
          </motion.div>
          
          {/* Image fixe avec les 5 paquets */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60 }}
            className="relative h-100 lg:h-162.5 order-1 lg:order-2 group"
          >
            <Image 
              src="/assets/images/products2.png" 
              alt={t('imageAlt')}
              fill 
              className="object-contain drop-shadow-[0_45px_45px_rgba(0,0,0,0.12)] transition-transform duration-500 group-hover:scale-105" 
              priority
            />
          </motion.div>

        </div>  
      </div>
    </section>
  );
}

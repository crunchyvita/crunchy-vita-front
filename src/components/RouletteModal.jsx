'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Copy, Check, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import the Wheel to prevent SSR issues
const Wheel = dynamic(
  () => import('react-custom-roulette').then((module) => module.Wheel),
  { ssr: false }
);

const BRAND_GREEN = '#556822'; 
const BRAND_PINK = '#E10C69';

export default function CrunchyRoulette({ isOpen, onClose, userEmail }) {
  const t = useTranslations('Roulette');
  
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [winResult, setWinResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(userEmail || '');

  useEffect(() => {
    if (isOpen) fetchRewards();
  }, [isOpen]);

  const fetchRewards = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${backendUrl}/roulette/rewards`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        const formattedRewards = result.data.map((reward, index) => ({
          option: reward,
          style: {
            backgroundColor: index % 2 === 0 ? BRAND_GREEN : BRAND_PINK,
            textColor: '#FFFFFF',
          },
        }));
        setRewards(formattedRewards);
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
      
    }
  };

  const handleSpinClick = () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (rewards.length === 0 || isSpinning) return;

    setError('');
    const newPrizeNumber = Math.floor(Math.random() * rewards.length);
    console.log('🎯 Prize Number Selected:', newPrizeNumber);
    console.log('🎁 Reward at index:', rewards[newPrizeNumber]?.option);
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);
    setIsSpinning(true);
  };

  const handleStopSpinning = async () => {
    setMustSpin(false);
    setIsSpinning(false);
    
    // Get the winning reward immediately when wheel stops
    const winningReward = rewards[prizeNumber].option;
    console.log('🛑 Wheel Stopped - Prize Number:', prizeNumber);
    console.log('🏆 Winning Reward:', winningReward);
    
    // Small delay to ensure state is synced
    setTimeout(async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        console.log('📤 Sending to backend:', { email, selectedReward: winningReward });
        
        const response = await fetch(`${backendUrl}/roulette/spin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, selectedReward: winningReward }),
        });
        const result = await response.json();
        console.log('📥 Backend response:', result);
        
        if (result.success) {
          // Use backend response to ensure consistency
          setWinResult({
            code: result.data.code,
            reward: result.data.reward || winningReward, // Prefer backend response
          });
          console.log('✅ Win result set:', { code: result.data.code, reward: result.data.reward || winningReward });
        }
      } catch (err) {
        console.error('❌ Error submitting spin:', err);
        setWinResult({
          code: "CRUNCHYVITA15",
          reward: winningReward,
        });
      }
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div 
        className="fixed inset-0 bg-black/60 z-100" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <div className="fixed inset-0 flex items-center justify-center z-101 p-4 pointer-events-none">
        <motion.div 
          className="bg-[#F5F3ED] rounded-[2.5rem] shadow-2xl max-w-4xl w-full overflow-hidden pointer-events-auto relative border-8 border-white"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 z-50 text-slate-400 hover:text-black transition-all">
            <X size={28} />
          </button>

          <div className="px-8 py-8">
            {!winResult ? (
              <div className="flex flex-col md:flex-row items-center justify-around gap-10">
                
                {/* Wheel Section */}
                <div className="relative scale-75 md:scale-90 shrink-0">
                  {/* Container for the Wheel with outer ring effect */}
                  <div className="relative rounded-full border-10 border-white ring-[6px] ring-[#E10C69] shadow-2xl bg-white flex items-center justify-center">
                    {rewards.length > 0 && (
                      <Wheel
                        mustStartSpinning={mustSpin}
                        prizeNumber={prizeNumber}
                        data={rewards}
                        onStopSpinning={handleStopSpinning}
                        pointerProps={{ style: { display: 'none' } }} 
                        outerRadius={180}
                        outerBorderWidth={0}
                        innerRadius={15}
                        radiusLineWidth={0}
                        fontSize={18}
                        textDistance={60}
                      />
                    )}

                    {/* Custom Pointer (Triangle) - TOP CENTER to match wheel logic */}
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
                      <div 
                        className="w-0 h-0 
                        border-l-20 border-l-transparent 
                        border-r-20 border-r-transparent 
                        border-t-40 border-t-white
                        drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)]" 
                      />
                    </div>
                  </div>
                  
                  {/* Center Logo Badge */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-md z-20 flex items-center justify-center pointer-events-none">
                    <img
                      src="/assets/images/logo.png"
                      alt="Crunchy Vita"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                </div>

                {/* Info and Form Section */}
                <div className="flex-1 max-w-sm space-y-6">
                  <div>
                    <h3 style={{ color: BRAND_GREEN }} className="text-3xl font-bold font-agrandir tracking-tight">Tournez pour Gagner !</h3>
                    <p className="text-slate-500 font-medium mt-1">Profitez d'une surprise fruitée pour votre prochaine commande</p>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre adresse email"
                      className="w-full px-6 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-lg focus:border-[#556822] outline-none transition-all shadow-inner text-black"
                    />
                    
                    {error && <p className="text-red-500 text-sm font-bold">{error}</p>}

                    <motion.button
                      onClick={handleSpinClick}
                      disabled={isSpinning}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ backgroundColor: isSpinning ? '#cbd5e1' : BRAND_GREEN }}
                      className="w-full text-white font-black py-4 rounded-xl text-xl shadow-lg   transition-all"
                    >
                      {isSpinning ? 'EN COURS...' : 'Lancer la roue'}
                    </motion.button>
                  </div>
                </div>

              </div>
            ) : (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
                <div className="mb-4">
                    <div style={{ color: BRAND_PINK }} className="flex justify-center mb-2"><Gift size={48} /></div>
                    <h3 style={{ color: BRAND_PINK }} className="text-3xl font-black uppercase italic">C'est Gagné !</h3>
                    <p className="text-slate-600">Vous avez remporté : <span className="font-bold text-black">{winResult.reward}</span></p>
                </div>
                
                <div 
                    onClick={() => {
                        navigator.clipboard.writeText(winResult.code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    }}
                    className="max-w-md mx-auto border-4 border-dashed rounded-2xl p-6 bg-slate-50 cursor-pointer transition-all hover:bg-white relative overflow-hidden"
                    style={{ borderColor: BRAND_GREEN }}
                >
                  <span style={{ color: BRAND_GREEN }} className="text-2xl font-mono font-black tracking-widest uppercase">
                    {winResult.code}
                  </span>
                  <div className="mt-2 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase text-xs">
                    {copied ? <><Check size={16} className="text-green-500"/> Copié !</> : <><Copy size={16}/> Cliquez pour copier</>}
                  </div>
                </div>

                <button onClick={onClose} className="mt-6 text-slate-400 font-bold uppercase text-sm tracking-widest hover:text-pink-600 transition-colors">
                  Continuer mes achats
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
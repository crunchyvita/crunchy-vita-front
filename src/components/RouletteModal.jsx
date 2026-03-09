'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function CrunchyRoulette({
  isOpen,
  onClose,
  userEmail,
  onSpinSuccess,
}) {
  const t = useTranslations('Roulette');
  const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const apiBaseUrl = rawApiBaseUrl.replace(/\/$/, '').endsWith('/api')
    ? rawApiBaseUrl.replace(/\/$/, '')
    : `${rawApiBaseUrl.replace(/\/$/, '')}/api`;

  const confettiCanvasRef = useRef(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const prizeNumberRef = useRef(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rewards, setRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsError, setRewardsError] = useState('');
  const [winResult, setWinResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState(userEmail || '');

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (isOpen) fetchRewards();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !winResult) return;

    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const confettiCount = 140;
    const gravity = 0.18;
    const drag = 0.992;
    const colors = ['#556822', '#E10C69', '#ffffff', '#d9e3c5', '#ffd4e8'];
    const pieces = [];

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createPiece = () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.4,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 12,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3,
      rotation: Math.random() * Math.PI * 2,
      vr: -0.12 + Math.random() * 0.24,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 220 + Math.random() * 80,
    });

    resizeCanvas();
    for (let i = 0; i < confettiCount; i += 1) {
      pieces.push(createPiece());
    }

    const render = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let living = 0;
      for (const piece of pieces) {
        if (piece.life <= 0) continue;
        living += 1;

        piece.life -= 1;
        piece.vx *= drag;
        piece.vy = piece.vy * drag + gravity;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.vr;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      }

      if (living > 0) {
        animationFrameId = window.requestAnimationFrame(render);
      }
    };

    animationFrameId = window.requestAnimationFrame(render);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [isOpen, winResult]);

  const fetchRewards = async () => {
    setRewardsLoading(true);
    setRewardsError('');
    try {
      const response = await fetch(`${apiBaseUrl}/roulette/rewards`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
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
      } else {
        setRewards([]);
        setRewardsError('Aucune recompense disponible pour le moment.');
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
      setRewards([]);
      setRewardsError('Impossible de charger la roue.');
    } finally {
      setRewardsLoading(false);
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

    // Keep both state and ref in sync
    setPrizeNumber(newPrizeNumber);
    prizeNumberRef.current = newPrizeNumber;

    setMustSpin(true);
    setIsSpinning(true);
  };

  const handleStopSpinning = async () => {
    setMustSpin(false);
    setIsSpinning(false);

    // Use ref — guaranteed correct value regardless of React re-render timing
    const safePrizeNumber = prizeNumberRef.current;
    const winningReward = rewards[safePrizeNumber].option;

    // Reveal winner immediately while code is being generated
    setWinResult({ code: 'GENERATION...', reward: winningReward, pending: true });

    console.log('🛑 Wheel stopped | prizeNumber:', safePrizeNumber, '| reward:', winningReward);

    try {
      const response = await fetch(`${apiBaseUrl}/roulette/spin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ email, selectedReward: winningReward }),
      });
      const result = await response.json();

      const generatedCode = result?.data?.code;
      if (result.success && generatedCode) {
        setWinResult({
          code: generatedCode,
          reward: winningReward,
          pending: false,
        });

        if (onSpinSuccess) {
          onSpinSuccess();
        }
      } else {
        setError(result.message || 'Something went wrong. Please try again.');
        setWinResult(null);
      }
    } catch (err) {
      console.error('Error submitting spin:', err);
      setError('Unable to generate your code right now. Please try again.');
      setWinResult(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {winResult && (
            <canvas
              ref={confettiCanvasRef}
              className="fixed inset-0 z-110 pointer-events-none"
              aria-hidden="true"
            />
          )}

          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-100"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Curtain container - attached to top */}
          <div className="fixed top-0 left-0 right-0 z-101 pointer-events-none flex justify-center">
            <motion.div
              className="w-full max-w-5xl bg-[#F5F3ED] shadow-2xl overflow-hidden pointer-events-auto relative"
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 18,
                mass: 0.9,
                bounce: 0.25,
              }}
              style={{
                borderBottomLeftRadius: '2.5rem',
                borderBottomRightRadius: '2.5rem',
                borderLeft: '8px solid white',
                borderRight: '8px solid white',
                borderBottom: '8px solid white',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 text-slate-400 hover:text-black transition-all hover:rotate-90 duration-300"
              >
                <X size={28} />
              </button>

              {/* Decorative header attachment line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#556822] via-[#E10C69] to-[#556822]" />

              <div className="px-6 py-10 md:px-10 md:py-12">{!winResult ? (
              <div className="flex flex-col md:flex-row items-center justify-around gap-10">

                {/* Wheel Section */}
                <div className="relative scale-75 md:scale-90 shrink-0">

                  <div className="relative rounded-full border-10 border-white ring-[6px] ring-[#E10C69] shadow-2xl bg-white flex items-center justify-center">
                    {rewardsLoading && (
                      <div className="h-90 w-90 rounded-full flex items-center justify-center text-slate-500 font-bold text-sm text-center px-8">
                        Chargement de la roue...
                      </div>
                    )}

                    {!rewardsLoading && rewards.length > 0 && (
                      <Wheel
                        mustStartSpinning={mustSpin}
                        prizeNumber={prizeNumber}
                        data={rewards}
                        onStopSpinning={handleStopSpinning}
                        pointerProps={{
                          style: {
                            width: '42px',
                            filter: `
      drop-shadow(0 2px 6px rgba(0,0,0,0.25))
      brightness(0) saturate(100%)
      invert(16%) sepia(95%) saturate(5200%)
      hue-rotate(320deg) brightness(90%) contrast(105%)
    `,
                          },
                        }}
                        outerRadius={180}
                        outerBorderWidth={0}
                        innerRadius={15}
                        radiusLineWidth={0}
                        fontSize={18}
                        textDistance={60}
                      />
                    )}

                    {!rewardsLoading && rewards.length === 0 && (
                      <div className="h-90 w-90 rounded-full flex flex-col items-center justify-center text-center px-8">
                        <p className="text-slate-500 font-semibold text-sm">{rewardsError || 'Roue indisponible'}</p>
                        <button
                          type="button"
                          onClick={fetchRewards}
                          className="mt-4 rounded-full bg-[#556822] px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
                        >
                          Reessayer
                        </button>
                      </div>
                    )}
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
                    <h3
                      style={{ color: BRAND_GREEN }}
                      className="text-3xl font-bold font-agrandir tracking-tight"
                    >
                      Tournez pour Gagner !
                    </h3>
                    <p className="text-slate-500 font-medium mt-1">
                      Profitez d'une surprise fruitée pour votre prochaine commande
                    </p>
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
                      className="w-full text-white font-black py-4 rounded-xl text-xl shadow-lg transition-all"
                    >
                      {isSpinning ? 'EN COURS...' : 'Lancer la roue'}
                    </motion.button>
                  </div>
                </div>

              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-4"
              >
                <div className="mb-4">
                  <div style={{ color: BRAND_PINK }} className="flex justify-center mb-2">
                    <Gift size={48} />
                  </div>
                  <h3
                    style={{ color: BRAND_PINK }}
                    className="text-3xl font-black uppercase italic"
                  >
                    C'est Gagné !
                  </h3>
                  <p className="text-slate-600">
                    Vous avez remporté :{' '}
                    <span className="font-bold text-black">{winResult.reward}</span>
                  </p>
                </div>

                <div
                  onClick={() => {
                    if (winResult.pending) return;
                    navigator.clipboard.writeText(winResult.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="max-w-md mx-auto border-4 border-dashed rounded-2xl p-6 bg-slate-50 cursor-pointer transition-all hover:bg-white relative overflow-hidden"
                  style={{ borderColor: BRAND_GREEN }}
                >
                  <span
                    style={{ color: BRAND_GREEN }}
                    className="text-2xl font-mono font-black tracking-widest uppercase"
                  >
                    {winResult.code}
                  </span>
                  <div className="mt-2 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase text-xs">
                    {winResult.pending ? (
                      <>Generation du code...</>
                    ) : copied ? (
                      <><Check size={16} className="text-green-500" /> Copié !</>
                    ) : (
                      <><Copy size={16} /> Cliquez pour copier</>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="mt-6 text-slate-400 font-bold uppercase text-sm tracking-widest hover:text-pink-600 transition-colors"
                >
                  Continuer mes achats
                </button>
              </motion.div>
            )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

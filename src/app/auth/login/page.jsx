'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Mail, Lock, ArrowRight, Leaf, Loader2, Eye, EyeOff } from 'lucide-react'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectBasedOnRole(user.role);
    }
  }, [isAuthenticated, user, router]);

  const redirectBasedOnRole = (role) => {
    if (role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (role === 'CLIENT') {
      // ✅ Redirect to production URL in production, localhost in dev
      if (process.env.NODE_ENV === 'production') {
        window.location.href = 'https://www.crunchyvita.com/shop';
      } else {
        router.push('/shop');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) redirectBasedOnRole(result.user.role);
      else setError(result.error || 'Identifiants invalides');
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authAPI.getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Colonne Gauche - Visuel (Caché sur mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#EF8EB8] items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#EF8EB8]/90 z-10" />
          <img 
            src="/assets/images/pic2.jpg" 
            alt="Organic Food"
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="relative z-20 max-w-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 backdrop-blur-md rounded-2xl border border-white/20">
              <img src="/assets/images/logo.png" alt="Crunchy Vita Logo" className="h-40 w-40" />
            </div>
          </div>
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Essayez, <br /> 
            <span className="text-white"> vous allez adorer.</span>
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
                Rejoignez-nous pour des produits sans additifs, sans sucres ajoutés, 100% bio et naturels.
          </p>
        </div>
        
        {/* Décoration abstraite */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
      </div>

      {/* Colonne Droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden flex flex-col items-center">
             <div className="w-24 h-24 bg-[#EF8EB8] rounded-xl flex items-center justify-center mb-4">
               <img src="/assets/images/logo_white.png" alt="Crunchy Vita Logo" className="h-16 w-16" />
             </div>
             <h1 className="text-2xl font-bold text-[#556822]">Crunchy Vita</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#556822] tracking-tight">Bon retour !</h2>
            <p className="text-[#556822] mt-2">
              Ravi de vous revoir. Connectez-vous à votre compte.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-800 text-sm animate-shake">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#556822] ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#EF8EB8] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EF8EB8]/30 focus:border-[#EF8EB8] transition-all shadow-sm"
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-medium text-[#556822]">Mot de passe</label>
                <Link href="/auth/forgot-password" size="sm" className="text-xs font-semibold text-[#556822] hover:text-[#3F4F18] transition-colors">
                  Oublié ?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#EF8EB8] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EF8EB8]/30 focus:border-[#EF8EB8] transition-all shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#EF8EB8] hover:bg-[#E10C69] disabled:bg-[#F5B9D1] text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#EF8EB8]/30 hover:shadow-[#E10C69]/30 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Se connecter'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-4 text-[#556822] font-medium">Ou continuer avec</span></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm font-medium text-slate-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          <p className="mt-10 text-center text-[#556822] text-sm">
            Nouveau sur CrunchyVita ?{' '}
            <Link href="/auth/register" className="font-bold text-[#556822] hover:text-[#3F4F18] underline-offset-4 hover:underline transition-all">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
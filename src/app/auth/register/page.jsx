'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Mail, Lock, User, ArrowRight, Leaf, Loader2, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user) {
      redirectBasedOnRole(user.role);
    }
  }, [isAuthenticated, user, router]);

  const redirectBasedOnRole = (role) => {
    if (role === 'ADMIN') router.push('/admin/dashboard');
    else if (role === 'CLIENT') router.push('/shop');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const result = await register(name, email, password);
      if (result.success) redirectBasedOnRole(result.user.role);
      else setError(result.error || 'Inscription échouée');
    } catch (err) {
      setError('Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authAPI.getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Colonne Gauche - Visuel (Identique au Login pour la cohérence) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-emerald-900/90 z-10" />
          <img 
            src="/assets/images/pic2.jpg" 
            alt="Organic Food"
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="relative z-20 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <Leaf className="text-emerald-400 h-8 w-8" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Crunchy Vita</span>
          </div>
          <h2 className="text-5xl font-bold text-white leading-tight mb-6">
            Changez de snack, <br /> 
            <span className="text-emerald-400">  changez d'énergie.</span>
          </h2>
          <p className="text-emerald-100/80 text-lg leading-relaxed">
            Créez un compte gratuitement et accédez à une sélection exclusive de produits 100% naturels et bio.
          </p>
        </div>
        
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Colonne Droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="mb-8 lg:hidden flex flex-col items-center">
             <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
               <Leaf className="text-white h-6 w-6" />
             </div>
             <h1 className="text-2xl font-bold text-slate-900">Crunchy Vita</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Créer un compte</h2>
            <p className="text-slate-500 mt-2">
              Rejoignez notre communauté de passionnés du bio.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-800 text-sm animate-shake">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {/* Nom Complet */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Nom complet</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                  placeholder="nom@exemple.com"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Mot de passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
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

            {/* Confirmer mot de passe */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">Confirmer le mot de passe</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
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
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 active:scale-[0.98] mt-4"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "S'inscrire"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-4 text-slate-500 font-medium">Ou continuer avec</span></div>
            </div>

            <button
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

          <p className="mt-8 text-center text-slate-500 text-sm">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="font-bold text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline transition-all">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
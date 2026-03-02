'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { Mail, ArrowLeft, Leaf, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setMessage('Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFEF0] flex flex-col items-center justify-center p-6">
      {/* Logo Central */}
      <div className="mb-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-[#EF8EB8] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#EF8EB8]/60">
          <img src="/assets/images/logo_white.png" alt="Crunchy Vita Logo" className="h-16 w-16" />
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Mot de passe oublié ?</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Pas d'inquiétude, cela arrive. Entrez votre email pour recevoir un lien de récupération.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerte Erreur */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-800 text-sm animate-shake">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Alerte Succès */}
          {message && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              {message}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#EF8EB8] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EF8EB8]/20 focus:border-[#EF8EB8] focus:bg-white transition-all shadow-sm"
                placeholder="nom@exemple.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#EF8EB8] hover:bg-[#E10C69] disabled:bg-[#F5B9D1] text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-[#EF8EB8]/30 hover:shadow-[#E10C69]/30 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Envoyer le lien'}
          </button>

          <div className="pt-2 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#EF8EB8] hover:text-[#E10C69] transition-colors"
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>

      <p className="mt-8 text-center text-slate-500 text-sm">
        Nouveau ici ?{' '}
        <Link href="/auth/register" className="font-bold text-[#EF8EB8] hover:text-[#E10C69] underline-offset-4 hover:underline transition-all">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import usePasswordReset from '@/hooks/usePasswordReset';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Leaf, Loader2, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resetToken = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const { loading, error, success, resetPassword } = usePasswordReset();

  useEffect(() => {
    if (!resetToken) {
      console.error('No reset token provided');
    }
  }, [resetToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken) return;

    const isSuccess = await resetPassword(resetToken, password, passwordConfirm);

    if (isSuccess) {
      setTimeout(() => {
        router.push('/auth/login');
      }, 2500);
    }
  };

  // État si le token est manquant
  if (!resetToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500 h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Lien invalide</h2>
          <p className="text-slate-500 mb-8 text-sm">
            Ce lien de réinitialisation est manquant ou a expiré. Veuillez demander un nouveau lien.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md"
          >
            <ArrowLeft size={18} />
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
          <img src="/assets/images/logo_white.png" alt="Crunchy Vita Logo" className="h-16 w-16" />
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Choisissez un mot de passe robuste pour protéger votre compte.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Alerte Erreur */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-800 text-sm animate-shake">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Alerte Succès */}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800 text-sm animate-in fade-in zoom-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-semibold">Succès !</p>
                <p className="text-xs opacity-90">Votre mot de passe a été modifié. Redirection...</p>
              </div>
            </div>
          )}

          {/* Nouveau Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Nouveau mot de passe</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || success}
                className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmation Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">Confirmer le mot de passe</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={loading || success}
                className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Info Box Requirements */}
          <div className="flex gap-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-800">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div className="text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider">Sécurité :</p>
              <ul className="list-disc list-inside opacity-80">
                <li>Minimum 6 caractères</li>
                <li>Doit être identique à la confirmation</li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-200 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Réinitialiser le mot de passe'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link 
            href="/auth/login" 
            className="text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
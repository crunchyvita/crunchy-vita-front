'use client';

import { ShieldAlert, ArrowLeft, LifeBuoy } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

export default function AccountDeactivatedPage() {
  const t = useTranslations('Auth.deactivated');

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(85,104,34,0.16),transparent_38%),radial-gradient(circle_at_80%_85%,rgba(239,142,184,0.2),transparent_42%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
        <section className="w-full rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl backdrop-blur-sm sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t('title')}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-slate-600 sm:text-base">
            {t('description')}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/contact#contact-section"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LifeBuoy className="h-4 w-4" />
              {t('contactSupport')}
            </Link>

            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#556822] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#46541c]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToLogin')}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

// Opt-out needs an explicit click: some mail security scanners open every link in an email,
// which would otherwise unsubscribe people without their knowledge.
export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const e = searchParams.get('e');
  const t = searchParams.get('t');
  const [state, setState] = useState(e && t ? 'idle' : 'invalid');

  const confirm = async () => {
    setState('loading');
    try {
      const res = await fetch(`${API_URL}/unsubscribe?e=${encodeURIComponent(e)}&t=${encodeURIComponent(t)}`, {
        method: 'POST',
      });
      setState(res.ok ? 'done' : res.status === 400 ? 'invalid' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-black text-[#556822] mb-6 font-[agrandir]">Désinscription</h1>

      {state === 'idle' || state === 'loading' ? (
        <>
          <p className="text-gray-700 mb-8">
            Vous ne recevrez plus nos e-mails de demande d’avis ni nos rappels de commande. Les
            e-mails liés à vos commandes (confirmation, livraison) continueront de vous parvenir.
          </p>
          <button
            type="button"
            onClick={confirm}
            disabled={state === 'loading'}
            className="rounded-full bg-[#E10C69] px-8 py-4 font-black uppercase tracking-widest text-white text-sm disabled:opacity-60"
          >
            {state === 'loading' ? 'Un instant…' : 'Confirmer la désinscription'}
          </button>
        </>
      ) : null}

      {state === 'done' && (
        <p className="text-gray-700">
          C’est noté : vous ne recevrez plus ces e-mails. Vous restez bien sûr le ou la bienvenue
          sur <Link href="/shop" className="text-[#E10C69] font-bold underline">notre boutique</Link>.
        </p>
      )}
      {state === 'invalid' && (
        <p className="text-gray-700">
          Ce lien de désinscription n’est pas valide. Utilisez le lien présent en bas de l’un de nos
          e-mails, ou écrivez-nous à contact@crunchyvita.com.
        </p>
      )}
      {state === 'error' && (
        <p className="text-gray-700">
          Une erreur est survenue. Réessayez dans quelques instants, ou écrivez-nous à
          contact@crunchyvita.com.
        </p>
      )}
    </div>
  );
}

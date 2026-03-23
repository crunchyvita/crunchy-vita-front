'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminHeader from '@/components/admin/header';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { stockAPI } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

function MovementRow({ m }) {
  const order = m.orderId;
  const populated = order && typeof order === 'object' && order._id;
  const linkId = populated ? order._id : order || null;
  const label = populated ? order.invoiceNumber || String(order._id).slice(-8) : linkId ? 'Commande' : null;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/80">
      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
        {m.date ? new Date(m.date).toLocaleString('fr-FR') : '—'}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold ${
            m.type === 'OUT'
              ? 'bg-red-50 text-red-700'
              : m.type === 'IN'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-700'
          }`}
        >
          {m.type}
        </span>
      </td>
      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{m.quantity}</td>
      <td className="px-4 py-3 text-slate-600">
        {linkId ? (
          <Link href={`/admin/orders?order=${linkId}`} className="text-[#556822] font-medium hover:underline">
            #{label}
          </Link>
        ) : (
          '—'
        )}
      </td>
    </tr>
  );
}

function StockMovementInner() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const MOVEMENTS_PER_PAGE = 8;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await stockAPI.getMovements(id);
        if (res?.success) setData(res.data);
        else setError(res?.message || 'Erreur');
      } catch (e) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  const movements = useMemo(
    () =>
      [...(data?.movements || [])].sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      ),
    [data?.movements]
  );

  const totalPages = Math.max(1, Math.ceil(movements.length / MOVEMENTS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * MOVEMENTS_PER_PAGE;
  const paginatedMovements = movements.slice(startIndex, startIndex + MOVEMENTS_PER_PAGE);
  const startDisplay = movements.length === 0 ? 0 : startIndex + 1;
  const endDisplay = movements.length === 0 ? 0 : Math.min(startIndex + MOVEMENTS_PER_PAGE, movements.length);

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
        <Link
          href="/admin/stock"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#556822]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au stock
        </Link>

        {loading && <p className="text-slate-500">Chargement…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && data && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Mouvements de stock</h1>
              <p className="text-slate-600 mt-1">{data.productName}</p>
              <p className="text-sm text-slate-500 mt-2">
                Stock actuel :{' '}
                <span className="font-semibold text-slate-800">{data.currentQuantity}</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Quantité</th>
                    <th className="px-4 py-3 text-left font-medium">Commande</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                        Aucun mouvement enregistré
                      </td>
                    </tr>
                  ) : (
                    paginatedMovements.map((m, i) => <MovementRow key={`${m._id || m.date || i}-${i}`} m={m} />)
                  )}
                </tbody>
              </table>
            </div>

            {movements.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
                <p>
                  Affichage de {startDisplay} à {endDisplay} sur {movements.length} mouvements
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function StockMovementPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <StockMovementInner />
    </ProtectedRoute>
  );
}

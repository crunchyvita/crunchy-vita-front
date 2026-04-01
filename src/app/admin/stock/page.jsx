"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import { stockAPI } from "@/lib/api";
import AdminHeader from "@/components/admin/header";
import { Search, Edit2, AlertCircle, Package, AlertTriangle, CheckCircle2, MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";

export default function StockPage() {
  const ts = useTranslations("admin.stock");
  const tcom = useTranslations("admin.common");
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        setLoading(true);
        const res = await stockAPI.list();
        setStocks(res.data || []);
      } catch (err) {
        setError(err.message || ts("loadError"));
      } finally {
        setLoading(false);
      }
    };
    loadStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    return stocks.filter((s) =>
      (s.productName || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [stocks, search]);

  const stats = useMemo(() => ({
    total: stocks.length,
    low: stocks.filter(s => s.isLowStock && s.quantity > 0).length,
    out: stocks.filter(s => s.quantity <= 0).length
  }), [stocks]);

  return (
    <>
    <AdminHeader />
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header Section - Matches Product Page Layout */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            {ts("title")}
            <span className="rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-700">
              {tcom("itemsCount", { count: stocks.length })}
            </span>
          </div>
          <p className="text-sm text-slate-500">{ts("subtitle")}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">{ts("totalProducts")}</p><p className="text-2xl font-bold text-slate-900">{stats.total}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">{ts("lowStock")}</p><p className="text-2xl font-bold text-slate-900">{stats.low}</p></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
          <div><p className="text-sm text-slate-500 font-medium">{ts("outOfStock")}</p><p className="text-2xl font-bold text-slate-900">{stats.out}</p></div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 max-w-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            placeholder={ts("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">{ts("loading")}</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-3 py-3 font-medium">{ts("productName")}</th>
                  <th className="px-3 py-3 font-medium text-center">{ts("availableQty")}</th>
                  <th className="px-3 py-3 font-medium text-center">{ts("reserved")}</th>
                  <th className="px-3 py-3 font-medium text-center">{ts("availableToSell")}</th>
                  <th className="px-3 py-3 font-medium text-center">{ts("threshold")}</th>
                  <th className="px-3 py-3 font-medium text-center">{tcom("status")}</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStocks.map((stock) => (
                  <tr key={stock._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-4 font-medium text-slate-900">
                      {stock.productName}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`font-mono font-semibold ${stock.quantity <= stock.alertThreshold ? 'text-red-600' : 'text-slate-700'}`}>
                        {stock.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center text-slate-500">{stock.reservedQuantity}</td>
                    <td className="px-3 py-4 text-center text-slate-500">{stock.available_to_sell}</td>
                    <td className="px-3 py-4 text-center text-slate-500">{stock.alertThreshold}</td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center">
                        {stock.quantity <= 0 ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {ts("statusOut")}
                          </span>
                        ) : stock.isLowStock ? (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertCircle className="h-3 w-3" /> {ts("statusLimited")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" /> {ts("statusIn")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === stock._id ? null : stock._id)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenu === stock._id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10 overflow-hidden">
                          <Link
                            href={`/admin/stock/edit/${stock.productId}`}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors w-full text-left"
                            onClick={() => setOpenMenu(null)}
                          >
                            <Edit2 className="h-4 w-4" />
                            {ts("editStock")}
                          </Link>
                          <Link
                            href={`/admin/stock/mouvment/${stock._id}`}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors w-full text-left border-t border-slate-100"
                            onClick={() => setOpenMenu(null)}
                          >
                            <AlertCircle className="h-4 w-4" />
                            {ts("viewHistory")}
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination Placeholder to match Product Page */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>{ts("showing", { count: filteredStocks.length })}</p>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50">{tcom("previous")}</button>
          <button className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50">{tcom("next")}</button>
        </div>
      </div>
    </div>
    </>
  );
}

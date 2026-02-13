"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/admin/header";
import { stockAPI } from "@/lib/api";
import { ArrowLeft, Info, AlertTriangle, CheckCircle2, TrendingUp, ShieldCheck, Plus, X, Loader2 } from "lucide-react";

export default function EditStockPage() {
  const { id: productId } = useParams();
  const [stock, setStock] = useState(null);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(0);

  const loadStock = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await stockAPI.getByProductId(productId);
      if (res && res.data) {
        setStock(res.data);
        setAlertThreshold(res.data.alertThreshold || 10);
      } else {
        setError("Stock data not available");
      }
    } catch (err) {
      // Extract error message safely
      let errorMessage = "Failed to load stock";
      if (err && typeof err === 'object') {
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      setError(errorMessage);
      console.error("Error loading stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) loadStock();
  }, [productId]);

  const availableQty = stock ? Math.max(0, stock.quantity - stock.reservedQuantity) : 0;

  const handleSaveAlert = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await stockAPI.update(productId, { alertThreshold });
      await loadStock();
      setMessage("Alert threshold updated successfully");
    } catch (err) {
      const errorMessage = err?.message || err?.error || "Failed to update alert threshold";
      setError(errorMessage);
      console.error("Error updating alert threshold:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuantity = async () => {
    if (quantityToAdd <= 0) {
      setError("Please enter a valid quantity");
      return;
    }
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await stockAPI.adjustQuantity(productId, quantityToAdd, "IN");
      await loadStock();
      setMessage(`Successfully added ${quantityToAdd} units to stock`);
      setShowModal(false);
      setQuantityToAdd(0);
    } catch (err) {
      const errorMessage = err?.message || err?.error || "Failed to add quantity";
      setError(errorMessage);
      console.error("Error adding quantity:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Loading stock data...</p>
      </div>
    );
  }

  if (!stock && !loading) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">Unable to load stock information. Please try again.</span>
        </div>
        <Link
          href="/admin/stock"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Inventory List
        </Link>
      </div>
    );
  }

  return (
    <>
      <AdminHeader />
      <div className="space-y-6 p-6 lg:p-8">
      {/* --- TOP NAVIGATION --- */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/stock"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Inventory List
          </Link>
          <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            {stock?.productName || "Loading..."}
            {stock && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  stock.isLowStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {stock.isLowStock ? "Limited Stock" : "In Stock"}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!stock}
          className="flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{backgroundColor: '#556622'}}
          onMouseEnter={(e) => !stock || (e.target.style.backgroundColor = '#3d4617')}
          onMouseLeave={(e) => !stock || (e.target.style.backgroundColor = '#556622')}
        >
          <Plus size={20} />
          Add Stock
        </button>
      </div>

      {/* Feedback messages */}
      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center gap-3">
          <CheckCircle2 size={20} />
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Stats Cards - Full Width */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Physical</p>
            <p className="text-3xl font-bold text-slate-900">{stock?.quantity || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Reserved Units</p>
            <p className="text-3xl font-bold text-slate-900">{stock?.reservedQuantity || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Available to Sell</p>
            <p className="text-3xl font-bold text-emerald-600">{availableQty}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Box - Larger */}
        <div className="lg:col-span-2">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4">
            <div className="h-12 w-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-base mb-2">Inventory Logic</h4>
              <p className="text-blue-700/80 text-sm leading-relaxed">
                Reserved units are items currently held in pending orders. They are deducted from your total to
                calculate the <strong>Available to Sell</strong> amount. This ensures you don't oversell products.
              </p>
            </div>
          </div>
        </div>

        {/* Alert Threshold Form - Larger */}
        <div>
          <form onSubmit={handleSaveAlert} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 h-full">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-slate-400" size={24} />
              <h3 className="font-bold text-slate-800 text-lg">Alert Settings</h3>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Alert Threshold</label>
              <input
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Math.max(0, Number(e.target.value)))}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xl font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                min="0"
              />
              <p className="text-xs text-slate-500">
                Get notified when stock drops below {alertThreshold} units
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full text-white py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 shadow-sm"
              style={{backgroundColor: '#556622'}}
              onMouseEnter={(e) => !saving && (e.target.style.backgroundColor = '#3d4617')}
              onMouseLeave={(e) => !saving && (e.target.style.backgroundColor = '#556622')}
            >
              {saving ? "Updating..." : "Save Alert Threshold"}
            </button>
          </form>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add Stock</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Quantity to Add</label>
                <input
                  type="number"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, Number(e.target.value)))}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xl font-bold text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  min="1"
                  placeholder="Enter quantity"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-500">
                This will add {quantityToAdd} units to the current stock of {stock?.quantity || 0}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-lg font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuantity}
                disabled={saving || quantityToAdd <= 0}
                className="flex-1 text-white py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{backgroundColor: '#556622'}}
                onMouseEnter={(e) => (saving || quantityToAdd <= 0) || (e.target.style.backgroundColor = '#3d4617')}
                onMouseLeave={(e) => (saving || quantityToAdd <= 0) || (e.target.style.backgroundColor = '#556622')}
              >
                {saving ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
}

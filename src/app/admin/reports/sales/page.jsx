'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { DollarSign, ShoppingCart, Package, CreditCard, Download, Search, RefreshCw } from 'lucide-react';
import AdminHeader from '@/components/admin/header';
import { categoryAPI, reportAPI } from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const cardClass = 'rounded-2xl border border-[#556822]/20 bg-white p-4 shadow-sm';

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));

const formatDateInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const changeClass = (value) => (Number(value || 0) >= 0 ? 'text-[#556822]' : 'text-[#E10C69]');

function KpiCard({ icon: Icon, title, value, changePct }) {
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
          <p className={`mt-2 text-xs font-semibold ${changeClass(changePct)}`}>
            {Number(changePct || 0) >= 0 ? '+' : ''}
            {Number(changePct || 0).toFixed(1)}% vs last month
          </p>
        </div>
        <div className="rounded-xl bg-[#556822]/10 p-2 text-[#556822]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function SalesReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [quickRange, setQuickRange] = useState('last30');

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    categoryId: 'all',
    paymentMethod: 'all',
    granularity: 'daily',
  });

  const [sales, setSales] = useState({ points: [], summary: {} });
  const [products, setProducts] = useState({ rows: [], summary: {} });
  const [orders, setOrders] = useState({ rows: [], summary: {} });
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    if (quickRange === 'custom') return;

    const today = new Date();
    const from = new Date(today);
    from.setHours(0, 0, 0, 0);

    if (quickRange === 'last7') {
      from.setDate(today.getDate() - 6);
    } else {
      from.setDate(today.getDate() - 29);
    }

    setFilters((prev) => ({
      ...prev,
      from: formatDateInput(from),
      to: formatDateInput(today),
    }));
  }, [quickRange]);

  const queryFilters = useMemo(
    () => ({
      from: filters.from || undefined,
      to: filters.to || undefined,
      categoryId: filters.categoryId !== 'all' ? filters.categoryId : undefined,
      paymentMethod: filters.paymentMethod !== 'all' ? filters.paymentMethod : undefined,
      granularity: filters.granularity,
    }),
    [filters]
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoryAPI.list();
        const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setCategories(list);
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [overviewRes, salesRes, productsRes, ordersRes] = await Promise.all([
          reportAPI.getOverview(),
          reportAPI.getSales(queryFilters),
          reportAPI.getProducts({ ...queryFilters, page: 1, pageSize: 100, search: search || undefined }),
          reportAPI.getOrders({ ...queryFilters, status: 'all', page: 1, pageSize: 20, search: search || undefined }),
        ]);

        setOverview(overviewRes?.data || null);
        setSales(salesRes?.data || { points: [], summary: {} });
        setProducts(productsRes?.data || { rows: [], summary: {} });
        setOrders(ordersRes?.data || { rows: [], summary: {} });
      } catch (err) {
        setError(err?.message || 'Failed to load sales report');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [queryFilters, search]);

  const handleFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const kpis = useMemo(() => {
    const monthlyChange = Number(overview?.sales?.monthly?.changePct ?? 12);
    const totalRevenue = Number(sales?.summary?.totalRevenue || 0);
    const totalOrders = Number(sales?.summary?.totalOrders || 0);
    const productsSold = (products?.rows || []).reduce((sum, row) => sum + Number(row?.salesCount || 0), 0);
    const avgOrderValue = Number(orders?.summary?.avgOrderValue || 0);

    return {
      monthlyChange,
      totalRevenue,
      totalOrders,
      productsSold,
      avgOrderValue,
    };
  }, [overview, sales, products, orders]);

  const salesLineData = useMemo(
    () => ({
      labels: (sales?.points || []).map((p) => p.label),
      datasets: [
        {
          label: 'Revenue',
          data: (sales?.points || []).map((p) => Number(p.revenue || 0)),
          borderColor: '#556822',
          backgroundColor: 'rgba(85, 104, 34, 0.18)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [sales]
  );

  const revenueVsOrdersData = useMemo(
    () => ({
      labels: (sales?.points || []).map((p) => p.label),
      datasets: [
        {
          label: 'Revenue',
          data: (sales?.points || []).map((p) => Number(p.revenue || 0)),
          backgroundColor: 'rgba(85, 104, 34, 0.85)',
          yAxisID: 'y',
        },
        {
          label: 'Orders',
          data: (sales?.points || []).map((p) => Number(p.orders || 0)),
          backgroundColor: 'rgba(225, 12, 105, 0.8)',
          yAxisID: 'y1',
        },
      ],
    }),
    [sales]
  );

  const revenueVsOrdersOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
        y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } },
      },
    }),
    []
  );

  const productsFlowData = useMemo(() => {
    const rows = Array.isArray(products?.rows) ? products.rows : [];
    const topRows = rows
      .filter((row) => Number(row?.salesCount || 0) > 0)
      .sort((a, b) => Number(b?.salesCount || 0) - Number(a?.salesCount || 0))
      .slice(0, 5);

    const remainingQty = rows
      .slice(5)
      .reduce((sum, row) => sum + Number(row?.salesCount || 0), 0);

    const labels = topRows.map((row) => row?.name || 'Product');
    const data = topRows.map((row) => Number(row?.salesCount || 0));

    if (remainingQty > 0) {
      labels.push('Others');
      data.push(remainingQty);
    }

    if (data.length === 0) {
      labels.push('No products sold');
      data.push(1);
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: ['#556822', '#E10C69', '#556822', '#E10C69', '#556822', '#E10C69'],
        },
      ],
    };
  }, [products]);

  const productsSummaryStats = useMemo(() => {
    const rows = Array.isArray(products?.rows) ? products.rows : [];
    const soldRows = rows.filter((row) => Number(row?.salesCount || 0) > 0);

    const totalSoldUnits = soldRows.reduce((sum, row) => sum + Number(row?.salesCount || 0), 0);
    const totalRevenue = soldRows.reduce((sum, row) => sum + Number(row?.revenue || 0), 0);
    const avgUnitRevenue = totalSoldUnits > 0 ? totalRevenue / totalSoldUnits : 0;

    return {
      avgUnitRevenue,
      totalSoldProducts: soldRows.length,
      totalRevenue,
    };
  }, [products]);

  const topProductInsight = useMemo(() => {
    const rows = Array.isArray(products?.rows) ? products.rows : [];
    if (!rows.length || !productsSummaryStats.totalRevenue) return 'No dominant product insight available yet.';

    const best = rows.reduce((prev, cur) => (Number(cur?.revenue || 0) > Number(prev?.revenue || 0) ? cur : prev), rows[0]);
    const share = (Number(best?.revenue || 0) / Math.max(1, Number(productsSummaryStats.totalRevenue || 0))) * 100;
    return `${best?.name || 'Top product'} generated ${share.toFixed(1)}% of total revenue.`;
  }, [products, productsSummaryStats.totalRevenue]);

  const orderStatusData = useMemo(() => {
    const flow = orders?.summary?.normalizedFlow || {
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    return {
      labels: ['Pending', 'Paid', 'Delivered', 'Cancelled'],
      datasets: [
        {
          data: [flow.pending, flow.paid, flow.delivered, flow.cancelled],
          backgroundColor: ['#556822', '#E10C69', '#556822', '#E10C69'],
        },
      ],
    };
  }, [orders]);

  const orderMetrics = useMemo(() => {
    const flow = orders?.summary?.normalizedFlow || {};
    const totalOrders = Number(orders?.summary?.totalOrders || 0);
    const cancelled = Number(flow.cancelled || 0);
    const cancellationRate = totalOrders > 0 ? (cancelled / totalOrders) * 100 : 0;

    return {
      totalCompletedOrders: Number(orders?.summary?.totalCompletedOrders || 0),
      cancellationRate,
    };
  }, [orders]);

  const downloadBlob = async (url, filename) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  };

  const handleExport = async (dataset, format = 'csv') => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const cleanBase = base.replace(/\/$/, '');
    const q = new URLSearchParams();
    q.set('dataset', dataset);
    q.set('format', format);
    if (queryFilters.from) q.set('from', queryFilters.from);
    if (queryFilters.to) q.set('to', queryFilters.to);
    if (queryFilters.categoryId) q.set('categoryId', queryFilters.categoryId);
    if (queryFilters.paymentMethod) q.set('paymentMethod', queryFilters.paymentMethod);
    if (search) q.set('search', search);

    const extension = format === 'xlsx' ? 'xlsx' : 'csv';
    await downloadBlob(`${cleanBase}/reports/admin/export?${q.toString()}`, `sales-report.${extension}`);
  };

  const handleExportPdf = async () => {
    const url = reportAPI.pdfUrl({
      reportType: 'sales',
      from: queryFilters.from,
      to: queryFilters.to,
      categoryId: queryFilters.categoryId,
      paymentMethod: queryFilters.paymentMethod,
      search: search || undefined,
    });
    await downloadBlob(url, 'sales-report.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <main className="space-y-6 px-4 pb-10 pt-6 md:px-8">
        <section className="rounded-2xl border border-[#556822]/20 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">Sales Report</h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#556822]/25 px-3 py-2 text-sm font-semibold text-[#556822]"
              >
                <RefreshCw className="h-4 w-4" /> Refresh
              </button>
              <button
                type="button"
                onClick={() => handleExport('sales', 'xlsx')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#556822]/25 px-3 py-2 text-sm font-semibold text-[#556822]"
              >
                <Download className="h-4 w-4" /> Export Excel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E10C69]/40 bg-[#E10C69] px-3 py-2 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" /> Export PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-7">
            <select
              value={quickRange}
              onChange={(e) => setQuickRange(e.target.value)}
              className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm"
            >
              <option value="last7">Last 7 days</option>
              <option value="last30">Last month</option>
              <option value="custom">Custom</option>
            </select>
            <input type="date" value={filters.from} onChange={(e) => handleFilter('from', e.target.value)} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm" />
            <input type="date" value={filters.to} onChange={(e) => handleFilter('to', e.target.value)} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm" />
            <select value={filters.categoryId} onChange={(e) => handleFilter('categoryId', e.target.value)} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm">
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select value={filters.paymentMethod} onChange={(e) => handleFilter('paymentMethod', e.target.value)} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm">
              <option value="all">All payments</option>
              <option value="stripe">Stripe</option>
              <option value="card">Card</option>
            </select>
            <select value={filters.granularity} onChange={(e) => handleFilter('granularity', e.target.value)} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full rounded-lg border border-[#556822]/25 py-2 pl-9 pr-3 text-sm" />
            </div>
          </div>
        </section>

        {error ? <div className="rounded-xl border border-[#E10C69]/20 bg-[#E10C69]/10 px-4 py-3 text-sm text-[#E10C69]">{error}</div> : null}
        {loading ? <div className={cardClass}>Loading sales report...</div> : null}

        {!loading ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard icon={DollarSign} title="Total Revenue" value={formatCurrency(kpis.totalRevenue)} changePct={kpis.monthlyChange} />
              <KpiCard icon={ShoppingCart} title="Total Orders" value={formatNumber(kpis.totalOrders)} changePct={kpis.monthlyChange} />
              <KpiCard icon={Package} title="Products Sold" value={formatNumber(kpis.productsSold)} changePct={kpis.monthlyChange} />
              <KpiCard icon={CreditCard} title="Average Order Value" value={formatCurrency(kpis.avgOrderValue)} changePct={kpis.monthlyChange} />
            </section>

            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-slate-800">Sales Trends</h2>
              <div className="h-72">
                <Line data={salesLineData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
              <div className="mt-3 text-sm text-slate-600">
                <p>Best sales day: {sales?.summary?.bestSalesDay?.day || 'N/A'} ({formatCurrency(sales?.summary?.bestSalesDay?.revenue || 0)})</p>
                <p>Peak hours: {(sales?.summary?.peakHours || []).map((h) => `${h.hour}:00`).join(', ') || 'N/A'}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className={cardClass}>
                <h2 className="mb-3 text-lg font-bold text-slate-800">Top Products by Sales</h2>
                <div className="h-72">
                  <Doughnut data={productsFlowData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>

              <div className={`${cardClass} xl:col-span-2`}>
                <h2 className="mb-3 text-lg font-bold text-slate-800">Product Details</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-[#556822]/20 text-left text-xs uppercase tracking-wider text-slate-500">
                        <th className="py-2">Product</th>
                        <th className="py-2">Quantity sold</th>
                        <th className="py-2">Revenue</th>
                        <th className="py-2">Stock</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(products?.rows || []).slice(0, 15).map((row) => (
                        <tr key={`${row.productId || row.name}`} className="border-b border-[#556822]/10">
                          <td className="py-2 font-medium text-slate-800">{row.name}</td>
                          <td className="py-2">{formatNumber(row.salesCount)}</td>
                          <td className="py-2">{formatCurrency(row.revenue)}</td>
                          <td className={`py-2 ${row.isLowStock ? 'text-[#E10C69]' : 'text-slate-700'}`}>{formatNumber(row.stockRemaining)}</td>
                          <td className="py-2">
                            {row.isTopSeller ? <span className="mr-2 rounded-full bg-[#556822]/10 px-2 py-1 text-xs font-semibold text-[#556822]">🔥 Best seller</span> : null}
                            {row.isLowStock ? <span className="rounded-full bg-[#E10C69]/10 px-2 py-1 text-xs font-semibold text-[#E10C69]">⚠️ Low stock</span> : null}
                            {Number(row.salesCount || 0) === 0 ? <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">❌ 0 sales</span> : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-slate-700">Products with 0 sales</p>
                  <p className="text-sm text-slate-600">
                    {(products?.summary?.unsoldProducts || []).map((p) => p.name).join(', ') || 'None'}
                  </p>
                </div>
              </div>
            </section>

           

       
          </>
        ) : null}
      </main>
    </div>
  );
}

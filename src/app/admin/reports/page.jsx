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
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Target,
  Download,
  Search,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
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

const pctTextClass = (pct) => (Number(pct || 0) >= 0 ? 'text-[#556822]' : 'text-rose-600');

function KpiCard({ title, value, change, icon: Icon }) {
  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
          {change !== undefined ? (
            <p className={`mt-2 text-xs font-semibold ${pctTextClass(change)}`}>
              {Number(change) >= 0 ? '↑' : '↓'} {Math.abs(Number(change || 0)).toFixed(1)}% vs last period
            </p>
          ) : null}
        </div>
        <div className="rounded-xl bg-[#556822]/10 p-2 text-[#556822]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    categoryId: 'all',
    paymentMethod: 'all',
    granularity: 'daily',
    status: 'all',
  });

  const [overview, setOverview] = useState(null);
  const [sales, setSales] = useState({ points: [], summary: {} });
  const [products, setProducts] = useState({ rows: [], summary: {} });
  const [customers, setCustomers] = useState({ growth: [], rows: [], summary: {} });
  const [orders, setOrders] = useState({ rows: [], summary: {} });
  const [promotions, setPromotions] = useState({});
  const [logistics, setLogistics] = useState({});
  const [inventory, setInventory] = useState({ rows: [], movementSummary: {} });

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
        const [
          overviewRes,
          salesRes,
          productsRes,
          customersRes,
          ordersRes,
          promotionsRes,
          logisticsRes,
          inventoryRes,
        ] = await Promise.all([
          reportAPI.getOverview(),
          reportAPI.getSales(queryFilters),
          reportAPI.getProducts({ ...queryFilters, page: 1, pageSize: 100, search: search || undefined }),
          reportAPI.getCustomers({ from: queryFilters.from, to: queryFilters.to, page: 1, pageSize: 50, search: search || undefined }),
          reportAPI.getOrders({ ...queryFilters, status: filters.status, page: 1, pageSize: 20, search: search || undefined }),
          reportAPI.getPromotions({ from: queryFilters.from, to: queryFilters.to }),
          reportAPI.getLogistics({ from: queryFilters.from, to: queryFilters.to }),
          reportAPI.getInventory({ from: queryFilters.from, to: queryFilters.to }),
        ]);

        setOverview(overviewRes?.data || null);
        setSales(salesRes?.data || { points: [], summary: {} });
        setProducts(productsRes?.data || { rows: [], summary: {} });
        setCustomers(customersRes?.data || { growth: [], rows: [], summary: {} });
        setOrders(ordersRes?.data || { rows: [], summary: {} });
        setPromotions(promotionsRes?.data || {});
        setLogistics(logisticsRes?.data || {});
        setInventory(inventoryRes?.data || { rows: [], movementSummary: {} });
      } catch (err) {
        setError(err?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [queryFilters, filters.status, search]);

  const handleFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

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
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
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

  const customerGrowthData = useMemo(
    () => ({
      labels: (customers?.growth || []).map((p) => p.label),
      datasets: [
        {
          label: 'New Customers',
          data: (customers?.growth || []).map((p) => Number(p.count || 0)),
          backgroundColor: '#556822',
          borderRadius: 6,
        },
      ],
    }),
    [customers]
  );

  const orderFlowData = useMemo(() => {
    const flow = orders?.summary?.normalizedFlow || {
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    return {
      labels: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
      datasets: [
        {
          data: [flow.pending, flow.paid, flow.shipped, flow.delivered, flow.cancelled],
          backgroundColor: ['#fef3c7', '#fcd34d', '#f59e0b', '#d97706', '#92400e'],
        },
      ],
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
    await downloadBlob(`${cleanBase}/reports/admin/export?${q.toString()}`, `${dataset}-report.${extension}`);
  };

  const handleExportPdf = async () => {
    const url = reportAPI.pdfUrl({
      from: queryFilters.from,
      to: queryFilters.to,
      categoryId: queryFilters.categoryId,
      paymentMethod: queryFilters.paymentMethod,
      status: filters.status !== 'all' ? filters.status : undefined,
      search: search || undefined,
    });
    await downloadBlob(url, 'analytics-summary.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <main className="space-y-6 px-4 pb-10 pt-6 md:px-8">
        <section className="rounded-2xl border border-[#556822]/20 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">Reports & Analytics</h1>
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
                onClick={() => handleExport('orders', 'xlsx')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#556822]/25 px-3 py-2 text-sm font-semibold text-[#556822]"
              >
                <Download className="h-4 w-4" /> Export Excel
              </button>
              <button
                type="button"
                onClick={() => downloadBlob(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')}/reports/admin/export/summary`, 'analytics-summary.txt')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#556822] px-3 py-2 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" /> Analytics Summary
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#f59e0b] px-3 py-2 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" /> Export PDF
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
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

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {loading ? <div className={cardClass}>Loading reports...</div> : null}

        {!loading ? (
          <>
            <section>
              <h2 className="mb-3 text-lg font-bold text-slate-800">1. Global Dashboard</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard title="Total Revenue" value={formatCurrency(overview?.sales?.monthly?.current)} change={overview?.sales?.monthly?.changePct} icon={DollarSign} />
                <KpiCard title="Total Orders" value={formatNumber(overview?.totalOrders)} icon={ShoppingCart} />
                <KpiCard title="Total Customers" value={formatNumber(overview?.totalCustomers)} icon={Users} />
                <KpiCard title="Products Sold" value={formatNumber(overview?.totalProductsSold)} icon={Package} />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className={cardClass}>
                <h2 className="mb-2 text-lg font-bold text-slate-800">2. Sales Analytics</h2>
                <div className="h-72"><Line data={salesLineData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                <div className="mt-3 text-sm text-slate-600">
                  <p>Best sales day: {sales?.summary?.bestSalesDay?.day || 'N/A'} ({formatCurrency(sales?.summary?.bestSalesDay?.revenue || 0)})</p>
                  <p>Peak hours: {(sales?.summary?.peakHours || []).map((h) => `${h.hour}:00`).join(', ') || 'N/A'}</p>
                </div>
              </div>
              <div className={cardClass}>
                <h3 className="mb-2 text-base font-bold text-slate-800">Revenue vs Orders</h3>
                <div className="h-72"><Bar data={revenueVsOrdersData} options={revenueVsOrdersOptions} /></div>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-slate-800">3. Product Performance</h2>
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
                        <td className={`py-2 ${row.isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>{formatNumber(row.stockRemaining)}</td>
                        <td className="py-2">
                          {row.isTopSeller ? <span className="mr-2 rounded-full bg-[#556822]/10 px-2 py-1 text-xs font-semibold text-[#556822]">🔥 Best seller</span> : null}
                          {row.isLowStock ? <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">⚠️ Low stock</span> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-700"> Unsold products</p>
                <p className="text-sm text-slate-600">{(products?.summary?.unsoldProducts || []).map((p) => p.name).join(', ') || 'None'}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className={cardClass}>
                <h2 className="mb-2 text-lg font-bold text-slate-800">4. Customer Insights</h2>
                <div className="h-64"><Bar data={customerGrowthData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                <div className="mt-3 text-sm text-slate-700">
                  <p>Average basket value: {formatCurrency(customers?.summary?.averageBasketValue || 0)}</p>
                  <p>Frequent buyers: {formatNumber(customers?.summary?.behavior?.frequentBuyers || 0)}</p>
                  <p>One-time buyers: {formatNumber(customers?.summary?.behavior?.oneTimeBuyers || 0)}</p>
                </div>
              </div>
              <div className={cardClass}>
                <h3 className="mb-2 text-base font-bold text-slate-800">Top customers</h3>
                <div className="space-y-2">
                  {(customers?.summary?.topCustomers || []).slice(0, 8).map((c) => (
                    <div key={c.customerId} className="rounded-lg border border-[#556822]/20 px-3 py-2 text-sm">
                      <p className="font-semibold text-slate-800">{c.name}</p>
                      <p className="text-slate-500">{c.email}</p>
                      <p className="text-[#556822]">{c.ordersCount} orders - {formatCurrency(c.totalSpent)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-slate-800">5. Orders Management</h2>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="h-72"><Doughnut data={orderFlowData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                <div className="space-y-2 text-sm text-slate-700">
                  <p>Average order value: <span className="font-semibold">{formatCurrency(orders?.summary?.avgOrderValue || 0)}</span></p>
                  <p>Total completed orders: <span className="font-semibold">{formatNumber(orders?.summary?.totalCompletedOrders || 0)}</span></p>
                  <p>Total order revenue: <span className="font-semibold">{formatCurrency(orders?.summary?.totalRevenue || 0)}</span></p>
                </div>
              </div>
            </section>

           

            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-slate-800">9. Export & Actions</h2>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleExport('sales')} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm font-semibold text-[#556822]">Export Sales</button>
                <button onClick={() => handleExport('products')} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm font-semibold text-[#556822]">Export Products</button>
                <button onClick={() => handleExport('customers')} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm font-semibold text-[#556822]">Export Customers</button>
                <button onClick={() => handleExport('orders')} className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm font-semibold text-[#556822]">Export Orders</button>
                <button onClick={handleExportPdf} className="rounded-lg border border-[#f59e0b]/40 bg-[#f59e0b] px-3 py-2 text-sm font-semibold text-white">Export PDF</button>
              </div>
            </section>

           
          </>
        ) : null}
      </main>
    </div>
  );
}

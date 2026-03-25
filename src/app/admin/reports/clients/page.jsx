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
import { Bar } from 'react-chartjs-2';
import { Users, UserPlus, Wallet, Repeat, Download, Search, RefreshCw } from 'lucide-react';
import AdminHeader from '@/components/admin/header';
import { reportAPI } from '@/lib/api';

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

const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US');
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

export default function ClientsReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [quickRange, setQuickRange] = useState('last30');

  const [filters, setFilters] = useState({
    from: '',
    to: '',
  });

  const [customers, setCustomers] = useState({ growth: [], rows: [], summary: {} });
  const [products, setProducts] = useState({ rows: [], summary: {} });
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
    }),
    [filters]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [overviewRes, customersRes, productsRes] = await Promise.all([
          reportAPI.getOverview(),
          reportAPI.getCustomers({
            from: queryFilters.from,
            to: queryFilters.to,
            page: 1,
            pageSize: 100,
            search: search || undefined,
          }),
          reportAPI.getProducts({ from: queryFilters.from, to: queryFilters.to, page: 1, pageSize: 20 }),
        ]);

        setOverview(overviewRes?.data || null);
        setCustomers(customersRes?.data || { growth: [], rows: [], summary: {} });
        setProducts(productsRes?.data || { rows: [], summary: {} });
      } catch (err) {
        setError(err?.message || 'Failed to load clients report');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [queryFilters, search]);

  const handleFilter = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const topCustomersBarData = useMemo(() => {
    const rows = Array.isArray(customers?.rows) ? customers.rows : [];
    const topFive = [...rows]
      .sort((a, b) => Number(b?.totalSpent || 0) - Number(a?.totalSpent || 0))
      .slice(0, 5);

    return {
      labels: topFive.map((customer) => customer?.name || 'Customer'),
      datasets: [
        {
          label: 'Total Spent (EUR)',
          data: topFive.map((customer) => Number(customer?.totalSpent || 0)),
          backgroundColor: ['#556822', '#E10C69', '#556822', '#E10C69', '#556822'],
          borderRadius: 8,
        },
      ],
    };
  }, [customers]);

  const kpis = useMemo(() => {
    const rows = Array.isArray(customers?.rows) ? customers.rows : [];
    const totalCustomers = Number(customers?.summary?.totalCustomers || 0);
    const thisMonthNewCustomers = Number(customers?.growth?.[customers.growth.length - 1]?.count || 0);
    const averageSpending = rows.length
      ? rows.reduce((sum, row) => sum + Number(row?.totalSpent || 0), 0) / rows.length
      : 0;

    const returningCustomers = rows.filter((row) => Number(row?.ordersCount || 0) > 1).length;
    const returningRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    const monthlyChange = Number(overview?.sales?.monthly?.changePct ?? 12);

    return {
      monthlyChange,
      totalCustomers,
      thisMonthNewCustomers,
      averageSpending,
      returningRate,
    };
  }, [customers, overview]);

  const behavior = useMemo(() => {
    const rows = Array.isArray(customers?.rows) ? customers.rows : [];
    const frequent = rows.filter((row) => Number(row?.ordersCount || 0) >= 3).length;
    const oneTime = rows.filter((row) => Number(row?.ordersCount || 0) === 1).length;
    const occasional = rows.filter((row) => Number(row?.ordersCount || 0) === 2).length;
    const totalOrders = rows.reduce((sum, row) => sum + Number(row?.ordersCount || 0), 0);
    const avgOrdersPerCustomer = rows.length ? totalOrders / rows.length : 0;

    return {
      frequent,
      occasional,
      oneTime,
      avgOrdersPerCustomer,
    };
  }, [customers]);

  const topCustomers = useMemo(() => {
    const rows = Array.isArray(customers?.rows) ? customers.rows : [];
    return [...rows].sort((a, b) => Number(b?.totalSpent || 0) - Number(a?.totalSpent || 0)).slice(0, 10);
  }, [customers]);

  const topProductsForCustomers = useMemo(() => {
    const rows = Array.isArray(products?.rows) ? products.rows : [];
    return rows
      .sort((a, b) => Number(b?.salesCount || 0) - Number(a?.salesCount || 0))
      .slice(0, 3)
      .map((row) => row?.name)
      .filter(Boolean);
  }, [products]);

  const smartInsights = useMemo(() => {
    const rows = Array.isArray(customers?.rows) ? customers.rows : [];
    const returning = rows.filter((row) => Number(row?.ordersCount || 0) > 1).length;
    const base = rows.length || 1;
    const returningPct = (returning / base) * 100;
    const topProductsText = topProductsForCustomers.length
      ? `Most customers buy ${topProductsForCustomers.join(', ')}.`
      : 'No product preference detected yet.';

    return [
      `${returningPct.toFixed(1)}% of active customers are returning users.`,
      topProductsText,
    ];
  }, [customers, topProductsForCustomers]);

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
    if (search) q.set('search', search);

    const extension = format === 'xlsx' ? 'xlsx' : 'csv';
    await downloadBlob(`${cleanBase}/reports/admin/export?${q.toString()}`, `clients-report.${extension}`);
  };

  const handleExportPdf = async () => {
    const url = reportAPI.pdfUrl({
      reportType: 'clients',
      from: queryFilters.from,
      to: queryFilters.to,
      search: search || undefined,
    });
    await downloadBlob(url, 'clients-report.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader />
      <main className="space-y-6 px-4 pb-10 pt-6 md:px-8">
        <section className="rounded-2xl border border-[#556822]/20 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">Clients Report</h1>
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
                onClick={() => handleExport('customers', 'xlsx')}
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

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients" className="w-full rounded-lg border border-[#556822]/25 py-2 pl-9 pr-3 text-sm" />
            </div>
          </div>
        </section>

        {error ? <div className="rounded-xl border border-[#E10C69]/20 bg-[#E10C69]/10 px-4 py-3 text-sm text-[#E10C69]">{error}</div> : null}
        {loading ? <div className={cardClass}>Loading clients report...</div> : null}

        {!loading ? (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard icon={Users} title="Total Customers" value={formatNumber(kpis.totalCustomers)} changePct={kpis.monthlyChange} />
              <KpiCard icon={UserPlus} title="New Customers" value={formatNumber(kpis.thisMonthNewCustomers)} changePct={kpis.monthlyChange} />
              <KpiCard icon={Wallet} title="Average Spending / Customer" value={formatCurrency(kpis.averageSpending)} changePct={kpis.monthlyChange} />
              <KpiCard icon={Repeat} title="Returning Customers" value={`${kpis.returningRate.toFixed(1)}%`} changePct={kpis.monthlyChange} />
            </section>

            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-slate-800">Customer Growth</h2>
              <div className="h-72">
                <Bar data={topCustomersBarData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-slate-800">Top Customers</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-[#556822]/20 text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="py-2">Name / Email</th>
                      <th className="py-2">Orders</th>
                      <th className="py-2">Total Spent</th>
                      <th className="py-2">Last Purchase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer) => (
                      <tr key={customer.customerId} className="border-b border-[#556822]/10">
                        <td className="py-2">
                          <p className="font-semibold text-slate-800">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.email || 'N/A'}</p>
                        </td>
                        <td className="py-2">{formatNumber(customer.ordersCount)}</td>
                        <td className="py-2">{formatCurrency(customer.totalSpent)}</td>
                        <td className="py-2">{formatDate(customer.lastPurchaseAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          

           

          </>
        ) : null}
      </main>
    </div>
  );
}

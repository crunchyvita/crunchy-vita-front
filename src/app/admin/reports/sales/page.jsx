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
import { Line, Doughnut } from 'react-chartjs-2';
import { Download, RefreshCw } from 'lucide-react';
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

const formatStockValue = (row) => {
  const stock = Number(row?.stockRemaining || 0);
  const isPackageProduct = /package/i.test(String(row?.name || ''));
  if (isPackageProduct && stock === 0) return '-';
  return formatNumber(stock);
};

const formatDateInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const changeClass = (value) => (Number(value || 0) >= 0 ? 'text-[#556822]' : 'text-[#EA580C]');

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
  const [quickRange, setQuickRange] = useState('week');

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    granularity: 'daily',
  });

  const [sales, setSales] = useState({ points: [], summary: {} });
  const [products, setProducts] = useState({ rows: [], summary: {} });
  const [orders, setOrders] = useState({ rows: [], summary: {} });
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today);
    const to = new Date(today);

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    let granularity = 'daily';

    if (quickRange === 'day') {
      granularity = 'hourly';
    } else if (quickRange === 'week') {
      granularity = 'daily';
      const day = from.getDay();
      const daysSinceMonday = (day + 6) % 7;
      from.setDate(from.getDate() - daysSinceMonday);
    } else if (quickRange === 'month') {
      granularity = 'weekly';
      from.setDate(1);
    } else {
      granularity = 'monthly';
      from.setMonth(0, 1);
    }

    setFilters((prev) => ({
      ...prev,
      from: formatDateInput(from),
      to: formatDateInput(to),
      granularity,
    }));
  }, [quickRange]);

  const queryFilters = useMemo(
    () => ({
      from: filters.from || undefined,
      to: filters.to || undefined,
      granularity: filters.granularity,
    }),
    [filters]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [overviewRes, salesRes, productsRes, ordersRes] = await Promise.all([
          reportAPI.getOverview(),
          reportAPI.getSales(queryFilters),
          reportAPI.getProducts({ ...queryFilters, page: 1, pageSize: 100 }),
          reportAPI.getOrders({ ...queryFilters, status: 'all', page: 1, pageSize: 20 }),
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
  }, [queryFilters]);

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

  const trendSeries = useMemo(() => {
    const points = Array.isArray(sales?.points) ? sales.points : [];

    if (quickRange === 'day') {
      const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
      const map = new Map(points.map((p) => [String(p.label || '').slice(-5), Number(p.revenue || 0)]));
      return {
        labels,
        data: labels.map((label) => map.get(label) || 0),
      };
    }

    if (quickRange === 'week') {
      const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const totals = Array(7).fill(0);

      points.forEach((p) => {
        const date = new Date(p.label);
        if (Number.isNaN(date.getTime())) return;
        const mondayFirstIndex = (date.getDay() + 6) % 7;
        totals[mondayFirstIndex] += Number(p.revenue || 0);
      });

      return { labels, data: totals };
    }

    if (quickRange === 'month') {
      return {
        labels: points.map((_, idx) => `Week ${idx + 1}`),
        data: points.map((p) => Number(p.revenue || 0)),
      };
    }

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totals = Array(12).fill(0);

    points.forEach((p) => {
      const parts = String(p.label || '').split('-');
      const monthIndex = Number(parts[1]) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        totals[monthIndex] += Number(p.revenue || 0);
      }
    });

    return {
      labels: monthLabels,
      data: totals,
    };
  }, [sales, quickRange]);

  const salesLineData = useMemo(
    () => ({
      labels: trendSeries.labels,
      datasets: [
        {
          label: 'Revenue',
          data: trendSeries.data,
          borderColor: '#556822',
          backgroundColor: 'rgba(85, 104, 34, 0.18)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [trendSeries]
  );

  const salesLineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
    }),
    []
  );

  const productsFlowData = useMemo(() => {
    const rows = Array.isArray(products?.rows) ? products.rows : [];
    const sortedRows = rows
      .filter((row) => Number(row?.salesCount || 0) > 0)
      .sort((a, b) => Number(b?.salesCount || 0) - Number(a?.salesCount || 0));

    const topRows = sortedRows.slice(0, 3);

    const remainingQty = sortedRows
      .slice(3)
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
          backgroundColor: ['#F8C27A', '#F29A3E', '#EE7A00', '#E05F00'],
        },
      ],
    };
  }, [products]);

  const productsDoughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '0%',
      elements: {
        arc: {
          borderWidth: 0,
          borderColor: 'transparent',
        },
      },
    }),
    []
  );

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

    const extension = format === 'xlsx' ? 'xlsx' : 'csv';
    await downloadBlob(`${cleanBase}/reports/admin/export?${q.toString()}`, `sales-report.${extension}`);
  };

  const handleExportPdf = async () => {
    const url = reportAPI.pdfUrl({
      reportType: 'sales',
      from: queryFilters.from,
      to: queryFilters.to,
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
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={quickRange}
                onChange={(e) => setQuickRange(e.target.value)}
                className="rounded-lg border border-[#556822]/25 px-3 py-2 text-sm"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
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
                className="inline-flex items-center gap-2 rounded-xl border border-[#EA580C]/40 bg-[#EA580C] px-3 py-2 text-sm font-semibold text-white"
              >
                <Download className="h-4 w-4" /> Export PDF
              </button>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-xl border border-[#EA580C]/20 bg-[#EA580C]/10 px-4 py-3 text-sm text-[#EA580C]">{error}</div> : null}
        {loading ? <div className={cardClass}>Loading sales report...</div> : null}

        {!loading ? (
          <>
           

            <section className={cardClass}>
              <h2 className="mb-3 text-lg font-bold text-slate-800">Sales Trends</h2>
              <div className="h-72">
                <Line data={salesLineData} options={salesLineOptions} />
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
                  <Doughnut data={productsFlowData} options={productsDoughnutOptions} />
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
                       
                      </tr>
                    </thead>
                    <tbody>
                      {(products?.rows || []).slice(0, 15).map((row) => (
                        <tr key={`${row.productId || row.name}`} className="border-b border-[#556822]/10">
                          <td className="py-2 font-medium text-slate-800">{row.name}</td>
                          <td className="py-2">{formatNumber(row.salesCount)}</td>
                          <td className="py-2">{formatCurrency(row.revenue)}</td>
                          <td className={`py-2 ${row.isLowStock ? 'text-[#EA580C]' : 'text-slate-700'}`}>{formatStockValue(row)}</td>
                    
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

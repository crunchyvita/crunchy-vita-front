'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Download, RefreshCw } from 'lucide-react';
import AdminHeader from '@/components/admin/header';
import { DoughnutWithCenter } from '@/components/admin/DoughnutWithCenter';
import { reportAPI } from '@/lib/api';
import { formatDateInputLocal } from '@/lib/reportDateRange';
import { useLocale, useTranslations } from 'next-intl';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const cardClass = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm';

const DOUGHNUT_CUTOUT = '70%';
const CLIENTS_TABLE_PAGE = 6;
const skel = 'animate-pulse rounded-md bg-slate-200/80';

const emptyCustomers = {
  growth: [],
  rows: [],
  summary: {},
  stats: {
    promoUsage: {
      totalOrders: 0,
      withPromo: 0,
      withoutPromo: 0,
      promoUsageRatePct: 0,
    },
  },
  pagination: {},
};

function formatPiePercent(part, whole) {
  const w = Number(whole) || 0;
  if (w <= 0) return '0';
  return String(Math.round((Number(part) / w) * 100));
}

function ClientsReportSkeleton({ loadingLabel }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={loadingLabel}>
      <span className="sr-only">{loadingLabel}</span>
      <section className={cardClass}>
        <div className={`mb-4 h-8 w-full max-w-xs ${skel}`} />
        <div className={`h-4 w-full max-w-2xl ${skel}`} />
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {[0, 1].map((i) => (
          <section key={i} className={cardClass}>
            <div className="space-y-3">
              <div className={`h-7 w-40 ${skel}`} />
              <div className={`mx-auto h-56 w-full max-w-[280px] rounded-full ${skel}`} />
            </div>
          </section>
        ))}
      </div>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className={cardClass}>
            <div className={`mb-4 h-6 w-48 ${skel}`} />
            <div className={`h-72 w-full rounded-xl ${skel}`} />
          </div>
        ))}
      </section>
      <section className={cardClass}>
        <div className={`mb-4 h-6 w-40 ${skel}`} />
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex gap-4 border-b border-slate-100 py-3">
              <div className={`h-4 flex-[2] ${skel}`} />
              <div className={`h-4 w-12 ${skel}`} />
              <div className={`h-4 w-20 ${skel}`} />
              <div className={`h-4 w-24 ${skel}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ClientsReportPage() {
  const tcr = useTranslations('admin.clientReport');
  const locale = useLocale();
  const numberLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickRange, setQuickRange] = useState('week');

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    granularity: 'daily',
  });

  const [customers, setCustomers] = useState(emptyCustomers);
  const [tableVisibleCount, setTableVisibleCount] = useState(CLIENTS_TABLE_PAGE);

  const formatCurrency = (value) =>
    new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatNumber = (value) => new Intl.NumberFormat(numberLocale).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) return tcr('na');
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return tcr('na');
    return d.toLocaleDateString(numberLocale);
  };

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
      from: formatDateInputLocal(from),
      to: formatDateInputLocal(to),
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
        const customersRes = await reportAPI.getCustomers({
          ...queryFilters,
          page: 1,
          pageSize: 100,
        });
        setCustomers(customersRes?.data ? { ...emptyCustomers, ...customersRes.data } : emptyCustomers);
      } catch (err) {
        setError(err?.message || tcr('loadError'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [queryFilters, tcr]);

  useEffect(() => {
    setTableVisibleCount(CLIENTS_TABLE_PAGE);
  }, [queryFilters]);

  const retentionDoughnut = useMemo(() => {
    const returning = Number(customers?.stats?.returningClients ?? 0);
    const oneTime = Number(customers?.summary?.behavior?.oneTimeBuyers ?? 0);
    const total = returning + oneTime;
    if (total <= 0) {
      return { hasData: false, total: 0, data: { labels: [], datasets: [] } };
    }
    return {
      hasData: true,
      total,
      data: {
        labels: [tcr('pieRepeatClients'), tcr('pieOneTimeClients')],
        datasets: [
          {
            data: [returning, oneTime],
            backgroundColor: ['#EE7A00', '#F29A3E'],
          },
        ],
      },
    };
  }, [customers, tcr]);

  const retentionDoughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: DOUGHNUT_CUTOUT,
      layout: { padding: { top: 4, bottom: 2 } },
      plugins: {
        legend: {
          position: 'bottom',
          align: 'center',
          labels: {
            boxWidth: 12,
            padding: 18,
            font: { size: 12, weight: '500' },
            usePointStyle: true,
            pointStyle: 'rectRounded',
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = Number(ctx.raw) || 0;
              const ds = ctx.dataset.data;
              const sum = ds.reduce((a, b) => a + Number(b || 0), 0);
              const pct = formatPiePercent(val, sum);
              return `${ctx.label}: ${formatNumber(val)} (${pct}%)`;
            },
          },
        },
      },
      elements: { arc: { borderWidth: 0 } },
    }),
    [formatNumber]
  );

  const promoDoughnut = useMemo(() => {
    const pu = customers?.stats?.promoUsage;
    const withPromo = Number(pu?.withPromo ?? 0);
    const withoutPromo = Number(pu?.withoutPromo ?? 0);
    const total = Number(pu?.totalOrders ?? withPromo + withoutPromo);
    if (total <= 0) {
      return { hasData: false, total: 0, data: { labels: [], datasets: [] } };
    }
    return {
      hasData: true,
      total,
      data: {
        labels: [tcr('pieOrdersWithPromo'), tcr('pieOrdersWithoutPromo')],
        datasets: [
          {
            data: [withPromo, withoutPromo],
            backgroundColor: ['#556822', '#8B9A48'],
          },
        ],
      },
    };
  }, [customers, tcr]);

  const promoDoughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: DOUGHNUT_CUTOUT,
      layout: { padding: { top: 4, bottom: 2 } },
      plugins: {
        legend: {
          position: 'bottom',
          align: 'center',
          labels: {
            boxWidth: 12,
            padding: 18,
            font: { size: 12, weight: '500' },
            usePointStyle: true,
            pointStyle: 'rectRounded',
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = Number(ctx.raw) || 0;
              const ds = ctx.dataset.data;
              const sum = ds.reduce((a, b) => a + Number(b || 0), 0);
              const pct = formatPiePercent(val, sum);
              return `${ctx.label}: ${formatNumber(val)} (${pct}%)`;
            },
          },
        },
      },
      elements: { arc: { borderWidth: 0 } },
    }),
    [formatNumber]
  );

  const retentionDoughnutRevision = useMemo(
    () => JSON.stringify({ l: retentionDoughnut.data?.labels, d: retentionDoughnut.data?.datasets?.[0]?.data }),
    [retentionDoughnut.data?.labels, retentionDoughnut.data?.datasets?.[0]?.data]
  );

  const promoDoughnutRevision = useMemo(
    () => JSON.stringify({ l: promoDoughnut.data?.labels, d: promoDoughnut.data?.datasets?.[0]?.data }),
    [promoDoughnut.data?.labels, promoDoughnut.data?.datasets?.[0]?.data]
  );

  const horizontalBarOptionsMoney = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(15, 23, 42, 0.06)' },
          ticks: {
            precision: 0,
            callback: (value) =>
              new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(Number(value)),
          },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
    }),
    [formatCurrency, numberLocale]
  );

  const horizontalBarOptionsCount = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatNumber(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(15, 23, 42, 0.06)' },
          ticks: { precision: 0 },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
    }),
    [formatNumber]
  );

  const revenueBarData = useMemo(() => {
    const rows = Array.isArray(customers?.summary?.topByRevenue) ? customers.summary.topByRevenue : [];
    const rev = [...rows].reverse();
    return {
      labels: rev.map((r) => r.name || r.email || '—'),
      datasets: [
        {
          label: tcr('colTotalSpent'),
          data: rev.map((r) => Number(r.totalSpent || 0)),
          backgroundColor: 'rgba(85, 104, 34, 0.65)',
          borderRadius: 6,
          barThickness: 18,
        },
      ],
      hasData: rows.length > 0,
    };
  }, [customers, tcr]);

  const ordersBarData = useMemo(() => {
    const rows = Array.isArray(customers?.summary?.topByOrders) ? customers.summary.topByOrders : [];
    const rev = [...rows].reverse();
    return {
      labels: rev.map((r) => r.name || r.email || '—'),
      datasets: [
        {
          label: tcr('colOrders'),
          data: rev.map((r) => Number(r.ordersCount || 0)),
          backgroundColor: 'rgba(234, 88, 12, 0.7)',
          borderRadius: 6,
          barThickness: 18,
        },
      ],
      hasData: rows.length > 0,
    };
  }, [customers, tcr]);

  const topTableRowsSorted = useMemo(() => {
    const rows = Array.isArray(customers?.rows) ? customers.rows : [];
    return [...rows].sort((a, b) => Number(b?.totalSpent || 0) - Number(a?.totalSpent || 0));
  }, [customers]);

  const topTableRowsVisible = useMemo(
    () => topTableRowsSorted.slice(0, tableVisibleCount),
    [topTableRowsSorted, tableVisibleCount]
  );

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

    const ct = response.headers.get('content-type') || '';
    let blob;
    if (ct.includes('spreadsheetml') || url.includes('format=xlsx')) {
      const buf = await response.arrayBuffer();
      blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } else {
      blob = await response.blob();
    }
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  };

  const handleExport = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const cleanBase = base.replace(/\/$/, '');
    const q = new URLSearchParams();
    q.set('dataset', 'customers');
    q.set('format', 'xlsx');
    if (queryFilters.from) q.set('from', queryFilters.from);
    if (queryFilters.to) q.set('to', queryFilters.to);
    await downloadBlob(`${cleanBase}/reports/admin/export?${q.toString()}`, 'clients-report.xlsx');
  };

  const handleExportPdf = async () => {
    const url = reportAPI.pdfUrl({
      reportType: 'clients',
      from: queryFilters.from,
      to: queryFilters.to,
    });
    await downloadBlob(url, 'clients-report.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full font-sans text-slate-900">
      <AdminHeader />
      <main className="flex-1 w-full p-6 lg:p-8">
        <div className="w-full space-y-8">
          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{tcr('title')}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={quickRange}
                  onChange={(e) => setQuickRange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
                >
                  <option value="day">{tcr('rangeDay')}</option>
                  <option value="week">{tcr('rangeWeek')}</option>
                  <option value="month">{tcr('rangeMonth')}</option>
                  <option value="year">{tcr('rangeYear')}</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleExport()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  {tcr('exportExcel')}
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-[#556822] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                >
                  <Download className="h-4 w-4" />
                  {tcr('exportPdf')}
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          ) : null}
          {loading ? <ClientsReportSkeleton loadingLabel={tcr('loading')} /> : null}

          {!loading ? (
            <>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                <section className={cardClass}>
                  <h2 className="mb-6 text-xl font-bold text-slate-900">{tcr('retentionTitle')}</h2>
                  <div className="mx-auto w-full max-w-[280px] min-h-0">
                    {retentionDoughnut.hasData ? (
                      <DoughnutWithCenter
                        key={retentionDoughnutRevision}
                        chartData={retentionDoughnut.data}
                        options={retentionDoughnutOptions}
                        heightClass="h-56"
                        totalCaptionKey="doughnutTotalClients"
                        formatNumber={formatNumber}
                        tsr={tcr}
                        dataRevision={retentionDoughnutRevision}
                      />
                    ) : (
                      <p className="flex h-56 items-center justify-center text-sm text-slate-400">
                        {tcr('noChartData')}
                      </p>
                    )}
                  </div>
                </section>
                <section className={cardClass}>
                  <h2 className="mb-6 text-xl font-bold text-slate-900">{tcr('promoUsageTitle')}</h2>
                  <div className="mx-auto w-full max-w-[280px] min-h-0">
                    {promoDoughnut.hasData ? (
                      <DoughnutWithCenter
                        key={promoDoughnutRevision}
                        chartData={promoDoughnut.data}
                        options={promoDoughnutOptions}
                        heightClass="h-56"
                        totalCaptionKey="doughnutTotalOrders"
                        formatNumber={formatNumber}
                        tsr={tcr}
                        dataRevision={promoDoughnutRevision}
                      />
                    ) : (
                      <p className="flex h-56 items-center justify-center text-sm text-slate-400">
                        {tcr('noChartData')}
                      </p>
                    )}
                  </div>
                </section>
              </div>

              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className={cardClass}>
                  <h2 className="mb-4 font-bold text-slate-900">{tcr('topByRevenueTitle')}</h2>
                  <div className="h-80">
                    {revenueBarData.hasData ? (
                      <Bar data={revenueBarData} options={horizontalBarOptionsMoney} />
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">
                        {tcr('noChartData')}
                      </p>
                    )}
                  </div>
                </div>
                <div className={cardClass}>
                  <h2 className="mb-4 font-bold text-slate-900">{tcr('topByOrdersTitle')}</h2>
                  <div className="h-80">
                    {ordersBarData.hasData ? (
                      <Bar data={ordersBarData} options={horizontalBarOptionsCount} />
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">
                        {tcr('noChartData')}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className={cardClass}>
                <h2 className="mb-4 font-bold text-slate-900">{tcr('topClientsTableTitle')}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="py-3">{tcr('colNameEmail')}</th>
                        <th className="py-3">{tcr('colOrders')}</th>
                        <th className="py-3">{tcr('colTotalSpent')}</th>
                        <th className="py-3">{tcr('colLastPurchase')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTableRowsVisible.map((customer) => (
                        <tr key={String(customer.customerId)} className="border-b border-slate-100">
                          <td className="py-3">
                            <p className="font-medium text-slate-800">{customer.name}</p>
                            <p className="text-xs text-slate-500">{customer.email || tcr('na')}</p>
                          </td>
                          <td className="py-3">{formatNumber(customer.ordersCount)}</td>
                          <td className="py-3">{formatCurrency(customer.totalSpent)}</td>
                          <td className="py-3">{formatDate(customer.lastPurchaseAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {topTableRowsSorted.length > topTableRowsVisible.length ? (
                  <div className="mt-4   pt-4">
                    <button
                      type="button"
                      onClick={() => setTableVisibleCount((c) => c + CLIENTS_TABLE_PAGE)}
                      className="flex items-center gap-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-sm"
                    >
                      <RefreshCw className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {tcr('loadMore')}
                    </button>
                  </div>
                ) : null}
                {topTableRowsSorted.length === 0 ? (
                  <p className="mt-4 text-center text-sm text-slate-400">{tcr('noChartData')}</p>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

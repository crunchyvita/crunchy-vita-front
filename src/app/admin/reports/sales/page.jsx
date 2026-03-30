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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Download, RefreshCw } from 'lucide-react';
import AdminHeader from '@/components/admin/header';
import { DoughnutWithCenter } from '@/components/admin/DoughnutWithCenter';
import { reportAPI } from '@/lib/api';
import { formatDateInputLocal } from '@/lib/reportDateRange';
import { useLocale, useTranslations } from 'next-intl';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const cardClass = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm';

/** Wider hole so center labels fit; thinner ring. */
const DOUGHNUT_CUTOUT = '70%';
const PRODUCTS_TABLE_PAGE = 6;

const emptySales = {
  points: [],
  summary: {},
  byDeliveryType: [],
  expressVsStandard: { express: 0, standard: 0 },
  byCountry: [],
  byCity: [],
  packageVsProductUnits: { product: 0, package: 0 },
};

const skel = 'animate-pulse rounded-md bg-slate-200/80';

function SalesReportSkeleton({ loadingLabel }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label={loadingLabel}>
      <span className="sr-only">{loadingLabel}</span>
      <section className={cardClass}>
        <div className={`mb-4 h-6 w-48 max-w-[40%] ${skel}`} />
        <div className={`h-72 w-full min-h-[16rem] rounded-xl ${skel}`} />
        <div className="mt-4 space-y-2">
          <div className={`h-4 w-full max-w-xl ${skel}`} />
          <div className={`h-4 w-full max-w-lg ${skel}`} />
        </div>
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className={cardClass}>
            <div className={`mb-4 h-6 w-56 max-w-[85%] ${skel}`} />
            <div className="flex flex-col items-center gap-4 pt-1">
              <div className={`h-56 w-56 shrink-0 rounded-full ${skel}`} />
              <div className="flex w-full flex-wrap justify-center gap-2">
                {[0, 1, 2].map((j) => (
                  <div key={j} className={`h-9 w-24 ${skel}`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className={cardClass}>
          <div className={`mb-4 h-6 w-44 max-w-[70%] ${skel}`} />
          <div className={`h-80 w-full rounded-xl ${skel}`} />
        </div>
        <div className={cardClass}>
          <div className={`mb-4 h-6 w-40 max-w-[65%] ${skel}`} />
          <div className={`h-96 w-full rounded-xl ${skel}`} />
        </div>
      </section>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {[0, 1].map((i) => (
            <div key={i} className={cardClass}>
              <div className={`mb-4 h-6 w-48 max-w-[90%] ${skel}`} />
              <div className="flex flex-col items-center gap-4 pt-1">
                <div className={`h-56 w-full max-w-[280px] rounded-full ${skel}`} />
                <div className="flex w-full flex-wrap justify-center gap-2">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className={`h-9 w-20 ${skel}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={cardClass}>
          <div className={`mb-4 h-6 w-40 max-w-[45%] ${skel}`} />
          <div className="space-y-1">
            <div className="flex gap-4 border-b border-slate-200 pb-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className={`h-3 flex-1 ${skel}`} />
              ))}
            </div>
            {[0, 1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="flex gap-4 border-b border-slate-100 py-3">
                <div className={`h-4 flex-[2] ${skel}`} />
                <div className={`h-4 w-12 shrink-0 ${skel}`} />
                <div className={`h-4 w-16 shrink-0 ${skel}`} />
                <div className={`h-4 w-12 shrink-0 ${skel}`} />
              </div>
            ))}
            <div className={`mt-4 h-9 w-32 ${skel}`} />
            <div className="mt-4 space-y-2 pt-2">
              <div className={`h-4 w-36 ${skel}`} />
              <div className={`h-4 w-full max-w-2xl ${skel}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesReportPage() {
  const tsr = useTranslations('admin.salesReport');
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

  const [sales, setSales] = useState(emptySales);
  const [products, setProducts] = useState({ rows: [], summary: {} });
  const [productsTableVisibleCount, setProductsTableVisibleCount] = useState(PRODUCTS_TABLE_PAGE);

  const formatCurrency = (value) =>
    new Intl.NumberFormat(numberLocale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatNumber = (value) => new Intl.NumberFormat(numberLocale).format(Number(value || 0));

  const formatStockValue = (row) => {
    const stock = Number(row?.stockRemaining || 0);
    const isPackageProduct = /package/i.test(String(row?.name || ''));
    if (isPackageProduct && stock === 0) return '-';
    return formatNumber(stock);
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
        const [salesRes, productsRes] = await Promise.all([
          reportAPI.getSales(queryFilters),
          reportAPI.getProducts({ ...queryFilters, page: 1, pageSize: 100 }),
        ]);

        setSales(salesRes?.data ? { ...emptySales, ...salesRes.data } : emptySales);
        setProducts(productsRes?.data || { rows: [], summary: {} });
      } catch (err) {
        setError(err?.message || tsr('loadError'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [queryFilters, tsr]);

  useEffect(() => {
    setProductsTableVisibleCount(PRODUCTS_TABLE_PAGE);
  }, [queryFilters]);

  const monthShortLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 15).toLocaleDateString(numberLocale, { month: 'short' })
      ),
    [numberLocale]
  );

  const weekDayLabels = useMemo(
    () => [
      tsr('weekdays.mon'),
      tsr('weekdays.tue'),
      tsr('weekdays.wed'),
      tsr('weekdays.thu'),
      tsr('weekdays.fri'),
      tsr('weekdays.sat'),
      tsr('weekdays.sun'),
    ],
    [tsr]
  );

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
      const totals = Array(7).fill(0);

      points.forEach((p) => {
        const date = new Date(p.label);
        if (Number.isNaN(date.getTime())) return;
        const mondayFirstIndex = (date.getDay() + 6) % 7;
        totals[mondayFirstIndex] += Number(p.revenue || 0);
      });

      return { labels: weekDayLabels, data: totals };
    }

    if (quickRange === 'month') {
      return {
        labels: points.map((_, idx) => tsr('month', { n: idx + 1 })),
        data: points.map((p) => Number(p.revenue || 0)),
      };
    }

    const totals = Array(12).fill(0);

    points.forEach((p) => {
      const parts = String(p.label || '').split('-');
      const monthIndex = Number(parts[1]) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        totals[monthIndex] += Number(p.revenue || 0);
      }
    });

    return {
      labels: monthShortLabels,
      data: totals,
    };
  }, [sales, quickRange, weekDayLabels, monthShortLabels, tsr]);

  const salesLineData = useMemo(
    () => ({
      labels: trendSeries.labels,
      datasets: [
        {
          label: tsr('chartRevenue'),
          data: trendSeries.data,
          borderColor: '#556822',
          backgroundColor: 'rgba(85, 104, 34, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    }),
    [trendSeries, tsr]
  );

  const salesLineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              new Intl.NumberFormat(numberLocale, {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 2,
              }).format(Number(ctx.raw) || 0),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(15, 23, 42, 0.06)' },
          ticks: {
            callback: (value) =>
              new Intl.NumberFormat(numberLocale, {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(Number(value)),
          },
        },
      },
    }),
    [numberLocale]
  );

  const deliveryTypeChart = useMemo(() => {
    const rows = Array.isArray(sales?.byDeliveryType) ? sales.byDeliveryType : [];
    const labelByType = {
      home: tsr('deliveryHome'),
      relay: tsr('deliveryRelay'),
      other: tsr('deliveryOther'),
    };
    const filtered = rows.filter((r) => Number(r.orders) > 0);
    const labels = filtered.map((r) => labelByType[r.type] || r.type);
    const data = filtered.map((r) => Number(r.orders));
    return {
      labels,
      datasets: [
        {
          data: data.length ? data : [1],
          backgroundColor: data.length ? ['#556822', '#8B9A48', '#C5D4A0'] : ['rgba(148, 163, 184, 0.35)'],
        },
      ],
      hasData: data.length > 0,
    };
  }, [sales, tsr]);

  const expressChart = useMemo(() => {
    const ex = Number(sales?.expressVsStandard?.express ?? 0);
    const st = Number(sales?.expressVsStandard?.standard ?? 0);
    const hasData = ex + st > 0;
    return {
      labels: [tsr('expressLabel'), tsr('standardLabel')],
      datasets: [
        {
          data: hasData ? [ex, st] : [1, 0],
          backgroundColor: hasData
            ? ['#EE7A00', '#F29A3E']
            : ['rgba(238, 122, 0, 0.35)', 'rgba(242, 154, 62, 0.3)'],
        },
      ],
      hasData,
    };
  }, [sales, tsr]);

  const packageProductChart = useMemo(() => {
    const pu = Number(sales?.packageVsProductUnits?.product ?? 0);
    const pk = Number(sales?.packageVsProductUnits?.package ?? 0);
    const hasData = pu + pk > 0;
    return {
      labels: [tsr('lineItemProduct'), tsr('lineItemPackage')],
      datasets: [
        {
          data: hasData ? [pu, pk] : [1, 0],
          backgroundColor: hasData
            ? ['#556822', '#8B9A48']
            : ['rgba(85, 104, 34, 0.35)', 'rgba(139, 154, 72, 0.35)'],
        },
      ],
      hasData,
    };
  }, [sales, tsr]);

  const doughnutTooltip = useMemo(
    () => ({
      callbacks: {
        label: (ctx) => `${ctx.label}: ${new Intl.NumberFormat(numberLocale).format(Number(ctx.raw) || 0)}`,
      },
    }),
    [numberLocale]
  );

  const doughnutOptions = useMemo(
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
        tooltip: doughnutTooltip,
      },
      elements: { arc: { borderWidth: 0 } },
    }),
    [doughnutTooltip]
  );

  const countryBarData = useMemo(() => {
    const rows = Array.isArray(sales?.byCountry) ? sales.byCountry : [];
    const rev = [...rows].reverse();
    return {
      labels: rev.map((r) => r.country || '—'),
      datasets: [
        {
          label: tsr('colOrders'),
          data: rev.map((r) => Number(r.orders)),
          backgroundColor: 'rgba(85, 104, 34, 0.65)',
          borderRadius: 6,
          barThickness: 18,
        },
      ],
      hasData: rows.length > 0,
    };
  }, [sales, tsr]);

  const cityBarData = useMemo(() => {
    const rows = Array.isArray(sales?.byCity) ? sales.byCity : [];
    const rev = [...rows].reverse();
    return {
      labels: rev.map((r) => {
        const c = r.city || '—';
        const co = (r.country || '').trim();
        return co ? `${c}, ${co}` : c;
      }),
      datasets: [
        {
          label: tsr('colOrders'),
          data: rev.map((r) => Number(r.orders)),
          backgroundColor: 'rgba(234, 88, 12, 0.7)',
          borderRadius: 6,
          barThickness: 18,
        },
      ],
      hasData: rows.length > 0,
    };
  }, [sales, tsr]);

  const horizontalBarOptions = useMemo(
    () => ({
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${tsr('colOrders')}: ${formatNumber(ctx.raw)}`,
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
    [formatNumber, tsr]
  );

  const deliveryDoughnutRevision = useMemo(
    () => JSON.stringify({ l: deliveryTypeChart.labels, d: deliveryTypeChart.datasets?.[0]?.data }),
    [deliveryTypeChart]
  );

  const expressDoughnutRevision = useMemo(
    () => JSON.stringify({ l: expressChart.labels, d: expressChart.datasets?.[0]?.data }),
    [expressChart]
  );

  const packageProductDoughnutRevision = useMemo(
    () => JSON.stringify({ l: packageProductChart.labels, d: packageProductChart.datasets?.[0]?.data }),
    [packageProductChart]
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

    const labels = topRows.map((row) => row?.name || '—');
    const data = topRows.map((row) => Number(row?.salesCount || 0));

    if (remainingQty > 0) {
      labels.push(tsr('othersSlice'));
      data.push(remainingQty);
    }

    if (data.length === 0) {
      labels.push(tsr('noProductsSold'));
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
      hasRealData: sortedRows.length > 0,
    };
  }, [products, tsr]);

  const productsDoughnutRevision = useMemo(
    () => JSON.stringify({ l: productsFlowData.labels, d: productsFlowData.datasets?.[0]?.data }),
    [productsFlowData]
  );

  const productsDoughnutOptions = useMemo(
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
            label: (ctx) => `${ctx.label}: ${formatNumber(ctx.raw)}`,
          },
        },
      },
      elements: { arc: { borderWidth: 0 } },
    }),
    [formatNumber]
  );

  const productDetailRowsSorted = useMemo(() => {
    const rows = Array.isArray(products?.rows) ? products.rows : [];
    return [...rows].sort((a, b) => Number(b?.salesCount || 0) - Number(a?.salesCount || 0));
  }, [products]);

  const productDetailRowsVisible = useMemo(
    () => productDetailRowsSorted.slice(0, productsTableVisibleCount),
    [productDetailRowsSorted, productsTableVisibleCount]
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

  const bestDay = sales?.summary?.bestSalesDay;
  const peakHours = Array.isArray(sales?.summary?.peakHours) ? sales.summary.peakHours : [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full font-sans text-slate-900">
      <AdminHeader />
      <main className="flex-1 w-full p-6 lg:p-8">
        <div className="w-full space-y-8">
          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{tsr('title')}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={quickRange}
                  onChange={(e) => setQuickRange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm"
                >
                  <option value="day">{tsr('rangeDay')}</option>
                  <option value="week">{tsr('rangeWeek')}</option>
                  <option value="month">{tsr('rangeMonth')}</option>
                  <option value="year">{tsr('rangeYear')}</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleExport('sales', 'xlsx')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  {tsr('exportExcel')}
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-[#556822] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                >
                  <Download className="h-4 w-4" />
                  {tsr('exportPdf')}
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
          ) : null}
          {loading ? <SalesReportSkeleton loadingLabel={tsr('loading')} /> : null}

          {!loading ? (
            <>
              <section className={cardClass}>
                <h2 className="mb-4 font-bold text-slate-900">{tsr('salesTrends')}</h2>
                <div className="h-72 w-full min-h-[16rem]">
                  <Line data={salesLineData} options={salesLineOptions} />
                </div>
                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p>
                    {bestDay?.day
                      ? tsr('bestSalesDay', {
                          day: bestDay.day,
                          amount: formatCurrency(bestDay.revenue),
                        })
                      : tsr('bestSalesDayNA')}
                  </p>
                  <p>
                    {peakHours.length
                      ? tsr('peakHours', {
                          hours: peakHours.map((h) => `${h.hour}:00`).join(', '),
                        })
                      : tsr('peakHoursNA')}
                  </p>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className={cardClass}>
                  <h2 className="mb-4 font-bold text-slate-900">{tsr('deliveryTypeTitle')}</h2>
                  <div className="min-h-0">
                    {deliveryTypeChart.hasData ? (
                      <DoughnutWithCenter
                        key={deliveryDoughnutRevision}
                        chartData={deliveryTypeChart}
                        options={doughnutOptions}
                        heightClass="h-72"
                        totalCaptionKey="doughnutTotalOrders"
                        formatNumber={formatNumber}
                        tsr={tsr}
                        dataRevision={deliveryDoughnutRevision}
                      />
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">{tsr('noChartData')}</p>
                    )}
                  </div>
                </div>
                <div className={cardClass}>
                  <h2 className="mb-4 font-bold text-slate-900">{tsr('expressStandardTitle')}</h2>
                  <div className="min-h-0">
                    {expressChart.hasData ? (
                      <DoughnutWithCenter
                        key={expressDoughnutRevision}
                        chartData={expressChart}
                        options={doughnutOptions}
                        heightClass="h-72"
                        totalCaptionKey="doughnutTotalOrders"
                        formatNumber={formatNumber}
                        tsr={tsr}
                        dataRevision={expressDoughnutRevision}
                      />
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">{tsr('noChartData')}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className={cardClass}>
                  <h2 className="mb-4 font-bold text-slate-900">{tsr('byCountryTitle')}</h2>
                  <div className="h-80">
                    {countryBarData.hasData ? (
                      <Bar data={countryBarData} options={horizontalBarOptions} />
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">{tsr('noChartData')}</p>
                    )}
                  </div>
                </div>
                <div className={cardClass}>
                  <h2 className="mb-4 font-bold text-slate-900">{tsr('byCityTitle')}</h2>
                  <div className="h-96">
                    {cityBarData.hasData ? (
                      <Bar data={cityBarData} options={horizontalBarOptions} />
                    ) : (
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">{tsr('noChartData')}</p>
                    )}
                  </div>
                </div>
              </section>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                  <section className={cardClass}>
                    <h2 className="mb-4 font-bold text-slate-900">{tsr('topProducts')}</h2>
                    <div className="min-h-0">
                      {productsFlowData.hasRealData ? (
                        <DoughnutWithCenter
                          key={productsDoughnutRevision}
                          chartData={productsFlowData}
                          options={productsDoughnutOptions}
                          heightClass="h-72"
                          totalCaptionKey="doughnutTotalUnits"
                          formatNumber={formatNumber}
                          tsr={tsr}
                          dataRevision={productsDoughnutRevision}
                        />
                      ) : (
                        <p className="flex h-full min-h-[18rem] items-center justify-center text-sm text-slate-400">
                          {tsr('noChartData')}
                        </p>
                      )}
                    </div>
                  </section>
                  <section className={cardClass}>
                    <h2 className="mb-4 font-bold text-slate-900">{tsr('packageVsProductTitle')}</h2>
                    <div className="min-h-0">
                      {packageProductChart.hasData ? (
                        <DoughnutWithCenter
                          key={packageProductDoughnutRevision}
                          chartData={packageProductChart}
                          options={doughnutOptions}
                          heightClass="h-72"
                          totalCaptionKey="doughnutTotalUnits"
                          formatNumber={formatNumber}
                          tsr={tsr}
                          dataRevision={packageProductDoughnutRevision}
                        />
                      ) : (
                        <p className="flex h-full min-h-[18rem] items-center justify-center text-sm text-slate-400">
                          {tsr('noChartData')}
                        </p>
                      )}
                    </div>
                  </section>
                </div>

                <section className={cardClass}>
                  <h2 className="mb-4 font-bold text-slate-900">{tsr('productDetails')}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3">{tsr('colProduct')}</th>
                          <th className="py-3">{tsr('colQty')}</th>
                          <th className="py-3">{tsr('colRevenue')}</th>
                          <th className="py-3 min-w-[5rem]">{tsr('colStock')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productDetailRowsVisible.map((row) => (
                          <tr key={`${row.productId || row.name}`} className="border-b border-slate-100">
                            <td className="py-3">
                              <p className="font-medium text-slate-800">{row.name}</p>
                            </td>
                            <td className="py-3">{formatNumber(row.salesCount)}</td>
                            <td className="py-3">{formatCurrency(row.revenue)}</td>
                            <td className={`py-3 ${row.isLowStock ? 'text-rose-600 font-medium' : 'text-slate-700'}`}>
                              {formatStockValue(row)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {productDetailRowsSorted.length > productDetailRowsVisible.length ? (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setProductsTableVisibleCount((c) => c + PRODUCTS_TABLE_PAGE)}
                        className="flex items-center gap-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 rounded-sm"
                      >
                        <RefreshCw className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                        {tsr('loadMore')}
                      </button>
                    </div>
                  ) : null}
                  {productDetailRowsSorted.length === 0 ? (
                    <p className="mt-4 text-center text-sm text-slate-400">{tsr('noChartData')}</p>
                  ) : null}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-800">{tsr('unsoldTitle')}</p>
                    <p className="text-sm text-slate-600">
                      {(products?.summary?.unsoldProducts || []).map((p) => p.name).join(', ') || tsr('unsoldNone')}
                    </p>
                  </div>
                </section>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

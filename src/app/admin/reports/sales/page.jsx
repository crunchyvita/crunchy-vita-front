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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import AdminHeader from '@/components/admin/header';
import { reportAPI } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';

/** Draws the total / slice value at the true center of the doughnut (chart area). */
const doughnutCenterNumberPlugin = {
  id: 'doughnutCenterNumber',
  afterDatasetsDraw(chart) {
    const cfg = chart.options.plugins?.doughnutCenterText;
    if (!cfg?.text) return;
    const { ctx, chartArea } = chart;
    if (!chartArea || chartArea.width <= 0) return;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;
    const fontSize = Math.round(Math.min(Math.max(chartArea.width * 0.11, 22), 40));
    ctx.save();
    ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = 'rgba(255,255,255,0.95)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(cfg.text, cx, cy);
    ctx.restore();
  },
};

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
  Filler,
  doughnutCenterNumberPlugin
);

const cardClass = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm';

/** Wider hole so center labels fit; thinner ring. */
const DOUGHNUT_CUTOUT = '70%';

function buildFilteredDoughnutData(chartData, included) {
  const labels = chartData?.labels ?? [];
  const ds0 = chartData?.datasets?.[0];
  if (!ds0) {
    return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  }
  const data = ds0.data ?? [];
  const bcRaw = ds0.backgroundColor;
  const bcArr = Array.isArray(bcRaw) ? bcRaw : data.map(() => bcRaw ?? '#94a3b8');
  const fl = [];
  const fd = [];
  const fc = [];
  for (let i = 0; i < labels.length; i += 1) {
    if (included[i] === false) continue;
    fl.push(labels[i]);
    fd.push(data[i]);
    fc.push(bcArr[i] ?? '#94a3b8');
  }
  return {
    labels: fl,
    datasets: [{ ...ds0, data: fd, backgroundColor: fc.length ? fc : '#94a3b8' }],
  };
}

/** Donut with segment checkboxes (filter), center total; click a slice to show that segment only (click again or the hole to reset). */
function DoughnutWithCenter({ chartData, options: baseOptions, heightClass, totalCaptionKey, formatNumber, tsr, dataRevision }) {
  const fullLabels = chartData?.labels ?? [];
  const fullLen = fullLabels.length;
  const [included, setIncluded] = useState(() => Array(fullLen).fill(true));
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setIncluded(Array(chartData?.labels?.length ?? 0).fill(true));
    setSelected(null);
  }, [dataRevision, chartData?.labels?.length]);

  const filteredChart = useMemo(
    () => buildFilteredDoughnutData(chartData, included),
    [chartData, included]
  );

  const filteredValues = filteredChart?.datasets?.[0]?.data ?? [];
  const filteredLabels = filteredChart?.labels ?? [];
  const filteredTotal = filteredValues.reduce((sum, v) => sum + Number(v || 0), 0);

  const chartDataOffset = useMemo(
    () => ({
      ...filteredChart,
      datasets: (filteredChart?.datasets || []).map((ds) => ({
        ...ds,
        offset: (ds.data || []).map((_, i) => (selected === i ? 10 : 0)),
      })),
    }),
    [filteredChart, selected]
  );

  const mainNum =
    selected != null && filteredValues[selected] != null ? Number(filteredValues[selected]) : filteredTotal;
  const ariaLabel =
    selected != null && filteredLabels[selected] != null
      ? `${formatNumber(mainNum)} — ${filteredLabels[selected]}`
      : `${formatNumber(mainNum)} — ${tsr(totalCaptionKey)}`;

  const mergedOptions = useMemo(
    () => ({
      ...baseOptions,
      plugins: {
        ...(baseOptions.plugins || {}),
        legend: {
          ...(typeof baseOptions.plugins?.legend === 'object' ? baseOptions.plugins.legend : {}),
          display: false,
        },
        doughnutCenterText: { text: formatNumber(mainNum) },
      },
      onClick: (_e, elements) => {
        if (elements.length > 0) {
          const idx = elements[0].index;
          setSelected((prev) => (prev === idx ? null : idx));
        } else {
          setSelected(null);
        }
      },
    }),
    [baseOptions, mainNum, formatNumber]
  );

  const ds0 = chartData?.datasets?.[0];
  const bgRaw = ds0?.backgroundColor;
  const bgArr = Array.isArray(bgRaw) ? bgRaw : null;

  const toggleIncluded = (idx) => {
    const len = fullLabels.length;
    setIncluded((prev) => {
      const next = Array.from({ length: len }, (_, i) => (i < prev.length ? prev[i] : true));
      if (idx < 0 || idx >= len) return next;
      if (next[idx]) {
        if (next.filter(Boolean).length <= 1) return next;
      }
      next[idx] = !next[idx];
      return next;
    });
    setSelected(null);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className={`relative ${heightClass} w-full min-h-0`} aria-label={ariaLabel}>
        <span className="sr-only">{ariaLabel}</span>
        <div className="absolute inset-0">
          <Doughnut data={chartDataOffset} options={mergedOptions} />
        </div>
      </div>
      <div
        className="flex flex-wrap items-start justify-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3"
        role="group"
        aria-label={tsr('pieSegmentFiltersAria')}
      >
        {fullLabels.map((label, i) => {
          const color = bgArr ? bgArr[i] : (bgRaw ?? '#94a3b8');
          const on = included[i] !== false;
          return (
            <button
              key={`${label}-${i}`}
              type="button"
              aria-pressed={on}
              aria-label={tsr('pieSegmentToggleAria', { label })}
              onClick={() => toggleIncluded(i)}
              className="flex max-w-[14rem] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#556822] focus-visible:ring-offset-1"
            >
              <span
                className={`relative h-4 w-4 shrink-0 rounded-sm border ${
                  on ? 'border-slate-200' : 'border-slate-300 opacity-50'
                }`}
                style={{ backgroundColor: color }}
                aria-hidden
              >
                {!on ? (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden rounded-sm">
                    <span className="h-0.5 w-[140%] shrink-0 -rotate-45 rounded-full bg-slate-700/90" />
                  </span>
                ) : null}
              </span>
              <span
                className={`line-clamp-3 leading-snug ${on ? 'text-slate-700' : 'text-slate-400 line-through'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const emptySales = {
  points: [],
  summary: {},
  byDeliveryType: [],
  expressVsStandard: { express: 0, standard: 0 },
  byCountry: [],
  byCity: [],
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
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={cardClass}>
          <div className={`mb-4 h-6 w-48 max-w-[90%] ${skel}`} />
          <div className="flex flex-col items-center gap-4 pt-1">
            <div className={`h-56 w-56 shrink-0 rounded-full ${skel}`} />
            <div className="flex flex-wrap justify-center gap-2">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className={`h-9 w-20 ${skel}`} />
              ))}
            </div>
          </div>
        </div>
        <div className={`${cardClass} xl:col-span-2`}>
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
            <div className="mt-4 space-y-2 pt-2">
              <div className={`h-4 w-36 ${skel}`} />
              <div className={`h-4 w-full max-w-2xl ${skel}`} />
            </div>
          </div>
        </div>
      </section>
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

  const formatDateInput = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
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

              <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <div className={cardClass}>
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
                      <p className="flex h-full items-center justify-center text-sm text-slate-400">{tsr('noChartData')}</p>
                    )}
                  </div>
                </div>

                <div className={`${cardClass} xl:col-span-2`}>
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
                        {(products?.rows || []).slice(0, 15).map((row) => (
                          <tr key={`${row.productId || row.name}`} className="border-b border-slate-100">
                            <td className="py-3 font-medium text-slate-800">{row.name}</td>
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
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-800">{tsr('unsoldTitle')}</p>
                    <p className="text-sm text-slate-600">
                      {(products?.summary?.unsoldProducts || []).map((p) => p.name).join(', ') || tsr('unsoldNone')}
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

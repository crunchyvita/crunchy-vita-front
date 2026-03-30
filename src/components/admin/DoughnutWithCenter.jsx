'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

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

ChartJS.register(doughnutCenterNumberPlugin);

export function buildFilteredDoughnutData(chartData, included) {
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

/**
 * Donut with segment toggles (filter), center total; click a slice to show that value in the center
 * (click again or the hole to reset). Matches admin sales report doughnut UX.
 */
export function DoughnutWithCenter({ chartData, options: baseOptions, heightClass, totalCaptionKey, formatNumber, tsr, dataRevision }) {
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

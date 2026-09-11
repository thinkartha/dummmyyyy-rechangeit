/**
 * Chart rendering, the same way live-data.js does tables.
 *
 * A page opts in with one attribute — `data-lhb-chart="accountMetric"` — and the entry
 * named there decides what to load and what option object to build. Adding a chart is a
 * registry entry, not another init function.
 *
 * Loaded dynamically by live-data.js only when a page actually has a chart on it, so
 * every table-only page keeps its current script weight.
 *
 * Colour
 * ------
 * The palette is fixed and ordered, and the order is the accessibility mechanism rather
 * than a preference: these five slots were validated for colour-vision deficiency
 * separation against both surfaces, so a series takes the next slot and hues are never
 * generated or cycled. A sixth series folds into "Other" on the API side instead.
 *
 * Three of the light slots sit below 3:1 against the light surface, which is allowed
 * only with relief. The relief here is concrete: a legend naming every series in ink
 * (not in the series colour), and a direct label on each line's endpoint carrying its
 * value. Identity and value are both reachable without distinguishing two hues.
 */

/* Categorical slots, in fixed order. Light and dark are the same five hues stepped for
   their own surface — not an automatic flip, which is what turns a validated light
   palette into an unvalidated dark one. */
const SERIES_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'];
const SERIES_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'];


const INK = {
  light: { primary: '#0b0b0b', secondary: '#52514e', muted: '#898781',
           grid: '#e1e0d9', axis: '#c3c2b7', surface: '#fcfcfb' },
  dark: { primary: '#ffffff', secondary: '#c3c2b7', muted: '#898781',
          grid: '#2c2c2a', axis: '#383835', surface: '#1a1a19' },
};

const isDark = () => document.documentElement.getAttribute('data-bs-theme') === 'dark';
const ink = () => INK[isDark() ? 'dark' : 'light'];
const seriesColors = () => (isDark() ? SERIES_DARK : SERIES_LIGHT);

/* One hue, light to dark. Used only by the treemap, and the distinction from a bar
   chart is deliberate: a bar already encodes magnitude as length, so shading it too
   spends the free channel twice. A treemap encodes magnitude as *area*, which is the
   thing people read badly — so here the ramp does real work, giving the eye a second
   cue and separating tiles that share an edge. Ordered by value: darker is bigger. */
const SEQUENTIAL_LIGHT = ['#0d366b', '#184f95', '#256abf', '#2a78d6', '#3987e5',
                          '#5598e7', '#6da7ec', '#86b6ef', '#9ec5f4', '#b7d3f6'];
const SEQUENTIAL_DARK = ['#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec',
                         '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#184f95'];
const sequential = () => (isDark() ? SEQUENTIAL_DARK : SEQUENTIAL_LIGHT);

/** Which grouping the spend treemap is showing. */
const spendGroupBy = () => {
  const el = document.getElementById('account-group-by');
  return (el && el.value) || 'SERVICE';
};

/** Which account this page is about, from the query string. */
export function accountParam() {
  return new URLSearchParams(window.location.search).get('account') || '';
}

const clock = (iso) => {
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? iso
    : at.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

/**
 * ECharts renders a tooltip formatter's return value as HTML, and these labels are not
 * ours: a Cost Explorer grouping by tag returns whatever the customer typed into that
 * tag. Escaped rather than trusted — the alternative is a stored injection into the
 * dashboard of whoever grouped by that tag.
 */
const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const money = (v, currency = 'USD') =>
  v == null || Number.isNaN(Number(v))
    ? '—'
    : `${currency} ${Number(v).toLocaleString(undefined, {
        minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Shared chrome: recessive axes, hairline grid, no chart junk. */
function base() {
  const c = ink();
  return {
    backgroundColor: 'transparent',
    animation: false,
    textStyle: { fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.surface,
      borderColor: c.axis,
      borderWidth: 1,
      textStyle: { color: c.primary, fontSize: 12 },
      /* The crosshair is the point of an axis tooltip: it reads every series at one
         instant, which is the comparison a multi-line chart exists to support. */
      axisPointer: { type: 'line', lineStyle: { color: c.axis, width: 1 } },
    },
  };
}

export const CHARTS = {
  /**
   * One metric over time, one line per resource. Trend over time with distinct series,
   * so: line marks, categorical colour, legend always present.
   */
  accountMetric: {
    /* The metric being charted is a choice, and it has to come from what the tenant
       actually streams — a picker offering RDS metrics to somebody streaming only EC2
       draws an empty chart and blames the data. */
    load: async (api) => {
      const account = accountParam();
      const catalog = await api.cloudMetrics.catalog({ account, hours: 24 })
        .catch(() => []);
      const select = document.getElementById('account-metric');
      if (select && !select.dataset.filled) {
        select.dataset.filled = '1';
        select.replaceChildren(...(catalog || []).map((c) => {
          const option = document.createElement('option');
          option.value = `${c.namespace}|${c.metric}`;
          option.textContent = `${c.service} · ${c.metric}`;
          return option;
        }));
      }
      const chosen = (select && select.value) || (catalog && catalog.length
        ? `${catalog[0].namespace}|${catalog[0].metric}` : '');
      if (!chosen) return null;
      const [namespace, metric] = chosen.split('|');
      const hours = Number((document.getElementById('account-range') || {}).value) || 3;
      return api.cloudMetrics.seriesByResource({ namespace, metric, account, hours });
    },
    empty: 'No metrics streamed for this account yet — set up metric streaming to fill this in.',
    option: (data) => {
      if (!data || !data.series || !data.series.length) return null;
      const c = ink();
      const palette = seriesColors();
      const stamps = [...new Set(data.series.flatMap((s) => s.points.map((p) => p.ts)))].sort();
      return {
        ...base(),
        color: palette,
        legend: {
          // Always present at two or more series: the light palette has slots below
          // 3:1 on this surface, and the legend is the relief that keeps identity off
          // colour alone.
          show: true, bottom: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10,
          textStyle: { color: c.secondary, fontSize: 11 },
        },
        grid: { left: 8, right: 56, top: 8, bottom: 28, containLabel: true },
        xAxis: {
          type: 'category',
          data: stamps,
          boundaryGap: false,
          axisLine: { lineStyle: { color: c.axis } },
          axisTick: { show: false },
          axisLabel: { color: c.muted, fontSize: 11, formatter: clock, hideOverlap: true },
        },
        yAxis: {
          type: 'value',
          name: data.unit && data.unit !== 'None' ? data.unit : '',
          nameTextStyle: { color: c.muted, fontSize: 11, align: 'left' },
          splitLine: { lineStyle: { color: c.grid, width: 1 } },
          axisLabel: { color: c.muted, fontSize: 11 },
        },
        series: data.series.map((s) => ({
          name: s.name,
          type: 'line',
          /* "Other" is the residual, not an entity, so it takes the de-emphasis gray
             rather than a sixth hue. That is both the honest encoding — nobody should
             read the fold as a thing — and what keeps the palette at its five
             validated slots instead of cycling back onto slot 1. */
          ...(s.id === '__other__' ? { color: c.muted, lineStyle: { width: 2, opacity: 0.7 } } : {}),
          smooth: false,
          showSymbol: false,
          // 2px lines, >=8px hover markers — thin marks, generous hit target.
          lineStyle: { width: 2 },
          symbolSize: 8,
          /* One label per line, at its end. Selective by design: a value beside every
             point is unreadable, but a tooltip as the *only* way to read a number
             fails anyone not using a mouse — the endpoint is the compromise the
             guidance calls for, and it doubles as the relief the low-contrast light
             slots require. */
          endLabel: {
            show: true,
            color: c.secondary,
            fontSize: 11,
            formatter: (p) => (p.value == null ? '' : Number(p.value)
              .toLocaleString(undefined, { maximumFractionDigits: 2 })),
          },
          data: stamps.map((ts) => {
            const point = s.points.find((p) => p.ts === ts);
            return point ? point.value : null;
          }),
        })),
      };
    },
  },

  /**
   * Daily spend for this account — the second time series beside the metric chart.
   *
   * A month-to-date total only ever rises, so it cannot answer "is this getting worse".
   * One series, so no legend: the card title names it, and a legend box for a single
   * line is chrome with nothing to disambiguate.
   */
  accountCost: {
    load: (api) => api.finops.costDaily({ days: 30, account: accountParam() }),
    empty: 'Waiting on Cost Explorer history for this account.',
    option: (data) => {
      if (!data || data.error || !(data.points || []).length) return null;
      const c = ink();
      const currency = data.currency || 'USD';
      const fill = seriesColors()[0];
      return {
        ...base(),
        tooltip: {
          ...base().tooltip,
          formatter: (points) => {
            const p = points[0];
            return `${esc(p.axisValue)}<br/>${esc(money(p.data, currency))}`;
          },
        },
        grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
        xAxis: {
          type: 'category',
          data: data.points.map((p) => p.date),
          boundaryGap: false,
          axisLine: { lineStyle: { color: c.axis } },
          axisTick: { show: false },
          axisLabel: { color: c.muted, fontSize: 11, hideOverlap: true },
        },
        yAxis: {
          type: 'value',
          name: currency,
          nameTextStyle: { color: c.muted, fontSize: 11, align: 'left' },
          splitLine: { lineStyle: { color: c.grid } },
          axisLabel: { color: c.muted, fontSize: 11 },
        },
        series: [{
          type: 'line',
          data: data.points.map((p) => p.amount),
          smooth: false,
          showSymbol: false,
          symbolSize: 8,
          lineStyle: { width: 2, color: fill },
          itemStyle: { color: fill },
          /* A single series is the one case where an area fill is right: nothing is
             hidden behind it, and the fill makes the shape readable at this height. */
          areaStyle: { color: fill, opacity: 0.12 },
        }],
      };
    },
  },

  /**
   * Databricks list cost per day.
   *
   * Same shape as accountCost and for the same reason: a month-to-date total only ever
   * rises, so it cannot answer "is this accelerating", which is the only question worth
   * putting a chart on a bill for.
   *
   * DBUs are deliberately not plotted beside it. They are the same quantity in a
   * different unit, and the honest way to show both on one canvas would be a second
   * y-axis — which is the one chart form that reliably misleads, because the crossing
   * point of the two lines is an artefact of the scales rather than anything real.
   */
  databricksCost: {
    load: (api) => api.databricks.usage({ days: 30 }),
    empty: 'No Databricks billing rows yet. system.billing fills in within a day of the first workload.',
    option: (data) => {
      if (!data || data.available === false || !(data.points || []).length) return null;
      const c = ink();
      const currency = data.currency || 'USD';
      const fill = seriesColors()[0];
      return {
        ...base(),
        tooltip: {
          ...base().tooltip,
          formatter: (points) => {
            const p = points[0];
            const point = data.points[p.dataIndex] || {};
            return `${esc(p.axisValue)}<br/>${esc(money(p.data, currency))}`
              + `<br/>${esc(`${point.dbus} DBUs`)}`;
          },
        },
        grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
        xAxis: {
          type: 'category',
          data: data.points.map((p) => p.date),
          boundaryGap: false,
          axisLine: { lineStyle: { color: c.axis } },
          axisTick: { show: false },
          axisLabel: { color: c.muted, fontSize: 11, hideOverlap: true },
        },
        yAxis: {
          type: 'value',
          name: `${currency} (list)`,
          nameTextStyle: { color: c.muted, fontSize: 11, align: 'left' },
          splitLine: { lineStyle: { color: c.grid } },
          axisLabel: { color: c.muted, fontSize: 11 },
        },
        series: [{
          type: 'line',
          data: data.points.map((p) => p.amount),
          smooth: false,
          showSymbol: false,
          symbolSize: 8,
          lineStyle: { width: 2, color: fill },
          itemStyle: { color: fill },
          areaStyle: { color: fill, opacity: 0.12 },
        }],
      };
    },
  },

  /**
   * Spend as a treemap — tile area is the amount.
   *
   * A ranked bar chart compares magnitude more accurately and is what shipped first.
   * This is the shape that was asked for, and it does earn its place on one thing a bar
   * list does badly: it shows the *shape* of a bill at a glance — whether one service
   * is most of it, or thirty services are all of it — without the reader adding up rows.
   *
   * The mitigations for what treemaps get wrong are all here: one hue ordered by value
   * so darker is reliably bigger, a 2px surface gap so adjacent tiles never merge, and
   * labels truncated rather than clipped mid-word, with the tooltip carrying the rest.
   */
  accountSpendTreemap: {
    load: (api) => api.finops.costBreakdown({
      groupBy: spendGroupBy(), account: accountParam(),
    }),
    empty: 'Waiting on Cost Explorer data for this account.',
    option: (data) => {
      if (!data || data.error || !(data.entries || []).length) return null;
      const c = ink();
      const currency = data.currency || 'USD';
      const ramp = sequential();
      /* Descending, so the ramp index and the tile order agree and the darkest tile is
         also the largest. Credits and refunds are negative and have no area — drawing
         them would make the layout meaningless, so they leave the map rather than
         becoming zero-size tiles. The total above still includes them. */
      const entries = [...data.entries]
        .filter((e) => Number(e.mtd) > 0)
        .sort((a, b) => b.mtd - a.mtd)
        .slice(0, 24);
      if (!entries.length) return null;
      const total = entries.reduce((t, e) => t + e.mtd, 0);
      return {
        ...base(),
        tooltip: {
          ...base().tooltip,
          trigger: 'item',
          formatter: (p) => `${esc(p.name)}<br/>${esc(money(p.value, currency))}`
            + `<br/>${esc(((p.value / total) * 100).toFixed(1))}% of shown`,
        },
        series: [{
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          top: 0, left: 0, right: 0, bottom: 0,
          /* The gap is the surface showing through, which is how tiles are separated —
             never a border drawn around each mark. */
          itemStyle: { borderColor: c.surface, borderWidth: 2, gapWidth: 2 },
          label: {
            show: true,
            /* Truncate, never clip: a treemap of thirty services otherwise guarantees
               half-words inside the small tiles. */
            overflow: 'truncate',
            fontSize: 12,
            lineHeight: 16,
            formatter: (p) => `${p.name}\n${money(p.value, currency)}`,
          },
          /* A dark tile needs light text and a pale one needs dark text, and the ramp
             spans both — so the label colour is decided per tile rather than once. */
          data: entries.map((e, i) => {
            const step = ramp[Math.min(i, ramp.length - 1)];
            const paleEnd = isDark() ? i < ramp.length / 2 : i >= ramp.length / 2;
            return {
              name: e.key,
              value: e.mtd,
              itemStyle: { color: step },
              label: { color: paleEnd ? '#0b0b0b' : '#ffffff' },
            };
          }),
        }],
      };
    },
  },
};

/* echarts is a global from the layout's vendor script rather than an import: it is a
   UMD build, and the page only loads it when it has a chart to draw. */
const echartsLib = () => (typeof window !== 'undefined' ? window.echarts : null);

const instances = new Map();

function message(root, text, tone = 'secondary') {
  const el = document.createElement('div');
  el.className = `d-flex align-items-center justify-content-center h-100 text-body-tertiary fs-9 text-${tone}`;
  el.textContent = text;
  root.replaceChildren(el);
}

/** Draw (or redraw) one chart element. */
async function draw(api, root) {
  const spec = CHARTS[root.dataset.lhbChart];
  const lib = echartsLib();
  if (!spec) return;
  if (!lib) {
    message(root, 'Charting library not loaded on this page.');
    return;
  }
  let data;
  try {
    data = await spec.load(api);
  } catch (err) {
    const status = /API (\d{3})/.exec(err.message)?.[1];
    message(root, status === '401' || status === '403'
      ? 'Sign in for live data.'
      : `Could not load: ${err.message}`);
    return;
  }
  const option = spec.option(data);
  if (!option) {
    /* An empty chart is a lie by omission — an axis with no marks reads as "zero"
       rather than "nothing was measured". Dispose and say which it is. */
    const existing = instances.get(root);
    if (existing) { existing.dispose(); instances.delete(root); }
    /* "Waiting on Cost Explorer history" is true of an account that has not been billed
       yet and false of a role that was refused ce:GetCostAndUsage — and the second is
       the likelier one, because it is a setup step. The payload already carries the
       reason; showing the generic line over the top of it is what made a permissions
       problem look like patience. */
    const reason = data && data.error;
    message(root, reason
      || spec.empty
      || 'This fills in once your backend systems are connected and reporting.',
      reason ? 'danger' : 'secondary');
    return;
  }
  let chart = instances.get(root);
  /* getInstanceByDom, not just the map: a redraw after a theme change disposes and
     re-inits, and echarts refuses to init twice on one element. */
  const live = lib.getInstanceByDom(root);
  if (!chart || chart !== live || chart.isDisposed()) {
    root.replaceChildren();
    chart = lib.init(root, null, { renderer: 'svg' });
    instances.set(root, chart);
  }
  chart.setOption(option, true);
}

let bound = false;
let lastDraw = 0;

/* A metric stream delivers about once a minute, so redrawing on the tables' ten-second
   tick is five wasted queries out of six — and a 7-day range is not a cheap one. An
   explicit refresh (the Refresh button, a control change, a theme flip) always redraws;
   the poll only does once this has elapsed. */
const CHART_MIN_INTERVAL_MS = 60_000;

/**
 * Render every chart on the page, and keep them rendered.
 *
 * `polled` marks the timer's pass, which is throttled; anything a person asked for is
 * not.
 */
export async function hydrateCharts(api, polled = false) {
  const roots = document.querySelectorAll('[data-lhb-chart]');
  if (!roots.length) return;
  if (polled && Date.now() - lastDraw < CHART_MIN_INTERVAL_MS) return;
  lastDraw = Date.now();
  if (!bound) {
    bound = true;
    /* Charts do not reflow on their own — an echarts canvas keeps the size it was
       initialised at, so a chart drawn in a hidden tab or before a sidebar collapse
       stays the wrong size until told otherwise. */
    window.addEventListener('resize', () => {
      for (const chart of instances.values()) {
        if (!chart.isDisposed()) chart.resize();
      }
    });
    /* The theme toggle fires this on body. Dark mode is a different validated palette,
       not an inversion, so the option is rebuilt rather than recoloured. */
    document.body.addEventListener('clickControl', () => {
      for (const chart of instances.values()) {
        if (!chart.isDisposed()) chart.dispose();
      }
      instances.clear();
      hydrateCharts(api);
    });
    /* A chart inside a hidden tab pane measures zero, so one drawn there has no size
       until the pane is shown. Charts live in the tab that is active on load, which
       covers the first paint; this covers coming back to it. */
    document.body.addEventListener('shown.bs.tab', () => {
      for (const chart of instances.values()) {
        if (!chart.isDisposed()) chart.resize();
      }
    });
    /* Changing the metric or the range changes what to fetch, not just how to draw it. */
    document.addEventListener('change', (event) => {
      if (event.target.closest('[data-lhb-chart-control]')) hydrateCharts(api);
    });
  }
  await Promise.all(Array.from(roots).map((root) => draw(api, root)));
}

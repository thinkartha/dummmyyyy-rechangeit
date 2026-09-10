/**
 * Chart option builders: the encoding rules, not the pixels.
 *
 * What is easy to get wrong here and impossible to see in a diff — a sixth series
 * cycling back onto the first hue, a value-ramp shading nominal categories so bar
 * length is encoded twice, an empty payload drawing empty axes that read as zero, and
 * an untrusted label concatenated into tooltip HTML.
 *
 *   node integration/test/charts.test.mjs
 */
import assert from 'node:assert/strict';

/* charts.js reads the theme off document and the account off the URL. */
globalThis.document = {
  documentElement: { getAttribute: () => null },
  getElementById: () => null,
  querySelector: () => null,
};
globalThis.window = {
  location: { search: '?account=111122223333', pathname: '/apps/observability/cloud-account.html' },
};

const { CHARTS } = await import('../charts.js');

const line = (name, values, id = name) => ({
  id,
  name,
  points: values.map((v, i) => ({ ts: `2026-09-10T10:0${i}:00+00:00`, value: v })),
});

// --- accountMetric ---------------------------------------------------------

// Nothing measured must not draw an axis: an empty plot reads as "zero", which is a
// different claim from "we have no data".
assert.equal(CHARTS.accountMetric.option(null), null);
assert.equal(CHARTS.accountMetric.option({ series: [] }), null);
assert.ok(CHARTS.accountMetric.empty, 'an empty chart has to say why');

{
  const option = CHARTS.accountMetric.option({
    unit: 'Percent',
    series: [line('i-a', [1, 2, 3]), line('i-b', [4, 5, 6])],
  });
  assert.equal(option.series.length, 2);
  assert.equal(option.series[0].type, 'line');
  // Thin marks, no per-point symbols, a hover target that is not a pinpoint.
  assert.equal(option.series[0].lineStyle.width, 2);
  assert.equal(option.series[0].showSymbol, false);
  assert.ok(option.series[0].symbolSize >= 8);
  // A legend is always present at two or more series — identity is never colour alone.
  assert.equal(option.legend.show, true);
  // Selective direct labels: the endpoint, never a number on every point.
  assert.equal(option.series[0].endLabel.show, true);
  assert.equal(option.yAxis.name, 'Percent');
  // One axis. A second y-scale is the single worst chart mistake.
  assert.ok(!Array.isArray(option.yAxis));
}

// Five named series take the five validated slots, in fixed order, never cycled.
{
  const option = CHARTS.accountMetric.option({
    series: ['a', 'b', 'c', 'd', 'e'].map((n) => line(n, [1, 2])),
  });
  assert.equal(option.color.length, 5);
  assert.equal(new Set(option.color).size, 5, 'no slot is reused');
  assert.deepEqual(option.color, ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4']);
}

// The sixth line is "Other" — the residual, not an identity. It takes the de-emphasis
// gray rather than cycling back onto slot 1, which is what ECharts would do unasked.
{
  const option = CHARTS.accountMetric.option({
    series: [...['a', 'b', 'c', 'd', 'e'].map((n) => line(n, [1, 2])),
             line('Other (7)', [9, 9], '__other__')],
  });
  const other = option.series[5];
  assert.equal(other.color, '#898781', 'Other must not take a categorical hue');
  assert.notEqual(other.color, option.color[0], 'and must not cycle onto slot 1');
  assert.ok(option.series.slice(0, 5).every((s) => s.color === undefined),
    'named series take their slot from the palette, not an override');
}

// Series with different sample times still line up on one shared x axis.
{
  const option = CHARTS.accountMetric.option({
    series: [
      { id: 'a', name: 'a', points: [{ ts: 't1', value: 1 }, { ts: 't3', value: 3 }] },
      { id: 'b', name: 'b', points: [{ ts: 't2', value: 2 }] },
    ],
  });
  assert.deepEqual(option.xAxis.data, ['t1', 't2', 't3']);
  // A gap is null, not zero — a missing sample is not a measurement of nothing.
  assert.deepEqual(option.series[0].data, [1, null, 3]);
  assert.deepEqual(option.series[1].data, [null, 2, null]);
}

// --- accountCost (daily spend) ---------------------------------------------

assert.equal(CHARTS.accountCost.option({ error: 'AccessDenied' }), null);
assert.equal(CHARTS.accountCost.option({ points: [] }), null);

{
  const option = CHARTS.accountCost.option({
    currency: 'USD',
    points: [{ date: '2026-09-01', amount: 10 }, { date: '2026-09-02', amount: 20 }],
  });
  assert.equal(option.series.length, 1);
  // A single series needs no legend — the card title names it, and there is nothing
  // to disambiguate.
  assert.ok(!option.legend || option.legend.show !== true);
  // An area fill is right here precisely because one series hides nothing behind it.
  assert.ok(option.series[0].areaStyle);
  assert.ok(option.series[0].areaStyle.opacity < 0.2, 'the fill must stay recessive');
  assert.deepEqual(option.series[0].data, [10, 20]);
  assert.ok(!Array.isArray(option.yAxis), 'one axis, never two');
}

// --- accountSpendTreemap ----------------------------------------------------

assert.equal(CHARTS.accountSpendTreemap.option({ error: 'AccessDenied' }), null);
assert.equal(CHARTS.accountSpendTreemap.option({ entries: [] }), null);

{
  const option = CHARTS.accountSpendTreemap.option({
    currency: 'USD',
    entries: [
      { key: 'EC2', mtd: 100 }, { key: 'RDS', mtd: 300 }, { key: 'untagged', mtd: 50 },
    ],
  });
  const data = option.series[0].data;
  // Descending, so the ramp index and the tile order agree: darkest is largest.
  assert.deepEqual(data.map((d) => d.name), ['RDS', 'EC2', 'untagged']);
  assert.equal(data[0].itemStyle.color, '#0d366b', 'largest takes the darkest step');
  assert.ok(data.every((d) => d.label && d.label.color),
    'each tile picks its own text colour — the ramp spans dark and pale');
  // Tiles are separated by the surface showing through, never by a drawn border.
  assert.equal(option.series[0].itemStyle.gapWidth, 2);
  // A label that will not fit is truncated by the library, never clipped mid-word.
  assert.equal(option.series[0].label.overflow, 'truncate');
  assert.ok(data.some((d) => d.name === 'untagged'), 'untagged spend is shown');
}

// Credits and refunds are negative and have no area. Drawing them would make the
// layout meaningless, so they leave the map rather than becoming zero-size tiles.
{
  const option = CHARTS.accountSpendTreemap.option({
    currency: 'USD',
    entries: [{ key: 'EC2', mtd: 100 }, { key: 'Credit', mtd: -40 }],
  });
  assert.deepEqual(option.series[0].data.map((d) => d.name), ['EC2']);
}
assert.equal(
  CHARTS.accountSpendTreemap.option({ entries: [{ key: 'Credit', mtd: -40 }] }), null,
  'nothing positive to draw is an empty state, not an empty box');

// A tag grouping returns customer-typed strings straight into an HTML tooltip.
{
  const option = CHARTS.accountSpendTreemap.option({
    currency: 'USD', entries: [{ key: '<script>x</script>', mtd: 5 }],
  });
  const html = option.tooltip.formatter({ name: '<script>x</script>', value: 5 });
  assert.ok(!html.includes('<script'), 'untrusted tile label reached the tooltip raw');
}

console.log('charts: ok');

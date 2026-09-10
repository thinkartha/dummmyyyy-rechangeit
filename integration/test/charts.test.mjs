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

// --- accountSpend ----------------------------------------------------------

assert.equal(CHARTS.accountSpend.option({ error: 'AccessDenied' }), null);
assert.equal(CHARTS.accountSpend.option({ entries: [] }), null);

{
  const option = CHARTS.accountSpend.option({
    currency: 'USD',
    entries: [
      { key: 'EC2', mtd: 100 }, { key: 'RDS', mtd: 300 }, { key: 'S3', mtd: 200 },
    ],
  });
  // Ranked ascending: a horizontal category axis draws bottom-up, so the largest
  // finishes on top.
  assert.deepEqual(option.yAxis.data, ['EC2', 'S3', 'RDS']);
  assert.deepEqual(option.series[0].data, [100, 200, 300]);

  // Nominal categories get ONE colour. A ramp here would encode bar length twice and
  // burn the only free channel on what the length already says.
  const bar = option.series[0];
  assert.equal(typeof bar.itemStyle.color, 'string');
  assert.ok(bar.data.every((d) => typeof d === 'number'),
    'no per-bar itemStyle — that is how a value-ramp sneaks back in');
  assert.equal(bar.itemStyle.color, '#2a78d6');
  // Values are labelled, so the tooltip is not the only way to read one.
  assert.equal(bar.label.show, true);
  // The hovered bar has to visibly respond.
  assert.ok(bar.emphasis.itemStyle);
}

// Cost Explorer grouped by tag returns whatever the customer typed. It reaches an
// HTML tooltip formatter, so it must arrive escaped.
{
  const option = CHARTS.accountSpend.option({
    currency: 'USD',
    entries: [{ key: '<img src=x onerror=alert(1)>', mtd: 1 }],
  });
  const html = option.tooltip.formatter({ name: '<img src=x onerror=alert(1)>', value: 1 });
  assert.ok(!html.includes('<img'), 'untrusted label reached the tooltip unescaped');
  assert.ok(html.includes('&lt;img'));
}

console.log('charts: ok');

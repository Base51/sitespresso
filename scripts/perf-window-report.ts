import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type CsvRow = {
  started_at: string;
  finished_at: string;
  round: string;
  round_elapsed_ms: string;
  target: string;
  count: string;
  failures: string;
  min_ms: string;
  p50_ms: string;
  p95_ms: string;
  max_ms: string;
  avg_ms: string;
  page_data_p95_ms: string;
  page_render_p95_ms: string;
  edge_mw_header_p95_ms: string;
  page_data_header_p95_ms: string;
  page_render_header_p95_ms: string;
};

type NumericStats = {
  count: number;
  min: number;
  avg: number;
  p95: number;
  max: number;
};

function parseArgString(flag: string): string | null {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) return null;
  const value = arg.split('=').slice(1).join('=').trim();
  return value || null;
}

function parseArgNumber(flag: string, fallback: number): number {
  const raw = parseArgString(flag);
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return value;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function summarize(values: number[]): NumericStats {
  if (values.length === 0) {
    return { count: 0, min: 0, avg: 0, p95: 0, max: 0 };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    avg: total / values.length,
    p95: percentile(values, 95),
    max: Math.max(...values),
  };
}

function pearson(x: number[], y: number[]): number {
  if (x.length === 0 || y.length === 0 || x.length !== y.length) return 0;

  const n = x.length;
  const xAvg = x.reduce((sum, value) => sum + value, 0) / n;
  const yAvg = y.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let xDen = 0;
  let yDen = 0;

  for (let index = 0; index < n; index += 1) {
    const dx = x[index] - xAvg;
    const dy = y[index] - yAvg;
    numerator += dx * dy;
    xDen += dx * dx;
    yDen += dy * dy;
  }

  const denominator = Math.sqrt(xDen * yDen);
  if (!Number.isFinite(denominator) || denominator === 0) return 0;
  return numerator / denominator;
}

function findLatestCsvPath(baseDir: string): string | null {
  const entries = readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.csv'))
    .map((entry) => entry.name)
    .sort();

  if (entries.length === 0) return null;
  return resolve(baseDir, entries[entries.length - 1]);
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  const rows: CsvRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const values = lines[index].split(',');
    if (values.length !== headers.length) continue;

    const row = Object.fromEntries(headers.map((header, colIndex) => [header, values[colIndex]])) as CsvRow;
    rows.push(row);
  }

  return rows;
}

function toNumber(value: string): number | null {
  if (!value?.trim()) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num;
}

function formatMs(value: number): string {
  return `${value.toFixed(1)}ms`;
}

async function main(): Promise<void> {
  const baseDir = resolve(process.cwd(), 'docs/perf-history');
  const inputArg = parseArgString('--input');
  const inputPath = inputArg ? resolve(process.cwd(), inputArg) : findLatestCsvPath(baseDir);

  if (!inputPath) {
    throw new Error('No CSV input found. Use --input=docs/perf-history/<file>.csv');
  }

  const spikeThresholdMs = parseArgNumber('--spike-ms', 300);
  const focusTarget = parseArgString('--target') || 'Published About';

  const rows = parseCsv(readFileSync(inputPath, 'utf8'));
  if (rows.length === 0) {
    throw new Error('CSV has no rows to analyze.');
  }

  const routeMap = new Map<string, number[]>();
  for (const row of rows) {
    const p95 = toNumber(row.p95_ms);
    if (p95 == null) continue;

    const existing = routeMap.get(row.target) || [];
    existing.push(p95);
    routeMap.set(row.target, existing);
  }

  console.log('Perf window report');
  console.log(`  input=${inputPath}`);
  console.log(`  rows=${rows.length}`);
  console.log(`  targets=${routeMap.size}`);
  console.log(`  spike_threshold_ms=${spikeThresholdMs}`);

  console.log('\nRoute p95 summary');
  const sortedTargets = Array.from(routeMap.keys()).sort((a, b) => a.localeCompare(b));
  for (const target of sortedTargets) {
    const stats = summarize(routeMap.get(target) || []);
    console.log(
      `  ${target}: rounds=${stats.count} avg=${formatMs(stats.avg)} min=${formatMs(stats.min)} p95_of_rounds=${formatMs(stats.p95)} max=${formatMs(stats.max)}`
    );
  }

  const focusRows = rows.filter((row) => row.target === focusTarget);
  if (focusRows.length === 0) {
    console.log(`\nFocus target '${focusTarget}' not present in CSV.`);
    return;
  }

  const focusTotals: number[] = [];
  const focusData: number[] = [];
  const focusRender: number[] = [];
  const spikes: Array<{ round: number; total: number; data: number | null; render: number | null; edge: number | null }> = [];

  for (const row of focusRows) {
    const round = Number(row.round);
    const total = toNumber(row.p95_ms);
    const data = toNumber(row.page_data_p95_ms);
    const render = toNumber(row.page_render_p95_ms);
    const edge = toNumber(row.edge_mw_header_p95_ms);

    if (total == null) continue;
    focusTotals.push(total);

    if (data != null) focusData.push(data);
    if (render != null) focusRender.push(render);

    if (total >= spikeThresholdMs) {
      spikes.push({ round, total, data, render, edge });
    }
  }

  const totalStats = summarize(focusTotals);
  const dataStats = summarize(focusData);
  const renderStats = summarize(focusRender);

  console.log(`\nFocus target: ${focusTarget}`);
  console.log(
    `  total p95: rounds=${totalStats.count} avg=${formatMs(totalStats.avg)} min=${formatMs(totalStats.min)} max=${formatMs(totalStats.max)}`
  );
  if (focusData.length > 0) {
    console.log(`  page_data p95: avg=${formatMs(dataStats.avg)} max=${formatMs(dataStats.max)}`);
  }
  if (focusRender.length > 0) {
    console.log(`  page_render p95: avg=${formatMs(renderStats.avg)} max=${formatMs(renderStats.max)}`);
  }

  if (focusData.length === focusTotals.length) {
    console.log(`  corr(total,page_data)=${pearson(focusTotals, focusData).toFixed(3)}`);
  }
  if (focusRender.length === focusTotals.length) {
    console.log(`  corr(total,page_render)=${pearson(focusTotals, focusRender).toFixed(3)}`);
  }

  if (spikes.length === 0) {
    console.log(`  spikes>=${spikeThresholdMs}ms: none`);
  } else {
    console.log(`  spikes>=${spikeThresholdMs}ms:`);
    for (const spike of spikes) {
      const dataText = spike.data == null ? 'n/a' : formatMs(spike.data);
      const renderText = spike.render == null ? 'n/a' : formatMs(spike.render);
      const edgeText = spike.edge == null ? 'n/a' : formatMs(spike.edge);
      console.log(
        `    round=${spike.round} total=${formatMs(spike.total)} page_data=${dataText} page_render=${renderText} edge_mw=${edgeText}`
      );
    }
  }
}

main().catch((error) => {
  console.error('Perf window report failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

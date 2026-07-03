import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

type TargetSummary = {
  target: string;
  count: number;
  failures: number;
  minMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  avgMs: number;
  metrics: Record<string, { p50: number; p95: number; avg: number }>;
};

type RoundResult = {
  startedAtIso: string;
  finishedAtIso: string;
  elapsedMs: number;
  targets: TargetSummary[];
};

function parseArgNumber(flag: string, fallback: number): number {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) return fallback;

  const value = Number(arg.split('=').slice(1).join('='));
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function parseArgString(flag: string, fallback: string): string {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) return fallback;
  const value = arg.split('=').slice(1).join('=').trim();
  return value || fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function parsePerfSampleOutput(stdout: string): TargetSummary[] {
  const lines = stdout.split(/\r?\n/);
  const targets: TargetSummary[] = [];

  let current: TargetSummary | null = null;
  let insideServerTiming = false;

  const maybePushCurrent = () => {
    if (current) {
      targets.push(current);
      current = null;
      insideServerTiming = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      maybePushCurrent();
      continue;
    }

    if (
      !line.startsWith(' ') &&
      !trimmed.startsWith('Running performance sample') &&
      !trimmed.startsWith('Performance budgets:') &&
      !trimmed.startsWith('Performance sampling complete')
    ) {
      maybePushCurrent();
      current = {
        target: trimmed,
        count: 0,
        failures: 0,
        minMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        maxMs: 0,
        avgMs: 0,
        metrics: {},
      };
      continue;
    }

    if (!current) continue;

    const countMatch = trimmed.match(/^count=(\d+) failures=(\d+)$/);
    if (countMatch) {
      current.count = Number(countMatch[1]);
      current.failures = Number(countMatch[2]);
      continue;
    }

    const summaryMatch = trimmed.match(/^min=([\d.]+)ms p50=([\d.]+)ms p95=([\d.]+)ms max=([\d.]+)ms avg=([\d.]+)ms$/);
    if (summaryMatch) {
      current.minMs = Number(summaryMatch[1]);
      current.p50Ms = Number(summaryMatch[2]);
      current.p95Ms = Number(summaryMatch[3]);
      current.maxMs = Number(summaryMatch[4]);
      current.avgMs = Number(summaryMatch[5]);
      continue;
    }

    if (trimmed === 'server_timing:' || trimmed === 'server_timing=none') {
      insideServerTiming = trimmed === 'server_timing:';
      continue;
    }

    if (insideServerTiming) {
      const metricMatch = trimmed.match(/^([a-zA-Z0-9_]+): p50=([\d.]+)ms p95=([\d.]+)ms avg=([\d.]+)ms$/);
      if (!metricMatch) continue;

      const metricName = metricMatch[1];
      current.metrics[metricName] = {
        p50: Number(metricMatch[2]),
        p95: Number(metricMatch[3]),
        avg: Number(metricMatch[4]),
      };
    }
  }

  maybePushCurrent();
  return targets;
}

function csvEscape(value: string | number): string {
  const text = String(value);
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(results: RoundResult[]): string {
  const header = [
    'started_at',
    'finished_at',
    'round',
    'round_elapsed_ms',
    'target',
    'count',
    'failures',
    'min_ms',
    'p50_ms',
    'p95_ms',
    'max_ms',
    'avg_ms',
    'page_data_p95_ms',
    'page_render_p95_ms',
    'edge_mw_header_p95_ms',
    'page_data_header_p95_ms',
    'page_render_header_p95_ms',
  ];

  const rows: string[] = [header.join(',')];

  results.forEach((result, index) => {
    for (const target of result.targets) {
      const row = [
        result.startedAtIso,
        result.finishedAtIso,
        index + 1,
        result.elapsedMs.toFixed(1),
        target.target,
        target.count,
        target.failures,
        target.minMs.toFixed(1),
        target.p50Ms.toFixed(1),
        target.p95Ms.toFixed(1),
        target.maxMs.toFixed(1),
        target.avgMs.toFixed(1),
        target.metrics.page_data?.p95?.toFixed(1) || '',
        target.metrics.page_render?.p95?.toFixed(1) || '',
        target.metrics.edge_mw_header?.p95?.toFixed(1) || '',
        target.metrics.page_data_header?.p95?.toFixed(1) || '',
        target.metrics.page_render_header?.p95?.toFixed(1) || '',
      ];

      rows.push(row.map(csvEscape).join(','));
    }
  });

  return `${rows.join('\n')}\n`;
}

async function runRound(count: number, warmup: number): Promise<RoundResult> {
  const startedAt = new Date();
  const roundStart = performance.now();
  const command = `npm run --silent test:perf-sample -- --count=${count} --warmup=${warmup}`;

  const { stdout, stderr } = await execAsync(command, {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  });

  const targets = parsePerfSampleOutput(stdout);
  const elapsedMs = Math.max(0, performance.now() - roundStart);

  if (targets.length === 0) {
    const stderrExcerpt = stderr ? ` stderr: ${stderr.trim()}` : '';
    throw new Error(`Unable to parse perf sample output.${stderrExcerpt}`);
  }

  return {
    startedAtIso: startedAt.toISOString(),
    finishedAtIso: new Date().toISOString(),
    elapsedMs,
    targets,
  };
}

async function main(): Promise<void> {
  const rounds = parseArgNumber('--rounds', 6);
  const intervalMs = parseArgNumber('--interval-ms', 60000);
  const count = parseArgNumber('--count', 7);
  const warmup = parseArgNumber('--warmup', 1);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const output = parseArgString('--output', `docs/perf-history/perf-window-${timestamp}.csv`);
  const outputPath = resolve(process.cwd(), output);

  mkdirSync(dirname(outputPath), { recursive: true });

  console.log('Running perf window sampler...');
  console.log(`  rounds=${rounds}`);
  console.log(`  interval_ms=${intervalMs}`);
  console.log(`  count=${count}`);
  console.log(`  warmup=${warmup}`);
  console.log(`  output=${output}`);

  const results: RoundResult[] = [];

  for (let round = 1; round <= rounds; round += 1) {
    console.log(`\nRound ${round}/${rounds}`);
    const result = await runRound(count, warmup);
    results.push(result);

    const about = result.targets.find((target) => target.target === 'Published About');
    if (about) {
      const pageDataP95 = about.metrics.page_data?.p95;
      const renderP95 = about.metrics.page_render?.p95;
      const edgeMwP95 = about.metrics.edge_mw_header?.p95;
      console.log(
        `  about: p95=${about.p95Ms.toFixed(0)}ms page_data_p95=${pageDataP95?.toFixed(1) ?? 'n/a'}ms page_render_p95=${renderP95?.toFixed(1) ?? 'n/a'}ms edge_mw_p95=${edgeMwP95?.toFixed(1) ?? 'n/a'}ms`
      );
    }

    if (round < rounds) {
      await sleep(intervalMs);
    }
  }

  const csv = toCsv(results);
  writeFileSync(outputPath, csv, 'utf8');

  console.log('\nPerf window sampling complete.');
  console.log(`  rows=${results.reduce((total, result) => total + result.targets.length, 0)}`);
  console.log(`  output=${output}`);
}

main().catch((error) => {
  console.error('Perf window sampler failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

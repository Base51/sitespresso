import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

type Sample = {
  status: number;
  elapsedMs: number;
  serverTimingRaw: string | null;
  pageTiming: Record<string, number>;
};

type Summary = {
  count: number;
  failures: number;
  min: number;
  p50: number;
  p95: number;
  max: number;
  avg: number;
};

type Target = { label: string; url: string; type: 'get' | 'post-generate' };

type BudgetConfig = {
  strict: boolean;
  maxFailureRate: number | null;
  p95ByTargetKey: Record<string, number>;
};

function loadDotEnvFile(path: string): void {
  if (!existsSync(path)) return;

  const text = readFileSync(path, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const index = line.indexOf('=');
    if (index <= 0) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

function readEnv(name: string): string {
  const raw = process.env[name];
  if (!raw) return '';
  const trimmed = raw.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseArgNumber(flag: string, fallback: number): number {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) return fallback;
  const value = Number(arg.split('=').slice(1).join('='));
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
}

function parseOptionalArgNumber(flag: string): number | null {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) return null;
  const value = Number(arg.split('=').slice(1).join('='));
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function toTargetKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function summarize(samples: Sample[]): Summary {
  if (samples.length === 0) {
    return {
      count: 0,
      failures: 0,
      min: 0,
      p50: 0,
      p95: 0,
      max: 0,
      avg: 0,
    };
  }

  const values = samples.map((sample) => sample.elapsedMs);
  const sum = values.reduce((total, value) => total + value, 0);
  const failures = samples.filter((sample) => sample.status < 200 || sample.status >= 400).length;

  return {
    count: samples.length,
    failures,
    min: Math.min(...values),
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    max: Math.max(...values),
    avg: sum / samples.length,
  };
}

function parseServerTiming(raw: string | null): Record<string, number> {
  if (!raw) return {};

  const output: Record<string, number> = {};
  const parts = raw.split(',').map((entry) => entry.trim()).filter(Boolean);

  for (const part of parts) {
    const sections = part.split(';').map((entry) => entry.trim());
    const metricName = sections[0];
    const durPart = sections.find((entry) => entry.startsWith('dur='));

    if (!metricName || !durPart) continue;
    const durValue = Number(durPart.replace('dur=', ''));
    if (!Number.isFinite(durValue)) continue;

    output[metricName] = durValue;
  }

  return output;
}

function parsePageTimingMeta(html: string): Record<string, number> {
  const output: Record<string, number> = {};
  const mainTagMatch = html.match(/<main[^>]*>/i);
  if (!mainTagMatch?.[0]) return output;

  const mainTag = mainTagMatch[0];
  const patterns: Array<{ key: string; regex: RegExp }> = [
    { key: 'page_data', regex: /data-sitespresso-data-ms=["']([^"']+)["']/i },
    { key: 'page_render', regex: /data-sitespresso-render-ms=["']([^"']+)["']/i },
  ];

  for (const pattern of patterns) {
    const match = mainTag.match(pattern.regex);
    if (!match?.[1]) continue;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) continue;
    output[pattern.key] = value;
  }

  return output;
}

async function discoverPublishedSlug(baseUrl: string): Promise<string | null> {
  const configuredSlug = readEnv('PERF_SAMPLE_SLUG').trim();
  if (configuredSlug) return configuredSlug;

  const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data } = await supabase
    .from('sites')
    .select('slug')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = data as { slug?: string | null } | null;
  const slug = row?.slug?.trim();
  if (!slug) return null;

  const normalizedBase = baseUrl.replace(/\/$/, '');
  if (normalizedBase.includes('sitespresso.com')) {
    return slug;
  }

  return null;
}

async function sampleGet(url: string, count: number): Promise<Sample[]> {
  const samples: Sample[] = [];

  for (let index = 0; index < count; index += 1) {
    const start = performance.now();
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
      });
      const body = await response.text();
      samples.push({
        status: response.status,
        elapsedMs: performance.now() - start,
        serverTimingRaw: response.headers.get('server-timing'),
        pageTiming: parsePageTimingMeta(body),
      });
    } catch {
      samples.push({
        status: 0,
        elapsedMs: performance.now() - start,
        serverTimingRaw: null,
        pageTiming: {},
      });
    }
  }

  return samples;
}

async function sampleGenerate(url: string, count: number): Promise<Sample[]> {
  const payload = {
    business_name: 'Performance Sample',
    business_type: 'Cafe',
    city: 'Lisbon',
  };

  const samples: Sample[] = [];

  for (let index = 0; index < count; index += 1) {
    const start = performance.now();
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });
      await response.text();
      samples.push({
        status: response.status,
        elapsedMs: performance.now() - start,
        serverTimingRaw: response.headers.get('server-timing'),
        pageTiming: {},
      });
    } catch {
      samples.push({
        status: 0,
        elapsedMs: performance.now() - start,
        serverTimingRaw: null,
        pageTiming: {},
      });
    }
  }

  return samples;
}

async function runSamples(target: Target, count: number, warmup: number): Promise<Sample[]> {
  for (let index = 0; index < warmup; index += 1) {
    if (target.type === 'post-generate') {
      await sampleGenerate(target.url, 1);
    } else {
      await sampleGet(target.url, 1);
    }
  }

  return target.type === 'post-generate'
    ? sampleGenerate(target.url, count)
    : sampleGet(target.url, count);
}

function printSummary(label: string, samples: Sample[]): void {
  const info = summarize(samples);
  console.log(`\n${label}`);
  console.log(`  count=${info.count} failures=${info.failures}`);
  console.log(`  min=${info.min.toFixed(0)}ms p50=${info.p50.toFixed(0)}ms p95=${info.p95.toFixed(0)}ms max=${info.max.toFixed(0)}ms avg=${info.avg.toFixed(0)}ms`);

  const timingBreakdown: Record<string, number[]> = {};
  for (const sample of samples) {
    const parsed = parseServerTiming(sample.serverTimingRaw);
    for (const [metric, value] of Object.entries(parsed)) {
      if (!timingBreakdown[metric]) {
        timingBreakdown[metric] = [];
      }
      timingBreakdown[metric].push(value);
    }

    for (const [metric, value] of Object.entries(sample.pageTiming)) {
      if (!timingBreakdown[metric]) {
        timingBreakdown[metric] = [];
      }
      timingBreakdown[metric].push(value);
    }
  }

  const metrics = Object.keys(timingBreakdown).sort();
  if (metrics.length === 0) {
    console.log('  server_timing=none');
    return;
  }

  console.log('  server_timing:');
  for (const metric of metrics) {
    const values = timingBreakdown[metric];
    const metricSummary = summarize(
      values.map((value) => ({ status: 200, elapsedMs: value, serverTimingRaw: null, pageTiming: {} }))
    );
    console.log(
      `    ${metric}: p50=${metricSummary.p50.toFixed(1)}ms p95=${metricSummary.p95.toFixed(1)}ms avg=${metricSummary.avg.toFixed(1)}ms`
    );
  }
}

function buildBudgetConfig(targets: Target[]): BudgetConfig {
  const p95ByTargetKey: Record<string, number> = {};
  for (const target of targets) {
    const key = toTargetKey(target.label);
    const value = parseOptionalArgNumber(`--budget-p95-${key}`);
    if (value != null) {
      p95ByTargetKey[key] = value;
    }
  }

  return {
    strict: hasFlag('--strict'),
    maxFailureRate: parseOptionalArgNumber('--budget-failure-rate'),
    p95ByTargetKey,
  };
}

function evaluateBudgets(
  targets: Target[],
  summaryByKey: Record<string, Summary>,
  budget: BudgetConfig,
): string[] {
  const failures: string[] = [];

  for (const target of targets) {
    const key = toTargetKey(target.label);
    const summary = summaryByKey[key];
    if (!summary) continue;

    const p95Budget = budget.p95ByTargetKey[key];
    if (Number.isFinite(p95Budget) && summary.p95 > p95Budget) {
      failures.push(`${target.label}: p95 ${summary.p95.toFixed(0)}ms > budget ${p95Budget.toFixed(0)}ms`);
    }

    if (budget.maxFailureRate != null && summary.count > 0) {
      const failureRate = (summary.failures / summary.count) * 100;
      if (failureRate > budget.maxFailureRate) {
        failures.push(
          `${target.label}: failure rate ${failureRate.toFixed(1)}% > budget ${budget.maxFailureRate.toFixed(1)}%`
        );
      }
    }
  }

  return failures;
}

async function main(): Promise<void> {
  loadDotEnvFile(resolve(process.cwd(), '.env.local'));

  const count = parseArgNumber('--count', 5);
  const warmup = parseArgNumber('--warmup', 0);
  const includeGenerate = hasFlag('--include-generate');

  const configuredBase =
    readEnv('PERF_SAMPLE_BASE_URL') ||
    readEnv('NEXT_PUBLIC_SITE_URL') ||
    'https://sitespresso.com';

  const baseUrl = /localhost|127\.0\.0\.1/i.test(configuredBase)
    ? 'https://sitespresso.com'
    : configuredBase.replace(/\/$/, '');
  const slug = await discoverPublishedSlug(baseUrl);

  const targets: Target[] = [
    { label: 'Home', url: `${baseUrl}/`, type: 'get' },
    { label: 'Robots', url: `${baseUrl}/robots.txt`, type: 'get' },
    { label: 'Sitemap', url: `${baseUrl}/sitemap.xml`, type: 'get' },
  ];

  if (slug) {
    targets.push({ label: 'Published Home', url: `${baseUrl}/sites/${slug}`, type: 'get' });
    targets.push({ label: 'Published About', url: `${baseUrl}/sites/${slug}/about`, type: 'get' });
    targets.push({ label: 'Published Contact', url: `${baseUrl}/sites/${slug}/contact`, type: 'get' });
  }

  if (includeGenerate) {
    targets.push({ label: 'Generate API', url: `${baseUrl}/api/generate`, type: 'post-generate' });
  }

  const budget = buildBudgetConfig(targets);
  const summaryByKey: Record<string, Summary> = {};

  console.log('Running performance sample...');
  console.log(`  base_url=${baseUrl}`);
  console.log(`  samples_per_route=${count}`);
  console.log(`  warmup_per_route=${warmup}`);
  console.log(`  include_generate=${includeGenerate ? 'yes' : 'no'}`);
  console.log(`  strict_mode=${budget.strict ? 'yes' : 'no'}`);
  if (!slug) {
    console.log('  slug=not found (published page checks skipped)');
  }

  for (const target of targets) {
    const samples = await runSamples(target, count, warmup);

    printSummary(target.label, samples);
    summaryByKey[toTargetKey(target.label)] = summarize(samples);
  }

  const budgetFailures = evaluateBudgets(targets, summaryByKey, budget);
  if (budgetFailures.length > 0) {
    console.log('\nPerformance budgets: FAIL');
    for (const failure of budgetFailures) {
      console.log(`  - ${failure}`);
    }
  } else if (Object.keys(budget.p95ByTargetKey).length > 0 || budget.maxFailureRate != null) {
    console.log('\nPerformance budgets: PASS');
  }

  console.log('\nPerformance sampling complete.');

  if (budget.strict && budgetFailures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Performance sample failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

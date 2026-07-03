import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

type SiteRow = {
  id: string;
  slug: string | null;
  status: string;
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

function parseArgString(flag: string): string | null {
  const arg = process.argv.find((entry) => entry.startsWith(`${flag}=`));
  if (!arg) return null;

  const value = arg.split('=').slice(1).join('=').trim();
  return value || null;
}

function logResult(label: string, passed: boolean, details?: string): void {
  const prefix = passed ? '[OK]' : '[FAIL]';
  console.log(`  ${prefix} ${label}${details ? ` (${details})` : ''}`);
}

async function main(): Promise<void> {
  console.log('Running analytics QA checks...');

  loadDotEnvFile(resolve(process.cwd(), '.env.local'));

  const baseUrlRaw =
    parseArgString('--base-url') ||
    readEnv('PERF_SAMPLE_BASE_URL') ||
    readEnv('NEXT_PUBLIC_SITE_URL') ||
    'https://sitespresso.com';

  const baseUrl = /localhost|127\.0\.0\.1/i.test(baseUrlRaw)
    ? 'https://sitespresso.com'
    : baseUrlRaw.replace(/\/$/, '');

  const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  logResult('NEXT_PUBLIC_SUPABASE_URL is available', Boolean(supabaseUrl));
  logResult('SUPABASE_SERVICE_ROLE_KEY is available', Boolean(serviceRoleKey));

  if (!supabaseUrl || !serviceRoleKey) {
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: sites, error: siteError } = await supabase
    .from('sites')
    .select('id, slug, status')
    .eq('status', 'published')
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (siteError) {
    logResult('Fetch published site slug', false, siteError.message);
    process.exit(1);
  }

  const site = (sites?.[0] ?? null) as SiteRow | null;
  logResult('Published site slug found', Boolean(site?.slug));
  if (!site?.slug) {
    process.exit(1);
  }

  const slug = site.slug;
  const startWindowIso = new Date(Date.now() - 2 * 60 * 1000).toISOString();

  const beforeQuery = await supabase
    .from('site_page_views')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)
    .gte('viewed_at', startWindowIso);

  if (beforeQuery.error) {
    logResult('Read site_page_views before event', false, beforeQuery.error.message);
    process.exit(1);
  }

  const beforeCount = beforeQuery.count ?? 0;
  logResult('Baseline recent pageview count read', true, `count=${beforeCount}`);

  const response = await fetch(`${baseUrl}/api/analytics/pageview`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'SiteSpressoAnalyticsQA/1.0',
      'x-forwarded-for': '198.51.100.20',
    },
    body: JSON.stringify({ slug, path: '/about' }),
    cache: 'no-store',
  });

  logResult('Analytics endpoint returned 204', response.status === 204, `status=${response.status}`);
  if (response.status !== 204) {
    process.exit(1);
  }

  const deadline = Date.now() + 15000;
  let afterCount = beforeCount;

  while (Date.now() < deadline) {
    const afterQuery = await supabase
      .from('site_page_views')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)
      .gte('viewed_at', startWindowIso);

    if (afterQuery.error) {
      logResult('Read site_page_views after event', false, afterQuery.error.message);
      process.exit(1);
    }

    afterCount = afterQuery.count ?? beforeCount;
    if (afterCount > beforeCount) {
      break;
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }

  const incremented = afterCount > beforeCount;
  logResult('Pageview persisted in site_page_views', incremented, `before=${beforeCount}; after=${afterCount}`);

  if (!incremented) {
    process.exit(1);
  }

  console.log('');
  console.log('Analytics QA checks passed.');
}

main().catch((error) => {
  console.error('Analytics QA failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

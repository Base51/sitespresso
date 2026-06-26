import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

type SiteRow = {
  id: string;
  slug: string | null;
  custom_domain: string | null;
  domain_verified: boolean | null;
  domain_attached: boolean | null;
  status: string;
};

type CheckResult = {
  label: string;
  passed: boolean;
  details?: string;
};

const results: CheckResult[] = [];

function addResult(label: string, passed: boolean, details = ''): void {
  results.push({ label, passed, details });
  const prefix = passed ? '[OK]' : '[FAIL]';
  console.log(`  ${prefix} ${label}${details ? ` (${details})` : ''}`);
}

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
    if (!key || process.env[key] != null) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
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

function readCanonicalHref(html: string): string | null {
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (!canonicalMatch?.[1]) return null;
  return canonicalMatch[1].trim();
}

async function fetchPage(url: string): Promise<{ status: number; body: string }> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const body = await res.text();
    return { status: res.status, body };
  } catch {
    return { status: 0, body: '' };
  }
}

async function assertRouteAndCanonical(url: string, expectedCanonical: string, label: string): Promise<void> {
  const res = await fetchPage(url);
  addResult(`${label} returns 200`, res.status === 200, `status=${res.status}; url=${url}`);

  if (res.status !== 200) return;

  const canonical = readCanonicalHref(res.body);
  addResult(`${label} canonical matches`, canonical === expectedCanonical, `expected=${expectedCanonical}; actual=${canonical ?? 'none'}`);
}

async function main(): Promise<void> {
  console.log('Running multipage published QA checks...');

  loadDotEnvFile(resolve(process.cwd(), '.env.local'));

  const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  const configuredBaseUrl =
    readEnv('MULTIPAGE_QA_BASE_URL') ||
    readEnv('NEXT_PUBLIC_SITE_URL') ||
    'https://sitespresso.com';

  const baseUrl =
    /localhost|127\.0\.0\.1/i.test(configuredBaseUrl)
      ? 'https://sitespresso.com'
      : configuredBaseUrl.replace(/\/$/, '');

  addResult('NEXT_PUBLIC_SUPABASE_URL is available', Boolean(supabaseUrl));
  addResult('SUPABASE_SERVICE_ROLE_KEY is available', Boolean(serviceRoleKey));

  if (!supabaseUrl || !serviceRoleKey) {
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('sites')
    .select('id, slug, custom_domain, domain_verified, domain_attached, status')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    addResult('Fetch published sites', false, error.message);
    process.exit(1);
  }

  const sites = (data ?? []) as SiteRow[];
  addResult('Published sites available for QA', sites.length > 0, `count=${sites.length}`);

  const site = sites.find((item) => Boolean(item.slug));
  addResult('Published site with slug found', Boolean(site));
  if (!site?.slug) {
    process.exit(1);
  }

  const slug = site.slug;
  console.log(`  [INFO] Using site slug: ${slug}`);

  await assertRouteAndCanonical(`${baseUrl}/sites/${slug}`, `${baseUrl}/sites/${slug}`, 'Primary Home');
  await assertRouteAndCanonical(`${baseUrl}/sites/${slug}/about`, `${baseUrl}/sites/${slug}/about`, 'Primary About');
  await assertRouteAndCanonical(`${baseUrl}/sites/${slug}/contact`, `${baseUrl}/sites/${slug}/contact`, 'Primary Contact');

  const customSite = sites.find(
    (item) => Boolean(item.custom_domain) && item.domain_verified === true && item.domain_attached === true
  );

  if (customSite?.custom_domain) {
    const host = customSite.custom_domain;
    console.log(`  [INFO] Using custom domain: ${host}`);

    await assertRouteAndCanonical(`https://${host}/`, `https://${host}/`, 'Custom Home');
    await assertRouteAndCanonical(`https://${host}/about`, `https://${host}/about`, 'Custom About');
    await assertRouteAndCanonical(`https://${host}/contact`, `https://${host}/contact`, 'Custom Contact');
  } else {
    console.log('  [WARN] No attached+verified custom domain found; skipping custom-host checks.');
  }

  const failed = results.filter((result) => !result.passed);
  if (failed.length > 0) {
    console.log('');
    console.log('Multipage QA checks failed:');
    for (const item of failed) {
      console.log(`  - ${item.label}${item.details ? ` (${item.details})` : ''}`);
    }
    process.exit(1);
  }

  console.log('');
  console.log('Multipage QA checks passed.');
}

main().catch((error) => {
  console.error('Unexpected multipage QA error:', error instanceof Error ? error.message : error);
  process.exit(1);
});

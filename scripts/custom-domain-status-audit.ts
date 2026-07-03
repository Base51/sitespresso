import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { verifyCustomDomainDns } from '../lib/domains-server';

type SiteRow = {
  id: string;
  slug: string | null;
  status: string;
  custom_domain: string | null;
  domain_verified: boolean;
  domain_attached: boolean;
  updated_at: string | null;
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

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toISOString();
}

function getVercelConfig(): { token: string; projectId: string; teamId?: string } | null {
  const token = readEnv('VERCEL_ACCESS_TOKEN');
  const projectId = readEnv('VERCEL_PROJECT_ID');
  const teamId = readEnv('VERCEL_TEAM_ID') || undefined;

  if (!token || !projectId) {
    return null;
  }

  return { token, projectId, teamId };
}

function buildVercelUrl(pathname: string, teamId?: string): string {
  const url = new URL(`https://api.vercel.com${pathname}`);
  if (teamId) {
    url.searchParams.set('teamId', teamId);
  }
  return url.toString();
}

async function isDomainAttachedInVercel(
  domain: string,
  config: { token: string; projectId: string; teamId?: string } | null,
): Promise<boolean | null> {
  if (!config) {
    return null;
  }

  const response = await fetch(
    buildVercelUrl(`/v10/projects/${config.projectId}/domains/${domain}`, config.teamId),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store',
    },
  );

  if (response.ok) {
    return true;
  }

  if (response.status === 404) {
    return false;
  }

  return null;
}

async function main(): Promise<void> {
  loadDotEnvFile(resolve(process.cwd(), '.env.local'));

  const applyChanges = process.argv.includes('--apply');
  const strictMode = process.argv.includes('--strict');

  const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  const vercelConfig = getVercelConfig();

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from('sites')
    .select('id, slug, status, custom_domain, domain_verified, domain_attached, updated_at')
    .not('custom_domain', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error(`Failed to load sites: ${error.message}`);
    process.exit(1);
  }

  const rows = (data ?? []) as SiteRow[];

  if (rows.length === 0) {
    console.log('No sites with custom domains found.');
    return;
  }

  console.log(`Found ${rows.length} custom-domain site(s):`);
  console.log(`Mode: ${applyChanges ? 'apply' : 'report-only'}`);
  console.log(`Strict: ${strictMode ? 'on' : 'off'}`);
  if (!vercelConfig) {
    console.log('Vercel API check: unavailable (missing VERCEL_ACCESS_TOKEN or VERCEL_PROJECT_ID)');
  }
  console.log('');

  let mismatches = 0;
  let repaired = 0;

  for (const site of rows) {
    const domain = site.custom_domain ?? '';

    if (!domain || !site.slug) {
      console.log(`- site=${site.id} slug=${site.slug ?? '-'} domain=${domain || '-'} status=SKIP (missing slug/domain)`);
      continue;
    }

    const dns = await verifyCustomDomainDns(domain, site.slug);
    const vercelAttached = await isDomainAttachedInVercel(domain, vercelConfig);
    const dnsMatchesSaved = dns.verified === Boolean(site.domain_verified);
    const attachMatchesSaved =
      vercelAttached == null ? true : vercelAttached === Boolean(site.domain_attached);

    if (!dnsMatchesSaved || !attachMatchesSaved) {
      mismatches += 1;
    }

    const flags = `saved(verified=${site.domain_verified},attached=${site.domain_attached})`;
    const observed = `dns(verified=${dns.verified}) vercel(attached=${vercelAttached == null ? 'unknown' : String(vercelAttached)})`;
    const marker = dnsMatchesSaved && attachMatchesSaved ? 'OK' : 'MISMATCH';

    console.log(`- [${marker}] site=${site.id}`);
    console.log(`  slug=${site.slug} status=${site.status} updated=${formatDate(site.updated_at)}`);
    console.log(`  domain=${domain}`);
    console.log(`  ${flags} ${observed}`);
    console.log(`  expectedTarget=${dns.expectedTarget}`);
    console.log(`  reason=${dns.reason}`);
    if (dns.expectedRecords.length) {
      console.log(`  expectedRecords=${dns.expectedRecords.join(', ')}`);
    }
    if (dns.observedRecords.length) {
      console.log(`  observedRecords=${dns.observedRecords.join(', ')}`);
    }

    if (applyChanges && (!dnsMatchesSaved || !attachMatchesSaved)) {
      const nextVerified = dns.verified;
      const nextAttached = vercelAttached == null ? site.domain_attached : vercelAttached;

      const { error: updateError } = await supabase
        .from('sites')
        .update({
          domain_verified: nextVerified,
          domain_attached: nextAttached,
          updated_at: new Date().toISOString(),
        })
        .eq('id', site.id);

      if (updateError) {
        console.log(`  repair=FAILED (${updateError.message})`);
      } else {
        repaired += 1;
        console.log(`  repair=APPLIED (verified=${nextVerified}, attached=${nextAttached})`);
      }
    }

    console.log('');
  }

  console.log(`Audit complete. DNS/status mismatches: ${mismatches}. Repairs applied: ${repaired}.`);

  if (mismatches > 0 && !applyChanges) {
    console.log('Action: run dashboard -> Check DNS for affected site(s), then Attach to Vercel if verified.');
  }

  if (strictMode && mismatches > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Audit failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

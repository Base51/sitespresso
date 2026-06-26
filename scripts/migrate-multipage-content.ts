import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { normalizeWebsiteContent } from '../lib/schemas/website';

type SiteRow = {
  id: string;
  slug: string | null;
  content: unknown;
};

const args = new Set(process.argv.slice(2));
const applyChanges = args.has('--apply');
const dryRun = !applyChanges || args.has('--dry-run');

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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

loadDotEnvFile(resolve(process.cwd(), '.env.local'));

const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL');
const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

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

const pageSize = 200;
let offset = 0;
let total = 0;
let unchanged = 0;
let candidates = 0;
let updated = 0;
let parseFailures = 0;
let updateFailures = 0;

const parseFailureSites: Array<{ id: string; slug: string | null; error: string }> = [];
const updateFailureSites: Array<{ id: string; slug: string | null; error: string }> = [];

async function main(): Promise<void> {
  console.log(`Running multipage content migration (${dryRun ? 'dry-run' : 'apply'})...`);

  while (true) {
    const { data, error } = await supabase
      .from('sites')
      .select('id, slug, content')
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(`Failed to fetch sites at offset ${offset}: ${error.message}`);
      process.exit(1);
    }

    const rows = (data ?? []) as SiteRow[];
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      total += 1;

      let normalized: unknown;
      try {
        normalized = normalizeWebsiteContent(row.content);
      } catch (error) {
        parseFailures += 1;
        parseFailureSites.push({
          id: row.id,
          slug: row.slug,
          error: error instanceof Error ? error.message : 'Unknown parse error',
        });
        continue;
      }

      const changed = stableStringify(row.content) !== stableStringify(normalized);
      if (!changed) {
        unchanged += 1;
        continue;
      }

      candidates += 1;

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('sites')
          .update({ content: normalized })
          .eq('id', row.id);

        if (updateError) {
          updateFailures += 1;
          updateFailureSites.push({
            id: row.id,
            slug: row.slug,
            error: updateError.message,
          });
        } else {
          updated += 1;
        }
      }
    }

    if (rows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  console.log('');
  console.log('Migration summary:');
  console.log(`  Mode              : ${dryRun ? 'dry-run' : 'apply'}`);
  console.log(`  Total sites       : ${total}`);
  console.log(`  Needs migration   : ${candidates}`);
  console.log(`  Unchanged         : ${unchanged}`);
  console.log(`  Parse failures    : ${parseFailures}`);
  console.log(`  Updated           : ${updated}`);
  console.log(`  Update failures   : ${updateFailures}`);

  if (parseFailureSites.length > 0) {
    console.log('');
    console.log('Parse failures (first 20):');
    for (const item of parseFailureSites.slice(0, 20)) {
      console.log(`  - id=${item.id} slug=${item.slug ?? 'null'} error=${item.error}`);
    }
  }

  if (updateFailureSites.length > 0) {
    console.log('');
    console.log('Update failures (first 20):');
    for (const item of updateFailureSites.slice(0, 20)) {
      console.log(`  - id=${item.id} slug=${item.slug ?? 'null'} error=${item.error}`);
    }
  }

  if (parseFailures > 0 || updateFailures > 0) {
    process.exit(1);
  }

  console.log('');
  console.log('Multipage content migration check completed successfully.');
}

main().catch((error) => {
  console.error('Unexpected migration error:', error instanceof Error ? error.message : error);
  process.exit(1);
});

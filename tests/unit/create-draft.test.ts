import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDraftSite } from '@/lib/sites/create-draft';

// Pure unit tests with fake Supabase clients. No real database, credentials or network.

type Result = { data?: unknown; error?: unknown; count?: number | null };

/** Chainable fake query builder: every method returns itself; awaiting it yields `result`. */
function fakeQuery(result: Result) {
  const calls: Array<[string, unknown[]]> = [];
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'order', 'limit', 'insert']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.single = () => Promise.resolve(result);
  builder.then = (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return { builder, calls };
}

function fakeSessionClient(opts: { plan?: string; priceId?: string; siteCount: number }) {
  const tables: string[] = [];
  const queries: Record<string, ReturnType<typeof fakeQuery>> = {
    profiles: fakeQuery({ data: { plan: opts.plan ?? 'free' }, error: null }),
    subscriptions: fakeQuery({
      data: opts.priceId ? [{ status: 'active', stripe_price_id: opts.priceId }] : [],
      error: null,
    }),
    sites: fakeQuery({ data: null, error: null, count: opts.siteCount }),
  };
  return {
    tables,
    queries,
    client: {
      from: (table: string) => {
        tables.push(table);
        return queries[table].builder;
      },
    },
  };
}

function fakeAdminClient(insertResult: Result = { data: { id: 'site-new' }, error: null }) {
  const q = fakeQuery(insertResult);
  return { query: q, client: { from: vi.fn(() => q.builder) } };
}

const validContent = {
  business_name: 'Café Lisboa',
  business_type: 'cafe',
  city: 'Lisbon',
  tagline: 'Coffee and pastries since 1990',
};

beforeEach(() => {
  vi.stubEnv('STRIPE_PRO_PRICE_ID', 'price_fake_pro_monthly');
  vi.stubEnv('STRIPE_AGENCY_PRICE_ID', 'price_fake_agency_monthly');
});

describe('createDraftSite', () => {
  it('rejects invalid content before touching the database', async () => {
    const session = fakeSessionClient({ siteCount: 0 });
    const getAdminClient = vi.fn();
    const result = await createDraftSite({
      userId: 'user-1',
      content: { business_name: '', business_type: 'cafe', city: 'Lisbon' },
      sessionClient: session.client,
      getAdminClient,
    });
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(session.tables).toEqual([]);
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it.each([
    ['free', undefined, 1, 1],
    ['starter', undefined, 1, 1],
    ['pro', undefined, 3, 3],
    ['free', 'price_fake_pro_monthly', 3, 3],
  ])('%s (price %s) at %i sites is blocked with limit %i and never uses the service role', async (plan, priceId, count, limit) => {
    const session = fakeSessionClient({ plan, priceId, siteCount: count });
    const getAdminClient = vi.fn();
    const result = await createDraftSite({
      userId: 'user-1',
      content: validContent,
      sessionClient: session.client,
      getAdminClient,
    });
    expect(result).toMatchObject({
      ok: false,
      status: 403,
      details: { requiresUpgrade: true, siteCount: count, siteLimit: limit },
    });
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it('agency is unlimited', async () => {
    const session = fakeSessionClient({ plan: 'agency', siteCount: 250 });
    const admin = fakeAdminClient();
    const result = await createDraftSite({
      userId: 'user-1',
      content: validContent,
      sessionClient: session.client,
      getAdminClient: () => admin.client,
      randomSuffix: () => 'abcd1234',
    });
    expect(result).toMatchObject({ ok: true, status: 201, id: 'site-new' });
  });

  it('under the limit inserts with the service role, user_id from the session and status draft', async () => {
    const session = fakeSessionClient({ plan: 'pro', siteCount: 2 });
    const admin = fakeAdminClient();
    const content = { ...validContent, user_id: 'attacker', status: 'published' };
    const result = await createDraftSite({
      userId: 'session-user',
      content,
      sessionClient: session.client,
      getAdminClient: () => admin.client,
      randomSuffix: () => 'abcd1234',
    });
    expect(result).toEqual({ ok: true, status: 201, id: 'site-new', slug: 'cafe-lisboa-abcd1234' });
    expect(admin.client.from).toHaveBeenCalledWith('sites');
    const insertCall = admin.query.calls.find(([m]) => m === 'insert');
    const row = insertCall?.[1][0] as Record<string, unknown>;
    expect(row.user_id).toBe('session-user');
    expect(row.status).toBe('draft');
    expect(row.slug).toBe('cafe-lisboa-abcd1234');
    // The session client is used only for reads; it never inserts.
    for (const q of Object.values(session.queries)) {
      expect(q.calls.some(([m]) => m === 'insert')).toBe(false);
    }
  });

  it('returns 500 when the site count cannot be read, without inserting', async () => {
    const session = fakeSessionClient({ siteCount: 0 });
    session.queries.sites = fakeQuery({ data: null, error: { message: 'boom' }, count: null });
    const getAdminClient = vi.fn();
    const result = await createDraftSite({
      userId: 'user-1',
      content: validContent,
      sessionClient: session.client,
      getAdminClient,
    });
    expect(result).toMatchObject({ ok: false, status: 500 });
    expect(getAdminClient).not.toHaveBeenCalled();
  });

  it('returns 500 when the service-role insert fails', async () => {
    const session = fakeSessionClient({ siteCount: 0 });
    const admin = fakeAdminClient({ data: null, error: { message: 'duplicate' } });
    const result = await createDraftSite({
      userId: 'user-1',
      content: validContent,
      sessionClient: session.client,
      getAdminClient: () => admin.client,
    });
    expect(result).toMatchObject({ ok: false, status: 500 });
  });
});

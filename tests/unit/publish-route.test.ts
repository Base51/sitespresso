import { beforeEach, describe, expect, it, vi } from 'vitest';

// Unit tests for POST /api/sites/[id]/publish with mocked Supabase clients.
// No real database, credentials or network.

type Result = { data?: unknown; error?: unknown };

function fakeQuery(result: Result, calls: Array<[string, unknown[]]>) {
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'update']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.single = () => Promise.resolve(result);
  builder.then = (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return builder;
}

const state = {
  user: { id: 'user-1' } as { id: string } | null,
  plan: 'free',
  site: { id: 'site-1', user_id: 'user-1', slug: 'draft-abc', status: 'draft', business_name: 'Cafe Lisboa', content: {} },
  sessionCalls: [] as Array<[string, string, unknown[]]>,
  adminCalls: [] as Array<[string, unknown[]]>,
  adminCreated: 0,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      const calls: Array<[string, unknown[]]> = [];
      const result: Result =
        table === 'profiles'
          ? { data: { plan: state.plan }, error: null }
          : { data: state.site, error: null };
      const q = fakeQuery(result, calls);
      // Record every session-client call with its table so tests can assert
      // the session client never writes.
      return new Proxy(q, {
        get(target, prop: string) {
          const value = (target as Record<string, unknown>)[prop];
          if (typeof value === 'function' && ['select', 'eq', 'update'].includes(prop)) {
            return (...args: unknown[]) => {
              state.sessionCalls.push([table, prop, args]);
              return (value as (...a: unknown[]) => unknown)(...args);
            };
          }
          return value;
        },
      });
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    state.adminCreated += 1;
    return {
      from: (table: string) => {
        state.adminCalls.push(['from', [table]]);
        return fakeQuery({ data: null, error: null }, state.adminCalls);
      },
    };
  },
}));

vi.mock('@/lib/redis/rate-limiter', () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));

vi.mock('@/lib/slug', () => ({
  generateSlug: () => 'cafe-lisboa',
  isReservedSlug: () => false,
  findUniqueSlug: async () => 'cafe-lisboa',
}));

async function callPublish() {
  const { POST } = await import('@/app/api/sites/[id]/publish/route');
  const request = new Request('https://sitespresso.com/api/sites/site-1/publish', {
    method: 'POST',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await POST(request as any, { params: { id: 'site-1' } });
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  state.user = { id: 'user-1' };
  state.plan = 'free';
  state.site = { id: 'site-1', user_id: 'user-1', slug: 'draft-abc', status: 'draft', business_name: 'Cafe Lisboa', content: {} };
  state.sessionCalls = [];
  state.adminCalls = [];
  state.adminCreated = 0;
});

describe('POST /api/sites/[id]/publish', () => {
  it('requires billing for Free users and never writes', async () => {
    const { status, body } = await callPublish();
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: false, requiresBilling: true });
    expect(state.adminCreated).toBe(0);
    expect(state.sessionCalls.some(([, method]) => method === 'update')).toBe(false);
  });

  it('publishes for paid users with the service role, scoped to the owner', async () => {
    state.plan = 'starter';
    const { status, body } = await callPublish();
    expect(status).toBe(200);
    expect(body).toMatchObject({ success: true, slug: 'cafe-lisboa' });

    // The session client only reads.
    expect(state.sessionCalls.some(([, method]) => method === 'update')).toBe(false);

    // The write goes through the admin client with both id and user_id filters.
    expect(state.adminCalls).toContainEqual(['from', ['sites']]);
    const update = state.adminCalls.find(([m]) => m === 'update');
    expect(update?.[1][0]).toMatchObject({ slug: 'cafe-lisboa', status: 'published' });
    expect(state.adminCalls).toContainEqual(['eq', ['id', 'site-1']]);
    expect(state.adminCalls).toContainEqual(['eq', ['user_id', 'user-1']]);
  });

  it('rejects publishing someone else\'s site before any write', async () => {
    state.plan = 'pro';
    state.site = { ...state.site, user_id: 'someone-else' };
    const { status } = await callPublish();
    expect(status).toBe(403);
    expect(state.adminCreated).toBe(0);
  });

  it('returns 401 when not signed in', async () => {
    state.user = null;
    const { status } = await callPublish();
    expect(status).toBe(401);
    expect(state.adminCreated).toBe(0);
  });
});

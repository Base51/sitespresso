import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createDraftSite } from '@/lib/sites/create-draft';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store, max-age=0' };

/**
 * POST /api/sites: create a draft site for the signed-in user.
 * Clients can no longer insert into `sites` directly (see
 * docs/RLS_PLAN_AND_SITE_INSERTS.md); this route enforces the plan's site limit
 * and inserts with the service role.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400, headers: NO_STORE });
    }

    const content = (body as { content?: unknown } | null)?.content;

    const result = await createDraftSite({
      userId: user.id,
      content,
      sessionClient: supabase,
      getAdminClient: createAdminClient,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.details ?? {}) },
        { status: result.status, headers: NO_STORE },
      );
    }

    return NextResponse.json({ id: result.id, slug: result.slug }, { status: 201, headers: NO_STORE });
  } catch (error) {
    console.error('[sites:create] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: NO_STORE });
  }
}

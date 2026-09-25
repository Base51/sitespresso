import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store, max-age=0' } as const;

function withNoStore(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function GET(): Promise<NextResponse> {
  try {
    // Admin gate runs before any subscription, profile or env data is read.
    // 401 unauthenticated, 403 non-admin, 500 if the allowlist is not configured (fail closed).
    const admin = await requireAdminSession();
    if (!admin.ok) {
      return withNoStore(admin.response);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return withNoStore(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Get subscription info
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('stripe_price_id, status, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    // Get profile info
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', user.id)
      .single();

    const envAgencyMonthly = process.env.STRIPE_AGENCY_PRICE_ID;
    const envAgencyAnnual = process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID;
    const latestPriceId = subscriptions?.[0]?.stripe_price_id;

    const payload = {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: {
        plan: profile?.plan,
        stripe_customer_id: profile?.stripe_customer_id,
      },
      subscriptions: subscriptions || [],
      latestSubscription: subscriptions?.[0] || null,
      envConfig: {
        STRIPE_AGENCY_PRICE_ID: envAgencyMonthly,
        STRIPE_AGENCY_ANNUAL_PRICE_ID: envAgencyAnnual,
      },
      match: {
        latestPriceId,
        matchesAgencyMonthly: latestPriceId === envAgencyMonthly,
        matchesAgencyAnnual: latestPriceId === envAgencyAnnual,
      },
    };

    return NextResponse.json(payload, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error('[debug/subscription] request failed:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

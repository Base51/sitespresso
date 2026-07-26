import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

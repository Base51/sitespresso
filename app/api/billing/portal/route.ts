import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

function getBaseUrl(request: NextRequest): string {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const host = request.headers.get('host');
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sitespresso.com';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (error || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing profile found for this account.' },
        { status: 404 },
      );
    }

    const stripe = getStripe();
    const baseUrl = getBaseUrl(request);

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrl}/dashboard`,
    });

    return NextResponse.json({ success: true, portalUrl: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session.' },
      { status: 500 },
    );
  }
}

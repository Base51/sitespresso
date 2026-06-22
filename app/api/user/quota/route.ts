import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/redis/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile for plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = (profile?.plan as 'free' | 'starter' | 'pro' | 'agency') ?? 'free';

    // Get rate limit info (which tracks remaining quota)
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimit = await checkRateLimit(user.id, userPlan, ip);

    return NextResponse.json({
      plan: userPlan,
      remaining: rateLimit.remaining,
      resetTime: rateLimit.resetTime,
    });
  } catch (error) {
    console.error('Quota endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deriveReferralCode } from '@/lib/referral';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: referrals } = await admin
    .from('referrals')
    .select('referred_user_id, status, reward_amount_cents, created_at, rewarded_at')
    .eq('referrer_user_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (referrals as Array<{
    referred_user_id: string;
    status: string;
    reward_amount_cents: number | null;
    created_at: string;
    rewarded_at: string | null;
  }> | null) ?? [];

  const totalEarnedCents = rows
    .filter((row) => row.status === 'rewarded')
    .reduce((sum, row) => sum + (row.reward_amount_cents ?? 0), 0);

  return NextResponse.json({
    referralCode: deriveReferralCode(user.id),
    referrals: rows.map((row) => ({
      status: row.status,
      reward_amount_cents: row.reward_amount_cents,
      created_at: row.created_at,
      rewarded_at: row.rewarded_at,
    })),
    totalEarnedCents,
  });
}

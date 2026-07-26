import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deriveReferralCode } from '@/lib/referral';

export const runtime = 'nodejs';

type Insertable = {
  insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
};

const BodySchema = z.object({
  referral_code: z.string().min(6).max(12).toUpperCase(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let referralCode: string;
  try {
    const body = BodySchema.parse(await request.json());
    referralCode = body.referral_code;
  } catch {
    return NextResponse.json({ error: 'Invalid referral code.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the referrer: scan all profiles and check if derived code matches
  // This is efficient because codes are deterministic — no extra column needed.
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id')
    .neq('id', user.id);

  if (profilesError) {
    console.error('[referral] profiles fetch error:', profilesError.message);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }

  const referrer = (profiles as Array<{ id: string }> | null)?.find(
    (profile) => deriveReferralCode(profile.id) === referralCode,
  );

  if (!referrer) {
    return NextResponse.json({ error: 'Referral code not found.' }, { status: 404 });
  }

  if (referrer.id === user.id) {
    return NextResponse.json({ error: 'Cannot refer yourself.' }, { status: 400 });
  }

  // Check that this user hasn't already been attributed a referral
  const { data: existing } = await admin
    .from('referrals')
    .select('id')
    .eq('referred_user_id', user.id)
    .limit(1);

  if ((existing as Array<{ id: string }> | null)?.length) {
    // Idempotent — already recorded, that's fine
    return NextResponse.json({ success: true, already_attributed: true });
  }

  const { error: insertError } = await (admin.from('referrals') as unknown as Insertable).insert({
    referrer_user_id: referrer.id,
    referred_user_id: user.id,
    status: 'pending',
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('[referral] insert error:', insertError.message);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

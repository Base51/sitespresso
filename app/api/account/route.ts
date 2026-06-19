import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type AccountPayload = {
  fullName?: string;
  email?: string;
};

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: AccountPayload;

  try {
    payload = (await request.json()) as AccountPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const nextFullName = payload.fullName?.trim() ?? '';
  const nextEmail = payload.email?.trim().toLowerCase() ?? '';

  if (!nextEmail || !nextEmail.includes('@')) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  if (nextFullName.length > 120) {
    return NextResponse.json({ error: 'Full name must be 120 characters or fewer.' }, { status: 400 });
  }

  const profileUpdate = {
    full_name: nextFullName || null,
    email: nextEmail
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let emailChangePending = false;

  if (user.email && user.email.toLowerCase() !== nextEmail) {
    const { error: authError } = await supabase.auth.updateUser({ email: nextEmail });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    emailChangePending = true;
  }

  return NextResponse.json({
    success: true,
    emailChangePending,
    message: emailChangePending
      ? 'Profile saved. Confirm the email change using the verification link sent by Supabase.'
      : 'Profile saved.'
  });
}
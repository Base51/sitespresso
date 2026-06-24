import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AdminSession = {
  userId: string;
  email: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getAdminAllowlistEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWLIST_EMAILS;
  if (!raw) return [];

  return raw
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
}

export async function requireAdminSession(): Promise<
  { ok: true; session: AdminSession } | { ok: false; response: NextResponse }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  const email = normalizeEmail((profile?.email as string | undefined) ?? user.email ?? '');
  if (!email) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Admin access cannot be validated for this account.' },
        { status: 403 },
      ),
    };
  }

  const allowlist = getAdminAllowlistEmails();
  if (allowlist.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Admin allowlist is not configured.' },
        { status: 500 },
      ),
    };
  }

  if (!allowlist.includes(email)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    session: {
      userId: user.id,
      email,
    },
  };
}

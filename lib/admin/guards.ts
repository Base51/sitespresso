import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export type AdminSession = {
  userId: string;
  email: string;
};

export type AdminSessionResult =
  | { ok: true; session: AdminSession }
  | { ok: false; status: 401 | 403 | 500; error: string };

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

export async function getAdminSession(): Promise<AdminSessionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  const email = normalizeEmail((profile?.email as string | undefined) ?? user.email ?? '');
  if (!email) {
    return { ok: false, status: 403, error: 'Admin access cannot be validated for this account.' };
  }

  const allowlist = getAdminAllowlistEmails();
  if (allowlist.length === 0) {
    return { ok: false, status: 500, error: 'Admin allowlist is not configured.' };
  }

  if (!allowlist.includes(email)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  return {
    ok: true,
    session: {
      userId: user.id,
      email,
    },
  };
}

export async function requireAdminSession(): Promise<
  { ok: true; session: AdminSession } | { ok: false; response: NextResponse }
> {
  const result = await getAdminSession();
  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: result.error }, { status: result.status }),
    };
  }

  return result;
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') || '/dashboard';
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  const redirectUrl = new URL(safeNext, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const fallback = new URL('/login?error=config', request.url);
    return NextResponse.redirect(fallback);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string): string | undefined {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions): void {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions): void {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      }
    }
  });

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const fallback = new URL('/login?error=oauth_exchange_failed', request.url);
      return NextResponse.redirect(fallback);
    }

    const user = data.user;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (user && serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      await adminClient.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            null
        },
        { onConflict: 'id' }
      );
    }

    return response;
  }

  const fallback = new URL('/login?error=missing_code', request.url);
  return NextResponse.redirect(fallback);
}
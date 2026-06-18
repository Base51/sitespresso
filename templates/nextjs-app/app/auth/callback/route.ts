import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

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
    await supabase.auth.exchangeCodeForSession(code);
    return response;
  }

  const fallback = new URL('/login?error=missing_code', request.url);
  return NextResponse.redirect(fallback);
}
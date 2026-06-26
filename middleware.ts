import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const ROOT_DOMAIN = 'sitespresso.com';
const PRIMARY_APP_HOSTS = new Set([ROOT_DOMAIN, `www.${ROOT_DOMAIN}`, 'localhost', '127.0.0.1']);
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin']);
const PROTECTED_PATHS = ['/dashboard', '/admin'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, '');
}

function isPrimaryAppHostname(hostname: string): boolean {
  return (
    PRIMARY_APP_HOSTS.has(hostname) ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.dev') ||
    hostname.endsWith('.vercel.local')
  );
}

function resolvePublishedPathname(slug: string, pathname: string): string {
  const normalizedPathname = pathname === '/' ? '' : pathname;
  return `/sites/${slug}${normalizedPathname}`;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const host = request.headers.get('host') ?? '';
  const hostname = normalizeHostname(host.split(':')[0] ?? '');

  const isSubdomain = hostname.endsWith(`.${ROOT_DOMAIN}`);

  if (isSubdomain) {
    const slug = hostname.replace(`.${ROOT_DOMAIN}`, '');

    if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = resolvePublishedPathname(slug, request.nextUrl.pathname);
      return NextResponse.rewrite(url);
    }
  }

  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
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

  if (hostname && !isPrimaryAppHostname(hostname) && !isSubdomain) {
    const { data: customDomainSite } = await supabase
      .from('sites')
      .select('slug')
      .eq('custom_domain', hostname)
      .eq('status', 'published')
      .eq('domain_verified', true)
      .eq('domain_attached', true)
      .maybeSingle();

    if (customDomainSite?.slug) {
      const url = request.nextUrl.clone();
      url.pathname = resolvePublishedPathname(customDomainSite.slug, request.nextUrl.pathname);
      return NextResponse.rewrite(url);
    }
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('next');
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)']
};

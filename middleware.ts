import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const ROOT_DOMAIN = 'sitespresso.com';
const PRIMARY_APP_HOSTS = new Set([ROOT_DOMAIN, `www.${ROOT_DOMAIN}`, 'localhost', '127.0.0.1']);
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin']);
const PROTECTED_PATHS = ['/dashboard', '/admin'];
const CUSTOM_DOMAIN_CACHE_TTL_MS = 60 * 1000;
const customDomainCache = new Map<string, { slug: string | null; expiresAt: number }>();

function finalizeResponse(response: NextResponse, startTimeMs: number): NextResponse {
  const middlewareMs = Math.max(0, performance.now() - startTimeMs);
  const metric = `edge_mw;dur=${middlewareMs.toFixed(1)}`;
  const existing = response.headers.get('server-timing');

  response.headers.set('server-timing', existing ? `${existing}, ${metric}` : metric);
  response.headers.set('x-sitespresso-mw-ms', middlewareMs.toFixed(1));
  return response;
}

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

function getCachedCustomDomainSlug(hostname: string): string | null | undefined {
  const entry = customDomainCache.get(hostname);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    customDomainCache.delete(hostname);
    return undefined;
  }
  return entry.slug;
}

function setCachedCustomDomainSlug(hostname: string, slug: string | null): void {
  customDomainCache.set(hostname, {
    slug,
    expiresAt: Date.now() + CUSTOM_DOMAIN_CACHE_TTL_MS,
  });
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const middlewareStart = performance.now();
  const finalize = (response: NextResponse): NextResponse => finalizeResponse(response, middlewareStart);
  const host = request.headers.get('host') ?? '';
  const hostname = normalizeHostname(host.split(':')[0] ?? '');
  const { pathname } = request.nextUrl;

  const isSubdomain = hostname.endsWith(`.${ROOT_DOMAIN}`);

  if (isSubdomain) {
    const slug = hostname.replace(`.${ROOT_DOMAIN}`, '');

    if (slug && !RESERVED_SUBDOMAINS.has(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = resolvePublishedPathname(slug, request.nextUrl.pathname);
      return finalize(NextResponse.rewrite(url));
    }
  }

  const needsAuthCheck = pathname === '/login' || isProtectedPath(pathname);
  const needsCustomDomainLookup = Boolean(hostname) && !isPrimaryAppHostname(hostname) && !isSubdomain;

  if (!needsAuthCheck && !needsCustomDomainLookup) {
    return finalize(NextResponse.next({ request }));
  }

  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return finalize(response);
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

  if (needsCustomDomainLookup) {
    const cachedSlug = getCachedCustomDomainSlug(hostname);
    if (cachedSlug) {
      const url = request.nextUrl.clone();
      url.pathname = resolvePublishedPathname(cachedSlug, pathname);
      return finalize(NextResponse.rewrite(url));
    }

    if (cachedSlug === null && !needsAuthCheck) {
      return finalize(response);
    }

    const { data: customDomainSite } = await supabase
      .from('sites')
      .select('slug')
      .eq('custom_domain', hostname)
      .eq('status', 'published')
      .eq('domain_verified', true)
      .eq('domain_attached', true)
      .maybeSingle();

    const resolvedSlug = customDomainSite?.slug ?? null;
    setCachedCustomDomainSlug(hostname, resolvedSlug);

    if (resolvedSlug) {
      const url = request.nextUrl.clone();
      url.pathname = resolvePublishedPathname(resolvedSlug, pathname);
      return finalize(NextResponse.rewrite(url));
    }

    if (!needsAuthCheck) {
      return finalize(response);
    }
  }

  if (!needsAuthCheck) {
    return finalize(response);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return finalize(NextResponse.redirect(redirectUrl));
  }

  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('next');
    return finalize(NextResponse.redirect(redirectUrl));
  }

  return finalize(response);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)']
};

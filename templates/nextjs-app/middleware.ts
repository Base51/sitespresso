import { NextRequest, NextResponse } from 'next/server';

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin']);

export function middleware(request: NextRequest): NextResponse {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0];

  if (!hostname.endsWith('.sitespresso.com')) {
    return NextResponse.next();
  }

  const slug = hostname.replace('.sitespresso.com', '');

  if (!slug || RESERVED_SUBDOMAINS.has(slug)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/sites/${slug}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

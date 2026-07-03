import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

type PageViewPayload = {
  slug?: string;
  path?: string;
};

type PublishedSiteLookup = {
  id: string;
};

const BOT_UA_REGEX = /(bot|crawler|spider|headless|lighthouse|preview|vercel-screenshot)/i;

function isLikelyBot(userAgent: string): boolean {
  return BOT_UA_REGEX.test(userAgent);
}

function normalizeSlug(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function normalizePath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  const trimmed = value.trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function resolveHost(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  return host.split(':')[0]?.trim().toLowerCase() || '';
}

function resolveClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function visitorFingerprint(ip: string, userAgent: string): string {
  const dayKey = new Date().toISOString().slice(0, 10);
  const raw = `${dayKey}|${ip}|${userAgent}`;
  return createHash('sha256').update(raw).digest('hex');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let payload: PageViewPayload;
    try {
      payload = (await request.json()) as PageViewPayload;
    } catch {
      return new NextResponse(null, { status: 204 });
    }

    const slug = normalizeSlug(payload.slug);
    if (!slug || !/^[a-z0-9-]{1,100}$/.test(slug)) {
      return new NextResponse(null, { status: 204 });
    }

    const path = normalizePath(payload.path);
    const userAgent = request.headers.get('user-agent') || '';
    if (isLikelyBot(userAgent)) {
      return new NextResponse(null, { status: 204 });
    }

    const admin = createAdminClient();
    const { data: siteData } = await admin
      .from('sites')
      .select('id, slug, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    const site = (siteData as PublishedSiteLookup | null);

    if (!site?.id) {
      return new NextResponse(null, { status: 204 });
    }

    const host = resolveHost(request);
    const ip = resolveClientIp(request);
    const fingerprint = visitorFingerprint(ip, userAgent);

    await admin.rpc('log_site_page_view' as never, {
      p_site_id: site.id,
      p_slug: slug,
      p_path: path,
      p_host: host,
      p_visitor_fingerprint: fingerprint,
    } as never);

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}

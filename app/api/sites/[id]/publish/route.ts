import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSlug, isReservedSlug, findUniqueSlug } from '@/lib/slug';
import { checkRateLimit } from '@/lib/redis/rate-limiter';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const startTime = Date.now();
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: max 20 publish operations per hour per user
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const publishLimit = await checkRateLimit(`publish:${user.id}`, 'free', ip);
    if (!publishLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many publish requests. Please try again in a few minutes.' },
        {
          status: 429,
          headers: { 'Retry-After': `${publishLimit.retryAfter ?? 60}` },
        }
      );
    }

    const siteId = params.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (!profile || profile.plan === 'free') {
      return NextResponse.json(
        {
          success: false,
          error: 'Billing required before publishing.',
          requiresBilling: true,
          siteId,
        },
        { status: 200 },
      );
    }

    // Fetch the site and verify ownership
    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('id, user_id, slug, status, business_name, content')
      .eq('id', siteId)
      .single();

    if (fetchError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let finalSlug = site.slug;

    // Keep current slug if already published, otherwise generate a clean business-name slug.
    if (site.status !== 'published') {
      const baseSlug = generateSlug(site.business_name);
      if (isReservedSlug(baseSlug)) {
        return NextResponse.json(
          { error: 'Business name resolves to a reserved slug. Please choose a different name.' },
          { status: 400 },
        );
      }
      const uniqueSlug = await findUniqueSlug(baseSlug);
      if (!uniqueSlug) {
        return NextResponse.json(
          { error: 'Could not generate a unique slug. Please try again.' },
          { status: 500 },
        );
      }
      finalSlug = uniqueSlug;
    }

    // Mark as published
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        slug: finalSlug,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Site published (${finalSlug}) in ${duration}ms`);

    const response = NextResponse.json({
      success: true,
      slug: finalSlug,
      url: `https://${finalSlug}.sitespresso.com`,
    });

    response.headers.set('X-Publish-Time-Ms', duration.toString());
    return response;
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ Publish error after ${duration}ms:`, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'X-Publish-Time-Ms': duration.toString() } }
    );
  }
}

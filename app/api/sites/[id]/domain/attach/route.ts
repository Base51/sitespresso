import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { attachDomainToVercelProject } from '@/lib/vercel-domains';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = params.id;

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id, slug, custom_domain, domain_verified, domain_attached')
      .eq('id', siteId)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found.' }, { status: 404 });
    }

    if (site.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (!profile || profile.plan === 'free') {
      return NextResponse.json(
        {
          error: 'Custom domain attach is available on paid plans only.',
          requiresBilling: true,
        },
        { status: 403 },
      );
    }

    if (!site.custom_domain) {
      return NextResponse.json({ error: 'Save a custom domain before attaching.' }, { status: 400 });
    }

    if (!site.slug) {
      return NextResponse.json(
        { error: 'Publish this site first so SiteSpresso can generate your target hostname.' },
        { status: 400 },
      );
    }

    if (!site.domain_verified) {
      return NextResponse.json(
        { error: 'Verify your custom domain DNS before attaching to Vercel.' },
        { status: 400 },
      );
    }

    const attach = await attachDomainToVercelProject(site.custom_domain as string);

    if (!attach.attached) {
      return NextResponse.json({ error: attach.message }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('sites')
      .update({
        domain_attached: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to persist domain attach status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customDomain: site.custom_domain,
      domainAttached: true,
      message: attach.message,
    });
  } catch (error) {
    console.error('Custom domain attach error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error.',
    }, { status: 500 });
  }
}

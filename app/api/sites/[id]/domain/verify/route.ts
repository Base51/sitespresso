import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyCustomDomainDns } from '@/lib/domains-server';

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
      .select('id, user_id, slug, custom_domain, domain_verified')
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
          error: 'Custom domain verification is available on paid plans only.',
          requiresBilling: true,
        },
        { status: 403 },
      );
    }

    if (!site.custom_domain) {
      return NextResponse.json({ error: 'Save a custom domain before verification.' }, { status: 400 });
    }

    if (!site.slug) {
      return NextResponse.json(
        { error: 'Publish this site first so SiteSpresso can generate your target hostname.' },
        { status: 400 },
      );
    }

    const verification = await verifyCustomDomainDns(site.custom_domain as string, site.slug as string);

    const { error: updateError } = await supabase
      .from('sites')
      .update({
        domain_verified: verification.verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to persist domain verification status.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customDomain: site.custom_domain,
      domainVerified: verification.verified,
      expectedTarget: verification.expectedTarget,
      expectedRecords: verification.expectedRecords,
      observedRecords: verification.observedRecords,
      message: verification.reason,
    });
  } catch (error) {
    console.error('Custom domain verification error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

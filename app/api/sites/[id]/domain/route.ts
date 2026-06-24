import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getCustomDomainInstructions,
  normalizeCustomDomain,
  validateCustomDomain,
} from '@/lib/domains';

type DomainPayload = {
  customDomain?: string;
};

export async function PATCH(
  request: NextRequest,
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

    let payload: DomainPayload;
    try {
      payload = (await request.json()) as DomainPayload;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    const siteId = params.id;

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id, slug, custom_domain')
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
          error: 'Custom domains are available on paid plans only.',
          requiresBilling: true,
        },
        { status: 403 },
      );
    }

    const customDomain = normalizeCustomDomain(payload.customDomain ?? '');
    const validationError = validateCustomDomain(customDomain);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data: existingClaim } = await supabase
      .from('sites')
      .select('id')
      .eq('custom_domain', customDomain)
      .neq('id', siteId)
      .limit(1);

    if (existingClaim && existingClaim.length > 0) {
      return NextResponse.json(
        { error: 'This custom domain is already connected to another site.' },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from('sites')
      .update({
        custom_domain: customDomain,
        domain_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save custom domain.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customDomain,
      domainVerified: false,
      instructions: getCustomDomainInstructions(customDomain, site.slug as string | null),
    });
  } catch (error) {
    console.error('Custom domain update error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = params.id;

    // Fetch the site and verify ownership
    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .single();

    if (fetchError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    if (site.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete associated logo files before removing site record.
    // Supports both the current user-scoped path and legacy path.
    const userSitePrefix = `users/${user.id}/sites/${siteId}`;
    const legacyPrefix = `sites/${siteId}`;

    const { data: currentLogoFiles } = await supabase.storage.from('logos').list(userSitePrefix);
    if (currentLogoFiles && currentLogoFiles.length > 0) {
      const toDelete = currentLogoFiles.map((f) => `${userSitePrefix}/${f.name}`);
      const { error: logoDeleteError } = await supabase.storage.from('logos').remove(toDelete);
      if (logoDeleteError) {
        console.error('Logo delete error (current path):', logoDeleteError);
        return NextResponse.json({ error: logoDeleteError.message || 'Failed to delete site logo' }, { status: 500 });
      }
    }

    const { data: legacyLogoFiles } = await supabase.storage.from('logos').list(legacyPrefix);
    if (legacyLogoFiles && legacyLogoFiles.length > 0) {
      const toDelete = legacyLogoFiles.map((f) => `${legacyPrefix}/${f.name}`);
      const { error: logoDeleteError } = await supabase.storage.from('logos').remove(toDelete);
      if (logoDeleteError) {
        console.error('Logo delete error (legacy path):', logoDeleteError);
        return NextResponse.json({ error: logoDeleteError.message || 'Failed to delete site logo' }, { status: 500 });
      }
    }

    // Delete the site
    const { error: deleteError } = await supabase
      .from('sites')
      .delete()
      .eq('id', siteId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete site' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: 'Site deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete handler error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

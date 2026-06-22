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

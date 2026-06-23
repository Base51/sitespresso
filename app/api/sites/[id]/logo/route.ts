import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    // Verify user owns the site
    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .single();

    if (fetchError || !site || site.user_id !== user.id) {
      return NextResponse.json({ error: 'Site not found or unauthorized' }, { status: 403 });
    }

    // Parse request body (expect { file: base64String, filename: string, type: string })
    const body = await request.json();
    const { file, filename, type } = body;

    if (!file || !filename || !type) {
      return NextResponse.json(
        { error: 'Missing file, filename, or type' },
        { status: 400 },
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(file, 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 5MB limit` },
        { status: 400 },
      );
    }

    // Generate unique filename: sites/{siteId}/logo-{timestamp}.{ext}
    const ext = filename.split('.').pop() || 'png';
    const timestamp = Date.now();
    const storagePath = `sites/${siteId}/logo-${timestamp}.${ext}`;

    // Delete old logo if exists
    const { data: files } = await supabase.storage
      .from('logos')
      .list(`sites/${siteId}`);

    if (files && files.length > 0) {
      const oldFiles = files.map((f) => `sites/${siteId}/${f.name}`);
      await supabase.storage.from('logos').remove(oldFiles);
    }

    // Upload new logo
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(storagePath, buffer, {
        contentType: type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Logo upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('logos')
      .getPublicUrl(storagePath);

    const logoUrl = publicUrlData?.publicUrl;

    // Update site with logo URL
    const { error: updateError } = await supabase
      .from('sites')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteId);

    if (updateError) {
      console.error('Failed to update site:', updateError);
      return NextResponse.json(
        { error: 'Failed to save logo info' },
        { status: 500 },
      );
    }

    console.log(`✅ Logo uploaded for site ${siteId}: ${storagePath}`);

    return NextResponse.json({
      success: true,
      url: logoUrl,
      path: storagePath,
    });
  } catch (error) {
    console.error('Logo API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    // Verify user owns the site
    const { data: site, error: fetchError } = await supabase
      .from('sites')
      .select('id, user_id')
      .eq('id', siteId)
      .single();

    if (fetchError || !site || site.user_id !== user.id) {
      return NextResponse.json({ error: 'Site not found or unauthorized' }, { status: 403 });
    }

    // Delete logo files from storage
    const { data: files } = await supabase.storage
      .from('logos')
      .list(`sites/${siteId}`);

    if (files && files.length > 0) {
      const filesToDelete = files.map((f) => `sites/${siteId}/${f.name}`);
      const { error: deleteError } = await supabase.storage
        .from('logos')
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Logo deletion error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete logo' },
          { status: 500 },
        );
      }
    }

    console.log(`✅ Logo deleted for site ${siteId}`);

    return NextResponse.json({
      success: true,
      message: 'Logo deleted',
    });
  } catch (error) {
    console.error('Logo delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

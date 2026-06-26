import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeWebsiteContent } from '@/lib/schemas/website';

const HERO_BUCKET = 'logos';
const LEGACY_PREFIX = 'sites';

function sanitizePrompt(input: string): string {
  return input.replace(/[{}<>]/g, '').trim().slice(0, 500);
}

function buildDefaultPrompt(content: {
  businessName: string;
  businessType: string;
  city: string;
  tagline: string;
}): string {
  return [
    `Professional hero image for ${content.businessName}, a ${content.businessType} business in ${content.city}.`,
    `Visual tone: modern, welcoming, premium quality, suitable for a website hero section.`,
    `Inspiration: ${content.tagline}.`,
    `No text, no logos, no watermark, no people with readable text on clothing, no UI overlays.`,
    `Landscape composition with depth and soft natural lighting.`,
  ].join(' ');
}

async function generateImageBuffer(prompt: string): Promise<Buffer> {
  const { default: OpenAI } = await import('openai');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const imageResponse = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1536x1024',
  });

  const first = imageResponse.data?.[0];
  if (!first) {
    throw new Error('No image returned by generation API');
  }

  if (first.b64_json) {
    return Buffer.from(first.b64_json, 'base64');
  }

  if (first.url) {
    const res = await fetch(first.url);
    if (!res.ok) {
      throw new Error(`Failed to download generated image (status ${res.status})`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error('Image API response missing b64_json and url');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = params.id;

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id, business_name, business_type, city, content')
      .eq('id', siteId)
      .single();

    if (siteError || !site || site.user_id !== user.id) {
      return NextResponse.json({ error: 'Site not found or unauthorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedPrompt = typeof body?.prompt === 'string' ? sanitizePrompt(body.prompt) : '';

    const website = normalizeWebsiteContent(site.content);

    const prompt =
      requestedPrompt ||
      buildDefaultPrompt({
        businessName: site.business_name,
        businessType: site.business_type,
        city: site.city,
        tagline: website.tagline,
      });

    const imageBuffer = await generateImageBuffer(prompt);

    const userSitePrefix = `users/${user.id}/sites/${siteId}`;
    const legacyPrefix = `${LEGACY_PREFIX}/${siteId}`;
    const storagePath = `${userSitePrefix}/hero-${Date.now()}.png`;

    const { data: existingFiles } = await supabase.storage.from(HERO_BUCKET).list(userSitePrefix);
    if (existingFiles?.length) {
      const heroFiles = existingFiles
        .filter((file) => file.name.startsWith('hero-'))
        .map((file) => `${userSitePrefix}/${file.name}`);
      if (heroFiles.length) {
        await supabase.storage.from(HERO_BUCKET).remove(heroFiles);
      }
    }

    const { data: legacyFiles } = await supabase.storage.from(HERO_BUCKET).list(legacyPrefix);
    if (legacyFiles?.length) {
      const heroLegacyFiles = legacyFiles
        .filter((file) => file.name.startsWith('hero-'))
        .map((file) => `${legacyPrefix}/${file.name}`);
      if (heroLegacyFiles.length) {
        await supabase.storage.from(HERO_BUCKET).remove(heroLegacyFiles);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(HERO_BUCKET)
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || 'Upload failed' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(HERO_BUCKET).getPublicUrl(storagePath);
    const heroImageUrl = publicUrlData?.publicUrl;

    if (!heroImageUrl) {
      return NextResponse.json({ error: 'Could not resolve image URL' }, { status: 500 });
    }

    const nextContent = {
      ...website,
      hero: {
        ...website.hero,
        hero_image_url: heroImageUrl,
        hero_image_prompt: prompt,
      },
      pages: {
        ...website.pages,
        home: {
          ...(website.pages?.home ?? {}),
          hero: {
            ...(website.pages?.home?.hero ?? {}),
            hero_image_url: heroImageUrl,
            hero_image_prompt: prompt,
          },
        },
      },
    };

    const { error: updateError } = await supabase
      .from('sites')
      .update({ content: nextContent, updated_at: new Date().toISOString() })
      .eq('id', siteId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to save image' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: heroImageUrl,
      prompt,
    });
  } catch (error) {
    console.error('Hero image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hero image generation failed' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const siteId = params.id;

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id, content')
      .eq('id', siteId)
      .single();

    if (siteError || !site || site.user_id !== user.id) {
      return NextResponse.json({ error: 'Site not found or unauthorized' }, { status: 403 });
    }

    const website = normalizeWebsiteContent(site.content);

    const userSitePrefix = `users/${user.id}/sites/${siteId}`;
    const legacyPrefix = `${LEGACY_PREFIX}/${siteId}`;

    const { data: currentFiles } = await supabase.storage.from(HERO_BUCKET).list(userSitePrefix);
    if (currentFiles?.length) {
      const heroFiles = currentFiles
        .filter((file) => file.name.startsWith('hero-'))
        .map((file) => `${userSitePrefix}/${file.name}`);
      if (heroFiles.length) {
        await supabase.storage.from(HERO_BUCKET).remove(heroFiles);
      }
    }

    const { data: legacyFiles } = await supabase.storage.from(HERO_BUCKET).list(legacyPrefix);
    if (legacyFiles?.length) {
      const heroLegacyFiles = legacyFiles
        .filter((file) => file.name.startsWith('hero-'))
        .map((file) => `${legacyPrefix}/${file.name}`);
      if (heroLegacyFiles.length) {
        await supabase.storage.from(HERO_BUCKET).remove(heroLegacyFiles);
      }
    }

    const nextContent = {
      ...website,
      hero: {
        ...website.hero,
        hero_image_url: undefined,
        hero_image_prompt: undefined,
      },
      pages: {
        ...website.pages,
        home: {
          ...(website.pages?.home ?? {}),
          hero: {
            ...(website.pages?.home?.hero ?? {}),
            hero_image_url: undefined,
            hero_image_prompt: undefined,
          },
        },
      },
    };

    const { error: updateError } = await supabase
      .from('sites')
      .update({ content: nextContent, updated_at: new Date().toISOString() })
      .eq('id', siteId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message || 'Failed to update site' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hero image delete error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Hero image removal failed' },
      { status: 500 },
    );
  }
}

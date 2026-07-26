import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/redis/rate-limiter';
import {
  getRefreshSectionSystemPrompt,
  getRefreshSectionPrompt,
  type RefreshableSection,
} from '@/lib/ai/prompts';
import type { Website } from '@/lib/schemas/website';

const RefreshSectionBodySchema = z.object({
  section: z.enum(['hero', 'about', 'services', 'contact']),
  hint: z.string().max(200).optional(),
});

function extractJsonObject(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '');
    const start = withoutFence.indexOf('{');
    const end = withoutFence.lastIndexOf('}');
    if (start >= 0 && end > start) return withoutFence.slice(start, end + 1);
    return withoutFence;
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const userPlan = (profile?.plan as 'free' | 'starter' | 'pro' | 'agency') ?? 'free';

    const rateLimit = await checkRateLimit(user.id, userPlan, ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Generation quota exceeded. Try again next month.' },
        {
          status: 429,
          headers: { 'Retry-After': `${rateLimit.retryAfter ?? 60}` },
        },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = RefreshSectionBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request: ' + parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }

    const { section, hint } = parsed.data;

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, user_id, business_name, business_type, city, content')
      .eq('id', params.id)
      .single();

    if (siteError || !site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    if (site.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const content = site.content as Website;
    const currentSectionContent = JSON.stringify(content[section as keyof Website] ?? {});

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userPrompt = getRefreshSectionPrompt(
      section as RefreshableSection,
      site.business_name,
      site.business_type,
      site.city,
      currentSectionContent,
      hint,
    );

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: getRefreshSectionSystemPrompt() },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const raw = aiResponse.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: 'No content returned from AI' }, { status: 500 });
    }

    let sectionData: unknown;
    try {
      sectionData = JSON.parse(extractJsonObject(raw));
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    const updatedContent: Website = {
      ...content,
      [section]: {
        ...(content[section as keyof Website] as Record<string, unknown>),
        ...(sectionData as Record<string, unknown>),
      },
    };

    await supabase
      .from('sites')
      .update({ content: updatedContent, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    return NextResponse.json({
      success: true,
      section,
      data: sectionData,
      remaining: rateLimit.remaining - 1,
    });
  } catch (error) {
    console.error('refresh-section error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Section refresh failed' },
      { status: 500 },
    );
  }
}

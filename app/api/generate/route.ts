import { NextRequest, NextResponse } from 'next/server';
import { WebsiteSchema, GenerateInputSchema, normalizeWebsiteContent } from '../../../lib/schemas/website';
import { getSystemPrompt, getUserPrompt } from '../../../lib/ai/prompts';
import { checkRateLimit } from '@/lib/redis/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import { normalizePlan } from '@/lib/billing/plans';
import { normalizeLanguage, type LanguageCode } from '@/lib/i18n/languages';
import { isSiteLimitReached, resolveSiteLimit } from '@/lib/billing/site-limits';
import { planFromPriceId } from '@/lib/stripe';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

type TimingEntry = {
  name: string;
  durationMs: number;
};

function toServerTiming(timings: TimingEntry[]): string {
  return timings.map((entry) => `${entry.name};dur=${entry.durationMs.toFixed(1)}`).join(', ');
}

function toTimingBreakdown(timings: TimingEntry[]): string {
  return timings.map((entry) => `${entry.name}:${Math.round(entry.durationMs)}ms`).join(',');
}

const websiteResponseSchema = {
  name: 'website_generation',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      business_name: { type: 'string' },
      business_type: { type: 'string' },
      city: { type: 'string' },
      tagline: { type: 'string' },
      hero: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          cta_text: { type: 'string' },
          cta_url: { type: 'string' },
        },
        required: ['title', 'content', 'cta_text', 'cta_url'],
      },
      about: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          cta_text: { type: 'string' },
          cta_url: { type: 'string' },
        },
        required: ['title', 'content', 'cta_text', 'cta_url'],
      },
      services: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          items: {
            type: 'array',
            minItems: 1,
            maxItems: 8,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['name', 'description'],
            },
          },
        },
        required: ['title', 'description', 'items'],
      },
      contact: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          hours: { type: 'string' },
        },
        required: ['title', 'phone', 'email', 'address', 'hours'],
      },
      color_scheme: {
        type: 'object',
        additionalProperties: false,
        properties: {
          primary: { type: 'string' },
          secondary: { type: 'string' },
          accent: { type: 'string' },
          neutral: { type: 'string' },
        },
        required: ['primary', 'secondary', 'accent', 'neutral'],
      },
      fonts: {
        type: 'object',
        additionalProperties: false,
        properties: {
          heading: { type: 'string' },
          body: { type: 'string' },
        },
        required: ['heading', 'body'],
      },
      logo: {
        type: 'object',
        additionalProperties: false,
        properties: {
          position: { type: 'string', enum: ['left', 'center', 'right'] },
          width: { type: 'number' },
        },
        required: ['position', 'width'],
      },
      language: { type: 'string', enum: ['en', 'es', 'pt', 'fr', 'de', 'it'] },
    },
    required: [
      'business_name',
      'business_type',
      'city',
      'tagline',
      'hero',
      'about',
      'services',
      'contact',
      'color_scheme',
      'fonts',
      'logo',
      'language',
    ],
  },
} as const;

function extractJsonObject(content: string): string {
  const trimmed = content.trim();

  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '');
    const fenceStart = withoutFence.indexOf('{');
    const fenceEnd = withoutFence.lastIndexOf('}');

    if (fenceStart >= 0 && fenceEnd > fenceStart) {
      return withoutFence.slice(fenceStart, fenceEnd + 1);
    }

    return withoutFence;
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

async function callOpenAIWithRetry(
  userPrompt: string,
  language: LanguageCode = 'en',
  retryCount: number = 0
): Promise<string> {
  // Dynamic import to avoid build-time issues
  const { default: OpenAI } = await import('openai');

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(language),
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: { type: 'json_schema', json_schema: websiteResponseSchema },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    return content;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1))
      );
      return callOpenAIWithRetry(userPrompt, language, retryCount + 1);
    }
    throw error;
  }
}

function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    // Remove potential prompt injection patterns and limit length
    return input
      .replace(/[<>{}]/g, '')
      .trim()
      .slice(0, 100);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

function applyDefaults(website: Record<string, unknown>): Record<string, unknown> {
  return {
    ...website,
    fonts: (website.fonts as Record<string, unknown>) || {
      heading: 'Playfair Display',
      body: 'Inter',
    },
    logo: (website.logo as Record<string, unknown>) || {
      position: 'left',
      width: 100,
    },
    layout: {
      ...(website.layout as Record<string, unknown>),
      section_order:
        (website.layout as Record<string, unknown>)?.section_order ||
        ['about', 'services', 'contact'],
      section_backgrounds: {
        about:
          ((website.layout as Record<string, unknown>)?.section_backgrounds as Record<string, unknown>)?.about ||
          '#ffffff',
        services:
          ((website.layout as Record<string, unknown>)?.section_backgrounds as Record<string, unknown>)?.services ||
          '#f8fafc',
        contact:
          ((website.layout as Record<string, unknown>)?.section_backgrounds as Record<string, unknown>)?.contact ||
          '#ffffff',
      },
    },
    color_scheme: {
      ...(website.color_scheme as Record<string, unknown>),
      accent: (website.color_scheme as Record<string, unknown>)?.accent || (website.color_scheme as Record<string, unknown>)?.primary,
      neutral: (website.color_scheme as Record<string, unknown>)?.neutral || '#f8fafc',
    },
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const timings: TimingEntry[] = [];
  let stepStart = Date.now();

  const markStep = (name: string): void => {
    const now = Date.now();
    timings.push({ name, durationMs: now - stepStart });
    stepStart = now;
  };

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI generation service not configured' },
        { status: 503 }
      );
    }

    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Parse and validate request body
    const body = await request.json();
    const sanitized = sanitizeInput(body);

    const input = GenerateInputSchema.parse(sanitized);
    markStep('input');

    const hasSupabaseAuthCookie = request.cookies
      .getAll()
      .some((cookie) => cookie.name.includes('sb-') && cookie.name.includes('-auth-token'));

    let user: { id: string } | null = null;
    const supabase = hasSupabaseAuthCookie ? createClient() : null;

    if (supabase) {
      const authResult = await supabase.auth.getUser();
      user = authResult.data.user ?? null;
    }
    markStep('auth');

    // Get user profile for plan info if authenticated
    let userPlan: 'free' | 'starter' | 'pro' | 'agency' = 'free';
    if (user && supabase) {
      const [{ data: profile }, { data: subscriptions }] = await Promise.all([
        supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single(),
        supabase
          .from('subscriptions')
          .select('status, stripe_price_id, updated_at')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing', 'past_due', 'unpaid'])
          .order('updated_at', { ascending: false })
          .limit(1),
      ]);

      const subscriptionPlan = planFromPriceId(subscriptions?.[0]?.stripe_price_id);
      userPlan = subscriptionPlan !== 'free' ? subscriptionPlan : normalizePlan(profile?.plan);

      const { count: siteCount } = await supabase
        .from('sites')
        .select('id', { head: true, count: 'exact' })
        .eq('user_id', user.id);

      const totalSites = siteCount ?? 0;
      if (isSiteLimitReached(userPlan, totalSites)) {
        const siteLimit = resolveSiteLimit(userPlan);
        return NextResponse.json(
          {
            error: siteLimit == null
              ? 'Site creation is temporarily unavailable.'
              : `Site limit reached (${totalSites}/${siteLimit}). Upgrade your plan to create more sites.`,
            requiresUpgrade: true,
            currentPlan: userPlan,
            siteCount: totalSites,
            siteLimit,
          },
          { status: 403 }
        );
      }
    }
    markStep('plan');

    // Rate limiting with plan-based quota
    const rateLimit = await checkRateLimit(user?.id ?? null, userPlan, ip);
    if (!rateLimit.allowed) {
      markStep('rate_limit');
      return NextResponse.json(
        {
          error: 'Generation quota exceeded. Check your plan limits or try again next month.',
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': `${rateLimit.retryAfter ?? 60}` },
        }
      );
    }
    markStep('rate_limit');

    // Call OpenAI with retry logic
    const language = normalizeLanguage(input.language);
    const jsonResponse = await callOpenAIWithRetry(getUserPrompt(input), language);
    markStep('openai');

    // Parse and validate response
    const parsed = JSON.parse(extractJsonObject(jsonResponse));
    const withDefaults = applyDefaults(parsed);
    const validated = WebsiteSchema.parse({ ...withDefaults, language });
    const website = normalizeWebsiteContent(validated);
    markStep('validate');

    const duration = Date.now() - startTime;
    console.log(`✅ Generation for ${input.business_name} (${input.business_type}) completed in ${duration}ms`);

    const response = NextResponse.json(
      {
        success: true,
        website,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      },
      { status: 200 }
    );

    response.headers.set('X-Generation-Time-Ms', duration.toString());
    response.headers.set('Server-Timing', toServerTiming(timings));
    response.headers.set('X-Generation-Breakdown', toTimingBreakdown(timings));

    console.log(`⏱️ Generation timing breakdown: ${toTimingBreakdown(timings)}`);
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    timings.push({ name: 'error', durationMs: Date.now() - stepStart });
    console.error(`❌ Generation failed after ${duration}ms:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      },
      {
        status: 500,
        headers: {
          'X-Generation-Time-Ms': duration.toString(),
          'Server-Timing': toServerTiming(timings),
          'X-Generation-Breakdown': toTimingBreakdown(timings),
        },
      }
    );
  }
}

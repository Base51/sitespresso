import { NextRequest, NextResponse } from 'next/server';
import { WebsiteSchema, GenerateInputSchema } from '../../../lib/schemas/website';
import { getSystemPrompt, getUserPrompt } from '../../../lib/ai/prompts';
import { checkRateLimit } from '../../../lib/ai/rate-limiter';
import { createClient } from '@/lib/supabase/server';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

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
        },
        required: ['primary', 'secondary'],
      },
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
          content: getSystemPrompt(),
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
      return callOpenAIWithRetry(userPrompt, retryCount + 1);
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
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

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Rate limiting: pass user ID if authenticated, otherwise IP-only limit applies
    const userRateLimit = checkRateLimit(ip, user?.id);
    if (!userRateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many generation requests. Try again later.',
          resetIn: userRateLimit.resetIn,
        },
        {
          status: 429,
          headers: { 'Retry-After': `${userRateLimit.resetIn}` },
        }
      );
    }

    // Call OpenAI with retry logic
    const jsonResponse = await callOpenAIWithRetry(getUserPrompt(input));

    // Parse and validate response
    const parsed = JSON.parse(extractJsonObject(jsonResponse));
    const website = WebsiteSchema.parse(parsed);

    const duration = Date.now() - startTime;
    console.log(`✅ Generation for ${input.business_name} (${input.business_type}) completed in ${duration}ms`);

    const response = NextResponse.json(
      {
        success: true,
        website,
        remaining: userRateLimit.remaining,
      },
      { status: 200 }
    );

    response.headers.set('X-Generation-Time-Ms', duration.toString());
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Generation failed after ${duration}ms:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      },
      { status: 500, headers: { 'X-Generation-Time-Ms': duration.toString() } }
    );
  }
}

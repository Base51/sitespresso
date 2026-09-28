import { describe, expect, it } from 'vitest';
import {
  classifyGenerationError,
  GENERATION_BUSY_MESSAGE,
  GENERATION_FAILED_MESSAGE,
  GENERATION_UNAVAILABLE_MESSAGE,
} from '@/lib/ai/generation-error';

describe('classifyGenerationError', () => {
  it('hides OpenAI insufficient_quota behind a friendly 503', () => {
    const err = Object.assign(new Error('You exceeded your current quota, please check your plan and billing details.'), {
      status: 429,
      code: 'insufficient_quota',
      type: 'insufficient_quota',
    });
    const result = classifyGenerationError(err);
    expect(result).toMatchObject({
      status: 503,
      code: 'ai_unavailable',
      message: GENERATION_UNAVAILABLE_MESSAGE,
      retryable: false,
      logReason: 'provider_insufficient_quota',
    });
    expect(result.message).not.toMatch(/quota|billing|openai/i);
  });

  it('treats missing API key as unavailable, not as a raw error', () => {
    const result = classifyGenerationError(new Error('OPENAI_API_KEY not configured'));
    expect(result).toMatchObject({
      status: 503,
      code: 'ai_unavailable',
      message: GENERATION_UNAVAILABLE_MESSAGE,
      retryable: false,
      logReason: 'provider_auth',
    });
  });

  it('treats a plain rate limit as busy and retryable', () => {
    const err = Object.assign(new Error('Rate limit reached'), {
      status: 429,
      code: 'rate_limit_exceeded',
    });
    const result = classifyGenerationError(err);
    expect(result).toMatchObject({
      status: 503,
      code: 'ai_busy',
      message: GENERATION_BUSY_MESSAGE,
      retryable: true,
      logReason: 'provider_rate_limit',
    });
  });

  it('treats provider 5xx as unavailable and retryable', () => {
    const err = Object.assign(new Error('Internal server error'), { status: 500 });
    const result = classifyGenerationError(err);
    expect(result).toMatchObject({
      status: 503,
      code: 'ai_unavailable',
      message: GENERATION_UNAVAILABLE_MESSAGE,
      retryable: true,
      logReason: 'provider_unavailable',
    });
  });

  it('never returns the raw Error.message for unexpected failures', () => {
    const result = classifyGenerationError(new Error('something weird leaked'));
    expect(result).toMatchObject({
      status: 500,
      code: 'generation_failed',
      message: GENERATION_FAILED_MESSAGE,
      retryable: true,
    });
    expect(result.message).not.toContain('something weird');
  });
});

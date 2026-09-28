/**
 * Maps errors from the AI generation step to a safe, customer-facing response.
 *
 * The raw provider error (for example OpenAI's "You exceeded your current quota,
 * please check your plan and billing details") must never reach customers: it is
 * confusing and leaks provider/billing details. The real cause is still logged
 * server-side by the caller.
 */

export type GenerationErrorCode =
  | 'ai_unavailable'
  | 'ai_busy'
  | 'generation_failed';

export interface ClassifiedGenerationError {
  status: number;
  code: GenerationErrorCode;
  message: string;
  /** Whether retrying the provider call can plausibly succeed. */
  retryable: boolean;
  /** Short reason for server logs only. Never sent to the client. */
  logReason: string;
}

export const GENERATION_UNAVAILABLE_MESSAGE =
  'Website generation is temporarily unavailable. Please try again later.';
export const GENERATION_BUSY_MESSAGE =
  'Website generation is busy right now. Please try again in a minute.';
export const GENERATION_FAILED_MESSAGE =
  "We couldn't generate your website this time. Please try again.";

interface ProviderErrorLike {
  status?: unknown;
  code?: unknown;
  type?: unknown;
  name?: unknown;
  message?: unknown;
  error?: { code?: unknown; type?: unknown } | null;
}

function asObject(error: unknown): ProviderErrorLike {
  return error !== null && typeof error === 'object' ? (error as ProviderErrorLike) : {};
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function classifyGenerationError(error: unknown): ClassifiedGenerationError {
  const e = asObject(error);
  const status = typeof e.status === 'number' ? e.status : undefined;
  const code = str(e.code) || str(e.error?.code);
  const type = str(e.type) || str(e.error?.type);
  const name = str(e.name);
  const message = error instanceof Error ? error.message : str(e.message);

  // Out of credit / billing problem on the provider account. Retrying won't help.
  if (code === 'insufficient_quota' || type === 'insufficient_quota') {
    return {
      status: 503,
      code: 'ai_unavailable',
      message: GENERATION_UNAVAILABLE_MESSAGE,
      retryable: false,
      logReason: 'provider_insufficient_quota',
    };
  }

  // Missing or rejected API key. Retrying won't help.
  if (
    status === 401 ||
    status === 403 ||
    code === 'invalid_api_key' ||
    message === 'OPENAI_API_KEY not configured'
  ) {
    return {
      status: 503,
      code: 'ai_unavailable',
      message: GENERATION_UNAVAILABLE_MESSAGE,
      retryable: false,
      logReason: 'provider_auth',
    };
  }

  // Provider rate limit (not quota): transient.
  if (status === 429 || code === 'rate_limit_exceeded') {
    return {
      status: 503,
      code: 'ai_busy',
      message: GENERATION_BUSY_MESSAGE,
      retryable: true,
      logReason: 'provider_rate_limit',
    };
  }

  // Provider outage, timeout or network failure: transient.
  if (
    (status !== undefined && status >= 500) ||
    name === 'APIConnectionError' ||
    name === 'APIConnectionTimeoutError'
  ) {
    return {
      status: 503,
      code: 'ai_unavailable',
      message: GENERATION_UNAVAILABLE_MESSAGE,
      retryable: true,
      logReason: 'provider_unavailable',
    };
  }

  // Anything else (bad JSON, schema validation, empty response, unexpected errors).
  return {
    status: 500,
    code: 'generation_failed',
    message: GENERATION_FAILED_MESSAGE,
    retryable: true,
    logReason: 'generation_failed',
  };
}

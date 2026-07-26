const REFERRAL_CODE_KEY = 'referral_code';
const REFERRAL_TTL_DAYS = 30;
const REFERRAL_TTL_MS = REFERRAL_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * Generate a short alphanumeric referral code from a user id.
 * Deterministic so we can always derive the code without a DB round-trip on the client.
 * Format: first 8 chars of userId hex, uppercased (sufficient for a friendly code).
 */
export function deriveReferralCode(userId: string): string {
  // Use the first 8 chars of the UUID without hyphens
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

/** Persist a referral code to localStorage with a TTL. */
export function storeReferralCode(code: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      REFERRAL_CODE_KEY,
      JSON.stringify({ code: code.toUpperCase(), storedAt: Date.now() }),
    );
  } catch {
    // Storage blocked or full — silently drop.
  }
}

/** Read the stored referral code if still within TTL. Returns null if absent/expired. */
export function getStoredReferralCode(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REFERRAL_CODE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code?: string; storedAt?: number };
    if (!parsed.code || !parsed.storedAt) return null;
    if (Date.now() - parsed.storedAt > REFERRAL_TTL_MS) {
      localStorage.removeItem(REFERRAL_CODE_KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

/** Clear the stored referral code (after it has been applied). */
export function clearReferralCode(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(REFERRAL_CODE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Trial state management for unauthenticated users.
 * Allows one free website generation before requiring sign-up.
 */

const TRIAL_USED_KEY = 'sitespresso_trial_used';

/**
 * Check if the free trial has been used in this browser.
 */
export function isTrialUsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TRIAL_USED_KEY) === 'true';
}

/**
 * Mark the free trial as used.
 */
export function markTrialUsed(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRIAL_USED_KEY, 'true');
}

/**
 * Reset the trial flag (for testing/account reset).
 */
export function resetTrial(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TRIAL_USED_KEY);
}

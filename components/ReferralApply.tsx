'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStoredReferralCode, clearReferralCode } from '@/lib/referral';

/**
 * Invisible component. On mount, if the user is authenticated and there is a
 * pending referral code in localStorage, apply it via the referrals API then
 * clear it so it only fires once.
 */
export default function ReferralApply(): null {
  useEffect(() => {
    const code = getStoredReferralCode();
    if (!code) return;

    const supabase = createClient();

    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Clear first to avoid duplicate requests on re-renders
      clearReferralCode();

      try {
        await fetch('/api/referrals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referral_code: code }),
        });
      } catch {
        // best-effort — silently drop
      }
    })();
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { storeReferralCode } from '@/lib/referral';

/**
 * Invisible component. Mount anywhere to capture a ?ref=CODE query param
 * and persist it to localStorage with a 30-day TTL.
 */
export default function ReferralCapture(): null {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && /^[A-Z0-9]{6,12}$/i.test(ref)) {
      storeReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  return null;
}

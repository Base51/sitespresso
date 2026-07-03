'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface PageViewTrackerProps {
  slug: string;
}

export default function PageViewTracker({ slug }: PageViewTrackerProps): null {
  const pathname = usePathname();

  useEffect(() => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) return;

    const payload = JSON.stringify({
      slug: normalizedSlug,
      path: pathname || '/',
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const body = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/pageview', body);
      return;
    }

    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {
      // Best-effort analytics event; ignore client-side failures.
    });
  }, [slug, pathname]);

  return null;
}

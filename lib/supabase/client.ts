'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseConfig();

    if (!url || !anonKey) {
      throw new Error('Supabase environment variables are missing.');
    }

    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}

'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasSupabaseConfig } from '@/lib/supabase/config';

type LoginPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps): JSX.Element {
  const next = searchParams?.next ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin(): Promise<void> {
    if (!hasSupabaseConfig()) {
      setError('Supabase environment variables are not configured.');
      return;
    }

    const supabase = createClient();
    setError(null);
    setMessage(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  async function handleMagicLink(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!hasSupabaseConfig()) {
      setError('Supabase environment variables are not configured.');
      return;
    }

    const supabase = createClient();
    setError(null);
    setMessage(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setMessage('Magic link sent. Check your inbox.');
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold text-white">Sign in to SiteSpresso</h1>
      <p className="text-sm text-slate-300">Continue to manage your website and publishing settings.</p>

      <button
        className="rounded-md bg-white px-4 py-2 font-medium text-slate-900 disabled:opacity-70"
        onClick={handleGoogleLogin}
        disabled={loading}
        type="button"
      >
        Continue with Google
      </button>

      <form className="flex flex-col gap-3" onSubmit={handleMagicLink}>
        <label className="text-sm text-slate-300" htmlFor="email">
          Email for magic link
        </label>
        <input
          id="email"
          type="email"
          required
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@business.com"
        />
        <button
          className="rounded-md border border-slate-600 px-4 py-2 font-medium text-slate-100 disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          Send magic link
        </button>
      </form>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </main>
  );
}

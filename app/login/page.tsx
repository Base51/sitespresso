'use client';

import { FormEvent, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/Logo';
import { createClient } from '../../lib/supabase/client';
import { hasSupabaseConfig } from '../../lib/supabase/config';

type LoginPageProps = {
  searchParams?: {
    next?: string;
    reason?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps): JSX.Element {
  const next = searchParams?.next ?? '/dashboard';
  const reason = searchParams?.reason;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  async function handlePasswordLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!hasSupabaseConfig()) {
      setError('Supabase environment variables are not configured.');
      return;
    }

    const supabase = createClient();
    setError(null);
    setMessage(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = next;
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
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-8 px-6">
      <div className="space-y-3">
        <Logo />
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Sign in</h1>
          {reason === 'trial_exhausted' ? (
            <p className="text-sm text-brand-muted">
              Your free preview is used. Sign up to unlock unlimited generations and publish your site.
            </p>
          ) : (
            <p className="text-sm text-brand-muted">Continue to manage your website and publishing settings.</p>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={handleGoogleLogin}
        disabled={loading}
        type="button"
      >
        Continue with Google
      </Button>

      <form className="flex flex-col gap-4" onSubmit={handlePasswordLogin}>
        <Input
          id="password-email"
          type="email"
          label="Email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@sitespresso.com"
          autoComplete="email"
        />
        <Input
          id="password"
          type="password"
          label="Password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <Button
          type="submit"
          disabled={loading}
          variant="secondary"
          size="lg"
          fullWidth
        >
          {loading ? 'Signing in...' : 'Sign in with email and password'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-brand-bg px-2 text-brand-muted">or</span>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleMagicLink}>
        <Input
          id="email"
          type="email"
          label="Email for magic link"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@business.com"
        />
        <Button
          type="submit"
          disabled={loading}
          variant="secondary"
          size="lg"
          fullWidth
        >
          {loading ? 'Sending link...' : 'Send magic link'}
        </Button>
      </form>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </main>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import GenerateForm, { type GenerateFormValues } from '@/components/GenerateForm';
import SitePreview from '@/components/SitePreview';
import PaywallModal from '@/components/PaywallModal';
import type { Website } from '@/lib/schemas/website';
import { isTrialUsed, markTrialUsed } from '@/lib/trial';
import { createClient } from '@/lib/supabase/client';

type Stage = 'form' | 'loading' | 'preview' | 'error';

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('form');
  const [website, setWebsite] = useState<Website | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastInput, setLastInput] = useState<GenerateFormValues | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [publishTime, setPublishTime] = useState<number | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [trialUsed, setTrialUsed] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  // Check auth and trial status on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setTrialUsed(isTrialUsed());
      setAuthLoaded(true);
    }
    checkAuth();
  }, []);

  async function generate(values: GenerateFormValues) {
    // Check if unauthenticated user has exhausted free trial
    if (authLoaded && !user && isTrialUsed()) {
      router.push('/login?redirect=/&reason=trial_exhausted');
      return;
    }

    startTimeRef.current = performance.now();
    setElapsedTime(0);
    setLastInput(values);
    setStage('loading');
    setErrorMessage('');
    setGenerationTime(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const elapsed = performance.now() - (startTimeRef.current || 0);
      setGenerationTime(Math.round(elapsed));
      console.log(`⏱️ Generation completed in ${Math.round(elapsed)}ms`);
      
      // Mark trial as used if this is first generation by unauthenticated user
      if (!user) {
        markTrialUsed();
        setTrialUsed(true);
      }
      
      setWebsite(json.website as Website);
      setStage('preview');
    } catch (err) {
      const elapsed = performance.now() - (startTimeRef.current || 0);
      setGenerationTime(Math.round(elapsed));
      console.error(`❌ Generation failed after ${Math.round(elapsed)}ms:`, err);
      setErrorMessage(err instanceof Error ? err.message : 'Generation failed. Please try again.');
      setStage('error');
    }
  }

  useEffect(() => {
    if (stage !== 'loading') return;
    const timer = setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTime(Math.round((performance.now() - startTimeRef.current) / 1000));
      }
    }, 100);
    return () => clearInterval(timer);
  }, [stage]);

  async function publishSite(draftId: string | null) {
    if (!draftId) {
      alert('Draft is not saved yet. Make one edit and wait for "Saved" before publishing.');
      return;
    }
    const startTime = performance.now();
    setPublishTime(null);
    try {
      const res = await fetch(`/api/sites/${draftId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (json?.requiresBilling) {
        setPaywallOpen(true);
        return;
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Publish failed.');
      }

      const elapsed = performance.now() - startTime;
      setPublishTime(Math.round(elapsed));
      console.log(`⏱️ Publishing completed in ${Math.round(elapsed)}ms`);
      console.log(`✅ Live at: https://${json.slug}.sitespresso.com`);
      alert(`✅ Published!\n\nYour site is live at:\nhttps://${json.slug}.sitespresso.com`);
    } catch (err) {
      const elapsed = performance.now() - startTime;
      console.error(`❌ Publishing failed after ${Math.round(elapsed)}ms:`, err);
      alert('Publishing failed. Please try again.');
    }
  }

  async function continueToCheckout() {
    if (!draftId) return;

    setCheckoutLoading(true);
    try {
      const checkoutRes = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: draftId }),
      });
      const checkoutJson = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutJson.checkoutUrl) {
        throw new Error(checkoutJson.error ?? 'Failed to start checkout flow.');
      }

      window.location.href = checkoutJson.checkoutUrl as string;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start checkout flow.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ── Form stage ────────────────────────────────────────────────────────────
  if (stage === 'form') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="space-y-3">
          <p className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            AI-Powered Website Builder
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Build your local business website
            <br className="hidden md:block" /> in seconds.
          </h1>
          <p className="mx-auto max-w-xl text-base text-slate-400">
            Enter your business details and our AI will generate a complete, editable website — no
            design skills required.
          </p>
        </div>
        <GenerateForm onSubmit={generate} />
      </main>
    );
  }

  // ── Loading stage ─────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-30" />
          <span className="relative inline-flex h-10 w-10 rounded-full bg-blue-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Generating your website…</h2>
          <p className="text-sm text-slate-400">
            Our AI is crafting content, selecting colors, and writing your copy. This takes about
            10–15 seconds.
          </p>
          <p className="text-xs text-slate-500 font-mono">⏱️ {elapsedTime}s elapsed</p>
        </div>
        <div className="mt-2 flex gap-2">
          {['Writing copy', 'Choosing colors', 'Building sections'].map((step) => (
            <span
              key={step}
              className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-400"
            >
              {step}
            </span>
          ))}
        </div>
      </main>
    );
  }

  // ── Error stage ───────────────────────────────────────────────────────────
  if (stage === 'error') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-900/40 text-2xl">
          ✕
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Generation failed</h2>
          <p className="text-sm text-slate-400">{errorMessage}</p>
        </div>
        <div className="flex gap-3">
          {lastInput && (
            <button
              onClick={() => generate(lastInput)}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-500"
            >
              Try again
            </button>
          )}
          <button
            onClick={() => setStage('form')}
            className="rounded-lg border border-slate-600 px-5 py-2.5 font-medium text-slate-300 transition hover:border-slate-500"
          >
            Start over
          </button>
        </div>
      </main>
    );
  }

  // ── Preview stage ─────────────────────────────────────────────────────────
  return (
    <>
      {!user && trialUsed && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/90 to-blue-500/90 px-6 py-3 text-center backdrop-blur">
          <p className="text-sm font-medium text-white">
            ✓ Free preview generated! <button onClick={() => router.push('/login?redirect=/&reason=trial_exhausted')} className="underline hover:text-blue-100 transition">Sign up to publish and generate more.</button>
          </p>
        </div>
      )}
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{website?.business_name}</h2>
          <p className="text-sm text-slate-400">
            Your AI-generated website preview
            {generationTime && (
              <span className="ml-2 text-slate-500">
                (Generated in {(generationTime / 1000).toFixed(2)}s)
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStage('form');
              setWebsite(null);
              setDraftId(null);
              setGenerationTime(null);
              setPublishTime(null);
              setPaywallOpen(false);
            }}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
          >
            ← New website
          </button>
          <button
            onClick={() => publishSite(draftId)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            {publishTime ? `Published (${(publishTime / 1000).toFixed(2)}s)` : 'Publish'}
          </button>
        </div>
      </div>
      {website && (
        <SitePreview
          website={website}
          initialDraftId={draftId}
          onDraftSaved={(id) => setDraftId(id)}
        />
      )}
      </main>

      <PaywallModal
        open={paywallOpen}
        loading={checkoutLoading}
        onClose={() => setPaywallOpen(false)}
        onContinue={continueToCheckout}
      />
    </>
  );
}

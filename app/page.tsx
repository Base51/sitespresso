'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import GenerateForm, { type GenerateFormValues } from '@/components/GenerateForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/useToast';
import SitePreview from '@/components/SitePreview';
import PaywallModal from '@/components/PaywallModal';
import type { Website } from '@/lib/schemas/website';
import { isTrialUsed, markTrialUsed } from '@/lib/trial';
import { createClient } from '@/lib/supabase/client';
import {
  PLAN_FEATURES,
  PLAN_LABELS,
  PLAN_ORDER,
  PLAN_PRICING,
  type PlanAvailability,
  type BillingInterval,
  type PaidPlan,
} from '@/lib/billing/plans';

type Stage = 'form' | 'loading' | 'preview' | 'error';

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>('form');
  const [website, setWebsite] = useState<Website | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastInput, setLastInput] = useState<GenerateFormValues | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [publishTime, setPublishTime] = useState<number | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan>('starter');
  const [selectedBilling, setSelectedBilling] = useState<BillingInterval>('monthly');
  const [planAvailability, setPlanAvailability] = useState<PlanAvailability | null>(null);
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

  useEffect(() => {
    async function loadPlanAvailability() {
      try {
        const res = await fetch('/api/billing/plans');
        const json = await res.json();
        if (res.ok && json?.availability) {
          setPlanAvailability(json.availability as PlanAvailability);
        }
      } catch {
        // Leave pricing interactive and let checkout route remain the fallback guard.
      }
    }

    void loadPlanAvailability();
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

  async function startCheckout(plan: PaidPlan, billing: BillingInterval, siteId?: string | null) {
    setCheckoutLoading(true);
    try {
      const checkoutRes = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: siteId ?? undefined,
          plan,
          billing,
        }),
      });
      const checkoutJson = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutJson.checkoutUrl) {
        throw new Error(checkoutJson.error ?? 'Failed to start checkout flow.');
      }

      window.location.href = checkoutJson.checkoutUrl as string;
    } catch (err) {
      toast({
        type: 'error',
        title: 'Checkout failed',
        description: err instanceof Error ? err.message : 'Could not start checkout. Please try again.',
      });
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function publishSite(draftId: string | null) {
    if (!draftId) {
      toast({
        type: 'warning',
        title: 'Draft not ready',
        description: 'Make one edit and wait for "Saved" before publishing.',
      });
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
      setPublishedUrl(json.url);
      console.log(`⏱️ Publishing completed in ${Math.round(elapsed)}ms`);
      console.log(`✅ Live at: ${json.url}`);
      toast({
        type: 'success',
        title: 'Published!',
        description: `Your site is live at: ${json.url}`,
      });
    } catch (err) {
      const elapsed = performance.now() - startTime;
      console.error(`❌ Publishing failed after ${Math.round(elapsed)}ms:`, err);
      toast({
        type: 'error',
        title: 'Publishing failed',
        description: 'Please try again or contact support.',
      });
    }
  }

  async function continueToCheckout() {
    if (!draftId) return;

    await startCheckout(selectedPlan, selectedBilling, draftId);
  }

  function handlePricingCheckout(plan: PaidPlan) {
    if (planAvailability && !planAvailability[plan][selectedBilling]) {
      toast({
        type: 'warning',
        title: 'Plan unavailable',
        description: `${PLAN_LABELS[plan]} with ${selectedBilling} billing is not configured yet.`,
      });
      return;
    }

    if (!user) {
      router.push(`/login?redirect=/&plan=${plan}`);
      return;
    }

    void startCheckout(plan, selectedBilling);
  }

  // ── Form stage ────────────────────────────────────────────────────────────
  if (stage === 'form') {
    return (
      <>
        {authLoaded && (
          <div className="sticky top-0 z-50 border-b border-white/10 bg-brand-bg/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <Logo href="/" compact />
              {user ? (
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="primary"
                  size="sm"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/login')}
                  variant="secondary"
                  size="sm"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center gap-16 px-6 py-16 text-center">
          <div className="space-y-5 pt-10">
            <p className="mx-auto w-fit rounded-full border border-white/10 bg-white/6 px-4 py-1.5 text-xs uppercase tracking-[0.24em] text-brand-muted-strong">
              AI-Powered Website Builder
            </p>
            <h1 className="text-balance font-display text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Build your local business website
              <br className="hidden md:block" /> in seconds.
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-brand-muted">
              Enter your business details and our AI will generate a complete, editable website — no
              design skills required.
            </p>
          </div>
          <Card className="w-full max-w-xl p-6 text-left md:p-8">
            <GenerateForm onSubmit={generate} />
          </Card>

          <section className="w-full space-y-8 text-left">
            <div className="space-y-3 text-center">
              <p className="text-xs uppercase tracking-[0.24em] text-brand-primary">Pricing</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Start free, upgrade when you are ready to publish and scale.
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-brand-muted md:text-base">
                Free is perfect for trying the workflow. Paid plans unlock publishing and higher generation capacity for teams that need more iterations.
              </p>
            </div>

            <div className="mx-auto inline-flex rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setSelectedBilling('monthly')}
                className={`rounded-full px-4 py-2 text-sm transition ${selectedBilling === 'monthly' ? 'bg-white text-slate-900' : 'text-brand-muted hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setSelectedBilling('annual')}
                className={`rounded-full px-4 py-2 text-sm transition ${selectedBilling === 'annual' ? 'bg-white text-slate-900' : 'text-brand-muted hover:text-white'}`}
              >
                Annual
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-4">
              <Card className="flex h-full flex-col justify-between p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-lg font-semibold text-white">Free</p>
                    <p className="mt-2 text-3xl font-semibold text-white">$0</p>
                    <p className="mt-1 text-sm text-brand-muted">Try the workflow before you commit.</p>
                  </div>
                  <ul className="space-y-2 text-sm text-brand-muted">
                    <li>• 1 free preview flow</li>
                    <li>• Draft editing only</li>
                    <li>• Great for testing the product</li>
                  </ul>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="mt-6"
                  onClick={() => setStage('form')}
                >
                  Start Free
                </Button>
              </Card>

              {PLAN_ORDER.map((plan) => {
                const price = PLAN_PRICING[plan][selectedBilling];
                const featured = plan === 'starter';
                const available = planAvailability ? planAvailability[plan][selectedBilling] : true;

                return (
                  <Card
                    key={plan}
                    className={`flex h-full flex-col justify-between p-6 ${featured ? 'border-brand-primary/40 shadow-[0_0_0_1px_rgba(96,165,250,0.25)]' : ''} ${available ? '' : 'opacity-60'}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-white">{PLAN_LABELS[plan]}</p>
                          <p className="mt-2 text-3xl font-semibold text-white">
                            ${price}
                            <span className="ml-1 text-base font-medium text-brand-muted">/{selectedBilling === 'monthly' ? 'mo' : 'yr'}</span>
                          </p>
                        </div>
                        {featured && (
                          <span className="rounded-full bg-brand-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                            Popular
                          </span>
                        )}
                      </div>
                      {!available && (
                        <p className="text-sm text-amber-300">
                          This billing option is not configured yet.
                        </p>
                      )}
                      <ul className="space-y-2 text-sm text-brand-muted">
                        {PLAN_FEATURES[plan].map((feature) => (
                          <li key={feature}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      type="button"
                      variant={featured ? 'primary' : 'secondary'}
                      size="md"
                      className="mt-6"
                      disabled={checkoutLoading || !available}
                      onClick={() => handlePricingCheckout(plan)}
                      title={!available ? 'This billing option is not configured yet.' : undefined}
                    >
                      {checkoutLoading ? 'Redirecting…' : user ? `Choose ${PLAN_LABELS[plan]}` : `Sign in for ${PLAN_LABELS[plan]}`}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        </main>
      </>
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
          {publishedUrl && (
            <p className="mt-2 text-sm font-medium text-emerald-400">
              ✓ Published at: <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-300 transition">{publishedUrl}</a>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {publishedUrl ? (
            <>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Visit Live Site ↗
              </a>
              <button
                onClick={() => router.push('/dashboard')}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setStage('form');
                  setWebsite(null);
                  setDraftId(null);
                  setGenerationTime(null);
                  setPublishTime(null);
                  setPublishedUrl(null);
                  setPaywallOpen(false);
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
              >
                ← New Website
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
        selectedPlan={selectedPlan}
        selectedBilling={selectedBilling}
        availability={planAvailability}
        onPlanChange={setSelectedPlan}
        onBillingChange={setSelectedBilling}
        onContinue={continueToCheckout}
      />
    </>
  );
}

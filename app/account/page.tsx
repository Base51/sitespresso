import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountSettingsForm from '@/components/AccountSettingsForm';
import ManageBillingButton from '@/components/ManageBillingButton';
import UpgradePlanButton from '@/components/UpgradePlanButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/Logo';
import { NEXT_PLAN, PLAN_LABELS, PLAN_PRICING, type Plan } from '@/lib/billing/plans';
import { billingIntervalFromPriceId, isStripePriceConfigured, planFromPriceId } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseConfig } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatBillingInterval(value: 'monthly' | 'annual' | null): string {
  if (value === 'annual') return 'Annual billing';
  if (value === 'monthly') return 'Monthly billing';
  return 'Billing interval unavailable';
}

export default async function AccountPage(): Promise<JSX.Element> {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold text-white">Account settings</h1>
        <p className="text-slate-300">Supabase environment variables are not configured yet.</p>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, plan, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('status, stripe_price_id, current_period_end, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  const initialFullName = (profile?.full_name as string | null | undefined) ?? '';
  const initialEmail = (profile?.email as string | null | undefined) ?? user.email ?? '';
  const latestSubscription = subscriptions?.[0];
  const storedPlan = ((profile?.plan as string | undefined) ?? 'free') as Plan;
  const subscriptionPlan = planFromPriceId(latestSubscription?.stripe_price_id);
  const currentPlan = subscriptionPlan !== 'free' ? subscriptionPlan : storedPlan;
  const nextPlan = currentPlan === 'agency' ? null : NEXT_PLAN[currentPlan];
  const billingInterval = billingIntervalFromPriceId(latestSubscription?.stripe_price_id);
  const hasBillingProfile = Boolean(profile?.stripe_customer_id);
  const nextPlanPrice = nextPlan ? PLAN_PRICING[nextPlan].monthly : null;
  const planLabel = currentPlan === 'free' ? 'Free' : PLAN_LABELS[currentPlan];
  const nextPlanAvailable = nextPlan ? isStripePriceConfigured(nextPlan, 'monthly') : false;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Logo href="/dashboard" compact />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Account settings</h1>
            <p className="text-sm text-brand-muted">Manage your account profile details used across SiteSpresso.</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex"
        >
          <Button variant="secondary" size="sm">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <AccountSettingsForm initialFullName={initialFullName} initialEmail={initialEmail} />
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-brand-muted">Billing</p>
            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-white">{planLabel}</p>
              {currentPlan !== 'free' && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted">
              Renewal date: {formatDate(latestSubscription?.current_period_end)}
            </p>
            <p className="text-xs text-brand-muted">
              {currentPlan === 'free' ? 'No active paid subscription yet.' : formatBillingInterval(billingInterval)}
            </p>
            {nextPlan && nextPlanPrice !== null && (
              <p className="text-sm text-brand-muted">
                Next upgrade: <span className="font-medium text-white">{PLAN_LABELS[nextPlan]}</span> for ${nextPlanPrice}/month.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {nextPlan && <UpgradePlanButton plan={nextPlan} unavailable={!nextPlanAvailable} />}
            <ManageBillingButton disabled={!hasBillingProfile} />
          </div>
        </div>
      </Card>
    </main>
  );
}
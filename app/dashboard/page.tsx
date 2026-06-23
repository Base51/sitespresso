import { signOut } from '../actions/auth';
import { hasSupabaseConfig } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';
import { NEXT_PLAN, PLAN_LABELS, PLAN_PRICING, type Plan } from '@/lib/billing/plans';
import { billingIntervalFromPriceId, isStripePriceConfigured, planFromPriceId } from '@/lib/stripe';
import { checkRateLimit } from '@/lib/redis/rate-limiter';
import ManageBillingButton from '@/components/ManageBillingButton';
import UpgradePlanButton from '@/components/UpgradePlanButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/Logo';
import DashboardContent from '@/components/DashboardContent';
import QuotaDisplay from '@/components/QuotaDisplay';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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

const PLAN_QUOTAS = {
  free: 3,
  starter: 50,
  pro: 500,
  agency: 5000,
} as const;

export default async function DashboardPage(): Promise<JSX.Element> {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <p className="text-slate-300">Supabase environment variables are not configured yet.</p>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('status, stripe_price_id, current_period_end, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  const { data: sites } = await supabase
    .from('sites')
    .select('id, slug, business_name, business_type, city, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const storedPlan = ((profile?.plan as string | undefined) ?? 'free') as Plan;
  const hasStripeCustomer = Boolean(profile?.stripe_customer_id);
  const latestSubscription = subscriptions?.[0];
  const subscriptionPlan = planFromPriceId(latestSubscription?.stripe_price_id);
  const billingInterval = billingIntervalFromPriceId(latestSubscription?.stripe_price_id);
  const plan = subscriptionPlan !== 'free' ? subscriptionPlan : storedPlan;
  const nextPlan = plan === 'agency' ? null : NEXT_PLAN[plan];
  const currentPlanLabel = plan === 'free' ? 'Free' : PLAN_LABELS[plan];
  const nextPlanMonthlyPrice = nextPlan ? PLAN_PRICING[nextPlan].monthly : null;
  const nextPlanAnnualPrice = nextPlan ? PLAN_PRICING[nextPlan].annual : null;
  const nextPlanMonthlyAvailable = nextPlan ? isStripePriceConfigured(nextPlan, 'monthly') : false;
  const nextPlanAnnualAvailable = nextPlan ? isStripePriceConfigured(nextPlan, 'annual') : false;

  // Get actual remaining quota for this month
  const rateLimit = await checkRateLimit(user.id, plan);
  const totalQuota = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS] || 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Logo href="/dashboard" compact />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="text-sm text-brand-muted">Signed in as {user.email ?? 'unknown user'}.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="inline-flex"
          >
            <Button variant="secondary" size="sm">Account</Button>
          </Link>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">Sign out</Button>
          </form>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.18em] text-brand-muted">Current plan</p>
            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-white">{currentPlanLabel}</p>
              {plan !== 'free' && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted">
              Renewal date: {formatDate(latestSubscription?.current_period_end)}
            </p>
            <p className="text-xs text-brand-muted">
              {plan === 'free' ? 'No active paid subscription yet.' : formatBillingInterval(billingInterval)}
            </p>
            {nextPlan && nextPlanMonthlyPrice !== null && nextPlanAnnualPrice !== null && (
              <p className="text-sm text-brand-muted">
                Next upgrade: <span className="font-medium text-white">{PLAN_LABELS[nextPlan]}</span> for ${nextPlanMonthlyPrice}/month or ${nextPlanAnnualPrice}/year.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {nextPlan && (
              <UpgradePlanButton
                plan={nextPlan}
                billing="monthly"
                label={`Upgrade Monthly · $${PLAN_PRICING[nextPlan].monthly}`}
                unavailable={!nextPlanMonthlyAvailable}
              />
            )}
            {nextPlan && (
              <UpgradePlanButton
                plan={nextPlan}
                billing="annual"
                variant="secondary"
                label={`Upgrade Annual · $${PLAN_PRICING[nextPlan].annual}`}
                unavailable={!nextPlanAnnualAvailable}
              />
            )}
            <ManageBillingButton
              disabled={!hasStripeCustomer}
              returnPath="/dashboard"
              label="Manage Subscription"
              title="Open Stripe Billing Portal and return to the dashboard"
            />
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <QuotaDisplay
            remaining={rateLimit.remaining}
            total={totalQuota}
            label="Generation quota this month"
          />
        </div>

        <p className="mt-4 text-sm text-brand-muted">
          {hasStripeCustomer
            ? `Manage your ${billingInterval === 'annual' ? 'annual' : billingInterval === 'monthly' ? 'monthly' : ''} subscription, billing details, and invoices in Stripe Billing Portal.`.replace('  ', ' ')
            : 'Upgrade to a paid plan to publish, create your billing profile, and unlock Stripe Billing Portal access.'}
        </p>
      </Card>

      <DashboardContent sites={sites ?? []} />
    </main>
  );
}
import { signOut } from '../actions/auth';
import { hasSupabaseConfig } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';
import { NEXT_PLAN, PLAN_LABELS, formatPlanPrice, mergePlanPricing, type Plan } from '@/lib/billing/plans';
import { billingIntervalFromPriceId, getStripePlanPricingOverrides, isStripePriceConfigured, planFromPriceId } from '@/lib/stripe';
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

type SiteRow = {
  id: string;
  slug: string | null;
  business_name: string;
  business_type: string;
  city: string;
  status: 'draft' | 'published' | 'unpublished';
  custom_domain: string | null;
  domain_verified: boolean;
  domain_attached: boolean;
  updated_at: string | null;
};

type SitePageViewRow = {
  site_id: string;
  viewed_at: string;
  visitor_fingerprint: string | null;
};

type SiteAnalyticsSummary = {
  siteId: string;
  views30d: number;
  uniqueVisitors30d: number;
  lastSeenAt: string | null;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

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

  const [{ data: profile }, { data: subscriptions }, { data: sites }, stripePricingOverrides] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('status, stripe_price_id, current_period_end, updated_at')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing', 'past_due', 'unpaid'])
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('sites')
      .select('id, slug, business_name, business_type, city, status, custom_domain, domain_verified, domain_attached, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    getStripePlanPricingOverrides(),
  ]);

  const typedSites = (sites ?? []) as SiteRow[];

  const storedPlan = ((profile?.plan as string | undefined) ?? 'free') as Plan;
  const hasStripeCustomer = Boolean(profile?.stripe_customer_id);
  const latestSubscription = subscriptions?.[0];
  const hasActiveSubscription = Boolean(latestSubscription);
  const subscriptionPlan = planFromPriceId(latestSubscription?.stripe_price_id);
  const billingInterval = billingIntervalFromPriceId(latestSubscription?.stripe_price_id);
  const plan = subscriptionPlan !== 'free' ? subscriptionPlan : storedPlan;
  const planPricing = mergePlanPricing(stripePricingOverrides);
  const nextPlan = plan === 'agency' ? null : NEXT_PLAN[plan];
  const currentPlanLabel = plan === 'free' ? 'Free' : PLAN_LABELS[plan];
  const nextPlanMonthlyPrice = nextPlan ? planPricing[nextPlan].monthly : null;
  const nextPlanAnnualPrice = nextPlan ? planPricing[nextPlan].annual : null;
  const nextPlanMonthlyAvailable = nextPlan ? isStripePriceConfigured(nextPlan, 'monthly') : false;
  const nextPlanAnnualAvailable = nextPlan ? isStripePriceConfigured(nextPlan, 'annual') : false;

  // Get actual remaining quota for this month
  const rateLimit = await checkRateLimit(user.id, plan);
  const totalQuota = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS] || 0;

  const nowMs = Date.now();
  const last24hIso = new Date(nowMs - (24 * 60 * 60 * 1000)).toISOString();
  const last30dIso = new Date(nowMs - (30 * 24 * 60 * 60 * 1000)).toISOString();

  let analyticsRows: SitePageViewRow[] = [];
  let analyticsError: string | null = null;

  if (typedSites.length > 0) {
    const siteIds = typedSites.map((site) => site.id);
    const { data: pageViews, error: pageViewsError } = await supabase
      .from('site_page_views')
      .select('site_id, viewed_at, visitor_fingerprint')
      .in('site_id', siteIds)
      .gte('viewed_at', last30dIso)
      .order('viewed_at', { ascending: false })
      .limit(10000);

    if (pageViewsError) {
      analyticsError = pageViewsError.message;
    } else {
      analyticsRows = (pageViews ?? []) as SitePageViewRow[];
    }
  }

  const views24hRows = analyticsRows.filter((row) => row.viewed_at >= last24hIso);
  const uniqueVisitors30d = new Set(
    analyticsRows
      .map((row) => row.visitor_fingerprint)
      .filter((value): value is string => Boolean(value))
  ).size;
  const uniqueVisitors24h = new Set(
    views24hRows
      .map((row) => row.visitor_fingerprint)
      .filter((value): value is string => Boolean(value))
  ).size;

  const perSiteAnalyticsMap = new Map<string, SiteAnalyticsSummary>();
  for (const row of analyticsRows) {
    const existing = perSiteAnalyticsMap.get(row.site_id) || {
      siteId: row.site_id,
      views30d: 0,
      uniqueVisitors30d: 0,
      lastSeenAt: null,
    };

    existing.views30d += 1;
    if (!existing.lastSeenAt || row.viewed_at > existing.lastSeenAt) {
      existing.lastSeenAt = row.viewed_at;
    }
    perSiteAnalyticsMap.set(row.site_id, existing);
  }

  for (const [siteId, summary] of perSiteAnalyticsMap.entries()) {
    const uniqueVisitors = new Set(
      analyticsRows
        .filter((row) => row.site_id === siteId)
        .map((row) => row.visitor_fingerprint)
        .filter((value): value is string => Boolean(value))
    ).size;
    summary.uniqueVisitors30d = uniqueVisitors;
    perSiteAnalyticsMap.set(siteId, summary);
  }

  const perSiteAnalytics = Array.from(perSiteAnalyticsMap.values())
    .sort((a, b) => b.views30d - a.views30d);

  const topSite = perSiteAnalytics[0]
    ? typedSites.find((site) => site.id === perSiteAnalytics[0].siteId)
    : null;

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
                Next upgrade: <span className="font-medium text-white">{PLAN_LABELS[nextPlan]}</span> for {formatPlanPrice(nextPlanMonthlyPrice)}/month or {formatPlanPrice(nextPlanAnnualPrice)}/year.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {!hasActiveSubscription && nextPlan && (
              <UpgradePlanButton
                plan={nextPlan}
                billing="monthly"
                label={`Upgrade Monthly · ${formatPlanPrice(planPricing[nextPlan].monthly)}`}
                unavailable={!nextPlanMonthlyAvailable}
              />
            )}
            {!hasActiveSubscription && nextPlan && (
              <UpgradePlanButton
                plan={nextPlan}
                billing="annual"
                variant="secondary"
                label={`Upgrade Annual · ${formatPlanPrice(planPricing[nextPlan].annual)}`}
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
          {hasActiveSubscription
            ? `Manage your ${billingInterval === 'annual' ? 'annual' : billingInterval === 'monthly' ? 'monthly' : ''} subscription, billing details, and plan changes in Stripe Billing Portal.`.replace('  ', ' ')
            : 'Upgrade to a paid plan to publish, create your billing profile, and unlock Stripe Billing Portal access.'}
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Analytics (last 30 days)</h2>
            <p className="text-sm text-brand-muted">Page views and unique visitors across your published sites.</p>
          </div>
          {topSite ? (
            <p className="text-xs text-brand-muted">
              Top site: <span className="font-medium text-white">{topSite.business_name}</span>
            </p>
          ) : null}
        </div>

        {analyticsError ? (
          <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Analytics temporarily unavailable: {analyticsError}
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Views (30d)</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(analyticsRows.length)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Unique Visitors (30d)</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(uniqueVisitors30d)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Views (24h)</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(views24hRows.length)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-brand-muted">Unique Visitors (24h)</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatNumber(uniqueVisitors24h)}</p>
              </div>
            </div>

            {typedSites.length === 0 ? (
              <p className="mt-4 text-sm text-brand-muted">Create and publish a site to start collecting analytics.</p>
            ) : perSiteAnalytics.length === 0 ? (
              <p className="mt-4 text-sm text-brand-muted">No page views recorded yet for the last 30 days.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/[0.04] text-left text-brand-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Site</th>
                      <th className="px-4 py-3 font-medium">Views (30d)</th>
                      <th className="px-4 py-3 font-medium">Unique Visitors (30d)</th>
                      <th className="px-4 py-3 font-medium">Last view</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perSiteAnalytics.map((entry) => {
                      const site = typedSites.find((item) => item.id === entry.siteId);
                      if (!site) return null;

                      return (
                        <tr key={entry.siteId} className="border-t border-white/10 text-brand-text">
                          <td className="px-4 py-3">
                            <p className="font-medium text-white">{site.business_name}</p>
                            <p className="text-xs text-brand-muted">{site.slug ? `/${site.slug}` : 'No slug yet'}</p>
                          </td>
                          <td className="px-4 py-3">{formatNumber(entry.views30d)}</td>
                          <td className="px-4 py-3">{formatNumber(entry.uniqueVisitors30d)}</td>
                          <td className="px-4 py-3">{formatDate(entry.lastSeenAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

      <DashboardContent sites={typedSites} currentPlan={plan} />
    </main>
  );
}
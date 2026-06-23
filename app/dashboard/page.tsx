import { signOut } from '../actions/auth';
import { hasSupabaseConfig } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';
import { checkRateLimit } from '@/lib/redis/rate-limiter';
import ManageBillingButton from '@/components/ManageBillingButton';
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
    .select('status, current_period_end, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  const { data: sites } = await supabase
    .from('sites')
    .select('id, slug, business_name, business_type, city, status, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const plan = (profile?.plan as string | undefined) ?? 'free';
  const hasStripeCustomer = Boolean(profile?.stripe_customer_id);
  const latestSubscription = subscriptions?.[0];

  // Get actual remaining quota for this month
  const rateLimit = await checkRateLimit(user.id, plan as 'free' | 'starter' | 'pro' | 'agency');
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
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-brand-muted">Current plan</p>
            <p className="text-lg font-semibold text-white capitalize">{plan}</p>
            <p className="text-xs text-brand-muted">
              Renewal date: {formatDate(latestSubscription?.current_period_end)}
            </p>
          </div>
          <ManageBillingButton disabled={!hasStripeCustomer} />

        <div className="mt-4 border-t border-white/10 pt-4">
          <QuotaDisplay
            remaining={rateLimit.remaining}
            total={totalQuota}
            label="Generation quota this month"
          />
        </div>
        </div>

        <p className="text-sm text-brand-muted">
          {hasStripeCustomer
            ? 'Manage your subscription, billing details, and invoices in Stripe Billing Portal.'
            : 'Complete checkout once to create your billing profile and enable billing portal access.'}
        </p>
      </Card>

      <DashboardContent sites={sites ?? []} />
    </main>
  );
}
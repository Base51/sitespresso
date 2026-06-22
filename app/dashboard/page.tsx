import { signOut } from '../actions/auth';
import { hasSupabaseConfig } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';
import ManageBillingButton from '@/components/ManageBillingButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/Logo';
import EmptyState from '@/components/EmptyState';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function statusBadge(status: string): string {
  if (status === 'published') return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200';
  return 'border-white/10 bg-white/5 text-brand-muted-strong';
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
        </div>

        <p className="text-sm text-brand-muted">
          {hasStripeCustomer
            ? 'Manage your subscription, billing details, and invoices in Stripe Billing Portal.'
            : 'Complete checkout once to create your billing profile and enable billing portal access.'}
        </p>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-white">Your sites</h2>
          <Link
            href="/"
            className="inline-flex"
          >
            <Button variant="secondary" size="sm">+ New site</Button>
          </Link>
        </div>

        {!sites || sites.length === 0 ? (
          <EmptyState
            icon="✦"
            title="No sites yet"
            description="Generate your first AI website to get started. It takes less than a minute!"
            action={<Link href="/" className="inline-flex"><Button variant="primary" size="md">Generate My Website</Button></Link>}
          />
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <Card key={site.id} className="p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{site.business_name}</h3>
                    <p className="text-sm text-brand-muted">
                      {site.business_type} • {site.city}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusBadge(site.status)}`}
                  >
                    {site.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Link
                    href={`/editor/${site.id}`}
                    className="inline-flex"
                  >
                    <Button variant="secondary" size="sm">Edit site</Button>
                  </Link>

                  {site.status === 'published' && site.slug ? (
                    <a
                      href={`https://${site.slug}.sitespresso.com`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex"
                    >
                      <span className="inline-flex items-center justify-center rounded-xl bg-brand-primary px-3 py-2 text-sm font-medium text-slate-950 transition hover:bg-brand-primary-strong">
                        View live site
                      </span>
                    </a>
                  ) : (
                    <span className="text-brand-muted">Publish to get live link</span>
                  )}

                  <span className="ml-auto text-xs text-brand-muted">
                    Updated {formatDate(site.updated_at)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

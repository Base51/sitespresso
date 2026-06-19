import { signOut } from '../actions/auth';
import { hasSupabaseConfig } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';
import ManageBillingButton from '@/components/ManageBillingButton';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function statusBadge(status: string): string {
  if (status === 'published') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
  return 'bg-slate-500/15 text-slate-300 border-slate-500/40';
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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100 transition hover:border-slate-500"
          >
            Account
          </Link>
          <form action={signOut}>
            <button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <p className="text-slate-300">Signed in as {user.email ?? 'unknown user'}.</p>

      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Current plan</p>
            <p className="text-lg font-semibold text-white capitalize">{plan}</p>
            <p className="text-xs text-slate-400">
              Renewal date: {formatDate(latestSubscription?.current_period_end)}
            </p>
          </div>
          <ManageBillingButton disabled={!hasStripeCustomer} />
        </div>

        <p className="text-sm text-slate-400">
          {hasStripeCustomer
            ? 'Manage your subscription, billing details, and invoices in Stripe Billing Portal.'
            : 'Complete checkout once to create your billing profile and enable billing portal access.'}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Your sites</h2>
          <Link
            href="/"
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition hover:border-slate-500"
          >
            + New site
          </Link>
        </div>

        {!sites || sites.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
            No sites yet. Generate your first site to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <article
                key={site.id}
                className="rounded-xl border border-slate-700 bg-slate-900/40 p-5"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{site.business_name}</h3>
                    <p className="text-sm text-slate-400">
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
                    className="rounded-md border border-slate-600 px-3 py-1.5 text-slate-100 transition hover:border-slate-500"
                  >
                    Edit site
                  </Link>

                  {site.status === 'published' && site.slug ? (
                    <a
                      href={`https://${site.slug}.sitespresso.com`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-white transition hover:bg-blue-500"
                    >
                      View live site
                    </a>
                  ) : (
                    <span className="text-slate-500">Publish to get live link</span>
                  )}

                  <span className="ml-auto text-xs text-slate-500">
                    Updated {formatDate(site.updated_at)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

import { signOut } from '../actions/auth';
import { hasSupabaseConfig } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';
import ManageBillingButton from '@/components/ManageBillingButton';

export const dynamic = 'force-dynamic';

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id')
    .eq('id', user?.id ?? '')
    .single();

  const plan = (profile?.plan as string | undefined) ?? 'free';
  const hasStripeCustomer = Boolean(profile?.stripe_customer_id);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <form action={signOut}>
          <button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100" type="submit">
            Sign out
          </button>
        </form>
      </div>

      <p className="text-slate-300">Signed in as {user?.email ?? 'unknown user'}.</p>

      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Current plan</p>
            <p className="text-lg font-semibold text-white capitalize">{plan}</p>
          </div>
          <ManageBillingButton disabled={!hasStripeCustomer} />
        </div>

        <p className="text-sm text-slate-400">
          {hasStripeCustomer
            ? 'Manage your subscription, billing details, and invoices in Stripe Billing Portal.'
            : 'Complete checkout once to create your billing profile and enable billing portal access.'}
        </p>
      </div>
    </main>
  );
}

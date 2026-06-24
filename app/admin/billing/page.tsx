import Link from 'next/link';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { getAdminSession } from '@/lib/admin/guards';
import { buildBillingDuplicatesReport } from '@/lib/admin/billing-report';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default async function AdminBillingPage(): Promise<JSX.Element> {
  const adminSession = await getAdminSession();

  if (!adminSession.ok && adminSession.status === 401) {
    redirect('/login?next=/admin/billing');
  }

  if (!adminSession.ok) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Logo href="/dashboard" compact />
        <Card className="space-y-3">
          <p className="text-sm uppercase tracking-[0.18em] text-brand-muted">Admin access denied</p>
          <h1 className="font-display text-2xl font-semibold text-white">Billing operations</h1>
          <p className="text-sm text-brand-muted">{adminSession.error}</p>
          <Link href="/dashboard" className="inline-flex">
            <Button variant="secondary" size="sm">Back to dashboard</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const admin = createAdminClient();
  const report = await buildBillingDuplicatesReport(admin);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Logo href="/dashboard" compact />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Admin · Billing</h1>
            <p className="text-sm text-brand-muted">
              Duplicate active-subscription report for operational cleanup.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/billing" className="inline-flex">
            <Button variant="secondary" size="sm">Refresh</Button>
          </Link>
          <Link href="/api/admin/billing/duplicates" className="inline-flex">
            <Button variant="ghost" size="sm">View JSON</Button>
          </Link>
          <Link href="/dashboard" className="inline-flex">
            <Button variant="secondary" size="sm">Dashboard</Button>
          </Link>
        </div>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-brand-muted">
            Generated: <span className="text-white">{formatDate(report.generatedAt)}</span>
          </p>
          <p className="text-sm text-brand-muted">
            Affected users: <span className="text-white">{report.totalAffectedUsers}</span>
          </p>
        </div>
        <p className="text-xs text-brand-muted">
          Active-like statuses considered: {report.activeLikeStatuses.join(', ')}
        </p>
      </Card>

      {report.duplicates.length === 0 ? (
        <Card>
          <p className="text-sm text-emerald-300">No duplicate active subscriptions found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {report.duplicates.map((user) => (
            <Card key={user.userId} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{user.email ?? 'Unknown email'}</p>
                  <p className="text-xs text-brand-muted">User ID: {user.userId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                    {user.activeLikeCount} active-like subscriptions
                  </span>
                  {user.hasAgencyAnnual && (
                    <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                      Agency annual present
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-brand-muted">
                      <th className="py-2 pr-4">Subscription ID</th>
                      <th className="py-2 pr-4">Price ID</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.subscriptions.map((subscription) => (
                      <tr key={`${user.userId}-${subscription.stripeSubscriptionId}`} className="border-b border-white/5 text-brand-text">
                        <td className="py-2 pr-4 font-mono text-xs">
                          {subscription.stripeSubscriptionId ?? '—'}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs">{subscription.stripePriceId ?? '—'}</td>
                        <td className="py-2 pr-4">{subscription.status ?? '—'}</td>
                        <td className="py-2">{formatDate(subscription.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

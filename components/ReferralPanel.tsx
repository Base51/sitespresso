'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';

interface ReferralStats {
  referralCode: string;
  referrals: Array<{
    status: string;
    reward_amount_cents: number | null;
    created_at: string;
    rewarded_at: string | null;
  }>;
  totalEarnedCents: number;
}

export default function ReferralPanel(): JSX.Element {
  const { toast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referrals/stats');
      if (res.ok) {
        setStats(await res.json() as ReferralStats);
      }
    } catch {
      // silently ignore — panel just won't show stats
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadStats(); }, [loadStats]);

  function getReferralLink(): string {
    if (typeof window === 'undefined') return '';
    const code = stats?.referralCode ?? '';
    return `${window.location.origin}/?ref=${code}`;
  }

  async function copyLink(): Promise<void> {
    const link = getReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ type: 'error', title: 'Copy failed', description: 'Please copy the link manually.' });
    }
  }

  const pendingCount = stats?.referrals.filter((r) => r.status === 'pending').length ?? 0;
  const rewardedCount = stats?.referrals.filter((r) => r.status === 'rewarded').length ?? 0;
  const totalEarnedDollars = ((stats?.totalEarnedCents ?? 0) / 100).toFixed(2);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-brand-muted">Referral Program</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Earn $10 per referral</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Share your link. When someone signs up and subscribes, you get $10 credit applied to your next bill.
          </p>
        </div>

        {loading ? (
          <div className="h-10 animate-pulse rounded-lg bg-white/5" />
        ) : (
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-brand-muted">
              {getReferralLink()}
            </code>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-center">
            <p className="text-2xl font-semibold text-white">{stats?.referrals.length ?? 0}</p>
            <p className="mt-0.5 text-xs text-brand-muted">Total refs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-amber-300">{pendingCount}</p>
            <p className="mt-0.5 text-xs text-brand-muted">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-emerald-300">${totalEarnedDollars}</p>
            <p className="mt-0.5 text-xs text-brand-muted">Earned</p>
          </div>
        </div>

        {!loading && stats && stats.referrals.length > 0 && (
          <ul className="space-y-1.5 text-xs text-brand-muted">
            {stats.referrals.slice(0, 5).map((ref, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                <span
                  className={
                    ref.status === 'rewarded'
                      ? 'text-emerald-400'
                      : 'text-amber-300'
                  }
                >
                  {ref.status === 'rewarded'
                    ? `+$${((ref.reward_amount_cents ?? 0) / 100).toFixed(2)} rewarded`
                    : 'Pending subscription'}
                </span>
              </li>
            ))}
          </ul>
        )}

        {rewardedCount > 0 && (
          <p className="text-xs text-brand-muted">
            Credits are applied to your Stripe balance and reduce your next invoice automatically.
          </p>
        )}
      </div>
    </Card>
  );
}

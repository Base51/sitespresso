'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/hooks/useToast';
import { getCustomDomainInstructions } from '@/lib/domains';

interface Site {
  id: string;
  slug: string | null;
  business_name: string;
  business_type: string;
  city: string;
  status: 'draft' | 'published' | 'unpublished';
  custom_domain: string | null;
  domain_verified: boolean;
  updated_at: string | null;
}

interface DashboardContentProps {
  sites: Site[];
  currentPlan: 'free' | 'starter' | 'pro' | 'agency';
}

function statusBadge(status: string): string {
  if (status === 'published') return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200';
  return 'border-white/10 bg-white/5 text-brand-muted-strong';
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function DashboardContent({ sites, currentPlan }: DashboardContentProps): JSX.Element {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [localSites, setLocalSites] = useState(sites);
  const [domainInputs, setDomainInputs] = useState<Record<string, string>>(
    Object.fromEntries(sites.map((site) => [site.id, site.custom_domain ?? '']))
  );
  const [savingDomainId, setSavingDomainId] = useState<string | null>(null);
  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);

  function openDeleteModal(site: Site) {
    setSiteToDelete(site);
    setDeleteModalOpen(true);
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
    setSiteToDelete(null);
  }

  function handleDeleteConfirm() {
    // Remove the site from local state
    if (siteToDelete) {
      setLocalSites((prev) => prev.filter((s) => s.id !== siteToDelete.id));
    }
    closeDeleteModal();
    router.refresh();
  }

  async function handleDomainSave(site: Site) {
    const customDomain = (domainInputs[site.id] ?? '').trim();
    setSavingDomainId(site.id);

    try {
      const response = await fetch(`/api/sites/${site.id}/domain`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? 'Could not save custom domain.');
      }

      setLocalSites((prev) => prev.map((entry) => (
        entry.id === site.id
          ? { ...entry, custom_domain: json.customDomain as string, domain_verified: false }
          : entry
      )));

      toast({
        type: 'success',
        title: 'Custom domain saved',
        description: 'The domain was saved. Verification and live routing will ship in a later release.',
      });
      router.refresh();
    } catch (error) {
      toast({
        type: 'error',
        title: 'Custom domain unavailable',
        description: error instanceof Error ? error.message : 'Could not save custom domain.',
      });
    } finally {
      setSavingDomainId(null);
    }
  }

  async function handleDomainVerify(site: Site) {
    setVerifyingDomainId(site.id);

    try {
      const response = await fetch(`/api/sites/${site.id}/domain/verify`, {
        method: 'POST',
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? 'Could not verify custom domain.');
      }

      setLocalSites((prev) => prev.map((entry) => (
        entry.id === site.id
          ? { ...entry, domain_verified: Boolean(json.domainVerified) }
          : entry
      )));

      toast({
        type: json.domainVerified ? 'success' : 'warning',
        title: json.domainVerified ? 'Domain verified' : 'Domain not verified yet',
        description: json.message as string,
      });
      router.refresh();
    } catch (error) {
      toast({
        type: 'error',
        title: 'Verification failed',
        description: error instanceof Error ? error.message : 'Could not verify custom domain.',
      });
    } finally {
      setVerifyingDomainId(null);
    }
  }

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-white">Your sites</h2>
          <Link href="/" className="inline-flex">
            <Button variant="secondary" size="sm">
              + New site
            </Button>
          </Link>
        </div>

        {!localSites || localSites.length === 0 ? (
          <EmptyState
            icon="✦"
            title="No sites yet"
            description="Generate your first AI website to get started. It takes less than a minute!"
            action={
              <Link href="/" className="inline-flex">
                <Button variant="primary" size="md">
                  Generate My Website
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {localSites.map((site) => (
              <Card key={site.id} className="p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{site.business_name}</h3>
                    <p className="text-sm text-brand-muted">
                      {site.business_type} • {site.city}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusBadge(site.status)}`}>
                    {site.status}
                  </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Link href={`/editor/${site.id}`} className="inline-flex">
                      <Button variant="secondary" size="sm">
                        Edit site
                      </Button>
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
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-brand-muted">{formatDate(site.updated_at)}</span>
                    <button
                      onClick={() => openDeleteModal(site)}
                      className="inline-flex text-xs font-medium text-rose-400 transition hover:text-rose-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Custom domain</p>
                      <p className="text-xs text-brand-muted">
                        Bring your own domain. Available on Starter, Pro, and Agency plans.
                      </p>
                    </div>
                    {currentPlan === 'free' ? (
                      <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                        Paid feature
                      </span>
                    ) : (
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${site.domain_verified ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-brand-muted-strong'}`}>
                        {site.domain_verified ? 'Verified' : 'Not verified'}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="flex-1">
                      <label htmlFor={`custom-domain-${site.id}`} className="mb-2 block text-sm font-medium text-brand-muted-strong">
                        Domain name
                      </label>
                      <input
                        id={`custom-domain-${site.id}`}
                        type="text"
                        value={domainInputs[site.id] ?? ''}
                        onChange={(event) => setDomainInputs((prev) => ({ ...prev, [site.id]: event.target.value }))}
                        placeholder="example.com"
                        disabled={currentPlan === 'free' || savingDomainId === site.id}
                        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-brand-text placeholder:text-brand-muted outline-none transition focus:border-brand-primary/60 focus-visible:ring-2 focus-visible:ring-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-55"
                      />
                    </div>

                    {currentPlan === 'free' ? (
                      <Link href="/account" className="inline-flex">
                        <Button variant="secondary" size="md">
                          Upgrade to unlock
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="md"
                          disabled={savingDomainId === site.id || verifyingDomainId === site.id}
                          onClick={() => handleDomainSave(site)}
                        >
                          {savingDomainId === site.id ? 'Saving…' : 'Save domain'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="md"
                          disabled={!site.custom_domain || verifyingDomainId === site.id || savingDomainId === site.id}
                          onClick={() => handleDomainVerify(site)}
                          title={!site.custom_domain ? 'Save a custom domain first.' : undefined}
                        >
                          {verifyingDomainId === site.id ? 'Checking…' : 'Check DNS'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {currentPlan === 'free' ? (
                    <p className="mt-3 text-sm text-brand-muted">
                      Free plans can preview this feature, but custom domains require a paid subscription. Upgrade to connect your brand domain when activation ships.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2 text-sm text-brand-muted">
                      {getCustomDomainInstructions(site.custom_domain ?? domainInputs[site.id] ?? 'example.com', site.slug).map((instruction) => (
                        <p key={`${site.id}-${instruction}`}>{instruction}</p>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {siteToDelete && (
        <DeleteConfirmationModal
          siteName={siteToDelete.business_name}
          siteId={siteToDelete.id}
          isOpen={deleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}

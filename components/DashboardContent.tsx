'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import EmptyState from '@/components/EmptyState';

interface Site {
  id: string;
  slug: string | null;
  business_name: string;
  business_type: string;
  city: string;
  status: 'draft' | 'published' | 'unpublished';
  updated_at: string | null;
}

interface DashboardContentProps {
  sites: Site[];
}

function statusBadge(status: string): string {
  if (status === 'published') return 'border-emerald-500/35 bg-emerald-500/15 text-emerald-200';
  return 'border-white/10 bg-white/5 text-brand-muted-strong';
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function DashboardContent({ sites }: DashboardContentProps): JSX.Element {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [localSites, setLocalSites] = useState(sites);

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

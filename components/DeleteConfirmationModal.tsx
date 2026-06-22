'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/hooks/useToast';

interface DeleteConfirmationModalProps {
  siteName: string;
  siteId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmationModal({
  siteName,
  siteId,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/delete`, { method: 'DELETE' });
      const json = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        toast({
          type: 'error',
          title: 'Delete failed',
          description: json.error ?? 'Could not delete the site.',
        });
        return;
      }

      toast({
        type: 'success',
        title: 'Site deleted',
        description: `"${siteName}" has been deleted.`,
      });

      onConfirm();
    } catch (err) {
      toast({
        type: 'error',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-sm p-6">
        <h2 className="mb-3 font-display text-xl font-semibold text-white">Delete site?</h2>
        <p className="mb-6 text-sm text-brand-muted">
          This will permanently delete <span className="font-medium text-brand-muted-strong">&quot;{siteName}&quot;</span> and cannot be undone.
        </p>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import Spinner from './Spinner';

interface LogoUploadProps {
  siteId: string;
  currentLogoUrl?: string;
  onLogoDone: (url: string | null) => void;
}

export default function LogoUpload({ siteId, currentLogoUrl, onLogoDone }: LogoUploadProps) {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(currentLogoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentLogoUrl ?? null);
  }, [currentLogoUrl]);

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read selected file'));
          return;
        }
        const [, base64] = result.split(',');
        if (!base64) {
          reject(new Error('Invalid file encoding'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read selected file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast({
        type: 'error',
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, WebP, or SVG image.',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        type: 'error',
        title: 'File too large',
        description: 'Logo must be smaller than 5MB.',
      });
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);

      const res = await fetch(`/api/sites/${siteId}/logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: base64,
          filename: file.name,
          type: file.type,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.url) {
        throw new Error(json.error ?? 'Upload failed');
      }

      setPreview(json.url);
      onLogoDone(json.url);

      toast({
        type: 'success',
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded successfully.',
      });
    } catch (err) {
      console.error('Logo upload error:', err);
      toast({
        type: 'error',
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Failed to upload logo.',
      });
      setPreview(currentLogoUrl ?? null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!currentLogoUrl) {
      // If upload failed before persistence, still allow local reset.
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/logo`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Delete failed');
      }

      toast({
        type: 'success',
        title: 'Logo deleted',
        description: 'Your logo has been removed.',
      });

      setPreview(null);
      onLogoDone(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Logo delete error:', err);
      toast({
        type: 'error',
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Failed to delete logo.',
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">Logo</label>

      {preview ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-600 bg-slate-800/50 p-3">
          <div className="flex items-center gap-3">
            <img
              src={preview}
              alt="Logo preview"
              className="h-10 w-10 rounded object-contain"
            />
            <span className="text-sm text-slate-400">Logo uploaded</span>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50 transition"
          >
            {deleting ? 'Deleting...' : 'Remove'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/30 px-4 py-8 text-center transition hover:border-slate-500 disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-slate-400">Uploading...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-slate-300">📤 Upload Logo</div>
              <div className="text-xs text-slate-500">
                JPEG, PNG, WebP, or SVG (max 5MB)
              </div>
            </div>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
    </div>
  );
}

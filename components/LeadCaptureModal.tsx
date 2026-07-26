'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface LeadCaptureModalProps {
  open: boolean;
  businessName?: string;
  businessType?: string;
  city?: string;
  onClose: () => void;
  onCaptured: () => void;
}

export default function LeadCaptureModal({
  open,
  businessName,
  businessType,
  city,
  onClose,
  onCaptured,
}: LeadCaptureModalProps): JSX.Element | null {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          business_name: businessName,
          business_type: businessType,
          city,
          source: 'generate_form',
        }),
      });
      // Store email in session storage so signup can pre-fill
      sessionStorage.setItem('lead_email', email.trim().toLowerCase());
    } catch {
      // best-effort — proceed regardless
    } finally {
      setLoading(false);
    }

    onCaptured();
  }

  function handleSignUp() {
    router.push('/login?redirect=/&reason=save_site');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <Card className="w-full max-w-md p-6 md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="space-y-2 mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-brand-primary">Almost there</p>
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white">
            Save your website
          </h3>
          <p className="text-sm leading-relaxed text-brand-muted">
            Drop your email and we&apos;ll save your site and keep it ready to publish when you&apos;re set.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="lead_email"
            label="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            maxLength={254}
            autoFocus
            error={error}
            disabled={loading}
          />

          <Button type="submit" disabled={loading} size="lg" fullWidth>
            {loading ? 'Saving…' : 'Save My Site →'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleSignUp}
            className="text-sm text-brand-primary hover:underline transition"
          >
            Create a free account instead
          </button>
        </div>
      </Card>
    </div>
  );
}

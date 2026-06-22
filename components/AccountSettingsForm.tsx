'use client';

import { FormEvent, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type AccountSettingsFormProps = {
  initialFullName: string;
  initialEmail: string;
};

type ApiResult = {
  success?: boolean;
  error?: string;
  message?: string;
  emailChangePending?: boolean;
};

export default function AccountSettingsForm({
  initialFullName,
  initialEmail
}: AccountSettingsFormProps): JSX.Element {
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const dirty = useMemo(() => {
    return fullName.trim() !== initialFullName.trim() || email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
  }, [email, fullName, initialEmail, initialFullName]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email
      })
    });

    const json = (await response.json().catch(() => ({}))) as ApiResult;

    if (!response.ok || !json.success) {
      setError(json.error ?? 'Unable to save account settings.');
      setLoading(false);
      return;
    }

    setMessage(json.message ?? 'Profile saved.');
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        id="full_name"
        label="Full name"
        type="text"
        maxLength={120}
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Your name"
      />

      <Input
        id="email"
        label="Email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="owner@business.com"
        hint="Changing email may require confirmation via inbox."
      />

      <Button
        type="submit"
        disabled={!dirty || loading}
        variant="primary"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </Button>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
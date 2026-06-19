'use client';

import { FormEvent, useMemo, useState } from 'react';

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
      <div className="space-y-2">
        <label className="block text-sm text-slate-300" htmlFor="full_name">
          Full name
        </label>
        <input
          id="full_name"
          type="text"
          maxLength={120}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-slate-300" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          placeholder="owner@business.com"
        />
        <p className="text-xs text-slate-500">Changing email may require confirmation via inbox.</p>
      </div>

      <button
        type="submit"
        disabled={!dirty || loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Saving...' : 'Save changes'}
      </button>

      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
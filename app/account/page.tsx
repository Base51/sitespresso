import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountSettingsForm from '@/components/AccountSettingsForm';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseConfig } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export default async function AccountPage(): Promise<JSX.Element> {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold text-white">Account settings</h1>
        <p className="text-slate-300">Supabase environment variables are not configured yet.</p>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const initialFullName = (profile?.full_name as string | null | undefined) ?? '';
  const initialEmail = (profile?.email as string | null | undefined) ?? user.email ?? '';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Account settings</h1>
        <Link
          href="/dashboard"
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-100 transition hover:border-slate-500"
        >
          Back to dashboard
        </Link>
      </div>

      <p className="text-sm text-slate-400">Manage your account profile details used across SiteSpresso.</p>

      <section className="rounded-xl border border-slate-700 bg-slate-900/40 p-6">
        <AccountSettingsForm initialFullName={initialFullName} initialEmail={initialEmail} />
      </section>
    </main>
  );
}
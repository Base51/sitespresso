import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountSettingsForm from '@/components/AccountSettingsForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/Logo';
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
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Logo href="/dashboard" compact />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Account settings</h1>
            <p className="text-sm text-brand-muted">Manage your account profile details used across SiteSpresso.</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex"
        >
          <Button variant="secondary" size="sm">Back to dashboard</Button>
        </Link>
      </div>

      <Card>
        <AccountSettingsForm initialFullName={initialFullName} initialEmail={initialEmail} />
      </Card>
    </main>
  );
}
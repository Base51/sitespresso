import { signOut } from '../actions/auth';
import { hasSupabaseConfig } from '../../lib/supabase/config';
import { createClient } from '../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage(): Promise<JSX.Element> {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <p className="text-slate-300">Supabase environment variables are not configured yet.</p>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <form action={signOut}>
          <button className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100" type="submit">
            Sign out
          </button>
        </form>
      </div>

      <p className="text-slate-300">Signed in as {user?.email ?? 'unknown user'}.</p>
      <p className="text-slate-400">M2 complete: auth and protected route scaffold is active.</p>
    </main>
  );
}

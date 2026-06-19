import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { hasSupabaseConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import SitePreview from '@/components/SitePreview';
import type { Website } from '@/lib/schemas/website';

export const dynamic = 'force-dynamic';

type EditorPageProps = {
  params: { id: string };
};

export default async function EditorPage({ params }: EditorPageProps): Promise<JSX.Element> {
  if (!hasSupabaseConfig()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-16">
        <h1 className="text-3xl font-semibold text-white">Editor</h1>
        <p className="text-slate-300">Supabase environment variables are not configured yet.</p>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: site, error } = await supabase
    .from('sites')
    .select('id, business_name, content, user_id')
    .eq('id', params.id)
    .single();

  if (error || !site || site.user_id !== user.id) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Edit site</h1>
          <p className="text-sm text-slate-400">{site.business_name}</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100"
        >
          Back to dashboard
        </Link>
      </div>

      <SitePreview website={site.content as Website} initialDraftId={site.id} />
    </main>
  );
}

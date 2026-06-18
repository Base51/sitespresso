export default function Home(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
        SiteSpresso MVP Template
      </p>
      <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
        Build your AI-powered local business website in minutes.
      </h1>
      <p className="max-w-2xl text-pretty text-base text-slate-300 md:text-lg">
        This starter includes TypeScript, Tailwind, middleware, and API route scaffolding for the
        SiteSpresso roadmap.
      </p>
    </main>
  );
}

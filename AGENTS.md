# AGENTS.md — Working Rules for AI Agents and Contributors

These rules come from the project owner and apply to every session that works on this repository.

## Working rules

1. **Work only on this repository** (`Base51/sitespresso`).
2. **Never push to or merge into `main`** without explicit owner approval. Never force-push.
3. **Always use a feature branch + pull request** against `main` (for example `feat/...`, `fix/...`, `docs/...`).
4. **Prefer small, testable increments**: one concern per PR, with a clear verification step.
5. **No changes to billing, secrets, production environment variables or DNS without owner approval.** This includes Stripe products/prices/webhooks, `lib/stripe.ts` / `lib/billing/*` behaviour, Vercel env vars, Supabase project settings, and domain records.
6. **Never commit secrets or identifiers** (API keys, tokens, Supabase project refs, pooler URLs, price IDs, customer emails). `.env*` files are ignored and must stay that way.
7. **Update docs after every merged change**: at least [ROADMAP.md](ROADMAP.md) and [NEXT_ACTIONS.md](NEXT_ACTIONS.md), plus any affected file in [docs/](docs/).
8. **Stop and ask** if GitHub or the repository is unreachable, a required credential is missing, or a task would break any rule above. Don't work around it.

## Start-of-session reading list

1. [README.md](README.md)
2. [ROADMAP.md](ROADMAP.md): current status (done / in progress / deferred / planned)
3. [NEXT_ACTIONS.md](NEXT_ACTIONS.md): ordered next PRs
4. [AGENTS.md](AGENTS.md): this file
5. [docs/](docs/), especially [docs/tasks.md](docs/tasks.md), [docs/architecture.md](docs/architecture.md), [docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md](docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md), [docs/BILLING_CONFIG_CHECKLIST.md](docs/BILLING_CONFIG_CHECKLIST.md)

## Verification commands

Run before opening a PR (CI runs the same checks):

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test                      # Vitest unit tests (tests/unit/), no secrets needed
npm run build
npm run test:reliability:ci   # portable subset; needs PowerShell 7 (pwsh)
```

Notes:

- Many npm scripts (`dev:clean`, `dev:health`, `test:smoke`, `test:reliability*`, `test:billing-config`, `test:supabase-isolation`, `test:release-version`) call PowerShell scripts, so **PowerShell 7 (`pwsh`) must be installed**, including on macOS/Linux.
- `npm run test:reliability` (without `:ci`) also runs cloud checks that need Supabase/Vercel credentials and hit production. Run it only when those credentials are intentionally available.
- Unit tests use Vitest (`vitest.config.ts`, `tests/unit/**/*.test.ts`). `npm test` runs once, and `npm run test:watch` watches. Keep them pure: no network or real credentials. Stub env with `vi.stubEnv`, use obviously fake IDs, and mock `@/lib/supabase/server` where needed. Tests marked `it.skip`/`it.todo` document suspected bugs ([NEXT_ACTIONS.md](NEXT_ACTIONS.md) item 8).
- When adding or upgrading dependencies, use npm 10+ (the npm bundled with Node 20). Older npm 9.x (for example Debian's system npm) can crash with `Cannot read properties of null (reading 'edgesOut')`, so run `npx -y npm@10 install ...` instead.
- For docs-only PRs, make sure `git diff --name-only main` lists only `.md` files and every relative link resolves.

CI workflows (`.github/workflows/`):

| Workflow | What it runs |
|---|---|
| `ci.yml` (CI) | `npm install && npm run build` for the root app; builds `templates/react-app`; checks `templates/static-website/index.html` exists |
| `build-verify.yml` (Build Verification) | `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`, checks `.next/static` exists |
| `reliability.yml` (Reliability Checks) | `npm ci`, `npm run test:reliability:ci` |

## Key paths

| Area | Paths |
|---|---|
| App pages | `app/page.tsx` (landing + generator), `app/dashboard/`, `app/editor/[id]/`, `app/account/`, `app/login/`, `app/admin/billing/`, `app/legal/**` |
| Published sites | `app/sites/[slug]/page.tsx`, `app/sites/[slug]/[page]/page.tsx`, `app/sitemap.ts`, `app/robots.ts` |
| Host routing + auth gate | `middleware.ts` (subdomain + custom-domain rewrite; protects `/dashboard`, `/admin`) |
| API routes | `app/api/**/route.ts` (list in [docs/architecture.md](docs/architecture.md)) |
| AI | `app/api/generate/route.ts`, `app/api/sites/[id]/refresh-section/route.ts`, `app/api/sites/[id]/hero-image/route.ts`, `lib/ai/prompts.ts` |
| Content schema | `lib/schemas/website.ts` |
| Billing (approval required to change) | `lib/stripe.ts`, `lib/billing/plans.ts`, `lib/billing/site-limits.ts`, `app/api/billing/**`, `app/api/webhooks/stripe/route.ts`, `app/api/user/reconcile-billing/route.ts` |
| Rate limits / quotas | `lib/redis/rate-limiter.ts`, `lib/redis/client.ts` |
| Custom domains | `lib/domains.ts`, `lib/domains-server.ts`, `lib/vercel-domains.ts`, `app/api/sites/[id]/domain/**` |
| Supabase | `lib/supabase/*`, `supabase/migrations/*.sql` |
| UI components | `components/`, `components/ui/` |
| Scripts | `scripts/*.ps1` (pwsh), `scripts/*.ts` (tsx); unit tests in `tests/unit/` (Vitest) |
| Templates (project-factory legacy) | `templates/`, `prompts/` |

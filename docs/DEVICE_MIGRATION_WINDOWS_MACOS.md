# SiteSpresso Workstation Migration Guide

Use this runbook to move SiteSpresso development between Windows and macOS, or to keep both computers ready for development.

The safe model is:

- GitHub stores source code and documentation.
- Vercel stores shared application runtime variables.
- Supabase stores the existing database, authentication, storage, and migrations.
- Each computer authenticates independently to GitHub, Vercel, Supabase, Stripe, and VS Code.
- Secret files, CLI credential stores, build output, and dependency folders are not copied between computers.

Do not send `.env.local` through Git, email, chat, Live Share, Settings Sync, or an untrusted file-transfer extension.

## 1. Before Leaving the Current Computer

### 1.1 Confirm the repository is synchronized

From the repository root:

```powershell
git status
git branch --show-current
git remote -v
git fetch origin
```

Commit and push every change that should move to the other computer. Do not commit `.env.local`, `.vercel/`, `node_modules/`, `.next/`, logs, or Supabase CLI temporary state.

```powershell
git add <reviewed-files>
git commit -m "Describe the change"
git push origin <branch-name>
```

Verify the branch and commit are visible in `Base51/sitespresso` on GitHub before continuing.

### 1.2 Confirm cloud access

Make sure the account used on the new computer has access to:

| Service | Required access |
|---|---|
| GitHub | Repository read/write access to `Base51/sitespresso` |
| Vercel | SiteSpresso project and its Development, Preview, and Production environment variables |
| Supabase | The SiteSpresso project, SQL editor, database, Auth, and Storage |
| Stripe | The correct test/live account, products, prices, webhook, and customer portal settings |
| OpenAI | The project that owns the SiteSpresso API key |
| Redis provider | The Redis database referenced by `REDIS_URL`, when configured |
| DNS provider | `sitespresso.com` and customer-domain DNS access when domain work is required |

Use an individual account with least-privilege team access where the service supports it. Do not share a teammate's password, session cookie, personal access token, or recovery code.

### 1.3 Verify Vercel is the runtime-variable source of truth

In Vercel, open the SiteSpresso project and check the intended targets for every variable: Development, Preview, and Production. Values may intentionally differ by target.

Current application variable inventory:

| Area | Variables |
|---|---|
| Supabase runtime | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| App URL | `NEXT_PUBLIC_SITE_URL` |
| OpenAI | `OPENAI_API_KEY` |
| Stripe runtime | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Stripe prices | `STRIPE_STARTER_PRICE_ID`, `STRIPE_STARTER_ANNUAL_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`, `STRIPE_AGENCY_PRICE_ID`, `STRIPE_AGENCY_ANNUAL_PRICE_ID` |
| Custom domains | `VERCEL_ACCESS_TOKEN`, `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID` when the project belongs to a team |
| Optional services | `REDIS_URL`, `ADMIN_ALLOWLIST_EMAILS`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL`, `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL`, `NEXT_PUBLIC_SOCIAL_LINKEDIN_URL` |

Important distinctions:

- `SUPABASE_ACCESS_TOKEN` is a developer CLI credential. Authenticate each computer separately; do not deploy it as an application runtime variable.
- `VERCEL_OIDC_TOKEN` is generated and short-lived. Do not copy, preserve, or manually promote it.
- `VERCEL_ACCESS_TOKEN` is used by SiteSpresso's custom-domain integration. Keep the required runtime value in Vercel, rotate it when staff or devices change, and never commit it.
- Public variables prefixed with `NEXT_PUBLIC_` are included in browser code. Never place a service-role key or other secret in a `NEXT_PUBLIC_` variable.

See [BILLING_CONFIG_CHECKLIST.md](BILLING_CONFIG_CHECKLIST.md) and [PRODUCTION_DEPLOYMENT_RUNBOOK.md](PRODUCTION_DEPLOYMENT_RUNBOOK.md) for production-specific requirements.

### 1.4 Record non-secret identifiers

Record these in an approved team password manager or operations note, not in source code if organizational policy treats them as sensitive:

- GitHub organization and repository: `Base51/sitespresso`
- Vercel team/account and project name
- Supabase project name and project reference
- Stripe account name and whether local testing uses test mode
- DNS provider and zone names

Do not record secret values in this guide.

## 2. Prepare the Destination Computer

Use full-disk encryption and an OS account protected by a strong password and MFA before adding credentials.

### 2.1 Windows prerequisites

Install Git, Node.js, VS Code, GitHub CLI, and PowerShell 7. The repository's current PowerShell-based npm scripts require `pwsh`.

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id GitHub.cli -e
winget install --id Microsoft.PowerShell -e
```

Restart the terminal, then verify:

```powershell
git --version
node --version
npm --version
pwsh --version
code --version
gh --version
```

### 2.2 macOS prerequisites

Install Apple's command-line tools first:

```bash
xcode-select --install
```

Install Homebrew if it is not already available, following the instructions at <https://brew.sh>. Then install the required tools:

```bash
brew install git node gh
brew install --cask visual-studio-code powershell
```

Open a new terminal, then verify:

```bash
git --version
node --version
npm --version
pwsh --version
code --version
gh --version
```

The source machine currently uses Node.js `24.14.0` and npm `11.9.0`. This repository does not currently pin a Node version, so use the same Node major on both computers when reproducibility matters. If the LTS package installs a different major, use a Node version manager and select Node 24 before running `npm ci`.

### 2.3 Configure Git identity and authentication

Configure the same human identity on each computer:

```bash
git config --global user.name "YOUR NAME"
git config --global user.email "YOUR VERIFIED GITHUB EMAIL"
gh auth login
gh auth status
```

Complete authentication in the external system browser. Prefer GitHub's HTTPS credential-manager flow or a separate SSH key generated on each computer. Do not copy a private SSH key from the old computer unless organizational policy explicitly requires key escrow.

Optional SSH setup:

```bash
ssh-keygen -t ed25519 -C "YOUR VERIFIED GITHUB EMAIL"
```

Add only the new public key to GitHub, test it with `ssh -T git@github.com`, and protect the private key with a passphrase.

### 2.4 Configure VS Code

Sign in to VS Code Settings Sync if you want to synchronize settings, keyboard shortcuts, snippets, and extensions. Settings Sync does not transfer `.env.local` or project credentials.

Recommended Microsoft extensions for this workflow:

- GitHub Pull Requests and Issues
- Remote - SSH, only when directly administering another trusted computer over SSH

Do not use extension sync or Live Share as a secret-transfer mechanism. Review third-party extensions before installing them because extensions can access the workspace and integrated terminal.

## 3. Clone and Install SiteSpresso

Choose either HTTPS or SSH and create a fresh clone. Do not copy `node_modules`, `.next`, `.vercel`, or the whole old workspace.

HTTPS:

```bash
gh repo clone Base51/sitespresso
cd sitespresso
```

SSH alternative:

```bash
git clone git@github.com:Base51/sitespresso.git
cd sitespresso
```

Confirm the expected branch and a clean worktree:

```bash
git switch main
git pull --ff-only origin main
git status
```

Install exactly the dependency tree recorded in `package-lock.json`:

```bash
npm ci
```

## 4. Connect Vercel and Restore Runtime Variables

Authenticate the destination computer independently:

```bash
npx vercel login
npx vercel whoami
```

Complete login in the external browser. Link the clone to the existing SiteSpresso project, selecting the correct Vercel scope/team and existing project:

```bash
npx vercel link
```

This recreates the ignored `.vercel/` project metadata on the destination computer.

Pull only the Development-target variables into a temporary ignored file:

```bash
npx vercel env pull .env.vercel.local --environment=development
```

On a new workstation, review key names without displaying values, then make the local environment file.

PowerShell 7 on Windows or macOS:

```powershell
Get-Content .env.vercel.local |
  Where-Object { $_ -match '^\s*[A-Za-z_][A-Za-z0-9_]*\s*=' } |
  ForEach-Object { ($_ -split '=', 2)[0].Trim() } |
  Sort-Object -Unique
Copy-Item .env.vercel.local .env.local
Remove-Item .env.vercel.local
```

POSIX shell on macOS:

```bash
sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' .env.vercel.local | sort -u
cp .env.vercel.local .env.local
rm .env.vercel.local
chmod 600 .env.local
```

Rules:

1. Never pull Production variables into a routine local-development file.
2. Never overwrite an existing `.env.local` without first comparing key names and preserving intentional local-only settings.
3. Do not retain `VERCEL_OIDC_TOKEN` between CLI sessions.
4. Do not add `.env.local` with `git add -f`; the repository intentionally ignores all `.env*` files.
5. If a required Development value is absent, add it in Vercel with the correct target, then pull again. Do not solve drift by privately passing files between computers.

## 5. Connect Supabase Safely

The Supabase database, Auth users, Storage objects, and deployed schema already live in Supabase. Do not export and import the production database merely to change computers.

Runtime Supabase keys arrive through the Vercel Development environment pull. The Supabase CLI account is separate and must be authenticated on each computer.

```bash
npx supabase login
```

Complete authentication in the external browser. If browser login is unavailable, create a personal access token in Supabase and follow the CLI token-login prompt. Avoid placing the token directly in shell history.

Link this clone to the existing project using the project reference from the approved project record or Supabase dashboard:

```bash
npx supabase link --project-ref <PROJECT_REF>
npx supabase migration list --linked
```

The second command is read-only and should show local migration files aligned with the remote migration history. Do not run `supabase db push`, reset the database, or apply SQL simply because a new workstation was linked.

For later intentional migration work, use `npx supabase` from the repository root. `SUPABASE_SERVICE_ROLE_KEY` is an application secret and is not valid as Supabase CLI authentication.

## 6. Other Service Access

### 6.1 Stripe

No data migration is required. Products, prices, customers, subscriptions, and production webhooks remain in the existing Stripe account. Runtime Stripe values should come from Vercel Development variables.

For local webhook development only, install and authenticate Stripe CLI independently:

Windows:

```powershell
winget install --id Stripe.StripeCLI -e
stripe login
```

macOS:

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

Start a temporary local webhook forwarder when needed:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the temporary signing secret printed by that session only in the local `.env.local`. Do not replace the Vercel Production webhook secret with a local listener secret. Confirm the Stripe dashboard webhook still targets the production SiteSpresso endpoint.

### 6.2 OpenAI

No workstation login is needed for normal app execution. `OPENAI_API_KEY` should come from the Vercel Development environment. Confirm the key belongs to the intended OpenAI project and has appropriate limits. Rotate it if it was ever copied through an unapproved channel.

### 6.3 Redis

If `REDIS_URL` is configured, it should come from Vercel. No local Redis data copy is needed. Confirm the destination environment can reach the provider and that its TLS/access policy permits development use.

### 6.4 DNS and custom domains

DNS zones and Vercel domain assignments are cloud resources and do not move with the computer. Confirm access to the DNS provider and Vercel project before doing domain work. Do not alter DNS as part of workstation migration.

See [CUSTOM_DOMAIN_APEX_GUIDE.md](CUSTOM_DOMAIN_APEX_GUIDE.md) for intentional domain changes.

## 7. Validate the Destination Computer

From the repository root, run the checks in this order.

PowerShell-based scripts work on both operating systems after `pwsh` is installed:

```bash
npm run dev:health
npm run test:billing-config
npm run test:supabase-isolation
npm run build
```

Then start development:

```bash
npm run dev
```

Open <http://localhost:3000> in the normal external browser and verify:

1. The landing page and styles load.
2. Login completes and returns to localhost.
3. The dashboard can read existing Supabase data.
4. A controlled generation request succeeds.
5. Billing UI loads; do not complete a live purchase during workstation validation.
6. No secret value appears in browser console output, rendered HTML, Git changes, or terminal transcripts intended for sharing.

If Supabase login redirects fail only on the new computer, check that `http://localhost:3000/auth/callback` is allowed in the Supabase Auth redirect configuration. Do not remove production redirect URLs.

Finish with:

```bash
git status --short
git check-ignore -v .env.local .vercel
```

The worktree should contain no accidental secret or generated-file changes, and both paths should be ignored.

## 8. Work on Windows and macOS Concurrently

Use Git branches as the handoff mechanism; do not synchronize the live workspace with OneDrive, iCloud Drive, Dropbox, a network share, or direct file mirroring.

Before starting on either computer:

```bash
git fetch origin
git switch <your-feature-branch>
git pull --ff-only
npm ci
```

Before switching computers:

```bash
git status
git add <reviewed-files>
git commit -m "Describe the completed checkpoint"
git push origin <your-feature-branch>
```

On the other computer, fetch and pull before editing. Avoid editing the same uncommitted branch on both computers. Use separate feature branches when work must proceed independently, then merge through a pull request.

Environment changes require a separate handoff:

1. Update the appropriate Vercel target.
2. Tell collaborators the variable name and target, never the value.
3. Run `npx vercel env pull .env.vercel.local --environment=development` on the other computer.
4. Compare key names, merge deliberately into `.env.local`, and delete the temporary file.
5. Restart the Next.js development server after environment changes.

Database changes must be committed as timestamped files under `supabase/migrations/`, reviewed, and applied once through the agreed deployment process. Do not make unrecorded dashboard schema edits from either computer.

## 9. Decommission or Lose a Computer

After confirming the destination works, or immediately after a device is lost:

1. Revoke that device's GitHub sessions, SSH keys, and personal access tokens.
2. Revoke its Vercel and Supabase CLI sessions/tokens.
3. Revoke its Stripe CLI session if installed.
4. Rotate `VERCEL_ACCESS_TOKEN`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and other secrets if exposure is possible.
5. Update affected Vercel targets and redeploy when runtime secrets rotate.
6. Remove the device from VS Code Settings Sync and identity-provider device/session lists.
7. Securely erase the old disk before disposal or reassignment.

Rotating a token means updating every legitimate consumer before revoking the old value, then validating the application and deleting the old credential.

## 10. Migration Completion Checklist

- [ ] All source changes are committed and pushed to GitHub.
- [ ] The destination has full-disk encryption, OS updates, and MFA-protected accounts.
- [ ] Git, Node.js, npm, PowerShell 7, VS Code, and GitHub CLI are installed.
- [ ] The repository was freshly cloned and `npm ci` completed.
- [ ] GitHub, Vercel, and Supabase were authenticated independently.
- [ ] The clone is linked to the existing Vercel and Supabase projects.
- [ ] Development variables were pulled from Vercel without sharing `.env.local`.
- [ ] No `SUPABASE_ACCESS_TOKEN` or persistent `VERCEL_OIDC_TOKEN` was copied.
- [ ] `npm run dev:health` and `npm run test:billing-config` pass.
- [ ] `npm run test:supabase-isolation` and `npm run build` pass.
- [ ] Login, dashboard access, and one controlled generation work locally.
- [ ] `git status --short` is clean and secret paths are ignored.
- [ ] The branch handoff workflow has been tested in both directions.
- [ ] Old-device credentials were retained, revoked, or rotated according to whether both devices remain in use.
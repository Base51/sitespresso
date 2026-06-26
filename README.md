# project-factory

A GitHub template repository that serves as the base for all future projects.

The deployable SiteSpresso app now lives at the repository root. The `templates/` folder remains as scaffold/source material for future projects.

## Structure

```
project-factory/
├── .github/
│   └── copilot-instructions.md   # Copilot coding conventions & AI guidance
├── templates/
│   ├── static-website/           # Plain HTML/CSS/JS site scaffold
│   ├── react-app/                # React application scaffold
│   ├── nextjs-app/               # Next.js application scaffold
│   └── power-platform/           # Microsoft Power Platform solution scaffold
├── prompts/
│   ├── brainstorming.md          # Prompt for idea exploration
│   ├── mvp.md                    # Prompt for MVP scoping
│   ├── prd.md                    # Prompt for Product Requirements Document
│   └── architecture.md           # Prompt for technical architecture design
├── docs/                         # Project documentation
├── scripts/                      # Automation and utility scripts
└── README.md
```

## How to Use

1. Click **"Use this template"** on GitHub to create a new repository from this base.
2. Choose the relevant template from the `templates/` folder as your starting point.
3. Use the prompts in `prompts/` with GitHub Copilot or another AI assistant to plan your project.
4. Add documentation to `docs/` and automation scripts to `scripts/` as the project grows.

## Templates

| Template | Description |
|---|---|
| `static-website` | Minimal HTML/CSS/JS site, no build tooling required |
| `react-app` | React SPA with Vite |
| `nextjs-app` | Next.js app with App Router |
| `power-platform` | Microsoft Power Platform solution structure |

## Contributing

Add new templates under `templates/`, each with its own `README.md` describing setup and usage.

## Local Development

### Quick Start

```bash
npm install
npm run dev:clean:start  # Clean cache + start fresh dev server
```

Then open [http://localhost:3000](http://localhost:3000)

### Commands

- **`npm run dev`** — Start dev server
- **`npm run dev:clean`** — Clean cache only (does not start server)
- **`npm run dev:clean:start`** — Clean cache + start fresh dev server
- **`npm run dev:health`** — Check local dev environment health
- **`npm run test:billing-config`** — Validate required Stripe billing env vars
- **`npm run test:billing-config:all`** — Enforce full 4-tier Stripe config readiness
- **`npm run test:smoke`** — Run smoke checks for core flows
- **`npm run test:supabase-isolation`** — Validate Supabase project separation across local/template environments
- **`npm run test:release-version`** — Validate semver alignment and prevent duplicate release tags
- **`npm run test:release-version:strict`** — Require next release version to be greater than latest semver tag
- **`npm run test:reliability`** — Run health + smoke + build pipeline
- **`npm run build`** — Build for production
- **`npm start`** — Run production build locally
- **`npm run clean`** — Clean cache without restarting

### Troubleshooting

If you see a white page, missing styles, or 404 errors on `/_next/static/`, see [docs/DEVELOPMENT_CACHE.md](docs/DEVELOPMENT_CACHE.md) for solutions.

For Stripe pricing and billing env readiness, see [docs/BILLING_CONFIG_CHECKLIST.md](docs/BILLING_CONFIG_CHECKLIST.md).

For production deploy and release validation steps, see [docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md](docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md).
For versioning and release-tag rules, see [docs/VERSIONING_POLICY.md](docs/VERSIONING_POLICY.md).

For the latest completed production validation evidence, see [docs/PRODUCTION_E2E_VALIDATION_2026-06-25.md](docs/PRODUCTION_E2E_VALIDATION_2026-06-25.md).


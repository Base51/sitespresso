# project-factory

A GitHub template repository that serves as the base for all future projects.

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


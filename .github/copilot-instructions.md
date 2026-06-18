# GitHub Copilot Instructions

This repository is a **project factory** — a GitHub template that serves as the base for all future projects.

## Repository Structure

```
project-factory/
├── .github/                  # GitHub-specific configuration
│   └── copilot-instructions.md
├── templates/                # Project scaffolding templates
│   ├── static-website/       # Plain HTML/CSS/JS site
│   ├── react-app/            # React application
│   ├── nextjs-app/           # Next.js application
│   └── power-platform/       # Microsoft Power Platform solution
├── prompts/                  # AI-assisted planning prompts
│   ├── brainstorming.md
│   ├── mvp.md
│   ├── prd.md
│   └── architecture.md
├── docs/                     # Project documentation
├── scripts/                  # Automation and utility scripts
└── README.md
```

## Coding Conventions

- Use clear, descriptive names for files and folders.
- Each template folder should contain its own `README.md` explaining setup steps.
- Prompts should be written in plain Markdown and follow the provided templates.
- Scripts should be documented with usage instructions at the top of each file.

## AI Assistance Guidelines

- When generating code, follow the conventions of the target template (React, Next.js, etc.).
- Prioritize security (OWASP Top 10) and accessibility (WCAG 2.1 AA) in all generated code.
- Keep generated files minimal — avoid unnecessary boilerplate or comments.

## Project Rules

Always follow:

Research
→ MVP
→ PRD
→ Architecture
→ Development

Never create source code
before Architecture.md exists.

Generate documentation in markdown.

Store all project documentation
inside /docs.
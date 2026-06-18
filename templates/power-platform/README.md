# Power Platform Template

A scaffold for Microsoft Power Platform solutions managed with source control.

## Structure

```
power-platform/
├── solution/             # Exported solution files (unpacked)
├── flows/                # Power Automate flow definitions
├── canvas-apps/          # Canvas app source files (.msapp unpacked)
├── custom-connectors/    # Custom connector definitions
└── README.md
```

## Getting Started

### Prerequisites

- [Power Platform CLI (`pac`)](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- Access to a Power Platform environment

### Export a solution

```bash
pac auth create --url https://your-environment.crm.dynamics.com
pac solution export --name YourSolutionName --path solution/ --managed false
pac solution unpack --zipfile solution/YourSolutionName.zip --folder solution/unpacked
```

### Import a solution

```bash
pac solution pack --zipfile solution/YourSolutionName.zip --folder solution/unpacked
pac solution import --path solution/YourSolutionName.zip
```

### Unpack a Canvas App

```bash
pac canvas unpack --msapp canvas-apps/YourApp.msapp --sources canvas-apps/YourApp/
```

## Conventions

- Always store **unmanaged** solution exports for source control.
- Never commit `.zip` files — unpack them first.
- Each flow and canvas app should have its own subfolder.
- Use environment variables for all connection references and URLs.

## CI/CD

Use [Power Platform Build Tools](https://learn.microsoft.com/en-us/power-platform/alm/devops-build-tools) for GitHub Actions or Azure DevOps pipelines.

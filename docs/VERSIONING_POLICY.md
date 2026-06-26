# Versioning Policy

This repository uses semantic versioning tags in the format `vMAJOR.MINOR.PATCH`.

## Rules

1. Never move or overwrite an existing release tag.
2. Every release tag must match `package.json` version prefixed with `v`.
3. New release version must be greater than the latest existing semver tag.
4. Use annotated tags for releases.

## Workflow

1. Choose release type:
   - patch: bugfixes and hardening (`x.y.Z`)
   - minor: backwards-compatible features (`x.Y.0`)
   - major: breaking changes (`X.0.0`)
2. Update `package.json` version.
3. Run release checks:
   - `npm run test:release-version:strict`
   - `npm run test:reliability`
4. Create and push annotated tag:

```bash
git tag -a v<version> -m "Release v<version>"
git push origin v<version>
```

## Guardrails

1. `npm run test:release-version`:
   - blocks tag reuse
   - blocks package version behind latest semver tag
2. `npm run test:release-version:strict`:
   - requires package version to be greater than latest semver tag

## Current Note

`v1.0.0` already exists on an older commit. New releases must use a higher version (for example `v1.0.1`).

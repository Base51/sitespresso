# Development Cache & Build Issues

## Problem

Occasionally, the development server can have stale Next.js build cache that causes:
- White/blank pages
- Missing styles (CSS not loading)
- Static assets returning 404s (`/_next/static/...`)
- Broken layouts after updates

## Root Cause

Next.js caches build artifacts in the `.next` folder and TypeScript caches in `tsconfig.tsbuildinfo`. If these become corrupted or out of sync during development, the dev server can serve stale or broken assets.

## Solution

### Option 1: Automatic (Recommended)

Use the clean dev command which automatically removes cache before starting:

```bash
npm run dev:clean:start
```

This runs `scripts/clean-dev.ps1` which:
- Kills any stale Node processes
- Removes `.next` build cache
- Removes `.turbo` cache (if using Turborepo)
- Removes TypeScript build info
- Starts a fresh dev server

### Option 2: Clean Without Restarting

If you need to clean without restarting:

```bash
npm run dev:clean
```

Then restart your dev server:

```bash
npm run dev
```

## When to Use Each Command

| Situation | Command |
|-----------|---------|
| Regular development | `npm run dev` |
| After pulling new code | `npm run dev:clean:start` |
| After failed builds | `npm run dev:clean:start` |
| Experiencing white/blank pages | `npm run dev:clean:start` |
| Styles not loading | `npm run dev:clean:start` |
| Only need to clean (don't restart) | `npm run dev:clean` |

## Health and Reliability Checks

Before opening PRs, run:

```bash
npm run test:reliability
```

This includes:
- `npm run dev:health`
- `npm run test:smoke`
- `npm run build`

## Preventing the Issue

1. **Always use `npm run dev:clean:start` after:**
   - Pulling new commits from git
   - Merging branches
   - Significant code changes
   - If you see any 404s for `/_next/static/*`

2. **If it happens in production**, it's likely a deployment issue—Vercel rebuilds automatically and shouldn't have this problem.

## Browser-Level Troubleshooting

If clean cache didn't work:

1. **Hard refresh the browser:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

2. **Clear browser cache:**
   - Open DevTools → Application → Cache Storage → Delete all

3. **Open in incognito/private mode** to bypass all browser caching

## Still Stuck?

If the issue persists:

1. Close all browser tabs pointing to `localhost:3000`
2. Kill all Node processes: `Get-Process node | Stop-Process -Force`
3. Delete `.next`: `rm -r .next` (or right-click delete in Explorer)
4. Run `npm run dev:clean:start`
5. Open a fresh browser tab to `http://localhost:3000`

If that doesn't work, try a full reinstall:

```bash
rm -r node_modules package-lock.json
npm install
npm run dev:clean:start
```

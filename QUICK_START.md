# 🚀 Quick Start Guide

## Installation & First Run

```bash
npm install
npm run dev:clean:start
```

Open [http://localhost:3000](http://localhost:3000)

## Daily Development

```bash
# Regular development (usually fine)
npm run dev

# After pulling new code or if you see styling issues
npm run dev:clean:start

# Production build
npm run build
npm start
```

## Testing & Validation

```bash
# Check local environment health
npm run dev:health

# Run core smoke checks
npm run test:smoke

# Full reliability pipeline
npm run test:reliability

# Focused Stripe billing configuration check
npm run test:billing-config
```

## If Something Breaks

| Symptom | Solution |
|---------|----------|
| White page / missing styles | `npm run dev:clean:start` |
| `/_next/static` 404 errors | `npm run dev:clean:start` |
| After pulling new code | `npm run dev:clean:start` |
| Build failing | `npm run clean && npm install && npm run build` |
| Not sure env is healthy | `npm run dev:health` |

## Important Files

- **Environment**: `.env.local` (not in git)
- **App layout**: `app/layout.tsx`
- **Styles**: `app/globals.css` (Tailwind)
- **API routes**: `app/api/`
- **Config**: `next.config.js`, `tailwind.config.ts`

## Documentation

- [Full development guide](docs/DEVELOPMENT_CACHE.md)
- [Billing config checklist](docs/BILLING_CONFIG_CHECKLIST.md)
- [Project requirements](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Task tracking](docs/tasks.md)

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com/docs)
- [Stripe](https://stripe.com/docs)

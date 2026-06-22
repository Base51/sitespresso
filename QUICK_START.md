# 🚀 Quick Start Guide

## Installation & First Run

```bash
npm install
npm run dev:clean
```

Open [http://localhost:3000](http://localhost:3000)

## Daily Development

```bash
# Regular development (usually fine)
npm run dev

# After pulling new code or if you see styling issues
npm run dev:clean

# Production build
npm run build
npm start
```

## If Something Breaks

| Symptom | Solution |
|---------|----------|
| White page / missing styles | `npm run dev:clean` |
| `/_next/static` 404 errors | `npm run dev:clean` |
| After pulling new code | `npm run dev:clean` |
| Build failing | `npm run clean && npm install && npm run build` |

## Important Files

- **Environment**: `.env.local` (not in git)
- **App layout**: `app/layout.tsx`
- **Styles**: `app/globals.css` (Tailwind)
- **API routes**: `app/api/`
- **Config**: `next.config.js`, `tailwind.config.ts`

## Documentation

- [Full development guide](docs/DEVELOPMENT_CACHE.md)
- [Project requirements](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Task tracking](docs/tasks.md)

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com/docs)
- [Stripe](https://stripe.com/docs)

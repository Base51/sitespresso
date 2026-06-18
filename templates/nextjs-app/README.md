# Next.js App Template

A Next.js application scaffold using the **App Router**, **TypeScript**, and **Tailwind CSS**.

## Structure

```
nextjs-app/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── app/api/              # API route handlers scaffold
├── components/           # Reusable UI components
├── public/               # Static assets served at /
├── middleware.ts         # Subdomain rewrite middleware
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .prettierrc.json
├── .env.local.example
└── README.md
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm run start
```

## Conventions

- Use the `app/` directory for all routes (App Router).
- Each route is a folder with a `page.tsx` file inside.
- Place reusable UI components in `components/`.
- Place static files (images, fonts, icons) in `public/`.
- Use Server Components by default; add `"use client"` only when needed.
- Keep secrets in `.env.local` and never commit secret values.

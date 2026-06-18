# Next.js App Template

A Next.js application scaffold using the **App Router**.

## Structure

```
nextjs-app/
├── app/
│   ├── layout.jsx        # Root layout
│   ├── page.jsx          # Home page
│   └── globals.css       # Global styles
├── components/           # Reusable UI components
├── public/               # Static assets served at /
├── package.json
├── next.config.js
└── README.md
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Conventions

- Use the `app/` directory for all routes (App Router).
- Each route is a folder with a `page.jsx` file inside.
- Place reusable UI components in `components/`.
- Place static files (images, fonts, icons) in `public/`.
- Use Server Components by default; add `"use client"` only when needed.

# React App Template

A React application scaffold using **Vite** as the build tool.

## Structure

```
react-app/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx          # Application entry point
│   ├── App.jsx           # Root component
│   ├── components/       # Reusable UI components
│   └── pages/            # Page-level components
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

# Preview production build
npm run preview
```

## Conventions

- Place reusable UI pieces in `src/components/`.
- Place route-level views in `src/pages/`.
- Each component lives in its own folder: `components/Button/Button.jsx`.
- Use `.jsx` for files containing JSX; `.js` for plain logic files.

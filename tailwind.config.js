/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'hsl(var(--background))',
          'bg-soft': 'hsl(var(--background-soft))',
          surface: 'hsl(var(--surface))',
          'surface-strong': 'hsl(var(--surface-strong))',
          text: 'hsl(var(--foreground))',
          muted: 'hsl(var(--muted))',
          'muted-strong': 'hsl(var(--muted-strong))',
          border: 'hsl(var(--border))',
          primary: 'hsl(var(--primary))',
          'primary-strong': 'hsl(var(--primary-strong))',
          accent: 'hsl(var(--accent))',
          danger: 'hsl(var(--danger))',
          success: 'hsl(var(--success))'
        }
      },
      boxShadow: {
        panel: '0 24px 60px rgba(2, 6, 23, 0.35)',
        glow: '0 0 0 1px rgba(248, 250, 252, 0.05), 0 18px 44px rgba(2, 6, 23, 0.32)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif']
      }
    }
  },
  plugins: []
};

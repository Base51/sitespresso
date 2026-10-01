import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastProvider } from '@/components/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import GlobalFooter from '@/components/GlobalFooter';
import { Suspense } from 'react';
import ReferralCapture from '@/components/ReferralCapture';
import ReferralApply from '@/components/ReferralApply';

const isVercelRuntime = Boolean(process.env.VERCEL_URL);

// Brand fonts (docs/DESIGN.md §3.5, §5): Outfit for the wordmark and headings (font-display),
// Inter for UI and body text (font-sans). next/font self-hosts both at build time.
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-outfit',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SiteSpresso',
  description: 'AI-powered website builder for local businesses.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-brand-bg text-brand-text antialiased">
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <GlobalFooter />
          </div>
          <ToastContainer />
          <Suspense fallback={null}><ReferralCapture /></Suspense>
          <Suspense fallback={null}><ReferralApply /></Suspense>
          {isVercelRuntime ? <Analytics /> : null}
          {isVercelRuntime ? <SpeedInsights /> : null}
        </ToastProvider>
      </body>
    </html>
  );
}

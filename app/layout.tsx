import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastProvider } from '@/components/ToastContext';
import ToastContainer from '@/components/ToastContainer';
import GlobalFooter from '@/components/GlobalFooter';

const isVercelRuntime = Boolean(process.env.VERCEL_URL);

export const metadata: Metadata = {
  title: 'SiteSpresso',
  description: 'AI-powered website builder for local businesses.',
  icons: {
    icon: '/favicon.svg',
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-bg text-brand-text antialiased">
        <ToastProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <GlobalFooter />
          </div>
          <ToastContainer />
          {isVercelRuntime ? <Analytics /> : null}
          {isVercelRuntime ? <SpeedInsights /> : null}
        </ToastProvider>
      </body>
    </html>
  );
}

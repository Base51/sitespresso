import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastProvider } from '@/components/ToastContext';
import ToastContainer from '@/components/ToastContainer';

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
      <body>
        <ToastProvider>
          {children}
          <ToastContainer />
          {isVercelRuntime ? <Analytics /> : null}
          {isVercelRuntime ? <SpeedInsights /> : null}
        </ToastProvider>
      </body>
    </html>
  );
}

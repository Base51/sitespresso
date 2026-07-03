import type { MetadataRoute } from 'next';

const ROOT_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sitespresso.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  const host = (() => {
    try {
      return new URL(ROOT_URL).host;
    } catch {
      return 'sitespresso.com';
    }
  })();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/account', '/admin'],
      },
    ],
    sitemap: `${ROOT_URL}/sitemap.xml`,
    host,
  };
}
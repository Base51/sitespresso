const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizeCustomDomain(value: string): string {
  return value.trim().toLowerCase();
}

export function validateCustomDomain(value: string): string | null {
  const normalized = normalizeCustomDomain(value);

  if (!normalized) {
    return 'A custom domain is required.';
  }

  if (normalized.includes('://')) {
    return 'Enter only the domain name, without http:// or https://.';
  }

  if (normalized.includes('/') || normalized.includes('?') || normalized.includes('#')) {
    return 'Enter only the domain name, without paths or query strings.';
  }

  if (normalized.includes('*')) {
    return 'Wildcard domains are not supported.';
  }

  if (normalized.includes(' ')) {
    return 'Spaces are not allowed in domain names.';
  }

  if (!DOMAIN_PATTERN.test(normalized)) {
    return 'Enter a valid root domain or subdomain.';
  }

  if (normalized === 'sitespresso.com' || normalized.endsWith('.sitespresso.com')) {
    return 'Use your own custom domain, not a SiteSpresso hostname.';
  }

  if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
    return 'Localhost domains are not valid for custom domain setup.';
  }

  return null;
}

export function getCustomDomainInstructions(domain: string, slug: string | null): string[] {
  const normalized = normalizeCustomDomain(domain);

  if (!slug) {
    return [
      `Custom domain ${normalized} is saved. Publish this site first to generate the final SiteSpresso target hostname.`,
      'After the site is published, run DNS verification and attach the domain in the dashboard.',
    ];
  }

  return [
    `Custom domain ${normalized} is saved for this site.`,
    `Point your DNS to ${slug}.sitespresso.com, then run Check DNS and Attach to Vercel in the dashboard.`,
    'Live routing turns on after DNS verification and Vercel attach succeed.',
  ];
}

export function getExpectedCustomDomainTarget(slug: string): string {
  return `${slug}.sitespresso.com`;
}

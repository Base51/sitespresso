import { describe, expect, it } from 'vitest';
import {
  getCustomDomainInstructions,
  getExpectedCustomDomainTarget,
  normalizeCustomDomain,
  validateCustomDomain,
} from '@/lib/domains';
import { DEFAULT_LANGUAGE, getLanguageLabel, normalizeLanguage } from '@/lib/i18n/languages';

describe('validateCustomDomain', () => {
  it.each(['example.com', 'www.example.com', 'shop.example.co.uk', '  Example.COM  ', 'my-shop.pt'])(
    'accepts %j',
    (domain) => {
      expect(validateCustomDomain(domain)).toBeNull();
    },
  );

  it.each([
    ['', 'A custom domain is required.'],
    ['   ', 'A custom domain is required.'],
    ['https://example.com', 'Enter only the domain name, without http:// or https://.'],
    ['example.com/path', 'Enter only the domain name, without paths or query strings.'],
    ['example.com?x=1', 'Enter only the domain name, without paths or query strings.'],
    ['example.com#top', 'Enter only the domain name, without paths or query strings.'],
    ['*.example.com', 'Wildcard domains are not supported.'],
    ['exa mple.com', 'Spaces are not allowed in domain names.'],
    ['example', 'Enter a valid root domain or subdomain.'],
    ['-bad.example.com', 'Enter a valid root domain or subdomain.'],
    ['example.c', 'Enter a valid root domain or subdomain.'],
    ['under_score.example.com', 'Enter a valid root domain or subdomain.'],
    [`${'a'.repeat(64)}.com`, 'Enter a valid root domain or subdomain.'],
    ['sitespresso.com', 'Use your own custom domain, not a SiteSpresso hostname.'],
    ['shop.sitespresso.com', 'Use your own custom domain, not a SiteSpresso hostname.'],
    ['app.localhost', 'Localhost domains are not valid for custom domain setup.'],
  ])('rejects %j', (domain, message) => {
    expect(validateCustomDomain(domain)).toBe(message);
  });

  it('rejects bare "localhost" via the pattern check (it has no TLD)', () => {
    expect(validateCustomDomain('localhost')).toBe('Enter a valid root domain or subdomain.');
  });
});

describe('custom domain helpers', () => {
  it('normalizeCustomDomain trims and lowercases', () => {
    expect(normalizeCustomDomain('  WWW.Example.com ')).toBe('www.example.com');
  });

  it('getExpectedCustomDomainTarget points at the slug subdomain', () => {
    expect(getExpectedCustomDomainTarget('janes-salon')).toBe('janes-salon.sitespresso.com');
  });

  it('getCustomDomainInstructions covers unpublished and published sites', () => {
    const unpublished = getCustomDomainInstructions(' Example.com ', null);
    expect(unpublished).toHaveLength(2);
    expect(unpublished[0]).toContain('example.com is saved');
    expect(unpublished[0]).toContain('Publish this site first');

    const published = getCustomDomainInstructions('example.com', 'janes-salon');
    expect(published).toHaveLength(3);
    expect(published[1]).toContain('janes-salon.sitespresso.com');
  });
});

describe('normalizeLanguage', () => {
  it.each([
    ['pt', 'pt'],
    ['PT', 'pt'],
    ['pt-BR', 'pt'],
    ['en_GB', 'en'],
    [' fr ', 'fr'],
    ['de', 'de'],
    ['it', 'it'],
    ['es-419', 'es'],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeLanguage(input)).toBe(expected);
  });

  it('falls back to the default language', () => {
    expect(DEFAULT_LANGUAGE).toBe('en');
    for (const value of ['ja', '', null, undefined, 1]) {
      expect(normalizeLanguage(value)).toBe('en');
    }
  });

  it('getLanguageLabel returns English labels', () => {
    expect(getLanguageLabel('pt')).toBe('Portuguese');
    expect(getLanguageLabel('en')).toBe('English');
  });
});

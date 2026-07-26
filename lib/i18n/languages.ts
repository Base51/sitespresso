export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

const LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((language) => language.code) as readonly string[];

export function normalizeLanguage(value: unknown): LanguageCode {
  if (typeof value !== 'string') {
    return DEFAULT_LANGUAGE;
  }

  const normalized = value.trim().toLowerCase().split(/[-_]/)[0];
  if (LANGUAGE_CODES.includes(normalized)) {
    return normalized as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export function getLanguageLabel(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? 'English';
}

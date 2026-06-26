import { z } from 'zod';

// Schema for a single text section (Hero, About, Services, Contact)
const SectionSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(10).max(500),
  cta_text: z.string().max(50).optional(),
  cta_url: z.string().optional(),
});

// Schema for service items within Services section
const ServiceSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().min(10).max(150),
});

const ServicesSectionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10).max(200),
  items: z.array(ServiceSchema).min(1).max(8),
});

const ContactSectionSchema = z.object({
  title: z.string().min(1).max(100),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  hours: z.string().optional(),
});

const PageSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  seo: z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().min(1).max(160).optional(),
  }).optional(),
  hero: SectionSchema.partial().optional(),
  about: SectionSchema.partial().optional(),
  services: ServicesSectionSchema.partial().optional(),
  contact: ContactSectionSchema.partial().optional(),
});

// Main website JSON structure
export const WebsiteSchema = z.object({
  business_name: z.string().min(1).max(100),
  business_type: z.string().min(1).max(50),
  city: z.string().min(1).max(50),
  tagline: z.string().min(10).max(150),
  hero: SectionSchema,
  about: SectionSchema,
  services: ServicesSectionSchema,
  contact: ContactSectionSchema,
  color_scheme: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    neutral: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  }),
  fonts: z.object({
    heading: z.string().default('Playfair Display'),
    body: z.string().default('Inter'),
  }),
  logo: z.object({
    url: z.string().optional(),
    position: z.enum(['left', 'center', 'right']).default('left'),
    width: z.number().min(30).max(200).default(100),
  }),
  layout: z.object({
    section_order: z.array(z.enum(['about', 'services', 'contact'])).optional(),
    section_backgrounds: z.object({
      about: z.string().regex(/^#[0-9A-F]{6}$/i),
      services: z.string().regex(/^#[0-9A-F]{6}$/i),
      contact: z.string().regex(/^#[0-9A-F]{6}$/i),
    }).optional(),
  }).optional(),
  pages: z.object({
    home: PageSchema.optional(),
    about: PageSchema.optional(),
    contact: PageSchema.optional(),
  }).optional(),
});

export type Website = z.infer<typeof WebsiteSchema>;
export type WebsitePageKey = 'home' | 'about' | 'contact';

function withLegacyTopLevelFallback(content: unknown): unknown {
  if (!content || typeof content !== 'object') return content;

  const candidate = content as Record<string, unknown>;
  const pages = candidate.pages;
  if (!pages || typeof pages !== 'object') return content;

  const home = (pages as Record<string, unknown>).home;
  if (!home || typeof home !== 'object') return content;

  const normalized: Record<string, unknown> = { ...candidate };
  const homePage = home as Record<string, unknown>;

  if (normalized.hero == null && homePage.hero != null) normalized.hero = homePage.hero;
  if (normalized.about == null && homePage.about != null) normalized.about = homePage.about;
  if (normalized.services == null && homePage.services != null) normalized.services = homePage.services;
  if (normalized.contact == null && homePage.contact != null) normalized.contact = homePage.contact;

  return normalized;
}

export function normalizeWebsiteContent(content: unknown): Website {
  const parsed = WebsiteSchema.parse(withLegacyTopLevelFallback(content));

  const defaultPages = {
    home: {
      title: 'Home',
      hero: parsed.hero,
      about: parsed.about,
      services: parsed.services,
      contact: parsed.contact,
    },
    about: {
      title: 'About',
      about: parsed.about,
      contact: parsed.contact,
    },
    contact: {
      title: 'Contact',
      contact: parsed.contact,
    },
  };

  const mergedPages = {
    home: {
      ...defaultPages.home,
      ...(parsed.pages?.home ?? {}),
    },
    about: {
      ...defaultPages.about,
      ...(parsed.pages?.about ?? {}),
    },
    contact: {
      ...defaultPages.contact,
      ...(parsed.pages?.contact ?? {}),
    },
  };

  return {
    ...parsed,
    hero: {
      ...parsed.hero,
      ...(mergedPages.home.hero ?? {}),
    },
    about: {
      ...parsed.about,
      ...(mergedPages.home.about ?? {}),
    },
    services: {
      ...parsed.services,
      ...(mergedPages.home.services ?? {}),
    },
    contact: {
      ...parsed.contact,
      ...(mergedPages.home.contact ?? {}),
    },
    pages: mergedPages,
  };
}

// Input validation schema (before sending to OpenAI)
export const GenerateInputSchema = z.object({
  business_name: z
    .string()
    .min(1, 'Business name required')
    .max(100, 'Business name too long')
    .trim(),
  business_type: z
    .string()
    .min(1, 'Business type required')
    .max(50, 'Business type too long')
    .trim(),
  city: z
    .string()
    .min(1, 'City required')
    .max(50, 'City too long')
    .trim(),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;

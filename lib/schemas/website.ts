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

// Main website JSON structure
export const WebsiteSchema = z.object({
  business_name: z.string().min(1).max(100),
  business_type: z.string().min(1).max(50),
  city: z.string().min(1).max(50),
  tagline: z.string().min(10).max(150),
  hero: SectionSchema,
  about: SectionSchema,
  services: z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(10).max(200),
    items: z.array(ServiceSchema).min(1).max(8),
  }),
  contact: z.object({
    title: z.string().min(1).max(100),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    hours: z.string().optional(),
  }),
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
    position: z.enum(['left', 'center', 'top']).default('left'),
    width: z.number().min(30).max(200).default(100),
  }),
});

export type Website = z.infer<typeof WebsiteSchema>;

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

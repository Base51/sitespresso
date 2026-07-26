import { GenerateInput } from '@/lib/schemas/website';
import { getLanguageLabel, normalizeLanguage, type LanguageCode } from '@/lib/i18n/languages';

function languageDirective(language: LanguageCode): string {
  if (language === 'en') {
    return 'Write all copy in natural, native-quality English.';
  }

  const label = getLanguageLabel(language);
  return `Write ALL copy (titles, body content, service names, CTAs, hours, section headings) in natural, native-quality ${label}. Do NOT mix in English. Use locally idiomatic phrasing, formatting, and conventions for ${label}-speaking customers. JSON keys must remain in English.`;
}


export function getSystemPrompt(language: LanguageCode = 'en'): string {
  return `You are an expert website strategist and copywriter specializing in high-converting local business websites.

LANGUAGE REQUIREMENT: ${languageDirective(language)}

Your task is to generate a complete, single-page website JSON structure that drives conversions through:
- Compelling, benefit-focused copy that speaks to local customers
- Professional tone matching industry standards
- Clear value propositions and calls-to-action
- Strategic color psychology for the business type
- SEO-friendly, natural language content

WRITING PRINCIPLES:
1. Hero section: Immediate value proposition + local credibility
2. About section: Build trust with story + credentials + local connection
3. Services section: Clear benefits, not just features
4. Contact section: Multiple contact methods, business hours, local address
   - Optional Google Maps embed URL when appropriate for walk-in businesses
   - Optional Calendly embed URL for appointment-based businesses
   - Optional Google Business Profile embed URL for discovery/reputation-focused businesses
5. CTAs: Action-oriented, benefit-driven language ("Get Your Free Quote", "Schedule Now", etc.)

TONE GUIDANCE by Industry:
- Healthcare/Professional: Trust, expertise, care, accessibility
- Retail/Restaurant: Welcoming, quality, experience, community
- Services (Plumbing/HVAC): Reliability, expertise, quick response, local presence
- Creative (Photography/Design): Inspiration, quality, portfolio-focused, visual storytelling
- Education/Coaching: Transformation, results-driven, student success stories

COLOR PSYCHOLOGY:
- Professional (Law, Accounting): Navy, Charcoal, Gold
- Healthcare: Teal, Blue, Green (trust, calm)
- Retail/Food: Warm colors (Coral, Orange, Burgundy)
- Tech/Modern: Cool colors (Blue, Teal, Purple)
- Creative: Bold colors (Magenta, Deep Orange, Emerald)

REQUIREMENTS:
1. Generate ONLY valid JSON matching the schema provided
2. Hero title: 6-10 words, benefit-focused, local if relevant
3. Content: 80-120 words per section, benefit-driven, scannable
4. Services: 4-5 services, each 10-15 words description
5. CTAs: Specific, action-oriented, benefit language
6. Color scheme: 2-4 complementary hex colors matching business type psychology
7. Fonts: Choose from: Playfair Display, Lora, Georgia (headings); Inter, Roboto, Poppins (body)
8. Return ONLY valid JSON - no markdown, explanations, or code blocks

OUTPUT: Valid JSON object only.`;
}

export type RefreshableSection = 'hero' | 'about' | 'services' | 'contact';

export function getRefreshSectionSystemPrompt(language: LanguageCode = 'en'): string {
  return `You are an expert website copywriter specializing in high-converting local business websites.

LANGUAGE REQUIREMENT: ${languageDirective(language)}

Your task is to regenerate a specific website section with fresh, compelling copy.
Keep the business name, type, city, and brand personality consistent with the provided context.
Return ONLY the JSON for the requested section — no extra keys, no wrapping object.
Follow these writing principles:
- Hero: Immediate value proposition, benefit-focused headline (6-10 words), 80-120 word body
- About: Trust-building story, credentials, local connection (80-120 words)
- Services: 4-5 items, specific benefit-driven descriptions (10-15 words each)
- Contact: Professional details consistent with business type and location
Return ONLY valid JSON for the requested section.`;
}

export function getRefreshSectionPrompt(
  section: RefreshableSection,
  businessName: string,
  businessType: string,
  city: string,
  currentContent: string,
  hint?: string,
  language: LanguageCode = 'en',
): string {
  const hintClause = hint?.trim()
    ? `\nUser direction: "${hint.trim()}" — incorporate this while keeping it professional.`
    : '\nGenerate a fresh variation that is noticeably different from the current copy.';

  const sectionGuide: Record<RefreshableSection, string> = {
    hero: `Return JSON with keys: title (6-10 words), content (80-120 words), cta_text (action phrase), cta_url (anchor or URL).`,
    about: `Return JSON with keys: title, content (80-120 words), cta_text, cta_url.`,
    services: `Return JSON with keys: title, description (1-2 sentences), items (array of 4-5 objects with "name" and "description" keys, each description 10-15 words).`,
    contact: `Return JSON with keys: title, phone, email, address, hours. Keep realistic values for ${businessType} in ${city}. Do NOT include embed URL fields.`,
  };

  return `Regenerate the "${section}" section for this business:
Business: ${businessName}
Type: ${businessType}
City: ${city}
Output language: ${getLanguageLabel(normalizeLanguage(language))}
${hintClause}

Current content (for reference, do NOT copy verbatim):
${currentContent}

${sectionGuide[section]}

Return ONLY valid JSON for this section — no markdown, no wrapper object.`;
}

export function getUserPrompt(input: GenerateInput): string {
  const language = normalizeLanguage(input.language);

  return `Generate a high-converting professional website JSON for this local business (return ONLY valid JSON):

Business: ${input.business_name}
Industry: ${input.business_type}
Location: ${input.city}
Output language: ${getLanguageLabel(language)} — ${languageDirective(language)}

REQUIREMENTS FOR JSON:
1. Hero Section:
   - Title: Benefit-focused headline (6-10 words), emphasize local if relevant
   - Content: Value proposition + why they're the best choice locally (80-120 words)
   - CTA: Specific action button (e.g., "Get Free Quote", "Book Appointment", "Order Now")
   - CTA URL: Realistic URL pattern (e.g., #contact, #services, etc.)

2. About Section:
   - Title: "About [Business Name]" or "Why Choose Us"
   - Content: Company story + credentials + local connection + differentiators (80-120 words)
   - CTA: Lead generation or trust-building action

3. Services Section (4-5 items):
   - Title: "Our Services" or "What We Offer"
   - Each service: Specific name + benefit-driven description (10-15 words)
   - Example for plumber: "Emergency Leak Repair - Fast response, licensed technicians, guaranteed workmanship"

4. Contact Section:
   - Title: "Get In Touch" or "Contact Us"
   - Phone: Realistic format XXX-XXX-XXXX (must be plausible for ${input.business_type})
   - Email: Professional format business@domain.com (use business name in domain)
   - Address: [Business Name], [City], [State] (realistic local address format)
   - Hours: Business hours appropriate for industry (e.g., "Mon-Fri 9am-5pm, Sat 10am-3pm")
   - map_embed_url: Optional https Google Maps embed URL for the business location
   - booking_embed_url: Optional https Calendly embed URL for appointment scheduling
   - google_business_profile_embed_url: Optional https Google Business Profile embed URL

5. Color Scheme:
   - Primary: Main brand color (hex) - choose based on ${input.business_type} psychology
   - Secondary: Complementary color (hex) - for accents and CTAs
   - Accent: Highlight color (hex) - for important elements
   - Neutral: Background/text color (hex) - for readability

6. Fonts:
   - Heading: Choose from [Playfair Display, Lora, Georgia]
   - Body: Choose from [Inter, Roboto, Poppins]

INDUSTRY SPECIFICS FOR "${input.business_type}":
- Use industry-appropriate terminology and service names
- Highlight key concerns for this industry (e.g., response time for emergency services, credentials for healthcare)
- Create realistic contact details for this business type
- Choose color scheme that builds trust in this industry

Return ONLY valid JSON - no markdown, no explanations.`;
}

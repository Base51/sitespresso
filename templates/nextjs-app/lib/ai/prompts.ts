import { GenerateInput } from '@/lib/schemas/website';

export function getSystemPrompt(): string {
  return `You are an expert website copywriter specialized in creating professional, conversion-focused websites for local businesses.

Your task is to generate a complete, single-page website JSON structure for a local business based on the provided details.

REQUIREMENTS:
1. Generate ONLY valid JSON matching the exact schema provided
2. All text must be professional and engaging
3. Content emphasizes trust, locality, and value
4. Use natural language without jargon
5. Content must be original
6. Return ONLY JSON - no markdown, no explanations, no code blocks

OUTPUT: Valid JSON object only.`;
}

export function getUserPrompt(input: GenerateInput): string {
  return `Generate a professional website JSON for this local business (return ONLY valid JSON):

Business Name: ${input.business_name}
Business Type: ${input.business_type}
City: ${input.city}

Create complete single-page website JSON with:
- Hero: Eye-catching headline and tagline with CTA
- About: Company story and value proposition
- Services: 3-5 key services
- Contact: Phone, email, address, hours

Requirements:
- Content specific to "${input.business_type}" industry
- Emphasize local presence in "${input.city}"
- Realistic phone format (XXX-XXX-XXXX)
- Professional hex color scheme
- Concise, clear, SEO-friendly text

Return ONLY the JSON object - no markdown, no explanations.`;
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type Upsertable = {
  upsert: (values: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>;
};

const LeadSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  business_name: z.string().max(100).optional(),
  business_type: z.string().max(50).optional(),
  city: z.string().max(50).optional(),
  source: z.enum(['generate_form', 'homepage']).default('generate_form'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const lead = LeadSchema.parse(body);

    const admin = createAdminClient();

    const { error } = await (admin.from('leads') as unknown as Upsertable).upsert(
      {
        email: lead.email,
        business_name: lead.business_name ?? null,
        business_type: lead.business_type ?? null,
        city: lead.city ?? null,
        source: lead.source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' },
    );

    if (error) {
      console.error('[leads] upsert error:', error.message);
      // Return success to avoid leaking DB internals — lead capture is best-effort
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? 'Invalid input.' },
        { status: 400 },
      );
    }
    console.error('[leads] unexpected error:', err);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}

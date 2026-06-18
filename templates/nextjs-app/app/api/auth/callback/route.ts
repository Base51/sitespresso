import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Not implemented yet.',
      nextStep: 'Wire Supabase OAuth callback handling in M2.'
    },
    { status: 501 }
  );
}

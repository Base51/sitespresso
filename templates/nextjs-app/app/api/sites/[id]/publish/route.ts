import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Not implemented yet.',
      nextStep: 'Implement site publishing and slug validation in M5.'
    },
    { status: 501 }
  );
}

import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Not implemented yet.',
      nextStep: 'Implement OpenAI generation with Zod validation in M3.'
    },
    { status: 501 }
  );
}

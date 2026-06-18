import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Not implemented yet.',
      nextStep: 'Implement Stripe webhook verification and handlers in M6.'
    },
    { status: 501 }
  );
}
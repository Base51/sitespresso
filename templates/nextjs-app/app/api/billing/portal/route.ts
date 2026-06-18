import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Not implemented yet.',
      nextStep: 'Implement Stripe Billing Portal session in M6.'
    },
    { status: 501 }
  );
}

import { NextResponse } from 'next/server';
import { getStripePlanAvailability } from '@/lib/stripe';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    availability: getStripePlanAvailability(),
  });
}
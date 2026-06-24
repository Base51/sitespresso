import { NextResponse } from 'next/server';
import { PLAN_PRICING, mergePlanPricing } from '@/lib/billing/plans';
import { getStripePlanAvailability, getStripePlanPricingOverrides } from '@/lib/stripe';

export async function GET(): Promise<NextResponse> {
  let pricing = PLAN_PRICING;

  try {
    const pricingOverrides = await getStripePlanPricingOverrides();
    pricing = mergePlanPricing(pricingOverrides);
  } catch (error) {
    console.warn('Falling back to static pricing in /api/billing/plans.', error);
  }

  return NextResponse.json({
    success: true,
    availability: getStripePlanAvailability(),
    pricing,
  });
}
# Billing Config Checklist

## Purpose

Use this checklist before enabling or announcing paid tiers. It prevents checkout failures caused by missing Stripe environment variables or incomplete tier configuration.

## Required For Current Billing Flow

These values must exist for Starter checkout and Stripe portal/webhook flow to work:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_STARTER_PRICE_ID=
```

## Required To Fully Launch All Planned Tiers

These values must also exist before Starter annual, Pro, and Agency are fully live:

```env
STRIPE_STARTER_ANNUAL_PRICE_ID=
STRIPE_PRO_PRICE_ID=
STRIPE_PRO_ANNUAL_PRICE_ID=
STRIPE_AGENCY_PRICE_ID=
STRIPE_AGENCY_ANNUAL_PRICE_ID=
```

## Validation Commands

Run the focused billing checks locally:

```bash
npm run test:billing-config
```

This validates the currently required Stripe setup and reports missing optional plan env vars as warnings.

To enforce the full 4-tier launch configuration:

```bash
npm run test:billing-config:all
```

## Environment Checklist

### Local

1. Add the Stripe variables to `.env.local`.
2. Run `npm run test:billing-config`.
3. Run `npm run build`.

### Vercel Preview / Staging

1. Add the same env vars in the project settings.
2. Confirm preview deployments can reach `/api/billing/checkout` and `/api/billing/portal`.
3. Verify webhook secret matches the Stripe environment you are testing.

### Vercel Production

1. Add all live-mode Stripe env vars.
2. Run `npm run test:billing-config:all` locally with the same planned values before promoting.
3. Confirm Stripe webhook points to the production domain.
4. Validate one end-to-end checkout in live mode or with a controlled test account.

## Expected UI Behavior When Config Is Missing

If optional plan env vars are missing:

1. Landing-page pricing cards show the plan/billing option as unavailable.
2. Publish paywall disables unavailable plan selections.
3. Dashboard and account upgrade buttons disable unavailable upgrades.
4. Checkout API returns a clear `400` message instead of a generic failure.

## Release Gate

Do not announce paid tiers until all of the following are true:

1. `npm run test:billing-config:all` passes.
2. `npm run build` passes.
3. Stripe portal opens and returns to the expected page.
4. Webhook updates `profiles.plan` and `subscriptions.stripe_price_id` correctly.
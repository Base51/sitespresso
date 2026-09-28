# Refund and Cancellation Policy (proposed)

> Docs draft only. Not live. Placeholders must be filled by the owner. Not legal advice.  
> Billing must verify alignment flags in [BILLING_ALIGNMENT.md](BILLING_ALIGNMENT.md) before this text is copied to production.

**Last updated (proposed):** 2026-09-28

This policy describes how **[LEGAL_ENTITY_NAME]** ("SiteSpresso") handles cancellations and refund requests for paid SiteSpresso subscriptions.

Legal contact: legal@sitespresso.com

## Billing Model

Paid plans (Starter, Pro, Agency) are billed in advance by billing cycle (monthly or annual), in **EUR**, through Stripe.

Free accounts can create drafts within Free limits. **Publishing a live site requires an active paid plan.**

## Cancellation (not the same as a refund)

You can cancel a paid subscription in the Stripe billing portal linked from your SiteSpresso account.

When you cancel:

- Your paid plan typically remains active until the end of the current paid period (Stripe `cancel_at_period_end` behaviour), unless the product UI states otherwise for a specific change.
- After the paid period ends, the account returns to the Free plan and Free limits apply (including the publish paywall).
- **When the paid plan ends, your published sites go offline.** They are switched back to draft and are no longer publicly reachable at their SiteSpresso address or custom domain. Your site content is kept, and you can republish by subscribing to a paid plan again from your SiteSpresso dashboard.
- Cancellation stops future renewals. It does **not** automatically issue a cash refund for time already paid, except where this policy or mandatory law requires one.

Upgrades and downgrades follow the billing portal and Stripe price-change rules shown at the time of the change. Billing should confirm immediate vs period-end effects before launch (see BILLING_ALIGNMENT.md).

## Refunds

Refund decisions are reviewed case-by-case within applicable law. This policy does not limit mandatory consumer rights (including EU consumer cooling-off or other non-waivable rights where they apply).

### Potentially eligible for review

Examples include:

- Duplicate charges for the same subscription period
- Clearly unintended upgrades reported promptly
- Platform-wide incidents that materially prevented use of paid features for a sustained period

### Typically not refundable

Unless required by law:

- Partial-period non-use or change of mind after purchase
- Preference changes unrelated to a product defect
- Issues caused by third-party services outside SiteSpresso's reasonable control (for example your DNS provider), except where we caused the failure
- Consumption of AI generation quota without a corresponding service defect

## How to Request a Refund

Email legal@sitespresso.com from the account owner email and include:

- Account email
- Approximate charge date and amount (EUR)
- Stripe invoice or payment reference if available
- Short description of the issue

We aim to acknowledge requests quickly and decide after reviewing account and billing records.

Questions? See `/legal/contact`.

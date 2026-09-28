# Changes vs live `/legal/` pages

Compared on 2026-09-28 against https://sitespresso.com/legal/* (live "Last updated: 2026-08-11").

## Shared across pages

- Add owner placeholders for legal entity, address, and tax ID (missing today; Stripe live and EU imprint expect them).
- State billing currency as **EUR** and list plan site limits: Free 1 / Starter 1 / Pro 3 / Agency unlimited.
- Clarify that Free can create drafts but **publishing requires a paid plan** (matches `POST /api/sites/[id]/publish`).
- Name processors explicitly: Supabase, Vercel, Stripe, OpenAI.
- Keep contact channel `legal@sitespresso.com` (and `support@sitespresso.com` on contact).
- Add a short "not legal advice / subject to lawyer review" note in the docs drafts only (do not copy that line into the public pages unless the owner wants it).

## terms.md

- Add plan limits and Free-vs-paid publish rule.
- Add account termination and content ownership (customer owns business content; SiteSpresso owns the platform).
- Soften liability language to keep EU consumer rights intact (same spirit as live, clearer).

## privacy.md

- Name the controller with placeholders.
- Expand processor list and purposes (auth, hosting, payments, AI generation).
- Add GDPR-style rights list and how to request them.
- Note AI prompts/outputs may include personal data the customer supplies.

## refunds.md

- Separate **cancellation** (access until end of paid period when canceled in the Stripe portal) from **refunds** (case-by-case).
- Align with current portal behaviour: cancel at period end; plan drops to Free after the paid period.
- Flag open questions for Billing in [BILLING_ALIGNMENT.md](BILLING_ALIGNMENT.md).

## cookies.md

- Call out auth/session cookies as strictly necessary.
- Mention analytics (Vercel Analytics / Speed Insights) as performance/analytics category.

## dpa.md

- Clarify customer = controller for site content; SiteSpresso = processor for platform delivery.
- List known subprocessors at a high level; full list still on request.

## contact.md

- Add imprint placeholders (entity, address, tax ID).
- Keep legal vs support email split.

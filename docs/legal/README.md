# Legal copy drafts (docs only)

Proposed wording for the public pages under `/legal/`. These files do **not** change the live site.

## Workflow

1. Docs proposes wording here (this folder).
2. Owner reviews and merges this docs PR.
3. Builder copies the approved text into `app/legal/*/page.tsx` in a separate PR.
4. After merge, update [NEXT_ACTIONS.md](../../NEXT_ACTIONS.md) and [ROADMAP.md](../../ROADMAP.md).

## Pages

| Draft | Live route | Purpose |
|---|---|---|
| [terms.md](terms.md) | `/legal/terms` | Terms of Service |
| [privacy.md](privacy.md) | `/legal/privacy` | Privacy Policy |
| [refunds.md](refunds.md) | `/legal/refunds` | Refund and Cancellation |
| [cookies.md](cookies.md) | `/legal/cookies` | Cookie Policy |
| [dpa.md](dpa.md) | `/legal/dpa` | Data Processing Addendum |
| [contact.md](contact.md) | `/legal/contact` | Contact and Imprint |

## Also in this folder

- [CHANGES.md](CHANGES.md) — what changed vs the live pages (last checked 2026-09-28)
- [BILLING_ALIGNMENT.md](BILLING_ALIGNMENT.md) — flags for Billing to verify against checkout and the portal

## Placeholders (owner must fill)

Replace before going live:

- `[LEGAL_ENTITY_NAME]` — registered company or sole-trader name
- `[REGISTERED_ADDRESS]` — street, city, country
- `[VAT_OR_NIF]` — VAT / NIF / tax ID, or "Not applicable"
- `[SUPPORT_EMAIL]` — currently shown as `support@sitespresso.com` on contact
- `[LEGAL_EMAIL]` — currently shown as `legal@sitespresso.com`

This draft is **not legal advice**. Have a lawyer review before Stripe live mode and EU customer onboarding.

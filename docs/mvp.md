# SiteSpresso — MVP Definition

> Minimum Viable Product scope for the initial public launch.

---

## MVP Goal

Enable a local business owner to enter their business name, type, and city, receive an AI-generated single-page website, edit it inline, and publish it to a SiteSpresso subdomain — all within 5 minutes — then subscribe to keep it live.

---

## User Stories

### Onboarding
- As a **business owner**, I want to enter my business name, type, and city so that SiteSpresso can generate my website automatically.
- As a **business owner**, I want to preview my generated website before publishing so that I can confirm it looks right.
- As a **business owner**, I want to edit any section of my generated website so that the content reflects my actual business.

### Publishing
- As a **business owner**, I want to publish my website to a free subdomain (`mybusiness.sitespresso.com`) so that my customers can find me online.
- As a **business owner**, I want my published site to load fast and look professional on mobile so that I can share it confidently.

### Subscription
- As a **business owner**, I want to subscribe to a paid plan so that I can keep my site live and unlock features.
- As a **business owner**, I want to manage my subscription (upgrade, cancel) from my account so that I stay in control of my billing.

### Account
- As a **business owner**, I want to sign in with Google or email so that I can access my site from any device.
- As a **business owner**, I want to return to my dashboard and update my site content so that I can keep my information current.

---

## Core Features (In Scope)

| # | Feature | Priority |
|---|---|---|
| 1 | Business info intake form (name, type, city) | P0 |
| 2 | AI website JSON generation via OpenAI | P0 |
| 3 | Single-page website renderer (preview mode) | P0 |
| 4 | Inline content editor (click-to-edit sections) | P0 |
| 5 | One-click publish to `{slug}.sitespresso.com` | P0 |
| 6 | User authentication (Supabase Auth — Google + magic link) | P0 |
| 7 | User dashboard (view/edit/manage single site) | P0 |
| 8 | Stripe subscription checkout (Starter plan — $9/mo) | P0 |
| 9 | Subdomain routing on Vercel | P0 |
| 10 | Mobile-responsive published site | P0 |

---

## Non-Goals (Out of Scope for MVP)

- Custom domain support
- Multiple pages (About, Menu, Gallery, etc.)
- AI-generated images or logos
- SEO tools, sitemap generation
- Analytics dashboard
- Booking / appointment widgets
- Google Business Profile integration
- Agency / white-label mode
- Multi-language support
- Team collaboration or multi-user accounts
- Site versioning or history
- Email marketing or newsletter features
- E-commerce / payment on published sites

---

## Success Metrics

| Metric | Target (30 days post-launch) |
|---|---|
| Sites generated | 500 |
| Sites published | 150 (30% of generated) |
| Free → Paid conversion | 15% of published sites |
| Monthly Recurring Revenue (MRR) | $200+ |
| Time to first published site (median) | < 5 minutes |
| User-reported satisfaction (survey) | ≥ 4/5 |

---

## Launch Criteria

A release is ready when:

- [ ] User can complete the full flow (intake → generate → preview → edit → publish) without error
- [ ] Published site is accessible at `{slug}.sitespresso.com` within 60 seconds
- [ ] Stripe subscription checkout completes and activates the site
- [ ] Subscription cancellation removes the published site after the billing period
- [ ] Auth (Google + magic link) works end-to-end
- [ ] Generated content passes a quality review for 5 different business types
- [ ] Published site scores ≥ 90 on Lighthouse mobile performance
- [ ] No critical security vulnerabilities (OWASP Top 10 reviewed)
- [ ] Error states are handled gracefully (AI failure, payment failure, slug conflict)
- [ ] Basic analytics (site views) are logged to Supabase

---

## Assumptions

- OpenAI GPT-4o is the generation model for MVP; cost is acceptable at low volume.
- Vercel wildcard subdomain routing is sufficient for MVP subdomain publishing.
- A single Stripe product (Starter $9/mo) is enough for MVP billing.
- Supabase free tier handles MVP data volume.
- UI is built in Next.js 14 App Router with Tailwind CSS.

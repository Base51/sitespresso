# SiteSpresso — Product Requirements Document (PRD)

> Version: 1.0 | Status: Draft | Date: 2026-06-18

---

## 1. Overview

**What is being built:**
SiteSpresso is an AI-powered website builder designed exclusively for local businesses. It takes a business name, type, and city as input, uses OpenAI to generate a structured website JSON, renders a live preview, and allows the owner to edit and publish to a free subdomain in minutes.

**Why:**
Most local businesses lack a professional web presence — not because they don't want one, but because existing tools are too complex, too slow, or too expensive. SiteSpresso removes every friction point by making generation automatic, editing intuitive, and publishing instant.

**Business goal:**
Reach $1,000 MRR within 90 days of launch through self-serve subscriptions from local business owners.

---

## 2. Goals and Non-Goals

### Goals
- Deliver a complete generate → preview → edit → publish flow in under 5 minutes.
- Generate website content that is specific to the business type and city.
- Enable self-serve subscription billing with Stripe.
- Publish sites on `{slug}.sitespresso.com` subdomains automatically.
- Support mobile-responsive published sites out of the box.

### Non-Goals
- Custom domain management (post-MVP)
- Multi-page sites (post-MVP)
- AI-generated imagery (post-MVP)
- White-label / agency mode (post-MVP)
- Any manual human review in the generation pipeline

---

## 3. User Personas

### Persona 1 — Maria, Restaurant Owner
- **Age:** 42 | **City:** Austin, TX
- **Tech level:** Low — uses Facebook and WhatsApp daily
- **Pain:** "My son set up a website years ago but I can't update it. Customers can't find my hours."
- **Goal:** A clean page that shows her menu, hours, address, and phone number
- **Willingness to pay:** $9–$19/mo if it looks professional

### Persona 2 — James, Barbershop Owner
- **Age:** 35 | **City:** Brooklyn, NY
- **Tech level:** Medium — has an Instagram, used Linktree
- **Pain:** "I keep getting calls asking if we're open. I need a page where I put everything."
- **Goal:** Fast, shareable page he can update himself when hours or prices change
- **Willingness to pay:** $9/mo; wants value immediately

### Persona 3 — Sofia, Freelance Web Designer
- **Age:** 28 | **City:** Miami, FL
- **Tech level:** High — builds WordPress and Webflow sites
- **Pain:** "Clients want a basic site for $200. I lose money on these jobs."
- **Goal:** Generate the first draft in minutes, hand off to client, collect payment faster
- **Willingness to pay:** $49/mo for agency plan (post-MVP)

---

## 4. Functional Requirements

### 4.1 Onboarding & Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | System shall present an intake form with fields: Business Name, Business Type (dropdown), City | P0 |
| FR-02 | System shall validate all three fields before allowing generation | P0 |
| FR-03 | System shall call the OpenAI API with a structured prompt and return a website JSON object | P0 |
| FR-04 | System shall display a loading state during AI generation (< 10s target) | P0 |
| FR-05 | System shall render the generated website as a live preview in the browser | P0 |
| FR-06 | If generation fails, system shall show an error message and a retry option | P0 |

### 4.2 Editing

| ID | Requirement | Priority |
|---|---|---|
| FR-07 | User shall be able to click any text section to edit it inline | P0 |
| FR-08 | Edits shall update the preview in real time | P0 |
| FR-09 | System shall auto-save edits to Supabase after a 1-second debounce | P0 |
| FR-10 | User shall be able to revert to the original AI-generated content per section | P1 |

### 4.3 Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-11 | User shall be able to sign up and sign in with Google OAuth | P0 |
| FR-12 | User shall be able to sign up and sign in with magic link (email) | P0 |
| FR-13 | Unauthenticated users may generate and preview but must sign in to publish | P0 |
| FR-14 | Session shall persist across browser refreshes | P0 |

### 4.4 Publishing

| ID | Requirement | Priority |
|---|---|---|
| FR-15 | System shall generate a URL-safe slug from the business name | P0 |
| FR-16 | User shall be able to confirm or edit the suggested slug before publishing | P1 |
| FR-17 | On publish, system shall write the site JSON to Supabase and route `{slug}.sitespresso.com` to the rendered site | P0 |
| FR-18 | Published site shall be publicly accessible without login | P0 |
| FR-19 | Published site shall be mobile-responsive | P0 |
| FR-20 | Slug conflicts shall be handled gracefully (suffix appended or user prompted) | P0 |

### 4.5 Subscription & Billing

| ID | Requirement | Priority |
|---|---|---|
| FR-21 | System shall redirect user to Stripe Checkout when they attempt to publish on the free tier | P0 |
| FR-22 | On successful payment, system shall activate the user's site and update their subscription status in Supabase | P0 |
| FR-23 | User shall be able to manage (view, cancel) their subscription from the dashboard | P0 |
| FR-24 | On subscription cancellation, published site shall remain live until the end of the billing period, then be unpublished | P0 |
| FR-25 | Stripe webhooks shall update subscription state in Supabase in real time | P0 |

### 4.6 Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-26 | Authenticated user shall see their site(s) listed on the dashboard | P0 |
| FR-27 | Dashboard shall show site status: Draft, Published, Unpublished | P0 |
| FR-28 | User shall be able to navigate to edit their site from the dashboard | P0 |
| FR-29 | Dashboard shall show subscription tier and renewal date | P1 |

---

## 5. Technical Requirements

| ID | Requirement | Priority |
|---|---|---|
| TR-01 | Application shall be built with Next.js 14 App Router | P0 |
| TR-02 | Styling shall use Tailwind CSS | P0 |
| TR-03 | Database and authentication shall use Supabase (PostgreSQL + Auth) | P0 |
| TR-04 | AI generation shall use OpenAI GPT-4o via the official Node.js SDK | P0 |
| TR-05 | Billing shall use Stripe (Checkout + Billing Portal + Webhooks) | P0 |
| TR-06 | Deployment shall be on Vercel with wildcard subdomain support | P0 |
| TR-07 | All API routes shall be Next.js Route Handlers (not Pages Router API) | P0 |
| TR-08 | OpenAI API key shall never be exposed to the client | P0 |
| TR-09 | Stripe webhook signature shall be verified on every webhook event | P0 |
| TR-10 | Row-Level Security (RLS) shall be enabled on all Supabase tables | P0 |
| TR-11 | Published site Lighthouse score shall be ≥ 90 (mobile, performance) | P1 |
| TR-12 | Time-to-first-byte (TTFB) on published sites shall be < 200ms (Vercel Edge) | P1 |

---

## 6. UX Requirements

| ID | Requirement | Priority |
|---|---|---|
| UX-01 | Intake form shall be the first screen — no sign-in wall before generation | P0 |
| UX-02 | Generation loading screen shall show progress feedback (spinner + copy) | P0 |
| UX-03 | Preview shall render in a simulated browser frame to feel real | P1 |
| UX-04 | Editable fields shall be visually highlighted on hover | P0 |
| UX-05 | Publish CTA shall be persistent and prominent throughout editing | P0 |
| UX-06 | Paywall shall appear inline (modal or slide-over), not a full-page redirect | P1 |
| UX-07 | Published site shall have no SiteSpresso branding on Starter plan and above | P1 |
| UX-08 | All flows shall be fully usable on mobile (375px viewport) | P0 |
| UX-09 | Accessibility: all interactive elements shall meet WCAG 2.1 AA | P1 |

---

## 7. Acceptance Criteria

### AC-01: Generation Flow
- Given a user submits a valid business name, type, and city
- When the system calls the AI generation endpoint
- Then a rendered website preview appears within 10 seconds containing the business name, a relevant headline, and at least 3 content sections

### AC-02: Editing
- Given the user is on the preview screen
- When they click a text section
- Then it becomes editable inline and changes persist on blur

### AC-03: Publishing
- Given the user has an active Starter subscription
- When they click "Publish"
- Then within 60 seconds `{slug}.sitespresso.com` returns their published site with HTTP 200

### AC-04: Subscription Activation
- Given the user completes Stripe Checkout
- When Stripe fires the `checkout.session.completed` webhook
- Then the user's subscription status in Supabase is updated to `active` and their site is published

### AC-05: Subscription Cancellation
- Given the user cancels their subscription via the Billing Portal
- When Stripe fires the `customer.subscription.deleted` webhook
- Then the user's site is unpublished at the end of the billing period

---

## 8. Roadmap

| Phase | Milestone | Target |
|---|---|---|
| **MVP** | Generate + preview + edit + publish + billing | Week 6 |
| **v1.1** | Custom domain support | Week 10 |
| **v1.2** | Multi-page sites (Home + About + Contact) | Week 14 |
| **v1.3** | AI image generation (hero, logo placeholder) | Week 18 |
| **v2.0** | Analytics dashboard, Google Business Profile integration | Week 24 |
| **v2.1** | Agency plan + white-label mode | Week 30 |
| **v3.0** | Booking widget, review aggregation, multi-language | Week 40 |

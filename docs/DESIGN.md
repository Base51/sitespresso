# SiteSpresso — Design System

> Status: **Draft v0.2** (2026-09-29), proposed for adoption in the `docs/design-system` PR (owner-approved to open, 2026-10-01). Grounded in `main` @ `c51581e`.
> **Brand: Approved direction (owner, 2026-09-29), not yet implemented on `main`** — D2 "Braces & Steam", orange-led (§3). Implementation (B1–B9) is a separate follow-up PR (`feat/brand-d2`).
> Everything labelled **Existing** is in the code today. Everything labelled **Proposed** is a
> recommendation that needs owner sign-off before it becomes a rule. Working rules for all
> contributors live in [AGENTS.md](../AGENTS.md); project status lives in [ROADMAP.md](../ROADMAP.md).

---

## 1. Purpose and scope

This document covers two separate visual systems. Keep them apart in every review and PR.

| | **A. SiteSpresso app UI** | **B. Customer published sites** |
|---|---|---|
| What | Landing/marketing page, generator, dashboard, editor chrome, account, login, admin, legal pages | The websites SiteSpresso generates for local businesses |
| Where | [app/page.tsx](../app/page.tsx), `app/dashboard/`, `app/editor/`, `app/account/`, `app/login/`, `app/legal/`, [components/](../components/) | [app/sites/[slug]/page.tsx](../app/sites/%5Bslug%5D/page.tsx), [app/sites/[slug]/[page]/page.tsx](../app/sites/%5Bslug%5D/%5Bpage%5D/page.tsx), editor preview in [components/SitePreview.tsx](../components/SitePreview.tsx) |
| Styled by | Brand tokens (`brand-*`) in [app/globals.css](../app/globals.css) + [tailwind.config.js](../tailwind.config.js) | Per-site data: `color_scheme`, `fonts`, `logo`, `layout` in [lib/schemas/website.ts](../lib/schemas/website.ts) |
| Theme | Dark only | Light base (`bg-white`, `text-slate-900`) tinted by the customer's colours |
| Blast radius | Our own product | **Every published customer site** — treat changes as high risk |

Rule: brand tokens never leak into customer sites, and customer colours never leak into app UI.

## 2. Principles

1. **Dark-only app UI** (Existing). `html { color-scheme: dark; }` in `globals.css`. There is no light theme and no theme switch. Do not add light-mode variants without an owner decision.
2. **Tokens before colours** (Proposed as a rule; tokens exist). App UI colours come from `brand-*` classes, not raw Tailwind palette colours (`slate-*`, `blue-*`, …). See §12 for allowed exceptions.
3. **Components before hand-rolled markup** (Proposed as a rule; components exist). Use `components/ui/*` for buttons, cards and form controls.
4. **Accessibility: WCAG 2.1 AA** (Existing intent). Stated in [.github/copilot-instructions.md](../.github/copilot-instructions.md); WCAG is in the M8 scope in [ROADMAP.md](../ROADMAP.md). No recorded audit exists yet.
5. **Preview = published** (Proposed as a rule). What an owner sees in the editor preview must match the live site (§10.4).
6. **One concern per design PR** (Existing, from AGENTS.md rule 4).

## 3. Brand

> **Status: Approved direction (owner, 2026-09-29), not yet implemented.** Direction D2 "Braces & Steam", orange-led.
> None of this is in the code yet. Today's logo, favicon, tokens and fonts are described as **Current** in §4, §5 and §9; the work to ship this section is items B1–B9 in §13.
> Source files live in the brand kit (`sitespresso-brand/D-braces-steam/D2-orange/`: `svg/*-v2.svg`, `png/*-v2*.png`, `tokens-v2.css`, reference board `board-D2-v2-final.png`). They are not in the repo yet; the proposed home is `public/brand/`.

### 3.1 Logo concept
- **Mark:** code braces `{ }` around a two-plume espresso steam that forms an **S**. One symbol for "websites", "espresso" and SiteSpresso.
- **Wordmark:** lower-case "site**spresso**" in Outfit Medium (500). "spresso" takes the primary orange on dark, `#B45309` on light, and navy on orange. The wordmark in the SVG lockups is converted to outlines, so it renders the same without the font installed.
- **Tagline:** "AI websites, brewed instantly." (replaces "launch faster"). Sentence case, Outfit 500, cyan full stop. Full lockup only.

### 3.2 Lockup variants and size rules
| Variant | Use | Size rule | Brand-kit files (`svg/`) |
|---|---|---|---|
| **Full lockup** (mark + wordmark + tagline) | Landing hero, footer, docs, social, email header | **Only at ≥ 240px wide** (tagline ≥ 11px). Narrower: use the compact lockup | `lockup-full-v2-on-dark`, `-on-light`, `-on-brand` |
| **Compact lockup** (mark + wordmark, no tagline) | **Navbar** / app header, login card, dashboard | 100–239px wide, ≥ 24px tall. The navbar always uses this variant and never shows the tagline | `lockup-compact-v2-on-dark`, `-on-light`, `-on-brand` |
| **Mark only** | Collapsed sidebar, avatars, loaders, tight UI | ≥ 20px tall | `mark-v2-on-dark`, `-on-light`, `-on-brand` |
| **App tile** | PWA/app icon, apple-touch-icon, social avatar | Master (512) at ≥ 64px; 32–63px use the small tile; below 32px use the favicon | `app-tile-v2`, `app-tile-small-v2`, `app-tile-ink-v2` (dark alternative) |
| **Favicon** | Browser tabs, bookmarks | 16–32px | `favicon-v2` |

Approved colourways (no others):

| Surface | Braces | Steam | "site" | "spresso" | Tagline |
|---|---|---|---|---|---|
| Dark (`#0F1729`, surfaces) | White | Cyan `#06C3FB` (8.7:1) | `#F8FAFC` | Orange `#FB9C3C` (8.45:1) | Muted `#A3B0C2` (8.1:1) |
| Light (`#F8FAFC` / white) | Navy `#0F1729` (17.1:1) | `#0973A5` (5.0:1) | Navy | `#B45309` (4.8:1) | `#526075` (6.1:1) |
| Brand orange `#FB9C3C` | Navy | Navy | Navy | Navy | Navy (all 8.45:1) |

- **App tile (refined):** orange tile, navy `#0F1729` braces **and** navy steam, 8.45:1. White steam was evaluated and rejected: 2.12:1 on orange, below the 3:1 minimum for graphics. The concept's all-white tile is retired.
- **Favicon:** navy tile, white braces (17.9:1) and one bold orange S stroke (8.45:1), pixel-aligned for 16px. It reads on light and dark tabs.

### 3.3 Clear space and minimum size
- **Clear space:** X = ¼ of the mark height on every side (app tile: ¼ of the tile). Example: a compact lockup 28px tall in the navbar keeps ≥ 7px clear. The brand-orange lockup files have the clear space built in.
- **Minimum sizes:** as in §3.2 (full ≥ 240px wide, compact ≥ 100px wide, mark ≥ 20px tall, favicon 16px).
- **Backgrounds:** navy/dark surfaces, light (`#F8FAFC` / white), or brand orange with the navy colourway. Not on busy photos.
- **Tile:** corner radius 15/64 of the tile. No borders, outlines, glows or shadows added to the mark.

### 3.4 Colour roles
| Role | Dark (app UI) | Light surfaces\* | Rule |
|---|---|---|---|
| **Primary** (orange) | `--primary` `#FB9C3C` | Same fill; orange text/links use `#B45309` | Primary buttons (one per view), selected state, "spresso" |
| **Text on primary** | `--on-primary` `#0F1729` (new token), 8.45:1 | Same | Also the text colour on cyan and danger fills. **Never white text on orange (2.1:1).** |
| **Accent** (cyan) | `--accent` `#06C3FB`, 8.7:1 on `brand-bg` | `#0973A5`, 5.0:1 on `#F8FAFC` | **Accent only:** steam, text links, focus ring, small highlights (status dots, underlines, icon tints). **Never** large surfaces, cards, hero backgrounds or primary buttons |
| **Links** | Default orange (`--primary`, 8.45:1); cyan allowed for inline/secondary links | `#B45309` (4.8:1 on `#F8FAFC`, 5.0:1 on white) | Use one link colour per surface |
| **Focus ring** | `--ring` → cyan, with a 2px `brand-bg` offset | `#0973A5` | Keeps focus (cyan) distinct from selected (orange) |

\*Light surfaces means brand assets on light backgrounds (docs, email, press, partner pages) and any future light theme. The app UI stays dark-only (§2, principle 1) until the owner decides otherwise.

### 3.5 Typography (Proposed — approved by owner, pending implementation)
- **Outfit** (500/600) for the wordmark and headings (`font-display`), via `next/font/google`.
- **Inter** for UI and body text (`font-sans`), via `next/font/google`. It is already the customer-site default body font.
- Both are OFL Google Fonts, self-hosted by `next/font` (no runtime dependency on Google Fonts). Current vs target: §5.

### 3.6 Don'ts
- **No white text on orange** (2.1:1). Use `--on-primary` navy.
- **No cyan surfaces:** no cyan cards, panels, hero backgrounds or primary buttons.
- **No recolouring the mark** outside the three colourways above, and no gradients (the current gradient "SS" tile is retired).
- **No stretching**, skewing, rotating, outlining or effects. Scale proportionally.
- No tagline in the navbar or anywhere below 240px wide.
- Don't rebuild the mark in markup or CSS. Use `<Logo>` (once rebuilt, B1) or the brand-kit SVGs.
- No trademark or name-clearance search has been done for the mark or the name. The owner should arrange one before registering or printing.

## 4. Colour tokens (app UI)

Source: `:root` in [app/globals.css](../app/globals.css) (HSL channels, used as `hsl(var(--x))`), mapped under `theme.extend.colors.brand` in [tailwind.config.js](../tailwind.config.js). Hex values and "intended usage" are derived from the code and are informational.

**Current** = `main` today. **Target** = approved D2 brand (§3), not yet implemented; values from the brand kit's `tokens-v2.css`. "=" means no change.

| CSS variable | Current HSL (≈ hex) | Target D2 HSL (≈ hex) | Tailwind class (current → target) | Intended usage |
|---|---|---|---|---|
| `--background` | `222 47% 11%` (`#0f1729`) | = | `brand-bg` | Page background (`body` in [app/layout.tsx](../app/layout.tsx)), sticky header `bg-brand-bg/70` |
| `--background-soft` | `220 38% 16%` (`#192438`) | = | `brand-bg-soft` | Top stop of the body gradient |
| `--surface` | `220 33% 18%` (`#1f293d`) | = | `brand-surface` | Raised surfaces. Mapped, but not observed in the files reviewed |
| `--surface-strong` | `219 37% 24%` (`#273654`) | = | `brand-surface-strong` | Stronger surfaces. Mapped, not observed in the files reviewed |
| `--foreground` | `210 40% 98%` (`#f8fafc`) | = | `brand-text` | Default text colour |
| `--muted` | `215 20% 70%` (`#a3b0c2`) | = | `brand-muted` | Secondary text, placeholders, hints |
| `--muted-strong` | `214 18% 84%` (`#cfd5de`) | = | `brand-muted-strong` | Labels, eyebrow text, ghost buttons |
| `--border` | `218 28% 31%` (`#394965`) | = | `brand-border` | Default border (`* { border-color }`), secondary button |
| `--ring` | `30 96% 61%` (`#fb9c3c`) | **`194 97% 50%` (≈ `#06c3fb`, cyan)** | — **not mapped** → `brand-ring` | Focus ring. Today not exposed in Tailwind (code uses `ring-brand-primary`). Target: cyan ring + `ring-offset-brand-bg` |
| `--primary` | `30 96% 61%` (`#fb9c3c`) | = | `brand-primary` | Primary actions, selected state, eyebrow accents, `::selection`, "spresso" |
| `--primary-strong` | `22 96% 53%` (`#fa6814`) | = | `brand-primary-strong` | Primary hover |
| `--accent` | `175 55% 43%` (`#31aaa0`, teal) | **`194 97% 50%` (≈ `#06c3fb`, cyan)** | `brand-accent` | Today: logo gradient end, body glow. Target: **accent only** (§3.4) |
| `--danger` | `0 72% 59%` (`#e24b4b`) | **`0 84% 68%` (≈ `#f26b6b`)** | `brand-danger` | Destructive button. Target pairs with navy text |
| `--success` | `153 55% 45%` (`#34b279`) | **`158 58% 48%` (≈ `#34c38f`)** | `brand-success` | Success. Mapped, not observed in the files reviewed |
| `--on-primary` | — (does not exist; code uses `text-slate-950`) | **`222 47% 11%` (`#0f1729`)** — new | — → `brand-on-primary` | Text on primary, cyan and danger fills |

Target light values (brand assets on light backgrounds and any future light theme; **not** for the dark-only app today): `--background` `#F8FAFC`, `--foreground` `#171C20`, `--muted` `#526075`, `--border` `#D5DCE6`, `--primary` `#FB9C3C` (fill, navy label), `--primary-strong` / links **`#B45309`**, `--accent` **`#0973A5`**, `--ring` `#0973A5`, `--danger` `#C62828`, `--success` `#12795A`, `--on-primary` `#0F1729`. Exact HSL in `tokens-v2.css`.

Notes:
- Opacity modifiers work on these tokens (`bg-brand-primary/10`, `ring-brand-primary/40`). Verified by compiling with Tailwind 3.4.16.
- `--ring` equals `--primary` today. **Proposed:** map it as `brand-ring` and use `ring-brand-ring` for all focus rings. **Target (D2):** `--ring` becomes cyan, so focus (cyan) and selected (orange) no longer share a colour.
- **Contrast** (WCAG, computed from the HSL values; Target = D2 values from §3):

| Pair | Current | Target (D2) | Requirement |
|---|---|---|---|
| `brand-text` on `brand-bg` | 17.1 ✅ | = 17.1 ✅ | 4.5 |
| `brand-muted` on `brand-bg` / `brand-surface` | 8.1 / 6.6 ✅ | = ✅ | 4.5 |
| `brand-primary` text on `brand-bg` | 8.4 ✅ | = 8.4 ✅ | 4.5 |
| Primary button label | `slate-950` on primary 9.5 ✅ | `brand-on-primary` on primary 8.45 ✅ | 4.5 |
| **White on `brand-primary`** ("Popular"/"Selected" badges) | **2.1 ❌** | Not allowed (§3.6); navy 8.45 ✅ | 4.5 |
| **White on `brand-danger`** (danger button) | **3.9 ❌** (large text only) | White on `#f26b6b` would be 3.0 ❌ → navy label 6.0 ✅ | 4.5 |
| `brand-accent` on `brand-bg` | Teal 6.3 ✅ | Cyan 8.7 ✅ | 4.5 (text), 3 (graphics) |
| Focus ring vs `brand-bg` | Orange 8.4 ✅ | Cyan 8.7 ✅ | 3 |
| `brand-border` vs `brand-bg` (non-text) | **2.0 ❌** for inputs that rely on the border alone | = 2.0 ❌ (not addressed by the brand; still open) | 3 |
| Light surfaces: links `#B45309` / accent `#0973A5` on `#F8FAFC` | — | 4.8 ✅ / 5.0 ✅ | 4.5 |
| App tile: navy braces + steam on orange | — (current tile: `slate-950` "SS" on gradient) | 8.45 ✅ (white steam 2.1 rejected) | 3 (graphics) |

## 5. Typography

**Current vs Target.** Target = approved D2 brand (§3.5): **Proposed — approved by owner, pending implementation.**

| Role | Current (Existing) | Target (D2) |
|---|---|---|
| Display / headings (`font-display`) | `['Georgia', 'Cambria', 'Times New Roman', 'serif']` ([tailwind.config.js](../tailwind.config.js)). Used for page headings (`font-display text-5xl font-semibold tracking-tight`) and the logo wordmark | **Outfit** 500/600 via `next/font/google` (`--font-outfit`), fallback `ui-sans-serif, system-ui, sans-serif`. Class names stay `font-display` |
| Body / UI (`font-sans`) | **Unset.** No `fontFamily.sans` override and no `next/font` in [app/layout.tsx](../app/layout.tsx), so the app uses Tailwind's default system sans stack | **Inter** via `next/font/google` (`--font-inter`), exposed as `fontFamily.sans`. Inter is already the customer-site default body font (`fonts.body`), so no new family for customers |
| Logo wordmark | "SiteSpresso" in `font-display text-xl font-semibold` (Georgia) | SVG lockup, lower-case "sitespresso", Outfit 500, outlined (§3.1) |
| Tagline | "launch faster", `text-[11px] uppercase tracking-[0.24em] text-brand-muted` | "AI websites, brewed instantly." Full lockup only, never in the navbar (§3.2) |
| Eyebrow | Small uppercase text with wide tracking, e.g. `tracking-[0.24em]`. Several tracking values are in use | = (one value, `tracking-[0.24em]`, in Inter) |

Notes:
- `next/font` self-hosts both families, so the app does not depend on Google Fonts at runtime.
- Outfit's widths and line height differ from Georgia's. Check headline wrapping on the landing hero and pricing cards in the Vercel preview when switching.
- The previous "TBD — body font" decision (P5) is resolved by the brand approval: Inter.

**Proposed type scale** (formalising what the code already uses):

| Role | Classes (unchanged; the family behind `font-display` changes to Outfit in the target) |
|---|---|
| Hero H1 | `font-display text-5xl md:text-6xl font-semibold tracking-tight` |
| Section H2 | `font-display text-3xl md:text-4xl font-semibold tracking-tight` |
| Card/page H2–H3 | `font-display text-2xl font-semibold` / `text-lg font-semibold` |
| Body | `text-sm`–`text-base`, `text-brand-muted` for secondary copy |
| Eyebrow | `text-xs uppercase tracking-[0.24em]` (one tracking value, Proposed) |

## 6. Radius, shadows, spacing, surfaces, background

**Existing**
- Radius: custom `rounded-xl2` = `1.25rem` (Card). Buttons and inputs use `rounded-xl` (0.75rem). Pills use `rounded-full`.
- Shadows: `shadow-panel` = `0 24px 60px rgba(2, 6, 23, 0.35)` (Card). `shadow-glow` = `0 0 0 1px rgba(248, 250, 252, 0.05), 0 18px 44px rgba(2, 6, 23, 0.32)` (primary Button, Logo mark).
- `.surface-glass` (utility in `globals.css`): `linear-gradient(180deg, rgba(30,41,59,0.74), rgba(15,23,42,0.88))` + `backdrop-filter: blur(18px)`.
- `.brand-outline`: `box-shadow: 0 0 0 1px rgba(248,250,252,0.04), 0 20px 50px rgba(2,6,23,0.35)`.
- Background: `body` stacks two radial glows (orange `rgba(249,164,27,0.16)` at top, teal `rgba(45,212,191,0.12)` at 85% 18%) over a `--background-soft` → `--background` linear gradient.
- Spacing: Tailwind default scale. Common patterns: container `mx-auto max-w-5xl`/`max-w-6xl px-6`, card padding `p-6` (`p-5` in lists), stacks `space-y-3`/`space-y-5`.

**Proposed**
- Radius scale: controls `rounded-xl`, containers/cards `rounded-xl2`, pills/badges `rounded-full`. Avoid `rounded`, `rounded-lg` and `rounded-2xl` in app UI.
- Elevation: page → `Card` (glass + panel) → modal (`Card` over a dark `bg-black/*` overlay). No other ad-hoc shadows. In particular, remove the blue `rgba(96,165,250,…)` glows (§13).

## 7. Components (`components/ui/`)

Rule (**Proposed**): **do not hand-roll** a button, card, text input, select or textarea in app UI. If a variant is missing, add it to the component in its own PR.

### Button — [components/ui/Button.tsx](../components/ui/Button.tsx) (Existing)
- Base: `inline-flex items-center justify-center rounded-xl font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-55`. `type="button"` by default.
- Variants:
  - `primary` — `bg-brand-primary text-slate-950 shadow-glow hover:bg-brand-primary-strong`. **One per view** (Proposed).
  - `secondary` — bordered, `bg-white/5`, hover to `border-brand-primary/50`.
  - `ghost` — text-only, `text-brand-muted-strong`. For tertiary actions.
  - `danger` — `bg-brand-danger text-white`. For destructive confirmation only.
- Sizes: `sm` (`px-3 py-2 text-sm`), `md` (default), `lg` (`px-6 py-3 text-base`). `fullWidth` for forms.
- Links styled as buttons (**Proposed**): wrap `<Button>` in a `<Link>`, or add an `asChild`/`href` option to Button. Do not copy Button classes onto a `<span>` (§13 item 9).

### Card — [components/ui/Card.tsx](../components/ui/Card.tsx) (Existing)
- `surface-glass brand-outline rounded-xl2 border border-white/10 p-6 shadow-panel`. Override padding through `className` (`p-5`, `md:p-8`).
- Use for any grouped panel, pricing tier, modal body or list item.

### Input — [components/ui/Input.tsx](../components/ui/Input.tsx) (Existing)
- One component for `input`, `select` (`as="select"`) and `textarea` (`as="textarea"`, `min-h-[120px]`).
- Props: `label`, `hint`, `error`. Pass an `id`: it links the label (`htmlFor`) and `aria-describedby` (`{id}-hint` / `{id}-error`). No `aria-invalid` is set on error (Proposed: add it).
- Note: the component spreads all props onto the DOM element, so `as`, `label`, `hint` and `error` are also forwarded as DOM attributes (possible React warnings; not verified at runtime).
- Control: `rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 … focus:border-brand-primary/60 focus-visible:ring-2 focus-visible:ring-brand-primary/25`.

### Other shared pieces (Existing)
[EmptyState](../components/EmptyState.tsx), [Spinner](../components/Spinner.tsx), [ToastContainer](../components/ToastContainer.tsx) with `useToast` ([hooks/useToast.ts](../hooks/useToast.ts)), [GlobalFooter](../components/GlobalFooter.tsx), [DeleteConfirmationModal](../components/DeleteConfirmationModal.tsx). **Proposed candidates** for `components/ui/`: `Badge` (status pills), `SegmentedControl` (Monthly/Annual, page tabs), `OptionCard` (selectable presets and plans), `Modal`.

## 8. States (app UI)

| State | Standard (Proposed unless marked) | Existing reference |
|---|---|---|
| Focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary` (or `/25`–`/40` on inputs). Never remove the outline without a ring. **Target (D2):** `focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg` (cyan) | Button, Input, GlobalFooter links (Existing) |
| Hover | Primary: `hover:bg-brand-primary-strong`. Secondary: `hover:border-brand-primary/50 hover:bg-white/10`. Links: `hover:text-white` | Button, GlobalFooter (Existing) |
| **Selected** | **One colour: `brand-primary`.** Option cards: `border-brand-primary bg-brand-primary/10`. Segmented/tabs: `bg-brand-primary text-slate-950` | SitePreview page tabs, PaywallModal plan card (Existing) |
| Disabled | `disabled:cursor-not-allowed disabled:opacity-55` | Button, Input (Existing) |
| Error | Text `text-brand-danger` (Proposed; code uses `text-rose-300`). Field: `Input error=` | Input |
| Success | Text/badge from `brand-success` (Proposed; code uses `emerald-*`/`green-*`) | — |
| Warning | **Proposed:** add a `--warning` token (code uses raw `amber-200/300/400`) | — |
| Loading | `<Spinner size="sm" />` plus a label (e.g. "Generating…") inside the disabled Button | GenerateForm (Existing) |

Selected text on `brand-primary` must be `text-slate-950` (target: `text-brand-on-primary`), never `text-white` (contrast 2.1, §4).

## 9. Iconography and logo

**Icons (Existing):** [`lucide-react`](../package.json) `^1.25.0`. Used in [EditorSidebar](../components/EditorSidebar.tsx), [SitePreview](../components/SitePreview.tsx) and [ContactIcons](../components/ContactIcons.tsx).
- Decorative icons get `aria-hidden="true"` (current practice). Icon-only buttons need an `aria-label`.
- **Proposed:** sizes 14 (inline status), 16 (lists/contact), 20 (buttons/panels); inherit colour via `currentColor`; no emoji as UI icons (they appear in ColorPicker labels and the landing error state today).

**Logo — Current (Existing), to be replaced by §3:** [components/Logo.tsx](../components/Logo.tsx)
- Mark: 40×40 `rounded-2xl` tile, `bg-gradient-to-br from-brand-primary via-orange-400 to-brand-accent`, "SS" in `font-black text-slate-950`, `shadow-glow`.
- Wordmark: "SiteSpresso" in `font-display text-xl font-semibold`. Tagline "launch faster" in `text-[11px] uppercase tracking-[0.24em] text-brand-muted`.
- Props: `compact` (mark only, e.g. sticky header), `href` (wraps in `Link`). Used on the landing, login, account, dashboard, editor and admin pages.
- Favicon: [public/favicon.svg](../public/favicon.svg). **It draws an "E", not the SiteSpresso mark** (B2).
- Rules: always use `<Logo>`, never re-create the mark; don't recolour or stretch it. **Target:** the approved D2 logo, lockup variants, clear space and don'ts in §3 supersede this block once B1–B2 ship.

## 10. Customer site styling system

### 10.1 Schema fields — [lib/schemas/website.ts](../lib/schemas/website.ts) (Existing)
| Field | Constraint |
|---|---|
| `color_scheme.primary`, `.secondary` | Required, `^#[0-9A-F]{6}$` (case-insensitive) |
| `color_scheme.accent`, `.neutral` | Optional, same regex |
| `fonts.heading` / `fonts.body` | String, defaults `Playfair Display` / `Inter` |
| `logo.url`, `.position` (`left`/`center`/`right`, default `left`), `.width` (30–200, default 100) | |
| `layout.section_order` | Array of `about`/`services`/`contact` |
| `layout.section_backgrounds.{about,services,contact}` | 6-digit hex. Renderer defaults `#ffffff` / `#f8fafc` / `#ffffff` |

### 10.2 How renderers use them (Existing)
- Hero: `linear-gradient(135deg, ${primary}f0, ${secondary}cc)`, or with an image `${primary}cc, ${secondary}b3` over `hero_image_url`. Text is white.
- About/Contact H2s and the About CTA (white text) use `primary`. The Services H2 is `text-slate-800`. Service cards use `borderTop: 3px solid ${primary}`. Section copy is `text-slate-600/800` on the chosen section background. The published top nav marks the active link with `primary` + `aria-current="page"`. The footer is a solid `primary` with `text-white/80`.
- Hero CTA: white pill, `text-slate-900`. Hero text: white over the primary→secondary gradient.
- `accent` and `neutral` are editable in [ColorPicker](../components/ColorPicker.tsx) but are **not used** by the published renderers.

### 10.3 Presets (Existing)
- Colours ([ColorPicker.tsx](../components/ColorPicker.tsx), `[primary, secondary, accent, neutral]`): Tech/Modern `#3B82F6 #06B6D4 #8B5CF6 #E2E8F0`; Warm/Creative `#F97316 #EC4899 #FBBF24 #FEE2E2`; Professional `#1E293B #374151 #CBD5E1 #F1F5F9`; Nature `#10B981 #0EA5E9 #F59E0B #FECACA`; Luxury `#7C3AED #DB2777 #FBBF24 #F3E8FF`.
- Font pairs ([FontSelector.tsx](../components/FontSelector.tsx)): Elegant (Playfair Display + Inter), Editorial (Lora + Roboto), Modern (Poppins + Inter), Friendly (Georgia + Poppins). Pickers: heading ∈ {Playfair Display, Lora, Georgia}, body ∈ {Inter, Roboto, Poppins}.
- Fonts load from Google Fonts at render time (Playfair Display, Lora, Inter, Roboto, Poppins); Georgia is a system font.
- User-saved presets: `profiles.style_presets` ([migration](../supabase/migrations/20260623183000_add_style_presets_to_profiles.sql)), managed in [EditorSidebar](../components/EditorSidebar.tsx).

### 10.4 Preview / published parity (Proposed rule)
Any change to customer-site rendering must land in **all three** files in the same PR: [SitePreview.tsx](../components/SitePreview.tsx), [app/sites/[slug]/page.tsx](../app/sites/%5Bslug%5D/page.tsx) and [app/sites/[slug]/[page]/page.tsx](../app/sites/%5Bslug%5D/%5Bpage%5D/page.tsx). Differences today:
- The font map, Google Fonts URL builder, section-background defaults and embed sanitisers are copied into each file (the font list is also in FontSelector).
- Published pages have a Home/About/Contact nav bar; the preview uses toolbar tabs instead.
- Published hero H1 has `text-balance`; the preview doesn't.
- Logo: preview uses [LogoDisplay](../components/LogoDisplay.tsx) (`alt="Logo"`, `drop-shadow-md`); published uses inline `next/image` (`alt="{business} logo"`, a CSS drop-shadow filter).

**Proposed:** extract a shared `lib/site-theme.ts` (font map, font URL, defaults) and shared section components.

### 10.5 Validation and contrast requirements (Proposed)
- **Hex:** every colour input must accept only `#RRGGBB` before it reaches `onColorsChange`. ColorPicker's free-text field accepts any string today. The hero appends alpha suffixes (`${primary}cc`), so `#fff` or `red` breaks the gradient. And published pages parse content with `WebsiteSchema` (via `normalizeWebsiteContent`), so a saved non-6-digit hex will likely fail to render. Normalise to upper- or lower-case consistently.
- **Contrast:** warn in the editor when `primary` fails 4.5:1 against white (footer, CTA and hero text) or against the section background (H2s), and when a custom `section_backgrounds` colour is too dark for the fixed `text-slate-600/800` copy. Built-in presets measured against white:

| Preset | white on primary | Result |
|---|---|---|
| Professional | 14.6 | ✅ |
| Luxury | 5.7 | ✅ |
| Tech/Modern | 3.7 | ❌ normal text |
| Warm/Creative | 2.8 | ❌ |
| Nature | 2.5 | ❌ |

  **Proposed:** fix or darken the three failing presets, or auto-pick dark text on light primaries.

## 11. Accessibility checklist (every UI PR)

- [ ] Text contrast ≥ 4.5:1 (≥ 3:1 for large text ≥ 24px, or ≥ 18.66px bold); UI boundaries and focus indicators ≥ 3:1.
- [ ] Every interactive element is reachable by keyboard and shows a visible `focus-visible` ring (§8).
- [ ] Inputs have a `<label htmlFor>` (use `Input` with `id` + `label`); errors are linked via `aria-describedby`.
- [ ] Icon-only controls have `aria-label`; decorative icons have `aria-hidden="true"`.
- [ ] State is not conveyed by colour alone (selected/published/verified also has text or an icon).
- [ ] Toggle groups expose state (`aria-pressed` or `aria-current`), as the published nav already does with `aria-current="page"`.
- [ ] Modals trap focus, close on Esc and return focus (not verified for current modals).
- [ ] Images have meaningful `alt`; iframes have `title` (published embeds do).
- [ ] Published pages keep `lang` (set on `<main>` from `site.language` via `normalizeLanguage`).
- [ ] Layout works at 320px width and at 200% zoom.

## 12. Do / Don't

| Don't | Do |
|---|---|
| `bg-slate-900`, `bg-slate-800` for panels | `<Card>` or `bg-brand-surface` / `surface-glass` |
| `text-slate-400` for secondary text | `text-brand-muted` |
| `text-slate-300` for labels | `text-brand-muted-strong` |
| `border-slate-600`, `border-slate-700` | `border-brand-border` or `border-white/10` |
| `bg-blue-600 hover:bg-blue-500` CTA | `<Button variant="primary">` |
| `border-cyan-500` / `border-blue-500` / `border-emerald-500` for selected | `border-brand-primary bg-brand-primary/10` |
| `focus:border-teal-500 focus:outline-none` (no ring) | `focus-visible:ring-2 focus-visible:ring-brand-primary` (target: `ring-brand-ring`, cyan, §8) |
| `bg-brand-primary text-white` badge | `bg-brand-primary text-slate-950` (target: `text-brand-on-primary`) |
| Cyan (`brand-accent`) card, panel, hero or primary button (target) | Cyan only for steam, links, focus ring, small highlights (§3.4) |
| Recreating, recolouring or stretching the logo | `<Logo>` / brand-kit SVGs in an approved colourway (§3) |
| `text-rose-300` / `text-red-400` errors | `text-brand-danger` (Proposed) |
| `text-emerald-400` / `text-green-400` success | `text-brand-success` (Proposed) |
| `bg-white/3`, `bg-white/6` (no CSS generated) | `bg-white/5` or `bg-white/[0.03]` |
| `shadow-[0_0_0_1px_rgba(96,165,250,0.25)]` (blue glow) | `shadow-glow` or `ring-1 ring-brand-primary/40` |
| Copy Input's classes onto a raw `<input>` | `<Input id label … />` |
| Brand tokens inside `app/sites/**` | Customer `color_scheme` / `fonts` only |

Allowed raw colours (Proposed): `white`/`black` with opacity (`border-white/10`, `bg-black/70` overlays), `text-slate-950` on primary fills (until `brand-on-primary` exists, B7), and `slate-*` inside customer-site renderers (their light base).

## 13. Known gaps and migration backlog

Each item is a candidate for its own small PR. Order is a suggestion. "Verified" means checked with a local Tailwind 3.4.16 compile or by reading the source.

1. **No design doc**: this file. Also replace the project-factory starter text in [.github/copilot-instructions.md](../.github/copilot-instructions.md) (its only design rule is "WCAG 2.1 AA"), which the [PR template](../.github/pull_request_template.md) tells contributors to follow.
2. **Editor off-token**: [EditorSidebar.tsx](../components/EditorSidebar.tsx) has 0 `brand-*` classes and ~149 raw `slate-*` usages, plus purple/violet/amber/cyan/blue/teal/sky/rose/emerald. It doesn't import `components/ui`, and each panel uses its own focus colour (`focus:border-cyan|sky|teal|purple|violet-500 focus:outline-none`, with no ring).
3. **FontSelector selected colours**: the preset card is `cyan-500`, the heading option `blue-500`, the body option `emerald-500`. [LogoDisplay](../components/LogoDisplay.tsx) uses `bg-blue-600`. Move all to the single selected style (§8).
4. **Poppins gap**: the "Modern" preset sets heading = Poppins, but `HEADING_FONTS` omits Poppins, so no heading option shows as selected. It still renders correctly (the renderers map Poppins).
5. **`cx()` duplicated** in Button, Card and Input. **Proposed:** one `lib/cx.ts` (optionally with `tailwind-merge` so `className` overrides win reliably).
6. **Raw rose in base components**: Button danger uses `hover:bg-rose-500` and `focus-visible:ring-rose-500/30`; Input errors use `text-rose-300`. Move to `brand-danger`. White on `brand-danger` is 3.9:1, so darken the token or use `text-sm font-semibold` → large text. **Target (D2):** `--danger` becomes `#f26b6b` with a navy label (6.0:1), B7.
7. **Dead classes (verified)**: `hover:bg-white/6` (Button ghost), `bg-white/6` (landing badge) and `bg-white/3` (PaywallModal) generate no CSS.
8. **Off-brand blue on the landing page** ([app/page.tsx](../app/page.tsx)): the loading/error/preview stages use `bg-blue-600` CTAs, a blue pulse and a blue trial banner. The featured pricing card and paywall selection use a blue `rgba(96,165,250,…)` glow. "Popular"/"Selected" badges are white on orange (2.1:1).
9. **Hand-rolled duplicates**: dashboard "View live site" copies Button primary onto a `<span>`; the dashboard domain field copies Input's control classes; landing error/preview buttons are raw `<button>`s.
10. **Status colours not tokenised**: emerald/amber/blue/rose badges and text in the dashboard, landing, login and SitePreview (`text-yellow-400`, `text-green-400`, `text-red-400`). No `--warning` token.
11. **`--ring` not mapped** in Tailwind (§4).
12. **Body font unset** (§5). Resolved by the brand approval: Inter via `next/font` (B4–B5).
13. **`::selection` rule** (also brand item B6) uses `hsla(var(--primary), 0.35)`. With space-separated channels this resolves to `hsla(30 96% 61%, 0.35)`, which is likely invalid CSS (not verified in a browser). **Proposed:** `hsl(var(--primary) / 0.35)`.
14. **Redundant body colour**: a non-layered `body { @apply text-slate-100 }` sits after the token-based `color: hsl(var(--foreground))`. `text-brand-text` on `<body>` wins anyway; remove it.
15. **Customer-site validation and contrast**: §10.5 (hex input, failing presets). `accent`/`neutral` are editable but unused.
16. **Parity duplication**: §10.4.
17. **No accessibility audit on record**: WCAG is in the M8 scope in [ROADMAP.md](../ROADMAP.md), and [docs/t084-087-summary.md](t084-087-summary.md) still lists "T-089: WCAG accessibility" as ☐.
18. **Upcoming theming needs**: T-109 white-label mode (ROADMAP "Planned") will need a rule for which tokens resellers may override.

### Brand implementation (approved D2, §3) — not started

Suggested as small PRs in this order. Each needs the usual owner approval + feature branch + PR (§14). App UI only; nothing here touches customer sites.

- **B1 · [components/Logo.tsx](../components/Logo.tsx):** replace the gradient "SS" tile and Georgia wordmark with the D2 mark. Inline SVG (or import from `public/brand/`) with three modes: compact lockup (default, navbar/header; no tagline), mark only (existing `compact` prop), full lockup with tagline (new prop, only where the rendered width is ≥ 240px). Keep `href`; add `aria-label="SiteSpresso"` on the link/svg and hide decorative parts. Remove the "launch faster" tagline.
- **B2 · [public/favicon.svg](../public/favicon.svg):** currently draws an **"E"**. Replace with the brand kit's `favicon-v2.svg`; add a 180px apple-touch icon from `app-tile-v2.svg` (and optional 32/48 PNGs).
- **B3 · [app/globals.css](../app/globals.css) tokens:** set `--accent`, `--danger`, `--success`, `--ring` to the target values and add `--on-primary` (§4 table). Replace the hard-coded body-glow colours `rgba(249,164,27,…)` and teal `rgba(45,212,191,…)` with `hsl(var(--primary) / 0.16)` and `hsl(var(--accent) / 0.12)`.
- **B4 · [tailwind.config.js](../tailwind.config.js):** map `brand.ring` and `brand.on-primary`; set `fontFamily.display` to `['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif']` and `fontFamily.sans` to `['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif']`.
- **B5 · [app/layout.tsx](../app/layout.tsx):** load Outfit (500, 600) and Inter with `next/font/google` (`variable: '--font-outfit'` / `'--font-inter'`, `display: 'swap'`) and add the variables to `<html>`. Extend `metadata.icons` (today only `{ icon: '/favicon.svg' }`) with the apple-touch icon.
- **B6 · `::selection` fix:** `hsla(var(--primary), 0.35)` → `hsl(var(--primary) / 0.35)` (backlog item 13).
- **B7 · Labels on fills:** `text-slate-950` on primary → `text-brand-on-primary`; "Popular"/"Selected" badges white → navy (item 8); danger button `text-white` → `text-brand-on-primary` once `--danger` is lightened (item 6).
- **B8 · Focus rings:** `ring-brand-primary` → `ring-brand-ring` + `ring-offset-2 ring-offset-brand-bg` in Button, Input and GlobalFooter (§8).
- **B9 · Brand assets in repo:** add the brand-kit SVGs to `public/brand/` (outlined wordmark, so no font dependency) and link this section to them. Then flip §3's status to "Implemented".

## 14. Review process for design changes

1. **Audit and propose in writing**: the issue, affected files, before/after classes, screenshots if possible, and whether it touches app UI (A) or customer sites (B).
2. **Owner approval** before any branch is created. Customer-site (B) changes and any change to `lib/stripe.ts` / `lib/billing/*` behaviour need explicit owner sign-off (AGENTS.md rule 5). Billing *UI* (PaywallModal, UpgradePlanButton, ManageBillingButton) is styling-only territory.
3. **Branch + PR** against `main` (e.g. `design/editor-tokens`), one concern per PR. Never push to `main`; never force-push (AGENTS.md rules 2–4).
4. **Checks**: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` (CI runs the same; see [AGENTS.md](../AGENTS.md)). For docs-only PRs, `git diff --name-only main` lists only `.md` files and all relative links resolve.
5. **Vercel preview check** (PRs get automatic preview deployments per [docs/architecture.md](architecture.md)): walk through the **landing page** (form + pricing), **dashboard**, **editor** (sidebar panels, presets, preview tabs) and **one published site** (`/sites/<slug>`, plus `/about` and `/contact`). Check keyboard focus and the §11 checklist.
6. **Owner merges.** The designer never merges.
7. **After merge**: update [ROADMAP.md](../ROADMAP.md), [NEXT_ACTIONS.md](../NEXT_ACTIONS.md) and this file (AGENTS.md rule 7).

---

### Decisions
**Approved (owner, 2026-09-29), not yet implemented:** Brand direction D2 "Braces & Steam", orange-led (§3), including the Outfit + Inter typography (resolves P5), tagline, colour roles and logo rules (supersedes P11). Implementation: B1–B9 (§13).

**Proposed, needing owner sign-off:**
P1 tokens-only rule (§2, §12) · P2 no hand-rolled controls (§7) · P3 single selected colour = `brand-primary` (§8) · P4 map `--ring` → `brand-ring` (§4) · P5 ~~body font~~ → approved with the brand (§3.5) · P6 type scale and single eyebrow tracking (§5) · P7 radius/elevation scale, remove blue glows (§6) · P8 `--warning` token; errors → `brand-danger`, success → `brand-success` (§8) · P9 darken `--danger` or enlarge danger-button text (§4; the D2 target instead uses a navy label on a lighter `--danger`) · P10 icon sizes, no emoji icons (§9) · P11 ~~logo usage rules~~ → approved with the brand (§3) · P12 preview/published parity rule + shared `lib/site-theme.ts` (§10.4) · P13 hex validation + editor contrast warnings; fix the 3 failing presets (§10.5) · P14 shared `cx` helper (§13) · P15 new `ui/` components: Badge, SegmentedControl, OptionCard, Modal (§7) · P16 replace copilot-instructions starter text (§13) · P17 white-label override policy, when T-109 starts (§13).

# T-101 Multi-Page Sites Implementation Plan

## Goal

Enable each published site to support multiple pages (Home, About, Contact) while preserving current single-page compatibility.

## Current Baseline

1. Published rendering is currently slug-based (`/sites/[slug]`).
2. Site content is stored as one JSON structure in `sites.content`.
3. Routing and middleware already support slug and custom-domain host resolution.

## Proposed Phase Plan

### Phase 1: Data Model

1. Introduce `pages` structure in `sites.content`:
   - `pages.home`
   - `pages.about`
   - `pages.contact`
2. Keep backward compatibility by mapping legacy single-page data into `pages.home` at read time.
3. Add optional page-level SEO fields (`title`, `description`).

Status: ✅ Implemented

Implemented details:

1. `WebsiteSchema` now supports optional `pages.home/about/contact`.
2. Added `normalizeWebsiteContent()` helper in `lib/schemas/website.ts`.
3. Published and editor loaders now normalize site content at read time.
4. Legacy single-page records continue to render without migration.

### Phase 2: Editor UX

1. Add page selector tabs in editor (Home/About/Contact).
2. Scope section editing to selected page.
3. Preserve existing autosave behavior.

Status: ✅ Implemented

Implemented details:

1. Editor preview now includes Home/About/Contact tabs.
2. Switching tabs hydrates the editable canvas from `pages.<selectedPage>`.
3. Autosave syncs edited canvas sections back into the selected page object.
4. Existing editor flow still works for legacy single-page sites.

### Phase 3: Published Routing

Status: ✅ Implemented

Implemented details:

1. Added dynamic published route support for `/sites/[slug]/about` and `/sites/[slug]/contact`.
2. Middleware rewrites now preserve path suffixes for subdomains and custom domains.
3. Added top navigation on published pages with host-aware links for home/about/contact.
4. Added per-page metadata handling for about/contact canonical and social URLs.

1. Add page route support under published slug:
   - `/sites/[slug]` -> Home
   - `/sites/[slug]/about`
   - `/sites/[slug]/contact`
2. For custom domains/subdomains, preserve host routing and resolve page path suffixes.
3. Add top navigation for page switching.

### Phase 4: Validation and Migration

Status: ✅ Implemented

Implemented details:

1. Generation route now normalizes validated output to the multipage content shape.
2. Added `scripts/migrate-multipage-content.ts` for dry-run auditing and optional apply migration over existing `sites.content` rows.
3. Added npm commands for audit/apply (`test:multipage-content`, `migrate:multipage-content`).
4. Extended smoke checks to guard multipage migration script presence and generation normalization wiring.

1. Extend schema validation for `pages` object.
2. Add read-time fallback for old records.
3. Add optional background migration script for existing rows.

### Phase 5: QA

Status: ✅ Implemented

Implemented details:

1. Applied multipage content migration and confirmed a clean post-migration dry run.
2. Added `scripts/multipage-qa.ts` to validate published Home/About/Contact route responses and canonical URLs.
3. Multipage QA now validates both primary host (`sitespresso.com`) and verified+attached custom host paths.
4. Integrated multipage QA into `scripts/reliability-check.ps1` for release-time regression protection.

1. Single-page legacy records still render.
2. New multi-page records render on all three routes.
3. Custom-domain host routing works for all page paths.
4. SEO metadata and canonical handling are correct per page.

## API/Schema Impact

1. `lib/schemas/website.ts` update required.
2. Editor save payload remains in `sites.content`, but shape extends.
3. No immediate table schema change required unless page metadata is split to normalized tables.

## Rollout Strategy

1. Ship read compatibility first.
2. Enable editor page tabs after renderer supports pages.
3. Release behind a lightweight feature flag if needed.

## Acceptance Criteria

1. User can create and edit Home/About/Contact independently.
2. Published navigation works on both subdomain and custom domain hosts.
3. Legacy sites remain functional with no manual migration required.
4. `npm run test:reliability` and custom-domain public QA checks remain green.

Write-Host "Running SiteSpresso smoke checks..." -ForegroundColor Cyan

$failures = @()

function Assert-PathExists {
    param(
        [string]$Path,
        [string]$Label
    )

    if (Test-Path -LiteralPath $Path) {
        Write-Host "  [OK] $Label" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $Label" -ForegroundColor Red
        $script:failures += "$Label ($Path)"
    }
}

function Assert-FileContains {
    param(
        [string]$Path,
        [string]$Pattern,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        Write-Host "  [FAIL] $Label (missing file)" -ForegroundColor Red
        $script:failures += "$Label (missing file: $Path)"
        return
    }

    $match = Select-String -LiteralPath $Path -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue
    if ($match) {
        Write-Host "  [OK] $Label" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $Label" -ForegroundColor Red
        $script:failures += "$Label (pattern not found: $Pattern)"
    }
}

Assert-PathExists "components/EditorSidebar.tsx" "Editor sidebar exists"
Assert-PathExists "components/SitePreview.tsx" "Site preview exists"
Assert-PathExists "app/sites/[slug]/page.tsx" "Published page exists"
Assert-PathExists "app/sites/[slug]/[page]/page.tsx" "Published multipage route exists"
Assert-PathExists "app/sitemap.ts" "Sitemap route exists"
Assert-PathExists "app/robots.ts" "Robots route exists"
Assert-PathExists "lib/schemas/website.ts" "Website schema exists"
Assert-PathExists "scripts/migrate-multipage-content.ts" "Multipage migration script exists"
Assert-PathExists "app/api/sites/[id]/hero-image/route.ts" "Hero image generation route exists"

Assert-FileContains "components/EditorSidebar.tsx" "applySavedPreset" "Saved preset apply handler present"
Assert-FileContains "components/EditorSidebar.tsx" "updateSavedPreset" "Saved preset update handler present"
Assert-FileContains "components/EditorSidebar.tsx" "handlePresetDrop" "Preset drag/drop handler present"
Assert-FileContains "components/EditorSidebar.tsx" "presetStorageMode" "Preset sync mode UI state present"

Assert-FileContains "components/SitePreview.tsx" "section_order" "Preview supports section order"
Assert-FileContains "components/SitePreview.tsx" "section_backgrounds" "Preview supports section backgrounds"
Assert-FileContains "components/SitePreview.tsx" "cta_url" "Preview supports hero CTA URL"

Assert-FileContains "app/sites/[slug]/page.tsx" "section_order" "Published page supports section order"
Assert-FileContains "app/sites/[slug]/page.tsx" "section_backgrounds" "Published page supports section backgrounds"
Assert-FileContains "app/sites/[slug]/page.tsx" "cta_url" "Published page supports hero CTA URL"
Assert-FileContains "app/sites/[slug]/page.tsx" "resolvePublishedNavPath" "Published home route supports page nav links"
Assert-FileContains "app/sites/[slug]/page.tsx" "WebSite" "Published home route includes WebSite structured data"
Assert-FileContains "app/sites/[slug]/[page]/page.tsx" "PUBLISHED_PAGES" "Published subpage route validates supported pages"
Assert-FileContains "app/sites/[slug]/[page]/page.tsx" "application/ld+json" "Published subpage route includes structured data"
Assert-FileContains "middleware.ts" "resolvePublishedPathname" "Middleware preserves host-routed subpage path suffix"
Assert-FileContains "app/api/generate/route.ts" "normalizeWebsiteContent" "Generation route normalizes multipage content"
Assert-FileContains "app/api/sites/[id]/refresh-section/route.ts" "getRefreshSectionPrompt" "Refresh-section route uses targeted AI prompt"
Assert-FileContains "components/EditorSidebar.tsx" "refresh-section" "Editor sidebar wires refresh-section API"
Assert-FileContains "components/GenerateForm.tsx" "SUPPORTED_LANGUAGES" "Generate form exposes website language selector"
Assert-FileContains "lib/ai/prompts.ts" "languageDirective" "AI prompts enforce output language"
Assert-FileContains "app/sites/[slug]/page.tsx" "lang={siteLanguage}" "Published home route sets document language"
Assert-FileContains "app/sites/[slug]/[page]/page.tsx" "lang={siteLanguage}" "Published subpage route sets document language"
Assert-FileContains "app/api/generate/route.ts" "isSiteLimitReached" "Generation route enforces per-plan site limits"
Assert-FileContains "app/api/sites/[id]/domain/route.ts" "isSameDomain" "Domain save preserves flags when domain is unchanged"
Assert-FileContains "app/api/sites/[id]/domain/verify/route.ts" "shouldPreserveVerifiedStatus" "Verify route avoids demotion on inconclusive DNS checks"
Assert-FileContains "components/DashboardContent.tsx" "resolveLiveSiteUrl" "Dashboard live button resolves custom domain when connected"
Assert-FileContains "components/SitePreview.tsx" "isSiteLimitReached" "Draft creation enforces per-plan site limits"
Assert-FileContains "app/api/leads/route.ts" "LeadSchema" "Lead capture API validates and upserts email"
Assert-FileContains "components/LeadCaptureModal.tsx" "onCaptured" "Lead capture modal wires callback after email submitted"
Assert-FileContains "app/page.tsx" "leadCaptureOpen" "Home page shows lead capture modal before anon publish"
Assert-FileContains "lib/referral.ts" "storeReferralCode" "Referral helpers manage localStorage TTL"
Assert-FileContains "components/ReferralCapture.tsx" "storeReferralCode" "Referral capture component reads ?ref= query param"
Assert-FileContains "components/ReferralApply.tsx" "clearReferralCode" "Referral apply component fires POST after login"
Assert-FileContains "app/api/referrals/route.ts" "deriveReferralCode" "Referral attribution API resolves referrer from code"
Assert-FileContains "app/api/webhooks/stripe/route.ts" "rewardReferrer" "Stripe webhook rewards referrer on subscription"
Assert-FileContains "components/ReferralPanel.tsx" "totalEarnedCents" "Account page shows referral stats panel"
Assert-FileContains "components/DashboardContent.tsx" "reachedSiteLimit" "Dashboard blocks new site action at plan limit"
Assert-FileContains "components/EditorSidebar.tsx" "handleGenerateHeroImage" "Editor supports hero image generation action"
Assert-FileContains "components/SitePreview.tsx" "hero_image_url" "Preview supports hero image background rendering"
Assert-FileContains "lib/schemas/website.ts" "hero_image_url" "Schema includes hero image URL field"
Assert-FileContains "lib/schemas/website.ts" "map_embed_url" "Schema includes contact map embed URL field"
Assert-FileContains "components/SitePreview.tsx" "map_embed_url" "Preview supports contact map embed rendering"
Assert-FileContains "app/sites/[slug]/page.tsx" "map_embed_url" "Published home supports contact map embed rendering"
Assert-FileContains "app/sites/[slug]/[page]/page.tsx" "map_embed_url" "Published subpage supports contact map embed rendering"
Assert-FileContains "lib/schemas/website.ts" "booking_embed_url" "Schema includes contact booking embed URL field"
Assert-FileContains "components/EditorSidebar.tsx" "booking_embed_url" "Editor supports Calendly embed URL input"
Assert-FileContains "components/SitePreview.tsx" "booking_embed_url" "Preview supports booking widget rendering"
Assert-FileContains "app/sites/[slug]/page.tsx" "booking_embed_url" "Published home supports booking widget rendering"
Assert-FileContains "app/sites/[slug]/[page]/page.tsx" "booking_embed_url" "Published subpage supports booking widget rendering"
Assert-FileContains "lib/schemas/website.ts" "google_business_profile_embed_url" "Schema includes Google Business Profile embed URL field"
Assert-FileContains "components/EditorSidebar.tsx" "google_business_profile_embed_url" "Editor supports Google Business Profile embed URL input"
Assert-FileContains "components/SitePreview.tsx" "google_business_profile_embed_url" "Preview supports Google Business Profile embed rendering"
Assert-FileContains "app/sites/[slug]/page.tsx" "google_business_profile_embed_url" "Published home supports Google Business Profile embed rendering"
Assert-FileContains "app/sites/[slug]/[page]/page.tsx" "google_business_profile_embed_url" "Published subpage supports Google Business Profile embed rendering"

Assert-FileContains "lib/schemas/website.ts" "left" "Schema includes logo left position"
Assert-FileContains "lib/schemas/website.ts" "center" "Schema includes logo center position"
Assert-FileContains "lib/schemas/website.ts" "right" "Schema includes logo right position"

Write-Host ""
Write-Host "Running dev health check..." -ForegroundColor Cyan
npm run dev:health
if ($LASTEXITCODE -ne 0) {
    $failures += "dev:health command failed"
}

Write-Host ""
if ($failures.Count -gt 0) {
    Write-Host "Smoke checks failed:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Smoke checks passed." -ForegroundColor Green
exit 0

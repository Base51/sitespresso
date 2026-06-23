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
Assert-PathExists "lib/schemas/website.ts" "Website schema exists"

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

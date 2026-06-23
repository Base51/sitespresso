param(
    [switch]$RequireAllPlans
)

Write-Host "Checking SiteSpresso billing configuration..." -ForegroundColor Cyan

$hasErrors = $false
$warnings = @()

if (-not (Test-Path ".env.local")) {
    Write-Host "  [FAIL] .env.local not found" -ForegroundColor Red
    exit 1
}

$envText = Get-Content ".env.local" -Raw

function Test-EnvVar {
    param(
        [string]$Name,
        [switch]$Required
    )

    if ($envText -match "(?m)^$Name\s*=\s*.+$") {
        Write-Host "  [OK] $Name is set" -ForegroundColor Green
        return $true
    }

    if ($Required) {
        Write-Host "  [FAIL] $Name is missing" -ForegroundColor Red
        $script:hasErrors = $true
        return $false
    }

    $script:warnings += "$Name is missing"
    return $false
}

Write-Host "" 
Write-Host "Core Stripe configuration" -ForegroundColor White
Test-EnvVar "STRIPE_SECRET_KEY" -Required | Out-Null
Test-EnvVar "STRIPE_WEBHOOK_SECRET" -Required | Out-Null
Test-EnvVar "STRIPE_STARTER_PRICE_ID" -Required | Out-Null

Write-Host "" 
Write-Host "Paid tier price IDs" -ForegroundColor White

$allPlanVars = @(
    "STRIPE_STARTER_ANNUAL_PRICE_ID",
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_PRO_ANNUAL_PRICE_ID",
    "STRIPE_AGENCY_PRICE_ID",
    "STRIPE_AGENCY_ANNUAL_PRICE_ID"
)

foreach ($varName in $allPlanVars) {
    if ($RequireAllPlans) {
        Test-EnvVar $varName -Required | Out-Null
    } else {
        Test-EnvVar $varName | Out-Null
    }
}

Write-Host "" 
if ($warnings.Count -gt 0) {
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    Write-Host "  These plans or billing intervals will appear unavailable in the UI until configured." -ForegroundColor Yellow
}

Write-Host ""
if ($hasErrors) {
    Write-Host "Billing configuration check failed." -ForegroundColor Red
    exit 1
}

if ($RequireAllPlans) {
    Write-Host "Billing configuration check passed for all planned tiers." -ForegroundColor Green
} else {
    Write-Host "Billing configuration check passed for the currently required Stripe setup." -ForegroundColor Green
}

exit 0
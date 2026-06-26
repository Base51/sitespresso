Write-Host "Checking Supabase environment isolation..." -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$failures = @()

function Get-EnvValueFromFile {
    param(
        [string]$Path,
        [string]$Name
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    $line = Get-Content -LiteralPath $Path |
        Where-Object { $_ -like "$Name=*" } |
        Select-Object -First 1

    if (-not $line) {
        return $null
    }

    return (($line -split '=', 2)[1]).Trim().Trim('"')
}

function Get-SupabaseRef {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return $null
    }

    if ($Url -match '^https://([a-z0-9-]+)\.supabase\.co/?$') {
        return $Matches[1]
    }

    return "INVALID_URL"
}

$localEnvPath = ".env.local"
$templateEnvPath = "templates/nextjs-app/.env.local"

$localUrl = Get-EnvValueFromFile -Path $localEnvPath -Name "NEXT_PUBLIC_SUPABASE_URL"
$templateUrl = Get-EnvValueFromFile -Path $templateEnvPath -Name "NEXT_PUBLIC_SUPABASE_URL"

$localRef = Get-SupabaseRef -Url $localUrl
$templateRef = Get-SupabaseRef -Url $templateUrl

Write-Host "" 
Write-Host "Detected refs:" -ForegroundColor Cyan
Write-Host "  .env.local                : $localRef"
Write-Host "  templates/nextjs-app/.env.local : $templateRef"

if (-not $localRef -or $localRef -eq "INVALID_URL") {
    $failures += ".env.local has missing/invalid NEXT_PUBLIC_SUPABASE_URL"
}

if (-not $templateRef -or $templateRef -eq "INVALID_URL") {
    $failures += "templates/nextjs-app/.env.local has missing/invalid NEXT_PUBLIC_SUPABASE_URL"
}

if ($localRef -and $templateRef -and $localRef -eq $templateRef) {
    $failures += "Local app and template currently point to the same Supabase project ref ($localRef)."
}

Write-Host ""
if ($failures.Count -gt 0) {
    Write-Host "Supabase isolation check failed:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Supabase isolation check passed." -ForegroundColor Green
exit 0

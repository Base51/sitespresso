# custom-domain-qa.ps1
# Validates custom domain APIs in production or preview environments.
#
# Usage examples:
#   .\scripts\custom-domain-qa.ps1
#   .\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com"
#   .\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com" -SiteId "<site-id>" -SessionCookie "sb-access-token=...; sb-refresh-token=..."
#   .\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com" -SiteId "<site-id>" -SessionCookie "..." -CustomDomain "www.example.com"

param(
    [string]$BaseUrl = "https://sitespresso.com",
    [string]$SiteId,
    [string]$SessionCookie,
    [string]$CustomDomain
)

$ErrorActionPreference = "Stop"
$failures = @()

function Write-Check {
    param(
        [string]$Label,
        [bool]$Passed,
        [string]$Details = ""
    )

    if ($Passed) {
        Write-Host "  [OK] $Label" -ForegroundColor Green
        if ($Details) {
            Write-Host "       $Details" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  [FAIL] $Label" -ForegroundColor Red
        if ($Details) {
            Write-Host "       $Details" -ForegroundColor DarkGray
        }
        $script:failures += "$Label - $Details"
    }
}

function Invoke-JsonRequest {
    param(
        [Parameter(Mandatory)]
        [ValidateSet("GET", "POST", "PATCH")]
        [string]$Method,

        [Parameter(Mandatory)]
        [string]$Uri,

        [string]$Cookie,

        [object]$Body
    )

    $headers = @{}
    if ($Cookie) {
        $headers["Cookie"] = $Cookie
    }

    $requestArgs = @{
        Uri = $Uri
        Method = $Method
        Headers = $headers
        SkipHttpErrorCheck = $true
    }

    if ($null -ne $Body) {
        $requestArgs["ContentType"] = "application/json"
        $requestArgs["Body"] = ($Body | ConvertTo-Json -Depth 8)
    }

    $response = Invoke-WebRequest @requestArgs
    $json = $null

    if ($response.Content) {
        try {
            $json = $response.Content | ConvertFrom-Json
        } catch {
            $json = $null
        }
    }

    [PSCustomObject]@{
        StatusCode = [int]$response.StatusCode
        Json = $json
        Raw = $response.Content
    }
}

Write-Host "Running custom-domain QA checks against $BaseUrl" -ForegroundColor Cyan

# 1) Public billing plans payload contract
$plans = Invoke-JsonRequest -Method "GET" -Uri "$BaseUrl/api/billing/plans"
$plansHasSuccess = ($plans.Json -and $null -ne $plans.Json.success)
$plansHasAvailability = ($plans.Json -and $null -ne $plans.Json.availability)
$plansHasPricing = ($plans.Json -and $null -ne $plans.Json.pricing)
Write-Check -Label "Billing plans endpoint responds 200" -Passed ($plans.StatusCode -eq 200) -Details "Status=$($plans.StatusCode)"
Write-Check -Label "Billing plans includes success" -Passed $plansHasSuccess
Write-Check -Label "Billing plans includes availability" -Passed $plansHasAvailability
Write-Check -Label "Billing plans includes pricing" -Passed $plansHasPricing

# 2) Domain verify endpoint denies unauthenticated access
$verifyUnauth = Invoke-JsonRequest -Method "POST" -Uri "$BaseUrl/api/sites/test-id/domain/verify"
$unauthBlocked = ($verifyUnauth.StatusCode -eq 401)
Write-Check -Label "Domain verify blocks unauthenticated requests" -Passed $unauthBlocked -Details "Status=$($verifyUnauth.StatusCode)"

# 3) Optional authenticated checks
if ($SiteId -and $SessionCookie) {
    Write-Host "Running authenticated checks for site $SiteId" -ForegroundColor Cyan

    if ($CustomDomain) {
        $saveDomain = Invoke-JsonRequest -Method "PATCH" -Uri "$BaseUrl/api/sites/$SiteId/domain" -Cookie $SessionCookie -Body @{ customDomain = $CustomDomain }
        $saveOk = ($saveDomain.StatusCode -eq 200 -and $saveDomain.Json -and $saveDomain.Json.success)
        Write-Check -Label "Save custom domain succeeds" -Passed $saveOk -Details "Status=$($saveDomain.StatusCode)"
    } else {
        Write-Host "  [SKIP] Save custom domain check (no -CustomDomain provided)" -ForegroundColor Yellow
    }

    $verifyAuth = Invoke-JsonRequest -Method "POST" -Uri "$BaseUrl/api/sites/$SiteId/domain/verify" -Cookie $SessionCookie
    $verifyAuthOk = ($verifyAuth.StatusCode -eq 200 -and $verifyAuth.Json -and $verifyAuth.Json.success)
    Write-Check -Label "Authenticated verify request succeeds" -Passed $verifyAuthOk -Details "Status=$($verifyAuth.StatusCode)"

    if ($verifyAuth.Json) {
        $hasVerified = $null -ne $verifyAuth.Json.domainVerified
        $hasExpectedTarget = -not [string]::IsNullOrWhiteSpace([string]$verifyAuth.Json.expectedTarget)
        $hasMessage = -not [string]::IsNullOrWhiteSpace([string]$verifyAuth.Json.message)

        Write-Check -Label "Verify payload includes domainVerified" -Passed $hasVerified
        Write-Check -Label "Verify payload includes expectedTarget" -Passed $hasExpectedTarget
        Write-Check -Label "Verify payload includes message" -Passed $hasMessage

        $verificationStatus = if ($verifyAuth.Json.domainVerified) { "VERIFIED" } else { "NOT VERIFIED" }
        Write-Host "  [INFO] Domain status: $verificationStatus" -ForegroundColor Cyan
        Write-Host "  [INFO] Message: $($verifyAuth.Json.message)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "Skipping authenticated checks (provide -SiteId and -SessionCookie to enable)." -ForegroundColor Yellow
}

Write-Host ""
if ($failures.Count -gt 0) {
    Write-Host "Custom-domain QA checks failed:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Custom-domain QA checks passed." -ForegroundColor Green
exit 0

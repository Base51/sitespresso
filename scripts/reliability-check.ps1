Write-Host "Running SiteSpresso reliability pipeline..." -ForegroundColor Cyan

$results = @()

function Run-Step {
    param(
        [string]$Label,
        [string]$Command
    )

    Write-Host ""
    Write-Host "[$Label]" -ForegroundColor Cyan
    # Stream command output to console but keep function return value numeric.
    Invoke-Expression $Command | Out-Host
    $exitCode = $LASTEXITCODE

    $status = if ($exitCode -eq 0) { "PASS" } else { "FAIL" }
    $script:results += [PSCustomObject]@{
        Label = $Label
        Status = $status
        ExitCode = $exitCode
    }

    return [int]$exitCode
}

$pipelineFailed = $false

if ((Run-Step -Label "Dev Health" -Command "npm run dev:health") -ne 0) {
    $pipelineFailed = $true
}

if ((Run-Step -Label "Smoke Checks" -Command "npm run test:smoke") -ne 0) {
    $pipelineFailed = $true
}

if ((Run-Step -Label "Production Build" -Command "npm run build") -ne 0) {
    $pipelineFailed = $true
}

Write-Host ""
Write-Host "Reliability summary:" -ForegroundColor Cyan
foreach ($result in $results) {
    if ($result.Status -eq "PASS") {
        Write-Host "  [PASS] $($result.Label)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $($result.Label) (exit $($result.ExitCode))" -ForegroundColor Red
    }
}

Write-Host ""
if ($pipelineFailed) {
    Write-Host "Reliability pipeline failed." -ForegroundColor Red
    exit 1
}

Write-Host "Reliability pipeline passed." -ForegroundColor Green
exit 0

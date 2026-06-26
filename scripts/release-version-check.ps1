param(
    [switch]$Strict
)

Write-Host "Checking release version consistency..." -ForegroundColor Cyan

$ErrorActionPreference = "Stop"
$failures = @()

if (-not (Test-Path -LiteralPath "package.json")) {
    Write-Error "package.json not found."
}

$packageJson = Get-Content -LiteralPath "package.json" -Raw | ConvertFrom-Json
$packageVersion = [string]$packageJson.version

if (-not $packageVersion -or $packageVersion -notmatch '^\d+\.\d+\.\d+$') {
    $failures += "package.json version is missing or not semver (x.y.z)."
}

$semverTags = @()
$allTags = git tag --list
foreach ($tag in $allTags) {
    if ($tag -match '^v(\d+)\.(\d+)\.(\d+)$') {
        $semverTags += [PSCustomObject]@{
            Tag = $tag
            Version = [Version]::new([int]$Matches[1], [int]$Matches[2], [int]$Matches[3])
        }
    }
}

$latestTag = $null
if ($semverTags.Count -gt 0) {
    $latestTag = $semverTags | Sort-Object Version | Select-Object -Last 1
}

$packageAsVersion = $null
if ($packageVersion -match '^(\d+)\.(\d+)\.(\d+)$') {
    $packageAsVersion = [Version]::new([int]$Matches[1], [int]$Matches[2], [int]$Matches[3])
}

$releaseTag = if ($packageVersion) { "v$packageVersion" } else { $null }

Write-Host "" 
Write-Host "Detected versions:" -ForegroundColor Cyan
Write-Host "  package.json version : $packageVersion"
Write-Host "  current release tag  : $releaseTag"
Write-Host "  latest semver tag    : $($latestTag.Tag)"

if ($null -ne $latestTag -and $null -ne $packageAsVersion) {
    if ($Strict -and $packageAsVersion -le $latestTag.Version) {
        $failures += "package.json version ($packageVersion) must be greater than latest tag ($($latestTag.Tag))."
    }

    if (-not $Strict -and $packageAsVersion -lt $latestTag.Version) {
        $failures += "package.json version ($packageVersion) is behind latest tag ($($latestTag.Tag))."
    }
}

if ($releaseTag -and ($allTags -contains $releaseTag)) {
    $failures += "Tag $releaseTag already exists. Choose a new version before tagging."
}

Write-Host ""
if ($failures.Count -gt 0) {
    Write-Host "Release version check failed:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host "  - $failure" -ForegroundColor Red
    }
    exit 1
}

Write-Host "Release version check passed." -ForegroundColor Green
Write-Host "Suggested release tag: $releaseTag"
exit 0

# new-project.ps1
# Creates a new project folder from a chosen template.
#
# Usage:
#   .\scripts\new-project.ps1 -Template react-app -Name my-project
#   .\scripts\new-project.ps1 -Template nextjs-app -Name my-app -Destination C:\Projects

param (
    [Parameter(Mandatory)]
    [ValidateSet("static-website", "react-app", "nextjs-app", "power-platform")]
    [string]$Template,

    [Parameter(Mandatory)]
    [string]$Name,

    [string]$Destination = "."
)

$source      = Join-Path $PSScriptRoot "..\templates\$Template"
$destination = Join-Path $Destination $Name

if (-not (Test-Path $source)) {
    Write-Error "Template '$Template' not found at: $source"
    exit 1
}

if (Test-Path $destination) {
    Write-Error "Destination already exists: $destination"
    exit 1
}

Copy-Item -Path $source -Destination $destination -Recurse

# Remove .gitkeep files from the copied project
Get-ChildItem -Path $destination -Filter ".gitkeep" -Recurse | Remove-Item -Force

Write-Host ""
Write-Host "Project created: $destination" -ForegroundColor Green
Write-Host "Template used:   $Template"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. cd $destination"

if ($Template -in @("react-app", "nextjs-app")) {
    Write-Host "  2. npm install"
    Write-Host "  3. npm run dev"
} elseif ($Template -eq "static-website") {
    Write-Host "  2. Open index.html in your browser"
} elseif ($Template -eq "power-platform") {
    Write-Host "  2. Review README.md for pac CLI setup steps"
}

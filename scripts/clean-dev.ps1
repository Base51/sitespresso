# clean-dev.ps1
# Safely clean build artifacts and restart dev server with fresh state
# This prevents stale cache issues that cause white/unstyled pages

Write-Host "🧹 Cleaning build artifacts and cache..." -ForegroundColor Cyan

# Kill any stale Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove Next.js build cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed .next cache" -ForegroundColor Green
}

# Remove Turbo cache if it exists
if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force ".turbo" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed .turbo cache" -ForegroundColor Green
}

# Remove TypeScript cache
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue
    Write-Host "  ✓ Removed TypeScript build info" -ForegroundColor Green
}

Write-Host "✨ Cache clean. Starting dev server..." -ForegroundColor Cyan
Write-Host ""

# Start the dev server
npm run dev

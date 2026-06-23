# clean-dev.ps1
# Safely clean build artifacts and restart dev server with fresh state
# This prevents stale cache issues that cause white/unstyled pages

Write-Host "Cleaning build artifacts and cache..." -ForegroundColor Cyan

# Stop only processes listening on common local dev ports.
# Do not kill all node processes because npm itself runs on node.
$devPorts = 3000..3010
foreach ($port in $devPorts) {
    try {
        $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($listener in $listeners) {
            if ($listener.OwningProcess -and $listener.OwningProcess -ne $PID) {
                Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped process on port $port" -ForegroundColor Green
            }
        }
    } catch {
        # Ignore ports with no listeners or unsupported environments.
    }
}

# Remove Next.js build cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  Removed .next cache" -ForegroundColor Green
}

# Remove Turbo cache if it exists
if (Test-Path ".turbo") {
    Remove-Item -Recurse -Force ".turbo" -ErrorAction SilentlyContinue
    Write-Host "  Removed .turbo cache" -ForegroundColor Green
}

# Remove TypeScript cache
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo" -ErrorAction SilentlyContinue
    Write-Host "  Removed TypeScript build info" -ForegroundColor Green
}

Write-Host "Cache clean. Starting dev server..." -ForegroundColor Cyan
Write-Host ""

# Start the dev server
npm run dev

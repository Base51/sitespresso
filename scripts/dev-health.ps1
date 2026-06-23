param(
    [int]$Port = 3000
)

Write-Host "Running SiteSpresso dev health checks..." -ForegroundColor Cyan

$hasErrors = $false
$warnings = @()

function Check-Command {
    param(
        [string]$Name
    )

    if (Get-Command $Name -ErrorAction SilentlyContinue) {
        Write-Host "  [OK] $Name is available" -ForegroundColor Green
        return $true
    }

    Write-Host "  [FAIL] $Name is not available in PATH" -ForegroundColor Red
    return $false
}

if (-not (Check-Command "node")) {
    $hasErrors = $true
}

if (-not (Check-Command "npm")) {
    $hasErrors = $true
}

if (Test-Path "package.json") {
    Write-Host "  [OK] package.json found" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] package.json not found. Run this command from repo root." -ForegroundColor Red
    $hasErrors = $true
}

if (Test-Path "node_modules") {
    Write-Host "  [OK] node_modules found" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] node_modules missing. Run npm install." -ForegroundColor Red
    $hasErrors = $true
}

if (Test-Path ".env.local") {
    Write-Host "  [OK] .env.local found" -ForegroundColor Green

    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "OPENAI_API_KEY"
    )

    $envText = Get-Content ".env.local" -Raw
    foreach ($varName in $requiredVars) {
        if ($envText -match "(?m)^$varName\s*=\s*.+$") {
            Write-Host "  [OK] $varName is set" -ForegroundColor Green
        } else {
            $warnings += "$varName is missing in .env.local"
        }
    }
} else {
    $warnings += ".env.local not found"
}

try {
    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listeners) {
        $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
        $processNames = @()
        foreach ($pid in $processIds) {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                $processNames += "$($proc.ProcessName)($pid)"
            }
        }

        if ($processNames.Count -gt 0) {
            $warnings += "Port $Port is already in use by: $($processNames -join ', ')"
        } else {
            $warnings += "Port $Port is already in use"
        }
    } else {
        Write-Host "  [OK] Port $Port is free" -ForegroundColor Green
    }
} catch {
    $warnings += "Could not check port $Port listeners on this environment"
}

if (Test-Path ".next") {
    Write-Host "  [INFO] .next exists (normal after previous runs)" -ForegroundColor DarkYellow
}

if ($warnings.Count -gt 0) {
    Write-Host "" 
    Write-Host "Warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
}

Write-Host ""
if ($hasErrors) {
    Write-Host "Dev health check failed. Fix the errors above first." -ForegroundColor Red
    exit 1
}

Write-Host "Dev health check passed." -ForegroundColor Green
exit 0

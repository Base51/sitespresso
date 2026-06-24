# Custom Domain QA Runbook

This runbook provides a repeatable validation flow for custom-domain registration and DNS verification.

## Script

Path: scripts/custom-domain-qa.ps1

## What it validates

1. Public billing plans payload contract.
2. Domain verify endpoint blocks unauthenticated requests.
3. Optional authenticated checks for a real site:
   - save custom domain (optional step)
   - run verify endpoint
   - validate response fields

## Usage

Public checks only:

```powershell
.\scripts\custom-domain-qa.ps1
```

Public checks against specific environment:

```powershell
.\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com"
```

Authenticated checks for a specific site:

```powershell
.\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com" -SiteId "<site-id>" -SessionCookie "sb-access-token=...; sb-refresh-token=..."
```

Authenticated checks including domain save:

```powershell
.\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com" -SiteId "<site-id>" -SessionCookie "sb-access-token=...; sb-refresh-token=..." -CustomDomain "www.example.com"
```

## Notes

1. Do not commit real session cookies or secrets.
2. For apex domains, verification now supports A/AAAA target matching in addition to CNAME.
3. Verification is status-only in this phase; live custom-domain routing is still out of scope.

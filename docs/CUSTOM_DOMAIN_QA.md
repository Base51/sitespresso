# Custom Domain QA Runbook

This runbook provides a repeatable validation flow for custom-domain registration, DNS verification, and Vercel attach.

## Script

Path: scripts/custom-domain-qa.ps1

## What it validates

1. Public billing plans payload contract.
2. Domain verify endpoint blocks unauthenticated requests.
3. Domain attach endpoint blocks unauthenticated requests.
3. Optional authenticated checks for a real site:
   - save custom domain (optional step)
   - run verify endpoint
   - validate response fields
   - optionally run attach endpoint after successful verification

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
.\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com" -SiteId "<site-id>" -SessionCookie "sb-<project>-auth-token.0=..."
```

Authenticated checks including domain save:

```powershell
.\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com" -SiteId "<site-id>" -SessionCookie "sb-<project>-auth-token.0=..." -CustomDomain "www.example.com"
```

Authenticated checks including attach:

```powershell
.\scripts\custom-domain-qa.ps1 -BaseUrl "https://sitespresso.com" -SiteId "<site-id>" -SessionCookie "sb-<project>-auth-token.0=..." -CustomDomain "app.example.com" -RunAttach
```

## Notes

1. Do not commit real session cookies or secrets.
2. For apex domains, verification now supports A/AAAA target matching in addition to CNAME.
3. `-RunAttach` is intended for a real domain or subdomain you control. Reserved domains such as `example.com` are useful only for negative-path verification.
4. Middleware now routes verified, attached custom hosts to the published site. The remaining validation gap is a real-domain success-path test.

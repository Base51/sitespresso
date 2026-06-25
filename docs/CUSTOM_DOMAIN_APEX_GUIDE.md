# Apex Domain Setup Guide

This guide explains how customers can connect a root domain (apex), such as `example.com`, to a published SiteSpresso site.

## When to use apex

Use apex when the customer explicitly wants their main root domain to be the live website.

For lower risk and easier rollback, recommend `www` first and apex as an advanced option.

## Preconditions

1. Site is published.
2. Customer is on a paid plan.
3. Custom domain is saved in the dashboard.
4. DNS provider access is available.

## Target values

The dashboard/API verification response provides:

1. `expectedTarget` (for CNAME-style routing)
2. `expectedRecords` (A/AAAA IP set for apex fallback)

For apex setups, use `expectedRecords`.

## Apex DNS procedure

1. Add root (`@`) A records matching the expected IPv4 values.
2. Add root (`@`) AAAA records if the verifier returns expected IPv6 values.
3. Disable DNS proxy/CDN while verifying (for example: Cloudflare must be DNS-only / gray cloud).
4. Wait for propagation.
5. In SiteSpresso dashboard:
   - Click Check DNS
   - After verified, click Attach to Vercel

## Common failure patterns

1. `No CNAME or A/AAAA records found yet`:
   - Records are missing or still propagating.
2. `A/AAAA records do not match`:
   - Root records differ from expected values.
   - Proxy/CDN is enabled and masking origin IPs.
3. Attach blocked after failed verify:
   - Expected behavior; attach requires `domain_verified = true`.

## Support checklist

When debugging a customer issue, always collect:

1. Domain value customer entered
2. Verify response (`expectedTarget`, `expectedRecords`, `observedRecords`, `message`)
3. DNS provider and proxy status
4. Timestamp of last DNS change
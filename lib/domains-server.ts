import { resolve4, resolve6, resolveCname } from 'node:dns/promises';
import { getExpectedCustomDomainTarget, normalizeCustomDomain } from '@/lib/domains';

type DomainVerificationResult = {
  verified: boolean;
  expectedTarget: string;
  expectedRecords: string[];
  observedRecords: string[];
  reason: string;
};

export async function verifyCustomDomainDns(
  domain: string,
  slug: string,
): Promise<DomainVerificationResult> {
  const normalizedDomain = normalizeCustomDomain(domain);
  const expectedTarget = getExpectedCustomDomainTarget(slug);
  const normalizedExpectedTarget = normalizeCustomDomain(expectedTarget);
  let cnameObservedRecords: string[] = [];

  async function resolveIpSet(hostname: string): Promise<Set<string>> {
    const values = new Set<string>();

    try {
      const ipv4 = await resolve4(hostname);
      for (const record of ipv4) {
        values.add(record);
      }
    } catch {
      // Ignore missing A records.
    }

    try {
      const ipv6 = await resolve6(hostname);
      for (const record of ipv6) {
        values.add(record);
      }
    } catch {
      // Ignore missing AAAA records.
    }

    return values;
  }

  try {
    const cnameRecords = await resolveCname(normalizedDomain);
    const normalizedRecords = cnameRecords.map((record) => normalizeCustomDomain(record.replace(/\.$/, '')));
    cnameObservedRecords = normalizedRecords;
    const verified = normalizedRecords.includes(normalizedExpectedTarget);

    if (verified) {
      return {
        verified: true,
        expectedTarget,
        expectedRecords: [],
        observedRecords: normalizedRecords,
        reason: 'DNS CNAME is correctly configured.',
      };
    }
  } catch {
    // CNAME is optional for apex domains; continue with A/AAAA fallback.
  }

  const domainIps = await resolveIpSet(normalizedDomain);
  const targetIps = await resolveIpSet(normalizedExpectedTarget);
  const expectedRecords = Array.from(targetIps);
  const matchingIps = Array.from(domainIps).filter((ip) => targetIps.has(ip));

  if (matchingIps.length > 0) {
    return {
      verified: true,
      expectedTarget,
      expectedRecords,
      observedRecords: matchingIps,
      reason: 'DNS A/AAAA records are correctly configured for this target.',
    };
  }

  const observedRecords = cnameObservedRecords.length > 0 ? cnameObservedRecords : Array.from(domainIps);
  if (cnameObservedRecords.length > 0) {
    return {
      verified: false,
      expectedTarget,
      expectedRecords,
      observedRecords,
      reason: `DNS CNAME does not match ${expectedTarget}. Update your CNAME target and re-run verification.`,
    };
  }

  if (observedRecords.length > 0) {
    return {
      verified: false,
      expectedTarget,
      expectedRecords,
      observedRecords,
      reason:
        `DNS A/AAAA records do not match ${expectedTarget}. ` +
        'For apex domains, set root records to the expected target IPs and keep DNS proxy/CDN disabled while verifying.',
    };
  }

  return {
    verified: false,
    expectedTarget,
    expectedRecords,
    observedRecords,
    reason: 'No CNAME or A/AAAA records found yet. DNS may still be propagating.',
  };
}

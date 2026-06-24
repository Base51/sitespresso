import { resolveCname } from 'node:dns/promises';
import { getExpectedCustomDomainTarget, normalizeCustomDomain } from '@/lib/domains';

type DomainVerificationResult = {
  verified: boolean;
  expectedTarget: string;
  observedRecords: string[];
  reason: string;
};

export async function verifyCustomDomainDns(
  domain: string,
  slug: string,
): Promise<DomainVerificationResult> {
  const normalizedDomain = normalizeCustomDomain(domain);
  const expectedTarget = getExpectedCustomDomainTarget(slug);

  try {
    const cnameRecords = await resolveCname(normalizedDomain);
    const normalizedRecords = cnameRecords.map((record) => normalizeCustomDomain(record.replace(/\.$/, '')));
    const verified = normalizedRecords.includes(normalizeCustomDomain(expectedTarget));

    if (verified) {
      return {
        verified: true,
        expectedTarget,
        observedRecords: normalizedRecords,
        reason: 'DNS CNAME is correctly configured.',
      };
    }

    return {
      verified: false,
      expectedTarget,
      observedRecords: normalizedRecords,
      reason: `DNS CNAME does not match ${expectedTarget}.`,
    };
  } catch {
    return {
      verified: false,
      expectedTarget,
      observedRecords: [],
      reason: 'No CNAME record found yet. DNS may still be propagating.',
    };
  }
}

import type { Metadata } from 'next';
import LegalPageTemplate, { type LegalSection } from '../_components/LegalPageTemplate';

export const metadata: Metadata = {
  title: 'Refund Policy | SiteSpresso',
  description: 'How SiteSpresso handles refund requests for subscriptions and billing disputes.',
};

const sections: LegalSection[] = [
  {
    id: 'overview',
    title: 'Policy Overview',
    paragraphs: [
      'SiteSpresso subscriptions are billed in advance by billing cycle. Refund decisions are reviewed case-by-case within applicable law.',
      'This policy does not limit mandatory consumer rights that may apply in your jurisdiction.',
    ],
  },
  {
    id: 'eligible-cases',
    title: 'Potentially Eligible Cases',
    paragraphs: [
      'Examples of eligible review include duplicate charges, clearly unintended upgrades, or platform-wide technical incidents that materially prevented use.',
      'Refund requests should be submitted promptly with account email, invoice details, and issue description.',
    ],
  },
  {
    id: 'non-refundable',
    title: 'Typically Non-Refundable Cases',
    paragraphs: [
      'Partial-period non-use, preference changes, or issues outside SiteSpresso service control are generally not refundable unless required by law.',
      'If you cancel, your plan remains active until the end of the paid period unless stated otherwise.',
    ],
  },
  {
    id: 'request-process',
    title: 'Request Process',
    paragraphs: [
      'Send requests to legal@sitespresso.com from the account owner email and include transaction references.',
      'We aim to acknowledge requests quickly and provide a decision after reviewing account and billing records.',
    ],
  },
];

export default function RefundPolicyPage(): JSX.Element {
  return (
    <LegalPageTemplate
      title="Refund Policy"
      summary="This policy describes how SiteSpresso reviews and processes refund requests."
      lastUpdated="2026-08-11"
      sections={sections}
    />
  );
}
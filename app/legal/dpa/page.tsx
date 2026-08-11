import type { Metadata } from 'next';
import LegalPageTemplate, { type LegalSection } from '../_components/LegalPageTemplate';

export const metadata: Metadata = {
  title: 'Data Processing Addendum | SiteSpresso',
  description: 'Data Processing Addendum information and request process for SiteSpresso customers.',
};

const sections: LegalSection[] = [
  {
    id: 'purpose',
    title: 'Purpose and Applicability',
    paragraphs: [
      'The SiteSpresso Data Processing Addendum (DPA) defines data protection obligations for customers that require processor terms.',
      'The DPA is intended for customers processing personal data under laws that require data processing agreements.',
    ],
  },
  {
    id: 'roles',
    title: 'Roles and Responsibilities',
    paragraphs: [
      'In most use cases, the customer acts as controller for site content and user-submitted data, and SiteSpresso acts as processor for service delivery.',
      'Subprocessors are used for hosting, billing, storage, and selected AI infrastructure.',
    ],
  },
  {
    id: 'security',
    title: 'Security and Incident Handling',
    paragraphs: [
      'SiteSpresso applies technical and organizational measures designed to protect personal data and support secure operations.',
      'Security incidents are evaluated and handled according to internal response processes and contractual commitments.',
    ],
  },
  {
    id: 'request',
    title: 'How to Request a DPA',
    paragraphs: [
      'To request a DPA, contact legal@sitespresso.com with your account details and legal entity information.',
      'Our team will provide the current DPA template and next steps for review and signature.',
    ],
  },
];

export default function DpaPage(): JSX.Element {
  return (
    <LegalPageTemplate
      title="Data Processing Addendum (DPA)"
      summary="Enterprise and compliance-focused customers can request SiteSpresso data processing terms through this channel."
      lastUpdated="2026-08-11"
      sections={sections}
    />
  );
}
import type { Metadata } from 'next';
import LegalPageTemplate, { type LegalSection } from '../_components/LegalPageTemplate';

export const metadata: Metadata = {
  title: 'Contact and Imprint | SiteSpresso',
  description: 'Legal and support contact details for SiteSpresso.',
};

const sections: LegalSection[] = [
  {
    id: 'company',
    title: 'Company and Service Contact',
    paragraphs: [
      'SiteSpresso provides AI-assisted website generation and publishing tools for local businesses.',
      'For legal and compliance matters, contact legal@sitespresso.com. For product support, use support@sitespresso.com.',
    ],
  },
  {
    id: 'response',
    title: 'Support and Response Expectations',
    paragraphs: [
      'We review support and legal requests in the order received and aim to respond as quickly as practical.',
      'For account-specific requests, include your account email and relevant references so we can verify ownership and assist securely.',
    ],
  },
  {
    id: 'notices',
    title: 'Legal Notices',
    paragraphs: [
      'This page may be updated to include additional jurisdiction-specific disclosure items as SiteSpresso expands operations.',
      'Material legal updates are reflected in the last-updated timestamp on each legal page.',
    ],
  },
];

export default function ContactImprintPage(): JSX.Element {
  return (
    <LegalPageTemplate
      title="Contact and Imprint"
      summary="Use this page for legal notices, compliance requests, and service-related contact channels."
      lastUpdated="2026-08-11"
      sections={sections}
    />
  );
}
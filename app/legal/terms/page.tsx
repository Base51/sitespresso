import type { Metadata } from 'next';
import LegalPageTemplate, { type LegalSection } from '../_components/LegalPageTemplate';

export const metadata: Metadata = {
  title: 'Terms of Service | SiteSpresso',
  description: 'Terms governing the use of SiteSpresso products and services.',
};

const sections: LegalSection[] = [
  {
    id: 'eligibility',
    title: 'Eligibility and Accounts',
    paragraphs: [
      'You must provide accurate account information and keep your credentials secure.',
      'You are responsible for all activity under your account unless caused by unauthorized access outside your control.',
    ],
  },
  {
    id: 'service-use',
    title: 'Service Use and Restrictions',
    paragraphs: [
      'You may use SiteSpresso to create and manage websites for lawful business purposes.',
      'You may not use the service for illegal activity, deceptive practices, abusive automation, or content that violates applicable law.',
    ],
  },
  {
    id: 'ai-content',
    title: 'AI-Generated Content',
    paragraphs: [
      'SiteSpresso uses AI to assist with first-draft content generation. You remain responsible for reviewing and approving all published content.',
      'You should verify business facts, legal statements, and regulated claims before publishing.',
    ],
  },
  {
    id: 'billing',
    title: 'Billing and Subscriptions',
    paragraphs: [
      'Paid plans renew automatically unless canceled before the renewal date. Pricing, plan limits, and included features are shown at checkout.',
      'Payments are processed by Stripe according to Stripe terms and applicable payment regulations.',
    ],
  },
  {
    id: 'liability',
    title: 'Disclaimers and Liability',
    paragraphs: [
      'The service is provided on an as-is and as-available basis to the extent permitted by law.',
      'To the extent permitted by applicable law, SiteSpresso is not liable for indirect, incidental, or consequential damages arising from service use.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to Terms',
    paragraphs: [
      'We may update these Terms to reflect product, legal, or operational changes.',
      'Material updates will be announced through the website or your account communication channels.',
    ],
  },
];

export default function TermsPage(): JSX.Element {
  return (
    <LegalPageTemplate
      title="Terms of Service"
      summary="These Terms describe your rights and responsibilities when using SiteSpresso."
      lastUpdated="2026-08-11"
      sections={sections}
    />
  );
}
import type { Metadata } from 'next';
import LegalPageTemplate, { type LegalSection } from '../_components/LegalPageTemplate';

export const metadata: Metadata = {
  title: 'Privacy Policy | SiteSpresso',
  description: 'How SiteSpresso collects, uses, stores, and protects personal data.',
};

const sections: LegalSection[] = [
  {
    id: 'scope',
    title: 'Scope and Controller',
    paragraphs: [
      'This Privacy Policy explains how SiteSpresso processes personal information when you use our website and services.',
      'For privacy requests, contact legal@sitespresso.com. We will route your request to the appropriate team and respond within applicable legal timelines.',
    ],
  },
  {
    id: 'data-collected',
    title: 'Data We Collect',
    paragraphs: [
      'We collect account details, subscription and billing metadata, website-generation inputs, and product usage information needed to operate and secure the platform.',
      'Payment details are processed by Stripe. SiteSpresso does not store full card numbers.',
    ],
  },
  {
    id: 'use-of-data',
    title: 'How We Use Data',
    paragraphs: [
      'We use data to provide the service, manage subscriptions, improve generation quality, prevent abuse, and meet legal obligations.',
      'Where required, we rely on legal bases such as contract performance, legitimate interest, consent, and legal compliance.',
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing and Processors',
    paragraphs: [
      'We may share data with infrastructure and service providers such as Supabase, Stripe, Vercel, and AI providers, only as needed to deliver the service.',
      'We require processors to protect data through contractual and technical safeguards.',
    ],
  },
  {
    id: 'rights',
    title: 'Your Privacy Rights',
    paragraphs: [
      'Depending on your location, you may have rights to access, correct, delete, restrict, object, or request portability of your personal data.',
      'To submit a rights request, contact legal@sitespresso.com with enough information to verify your account ownership.',
    ],
  },
  {
    id: 'retention-security',
    title: 'Retention and Security',
    paragraphs: [
      'We retain personal information only for as long as necessary for service delivery, legitimate business needs, and legal obligations.',
      'We use technical and organizational safeguards designed to protect data from unauthorized access, alteration, disclosure, or destruction.',
    ],
  },
];

export default function PrivacyPolicyPage(): JSX.Element {
  return (
    <LegalPageTemplate
      title="Privacy Policy"
      summary="This Privacy Policy outlines how SiteSpresso handles personal information across account, billing, analytics, and AI-generation workflows."
      lastUpdated="2026-08-11"
      sections={sections}
    />
  );
}
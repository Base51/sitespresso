import type { Metadata } from 'next';
import LegalPageTemplate, { type LegalSection } from '../_components/LegalPageTemplate';

export const metadata: Metadata = {
  title: 'Cookie Policy | SiteSpresso',
  description: 'How SiteSpresso uses cookies and similar technologies.',
};

const sections: LegalSection[] = [
  {
    id: 'what-are-cookies',
    title: 'What Are Cookies',
    paragraphs: [
      'Cookies are small text files stored on your device to help websites operate, remember preferences, and understand usage patterns.',
      'SiteSpresso may also use related technologies for session handling and performance monitoring.',
    ],
  },
  {
    id: 'cookie-categories',
    title: 'Cookie Categories We Use',
    paragraphs: [
      'Strictly Necessary: required for authentication, security, and core functionality.',
      'Analytics: used to understand product performance and improve reliability and experience.',
    ],
  },
  {
    id: 'third-party',
    title: 'Third-Party Services',
    paragraphs: [
      'Some cookies may be set by integrated services such as hosting, billing, analytics, and authentication providers.',
      'These providers process data according to their own privacy documentation and contractual commitments with SiteSpresso.',
    ],
  },
  {
    id: 'manage-cookies',
    title: 'How to Manage Cookies',
    paragraphs: [
      'Most browsers allow you to control cookies through settings, including blocking or deleting specific cookie types.',
      'Disabling strictly necessary cookies may prevent sign-in and other essential product features from working correctly.',
    ],
  },
];

export default function CookiePolicyPage(): JSX.Element {
  return (
    <LegalPageTemplate
      title="Cookie Policy"
      summary="This policy explains the categories of cookies and related technologies used by SiteSpresso."
      lastUpdated="2026-08-11"
      sections={sections}
    />
  );
}
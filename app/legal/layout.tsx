import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s — TaxProExchange',
    default: 'Legal — TaxProExchange',
  },
  description: 'Legal documents for TaxProExchange - Terms of Use and Privacy Policy for our professional networking platform.',
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import { Metadata } from 'next';
import SearchPageClient from './SearchPageClient';

export const metadata: Metadata = {
  title: 'Search Verified CPAs, EAs, and Tax Preparers | TaxProExchange',
  description: 'Find verified tax professionals by credential, state, and specialization.',
  alternates: { canonical: 'https://www.taxproexchange.com/search' }
};

export default function SearchPage() {
  return <SearchPageClient />;
}

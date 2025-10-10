import { NextResponse } from 'next/server';

/**
 * Security.txt endpoint
 * https://securitytxt.org/
 */
export async function GET() {
  const securityTxt = `Contact: mailto:koen@cardifftax.com
Policy: https://www.taxproexchange.com/trust
Preferred-Languages: en
`;

  return new NextResponse(securityTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}


import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PUBLIC_FIELDS = [
  'id', 'state', 'years_established',
  'annual_revenue_min', 'annual_revenue_max',
  'client_count_min', 'client_count_max',
  'revenue_pct_tax', 'revenue_pct_bookkeeping', 'revenue_pct_advisory',
  'staff_count', 'specialties', 'software_stack',
  'asking_price_min', 'asking_price_max',
  'reason_for_sale', 'remote_friendly', 'seller_financing',
  'additional_notes', 'created_at'
];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let hasBuyerAccess = false;
  if (user) {
    const { data: access } = await supabase
      .from('practice_buyer_access')
      .select('access_end, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('access_end', new Date().toISOString())
      .single();
    hasBuyerAccess = !!access;
  }

  const fields = hasBuyerAccess ? '*' : PUBLIC_FIELDS.join(', ');

  const { data, error } = await supabase
    .from('practice_listings')
    .select(fields)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (hasBuyerAccess && user) {
    await supabase.from('practice_listing_views').insert({
      listing_id: id,
      viewer_user_id: user.id
    });
  }

  return NextResponse.json({ listing: data, hasAccess: hasBuyerAccess });
}

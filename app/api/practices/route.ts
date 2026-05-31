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

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('practice_listings')
    .select(PUBLIC_FIELDS.join(', '))
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ listings: data || [] });
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from('practice_listings')
    .insert({
      ...body,
      seller_user_id: user.id,
      status: 'pending'
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ id: data.id });
}

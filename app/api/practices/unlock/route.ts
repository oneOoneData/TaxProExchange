import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { listingId, message } = await req.json();

  // Check buyer access
  const { data: access } = await supabase
    .from('practice_buyer_access')
    .select('access_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('access_end', new Date().toISOString())
    .single();

  if (!access) return NextResponse.json({ error: 'Buyer access required' }, { status: 403 });

  // Get seller info
  const { data: listing } = await supabase
    .from('practice_listings')
    .select('seller_name, firm_name, email')
    .eq('id', listingId)
    .single();

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Get buyer info
  const { data: buyerProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .single();

  // Send email to seller via Resend
  const resendPayload = {
    from: 'TaxProExchange <support@taxproexchange.com>',
    to: listing.email,
    subject: `Someone is interested in your practice — ${listing.firm_name}`,
    html: `<p>Hi ${listing.seller_name},</p>
<p>A verified buyer on TaxProExchange is interested in your practice.</p>
<p><strong>Buyer:</strong> ${buyerProfile?.first_name} ${buyerProfile?.last_name || 'A verified buyer'}</p>
${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
<p>Reply to this email to continue the conversation directly.</p>
<p>— TaxProExchange</p>`
  };

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });
  } catch (e) {
    console.error('Failed to send seller email:', e);
  }

  return NextResponse.json({ success: true });
}

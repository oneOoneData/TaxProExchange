import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const { email, name } = body;

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'support@taxproexchange.com';

  try {
    // Notify admin of new subscriber
    await resend.emails.send({
      from: 'TaxProExchange <noreply@taxproexchange.com>',
      to: adminEmail,
      subject: `New Insights subscriber: ${email}`,
      html: `<p>New newsletter subscriber from /insights:</p><p><strong>Email:</strong> ${email}${name ? `<br><strong>Name:</strong> ${name}` : ''}</p>`,
    });

    // Send welcome email to subscriber
    await resend.emails.send({
      from: 'TaxProExchange Insights <noreply@taxproexchange.com>',
      to: email,
      subject: "You're subscribed to TaxProExchange Insights",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#0f172a">Welcome to TaxProExchange Insights${name ? `, ${name}` : ''}!</h2>
          <p style="color:#475569">You'll receive our latest articles on AI in tax, industry trends, and tools for CPAs and EAs — straight to your inbox.</p>
          <p style="color:#475569">In the meantime, browse what's already published:</p>
          <a href="https://www.taxproexchange.com/insights" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Read the latest →
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px">
            You can unsubscribe at any time by replying "unsubscribe" to this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

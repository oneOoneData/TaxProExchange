import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, firmName, message } = body;

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'support@taxproexchange.com';

  try {
    await resend.emails.send({
      from: 'TaxProExchange <noreply@taxproexchange.com>',
      to: adminEmail,
      replyTo: email,
      subject: `Demo Request: ${firmName || name}`,
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${firmName ? `<p><strong>Firm:</strong> ${firmName}</p>` : ''}
        ${message ? `<p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>` : ''}
        <hr>
        <p style="color:#666;font-size:12px">Reply directly to this email to respond to ${name}.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demo contact email error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

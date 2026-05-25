import { NextRequest, NextResponse } from 'next/server';

// Sends a Pushover notification to the owner's phone.
// Used by the autonomous agent to request approval or report status.
// Protected by AGENT_SECRET env var.
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-agent-secret');
  if (secret !== process.env.AGENT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, message, url } = await request.json();

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message required' }, { status: 400 });
  }

  const pushoverToken = process.env.PUSHOVER_APP_TOKEN;
  const pushoverUser = process.env.PUSHOVER_USER_KEY;

  if (!pushoverToken || !pushoverUser) {
    // Gracefully degrade — log but don't fail
    console.log('[Agent notify] Pushover not configured. Message:', title, message);
    return NextResponse.json({ success: true, channel: 'console' });
  }

  const body: Record<string, string> = {
    token: pushoverToken,
    user: pushoverUser,
    title: `[TaxProExchange] ${title}`,
    message,
    priority: '0',
  };

  if (url) {
    body.url = url;
    body.url_title = 'View PR / Details';
  }

  const res = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Pushover error:', err);
    return NextResponse.json({ error: 'Pushover delivery failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, channel: 'pushover' });
}

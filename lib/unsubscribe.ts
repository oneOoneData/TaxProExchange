import { createHmac } from 'crypto';

export function signUnsubscribeToken(profileId: string): string {
  return createHmac('sha256', (() => { const s = process.env.WEBHOOK_SECRET; if (!s) throw new Error('WEBHOOK_SECRET is not set'); return s; })())
    .update(`unsub:${profileId}`)
    .digest('hex');
}

export function generateUnsubscribeUrl(profileId: string, type = 'marketing'): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';
  const token = signUnsubscribeToken(profileId);
  return `${appUrl}/api/unsubscribe?pid=${profileId}&token=${token}&type=${type}`;
}


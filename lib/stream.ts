// lib/stream.ts
import { StreamChat } from 'stream-chat';

export function getServerStreamClient() {
  const key = process.env.STREAM_KEY!;
  const secret = process.env.STREAM_SECRET!;
  if (!key || !secret) throw new Error('Missing Stream env vars');
  return StreamChat.getInstance(key, secret);
}

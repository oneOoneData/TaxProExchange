import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerTaxProTools } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const handler = createMcpHandler((server) => registerTaxProTools(server), {
  serverInfo: { name: 'taxproexchange', version: '1.0.0' },
});

// Bearer-token gate: the token in MCP_ACCESS_TOKEN is the single credential.
// Mirrors the x-agent-secret / AGENT_SECRET convention used elsewhere in the app.
const authedHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    const expected = process.env.MCP_ACCESS_TOKEN?.replace(/^﻿/, '').trim();
    if (!expected || bearerToken !== expected) return undefined;
    return { token: bearerToken, clientId: 'owner', scopes: [] };
  },
  { required: true }
);

export { authedHandler as GET, authedHandler as POST };

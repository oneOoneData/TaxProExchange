import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { verifyClerkToken } from '@clerk/mcp-tools/next';
import { auth } from '@clerk/nextjs/server';
import { registerTaxProTools } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const handler = createMcpHandler((server) => registerTaxProTools(server), {
  serverInfo: { name: 'taxproexchange', version: '1.0.0' },
});

// Two credential paths: the static MCP_ACCESS_TOKEN (Claude Code / Claude
// Desktop, configured manually — mirrors the x-agent-secret / AGENT_SECRET
// convention used elsewhere in the app) and Clerk-issued OAuth tokens (the
// claude.ai Connectors UI, which discovers the OAuth server via the
// .well-known metadata routes and does a real DCR + authorize + token flow).
const authedHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    const expected = process.env.MCP_ACCESS_TOKEN?.replace(/^﻿/, '').trim();
    if (expected && bearerToken === expected) {
      return { token: bearerToken, clientId: 'owner', scopes: [] };
    }
    const clerkAuth = await auth({ acceptsToken: 'oauth_token' });
    return verifyClerkToken(clerkAuth, bearerToken);
  },
  {
    required: true,
    resourceMetadataPath: '/.well-known/oauth-protected-resource/api/mcp',
  }
);

export { authedHandler as GET, authedHandler as POST };

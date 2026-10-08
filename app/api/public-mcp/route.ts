import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { registerPublicMcpTools } from '@/lib/publicMcp/tools';
import { authenticatePublicMcpRequest } from '@/lib/publicMcp/auth';
import { FEATURE_PUBLIC_MCP } from '@/lib/flags';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ---------------------------------------------------------------------------
// SEPARATE SURFACE from the internal/admin MCP server (app/api/mcp/route.ts,
// lib/mcp/tools.ts). This route shares NO code, NO auth logic, and NO
// handler instance with that one. It is read-only, PII-safe, and gated by
// a per-firm API key validated live against subscription status on every
// request -- see dev-public-mcp-server-2026-10.
// ---------------------------------------------------------------------------

const handler = createMcpHandler((server) => registerPublicMcpTools(server), {
  serverInfo: { name: 'taxproexchange-public', version: '1.0.0' },
});

const authedHandler = withMcpAuth(
  handler,
  async (_req, bearerToken) => {
    const firm = await authenticatePublicMcpRequest(bearerToken);
    if (!firm) return undefined;
    // AuthInfo.extra is how per-request data reaches each tool call's ctx
    // (see lib/publicMcp/tools.ts for why -- mcp-handler's initializeServer
    // doesn't get authInfo, only the per-call tool ctx does).
    return {
      token: bearerToken!,
      clientId: firm.firmId,
      scopes: [],
      extra: { firmId: firm.firmId, apiKeyId: firm.apiKeyId, firmName: firm.firmName },
    };
  },
  { required: true }
);

function gatedHandler(req: Request) {
  if (!FEATURE_PUBLIC_MCP) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return authedHandler(req);
}

export { gatedHandler as GET, gatedHandler as POST };

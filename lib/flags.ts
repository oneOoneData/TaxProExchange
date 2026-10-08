/**
 * Feature Flags
 * 
 * Centralized feature flag configuration for gradual rollouts and A/B testing.
 * Set via environment variables (NEXT_PUBLIC_* for client-side access).
 */

// Firm workspaces are now live for all users
export const FEATURE_FIRM_WORKSPACES = true;

// Public read-only MCP server for paid firms ("Ask your AI to find a tax pro").
// Ship dark behind this flag for a quiet beta to existing paid firms first;
// flip to true (or gate by env var) once adoption is worth a public push.
// See dev-public-mcp-server-2026-10.
export const FEATURE_PUBLIC_MCP = process.env.NEXT_PUBLIC_FEATURE_PUBLIC_MCP === 'true';



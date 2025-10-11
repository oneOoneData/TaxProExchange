/**
 * Feature Flags
 * 
 * Centralized feature flag configuration for gradual rollouts and A/B testing.
 * Set via environment variables (NEXT_PUBLIC_* for client-side access).
 */

export const FEATURE_FIRM_WORKSPACES =
  process.env.NEXT_PUBLIC_FEATURE_FIRM_WORKSPACES === 'true';


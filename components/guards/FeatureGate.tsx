/**
 * FeatureGate Component
 * 
 * Conditionally renders children based on feature flag status.
 * When flag is off, renders nothing (null).
 */

import { FEATURE_FIRM_WORKSPACES } from '@/lib/flags';

interface FeatureGateProps {
  children: React.ReactNode;
  feature?: 'firm_workspaces';
}

export default function FeatureGate({ 
  children, 
  feature = 'firm_workspaces' 
}: FeatureGateProps) {
  // Map feature names to flag values
  const featureFlags = {
    firm_workspaces: FEATURE_FIRM_WORKSPACES,
  };

  const isEnabled = featureFlags[feature];

  if (!isEnabled) return null;

  return <>{children}</>;
}





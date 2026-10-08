/**
 * Public MCP API key management for a firm.
 *
 * GET    -- status only (prefix, created_at, last_used_at). Never the full key.
 * POST   -- generate a new key, revoking any existing active one first (one
 *           active key per firm, per spec). Returns the plaintext ONCE.
 * DELETE -- revoke the active key.
 *
 * Paid-firms-only: gated on firm-admin membership AND an active/trialing
 * subscription, same check already used for the Stripe customer-portal
 * link in app/(firm)/team/settings/page.tsx.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase/server';
import { FEATURE_FIRM_WORKSPACES, FEATURE_PUBLIC_MCP } from '@/lib/flags';
import { resolveProfileId } from '@/lib/authz';
import { generateApiKey } from '@/lib/publicMcp/auth';

const PAYING_STATUSES = ['active', 'trialing'];

async function requireFirmAdmin(firmId: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const supabase = createServerClient();
  const profileId = await resolveProfileId(userId);
  if (!profileId) return { error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) };

  const { data: membership } = await supabase
    .from('firm_members')
    .select('role')
    .eq('firm_id', firmId)
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .maybeSingle();

  if (!membership || membership.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Only firm admins can manage the AI assistant key' }, { status: 403 }) };
  }

  const { data: firm } = await supabase
    .from('firms')
    .select('subscription_status')
    .eq('id', firmId)
    .maybeSingle();

  if (!firm || !PAYING_STATUSES.includes(firm.subscription_status)) {
    return { error: NextResponse.json({ error: 'An active firm subscription is required' }, { status: 403 }) };
  }

  return { supabase, profileId };
}

function featureGate() {
  if (!FEATURE_FIRM_WORKSPACES || !FEATURE_PUBLIC_MCP) {
    return NextResponse.json({ error: 'Feature not available' }, { status: 404 });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = featureGate();
  if (gate) return gate;

  const { id: firmId } = await params;
  const authResult = await requireFirmAdmin(firmId);
  if (authResult.error) return authResult.error;
  const { supabase } = authResult;

  const { data: key } = await supabase
    .from('firm_api_keys')
    .select('key_prefix, created_at, last_used_at')
    .eq('firm_id', firmId)
    .is('revoked_at', null)
    .maybeSingle();

  return NextResponse.json({ hasKey: !!key, key: key || null });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = featureGate();
  if (gate) return gate;

  const { id: firmId } = await params;
  const authResult = await requireFirmAdmin(firmId);
  if (authResult.error) return authResult.error;
  const { supabase, profileId } = authResult;

  // Revoke any existing active key first -- one active key per firm (MVP).
  await supabase
    .from('firm_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .is('revoked_at', null);

  const { plaintext, hash, prefix } = generateApiKey();

  const { error } = await supabase.from('firm_api_keys').insert({
    firm_id: firmId,
    key_hash: hash,
    key_prefix: prefix,
    created_by_profile_id: profileId,
  });

  if (error) {
    console.error('Error creating firm API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }

  // Shown exactly once -- never retrievable again after this response.
  return NextResponse.json({ apiKey: plaintext, prefix });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = featureGate();
  if (gate) return gate;

  const { id: firmId } = await params;
  const authResult = await requireFirmAdmin(firmId);
  if (authResult.error) return authResult.error;
  const { supabase } = authResult;

  const { error } = await supabase
    .from('firm_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .is('revoked_at', null);

  if (error) {
    console.error('Error revoking firm API key:', error);
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

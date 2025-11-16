/**
 * Anti-spam utilities for form submissions and API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { containsIllegalUrls } from './seo';
import { supabaseService } from './supabaseService';

/**
 * Honeypot field name - should be hidden via CSS in forms
 */
export const HONEYPOT_FIELD_NAME = 'website_url_verification';

/**
 * Check if request contains honeypot field filled in
 */
export function checkHoneypot(body: Record<string, any>): boolean {
  const honeypotValue = body[HONEYPOT_FIELD_NAME];
  // If honeypot is filled in, it's likely a bot
  return !!honeypotValue && honeypotValue.trim().length > 0;
}

/**
 * Validate text fields don't contain URLs where they shouldn't
 */
export function validateNoUrlsInTextFields(fields: Record<string, any>): {
  valid: boolean;
  field?: string;
} {
  // Fields that should NOT contain URLs
  const textOnlyFields = ['name', 'title', 'firm', 'message', 'description', 'organizer', 'topic'];
  
  for (const field of textOnlyFields) {
    if (fields[field] && containsIllegalUrls(fields[field])) {
      return { valid: false, field };
    }
  }
  
  return { valid: true };
}

/**
 * Rate limiting check using in-memory store (simple implementation)
 * For production, consider using Redis or Vercel's rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean expired entries
  if (record && record.resetTime < now) {
    rateLimitStore.delete(identifier);
  }

  const currentRecord = rateLimitStore.get(identifier);

  if (!currentRecord) {
    // First request, create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Increment counter
  currentRecord.count++;

  const remaining = Math.max(0, maxRequests - currentRecord.count);
  const allowed = remaining > 0;

  return {
    allowed,
    remaining,
    resetAt: currentRecord.resetTime,
  };
}

/**
 * Get client IP from request
 */
export function getClientIp(req: NextRequest): string {
  // Try various headers for IP (Vercel, Cloudflare, etc.)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}

/**
 * Comprehensive spam check middleware
 */
export async function performSpamCheck(
  req: NextRequest,
  body: Record<string, any>
): Promise<{ isSpam: boolean; reason?: string }> {
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent');
  const endpoint = req.nextUrl.pathname;

  // 1. Check honeypot
  if (checkHoneypot(body)) {
    await logSpamActivity(ip, endpoint, 'Honeypot field filled', userAgent, body);
    return { isSpam: true, reason: 'Honeypot field filled' };
  }

  // 2. Check for URLs in text fields
  const urlCheck = validateNoUrlsInTextFields(body);
  if (!urlCheck.valid) {
    await logSpamActivity(ip, endpoint, `URL found in ${urlCheck.field} field`, userAgent, body);
    return { isSpam: true, reason: `URL found in ${urlCheck.field} field` };
  }

  // 3. Rate limiting
  const rateLimit = checkRateLimit(ip, 10, 15 * 60 * 1000); // 10 requests per 15 minutes
  if (!rateLimit.allowed) {
    await logSpamActivity(ip, endpoint, 'Rate limit exceeded', userAgent, body);
    return { isSpam: true, reason: 'Rate limit exceeded' };
  }

  return { isSpam: false };
}

/**
 * Create error response for spam detection
 */
export function createSpamResponse(reason: string): NextResponse {
  return NextResponse.json(
    { error: 'Submission rejected for security reasons' },
    { status: 429 }
  );
}

/**
 * Log spam activity to database for monitoring
 */
export async function logSpamActivity(
  ip: string,
  endpoint: string,
  reason: string,
  userAgent: string | null = null,
  sanitizedBody: Record<string, any> = {}
): Promise<void> {
  try {
    const supabase = supabaseService();
    
    // Remove sensitive data from request body before logging
    const sanitizedRequestBody: Record<string, any> = {};
    const allowedFields = ['title', 'name', 'email', 'firm', 'topic'];
    for (const field of allowedFields) {
      if (sanitizedBody[field]) {
        sanitizedRequestBody[field] = sanitizedBody[field];
      }
    }
    
    await supabase.from('spam_activity').insert({
      ip_address: ip,
      endpoint,
      reason,
      user_agent: userAgent,
      request_body: sanitizedRequestBody,
    });
  } catch (error) {
    // Silently fail spam logging - don't break the flow
    console.error('Failed to log spam activity:', error);
  }
}


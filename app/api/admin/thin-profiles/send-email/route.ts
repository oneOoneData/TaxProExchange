import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables not configured');
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const SKIP_IF_EMAILED_WITHIN_DAYS = 30;

function wasRecentlyEmailed(emailedAt: string | null): boolean {
  if (!emailedAt) return false;
  const daysSince = (Date.now() - new Date(emailedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSince < SKIP_IF_EMAILED_WITHIN_DAYS;
}

// Email template for profile optimization
function generateProfileOptimizationEmail(data: {
  firstName: string;
  currentWordCount: number;
  credentialType: string;
  profileEditUrl: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';

  const exampleBios: Record<string, string> = {
    'CPA': `"15 years specializing in S-Corporation taxation and multi-state SALT compliance. I help small businesses navigate complex situations and take on overflow work during peak season — second reviews, partnership returns, and entity structuring. Licensed in CA, TX, and NV."`,
    'EA': `"Enrolled Agent with deep IRS representation experience. I assist practitioners with audit defense, offer in compromise cases, and collection matters. Available for consultation and collaborative engagements year-round — especially during exam season."`,
    'CTEC': `"CTEC-certified preparer specializing in individual returns, crypto reporting, and rental property. Proficient in Drake and QuickBooks. Looking for overflow partnerships during tax season — fast turnaround, clean workpapers."`,
  };

  const exampleBio = exampleBios[data.credentialType] || exampleBios['CPA'];
  const subject = `Your TaxProExchange profile is missing something`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 580px; margin: 0 auto; padding: 32px 20px;">

        <p style="margin: 0 0 24px 0; font-size: 15px;">Hi ${data.firstName},</p>

        <p style="margin: 0 0 16px 0; font-size: 15px;">
          Other professionals on TaxProExchange are searching for help — and your profile comes up. But right now it's pretty thin, which means most of them move on before reaching out.
        </p>

        <p style="margin: 0 0 24px 0; font-size: 15px;">
          Your profile has about <strong>${data.currentWordCount} words</strong>. Profiles with a solid bio and listed specializations show up higher in search and get significantly more contact requests. It takes about 5 minutes to fix.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin: 0 0 28px 0;">
          <p style="margin: 0 0 12px 0; font-weight: 600; font-size: 14px; color: #475569; text-transform: uppercase; letter-spacing: 0.05em;">Three things that make the biggest difference:</p>
          <ol style="margin: 0; padding-left: 20px; color: #334155;">
            <li style="margin: 10px 0; font-size: 15px;"><strong>A bio (75–150 words)</strong> — what you specialize in, who you work with, what you're looking for</li>
            <li style="margin: 10px 0; font-size: 15px;"><strong>Your specializations</strong> — S-Corp, SALT, crypto, trusts, IRS rep, K-1s, etc.</li>
            <li style="margin: 10px 0; font-size: 15px;"><strong>Your software</strong> — Lacerte, Drake, ProSeries, QuickBooks, etc.</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 0 0 32px 0;">
          <a href="${data.profileEditUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Update my profile →
          </a>
        </div>

        <div style="border-left: 3px solid #cbd5e1; padding-left: 16px; margin: 0 0 28px 0;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Example bio for ${data.credentialType}s</p>
          <p style="margin: 0; font-size: 14px; color: #475569; font-style: italic; line-height: 1.7;">
            ${exampleBio}
          </p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; margin: 0 0 32px 0;">
          <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #166534;">Don't want to write it yourself?</p>
          <p style="margin: 0; font-size: 14px; color: #166534;">
            Reply to this email with 3 bullet points — your specializations, who you work with, and years of experience. I'll write a full bio and send it back for you to approve.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #94a3b8;">
          <p style="margin: 0 0 8px 0;">Koen<br>TaxProExchange</p>
          <p style="margin: 0;">
            You're receiving this because your profile is live on TaxProExchange.
            <a href="${appUrl}/settings" style="color: #64748b;">Manage preferences</a>
          </p>
        </div>

      </body>
    </html>
  `;

  const text = `
Hi ${data.firstName},

Other professionals on TaxProExchange are searching for help — and your profile comes up. But right now it's pretty thin, which means most of them move on before reaching out.

Your profile has about ${data.currentWordCount} words. Profiles with a solid bio and listed specializations show up higher in search and get significantly more contact requests. It takes about 5 minutes to fix.

Three things that make the biggest difference:
1. A bio (75–150 words) — what you specialize in, who you work with, what you're looking for
2. Your specializations — S-Corp, SALT, crypto, trusts, IRS rep, K-1s, etc.
3. Your software — Lacerte, Drake, ProSeries, QuickBooks, etc.

Update your profile: ${data.profileEditUrl}

Example bio for ${data.credentialType}s:
${exampleBio.replace(/"/g, '')}

Don't want to write it yourself? Reply with 3 bullet points — your specializations, who you work with, and years of experience. I'll write a full bio and send it back for you to approve.

Koen
TaxProExchange

---
Manage preferences: ${appUrl}/settings
  `;

  return { subject, html, text };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin status
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('clerk_id', userId)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { profileIds, sendToAll } = body;

    if (!profileIds && !sendToAll) {
      return NextResponse.json(
        { error: 'Must specify profileIds or sendToAll' },
        { status: 400 }
      );
    }

    // Fetch target profiles
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, public_email, credential_type, slug, bio, headline, opportunities, specializations, states, profile_optimization_emailed_at')
      .eq('is_listed', true)
      .eq('visibility_state', 'verified');

    if (!sendToAll && profileIds) {
      query = query.in('id', profileIds);
    }

    const { data: profiles, error } = await query;

    if (error || !profiles) {
      console.error('Error fetching profiles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Send emails with rate limiting
    const results = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';

    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      
      // Calculate word count
      const wordCount = 
        (profile.first_name?.split(' ').length || 0) +
        (profile.last_name?.split(' ').length || 0) +
        (profile.credential_type?.split(' ').length || 0) +
        (profile.headline?.split(' ').filter((w: string) => w).length || 0) +
        (profile.bio?.split(' ').filter((w: string) => w).length || 0) +
        (profile.opportunities?.split(' ').filter((w: string) => w).length || 0) +
        ((profile.specializations as string[] || []).length * 2) +
        ((profile.states as string[] || []).length);

      // Skip if already has good content
      if (wordCount >= 120 && (profile.bio?.split(' ').length || 0) >= 50) {
        results.push({ success: false, email: profile.public_email, reason: 'Profile already has sufficient content', profile_id: profile.id });
        continue;
      }

      // Skip if emailed within the last 30 days
      if (wasRecentlyEmailed(profile.profile_optimization_emailed_at)) {
        results.push({ success: false, email: profile.public_email, reason: `Already emailed within ${SKIP_IF_EMAILED_WITHIN_DAYS} days`, profile_id: profile.id, last_emailed: profile.profile_optimization_emailed_at });
        continue;
      }

      try {
        const emailContent = generateProfileOptimizationEmail({
          firstName: profile.first_name,
          currentWordCount: wordCount,
          credentialType: profile.credential_type,
          profileEditUrl: `${appUrl}/profile/edit`,
        });

        await sendEmail({
          to: profile.public_email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        // Stamp the profile with the send time
        await supabase
          .from('profiles')
          .update({ profile_optimization_emailed_at: new Date().toISOString() })
          .eq('id', profile.id)
          .catch((err: unknown) => console.error('Failed to stamp email timestamp:', err));

        results.push({
          success: true,
          email: profile.public_email,
          profile_id: profile.id,
          word_count: wordCount
        });

        // Rate limiting: 500ms between emails (2 emails/sec limit for Resend)
        if (i < profiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to send email to ${profile.public_email}:`, error);
        results.push({ 
          success: false, 
          email: profile.public_email, 
          error: error instanceof Error ? error.message : 'Unknown error',
          profile_id: profile.id
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      total: results.length,
      sent: successCount,
      failed: failureCount,
      results,
    });

  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



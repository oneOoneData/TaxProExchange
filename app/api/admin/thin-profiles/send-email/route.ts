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

// Email template for profile optimization
function generateProfileOptimizationEmail(data: {
  firstName: string;
  currentWordCount: number;
  credentialType: string;
  profileEditUrl: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';
  
  // Credential-specific example bios
  const exampleBios: Record<string, string> = {
    'CPA': `"With 15 years of experience specializing in S-Corporation taxation and multi-state SALT compliance, I help small businesses navigate complex tax situations. My practice focuses on overflow support during peak season and second reviews for partnership returns. Licensed in CA, TX, and NV."`,
    'EA': `"As an Enrolled Agent with IRS representation experience, I assist practitioners with audit defense, offer in compromise cases, and collection matters. Available for consultation and collaborative engagements year-round."`,
    'CTEC': `"CTEC-certified tax preparer specializing in individual returns, cryptocurrency reporting, and rental property taxation. Proficient in Drake Tax and QuickBooks. Seeking overflow opportunities during tax season."`,
  };

  const exampleBio = exampleBios[data.credentialType] || exampleBios['CPA'];

  const subject = `📊 Make your TaxProExchange profile work harder for you`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Optimize Your Profile</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">📊 Optimize Your Profile</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #2d3748; margin-top: 0; font-size: 20px;">Hi ${data.firstName}!</h2>
          
          <p style="color: #4a5568; margin: 15px 0;">
            I noticed your TaxProExchange profile could use a quick update to help potential clients and collaborators find you more easily.
          </p>

          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Your profile currently has about ${data.currentWordCount} words.</strong> Adding just 50-100 more words could significantly boost your visibility.
            </p>
          </div>

          <h3 style="color: #2d3748; margin: 25px 0 15px 0; font-size: 18px;">Here's why it matters:</h3>
          
          <ul style="color: #4a5568; margin: 10px 0; padding-left: 25px;">
            <li style="margin: 8px 0;">✓ Complete profiles rank <strong>higher in our search results</strong></li>
            <li style="margin: 8px 0;">✓ Profiles with detailed bios get <strong>3x more views</strong></li>
            <li style="margin: 8px 0;">✓ Google indexes profiles with &gt;150 words more favorably</li>
            <li style="margin: 8px 0;">✓ Clients trust professionals with comprehensive profiles</li>
          </ul>
        </div>

        <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid #e2e8f0; margin-bottom: 25px;">
          <h3 style="color: #2d3748; margin-top: 0; font-size: 18px;">🚀 Quick Wins (5 minutes):</h3>
          
          <ol style="color: #4a5568; margin: 10px 0; padding-left: 25px;">
            <li style="margin: 12px 0;">
              <strong>Add a professional bio (75-150 words)</strong><br>
              <span style="font-size: 14px; color: #718096;">Tell your story: What makes you different? What do you specialize in?</span>
            </li>
            <li style="margin: 12px 0;">
              <strong>List your specializations</strong><br>
              <span style="font-size: 14px; color: #718096;">S-Corp, SALT, crypto, trusts, K-1s, IRS rep, etc.</span>
            </li>
            <li style="margin: 12px 0;">
              <strong>Add software proficiencies</strong><br>
              <span style="font-size: 14px; color: #718096;">Lacerte, Drake, ProSeries, QuickBooks, etc.</span>
            </li>
            <li style="margin: 12px 0;">
              <strong>Upload a professional photo</strong><br>
              <span style="font-size: 14px; color: #718096;">Profiles with photos get 5x more connection requests</span>
            </li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.profileEditUrl}" style="display: inline-block; background: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
            Update My Profile →
          </a>
        </div>

        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 30px 0;">
          <h3 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 16px;">📝 Example Bio for ${data.credentialType}s:</h3>
          <p style="margin: 0; color: #0c4a6e; font-size: 14px; font-style: italic; line-height: 1.6;">
            ${exampleBio}
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 16px;">💡 Pro Tips:</h3>
          <ul style="color: #4a5568; font-size: 14px; margin: 5px 0; padding-left: 20px;">
            <li style="margin: 6px 0;">Be specific about what you do (not just "tax professional")</li>
            <li style="margin: 6px 0;">Mention the types of clients you work with</li>
            <li style="margin: 6px 0;">List 3-5 key specializations you want to be found for</li>
            <li style="margin: 6px 0;">Keep it professional but let your personality show</li>
          </ul>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096;">
          <p><strong>Need help?</strong> Reply to this email with 3 bullet points about yourself and I'll draft a professional bio for you.</p>
          <p style="margin: 15px 0 5px 0;"><strong>Example bullets:</strong></p>
          <ul style="margin: 5px 0; padding-left: 20px; color: #718096; font-size: 13px;">
            <li>S-Corp and partnership taxation</li>
            <li>Work with tech startups and small businesses</li>
            <li>12 years experience, licensed in CA and NV</li>
          </ul>
          <p style="margin-top: 15px;">That's it! I'll write a bio for you and send it back for approval.</p>
          
          <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p>Best regards,<br>The TaxProExchange Team</p>
            <p style="font-size: 12px; color: #94a3b8;">
              You're receiving this because your profile is live on TaxProExchange. 
              <a href="${appUrl}/settings" style="color: #667eea; text-decoration: none;">Manage email preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Optimize Your TaxProExchange Profile

Hi ${data.firstName}!

I noticed your TaxProExchange profile could use a quick update to help potential clients and collaborators find you more easily.

YOUR PROFILE: ${data.currentWordCount} words
TARGET: 150+ words for better visibility

Here's why it matters:
✓ Complete profiles rank higher in our search results
✓ Profiles with detailed bios get 3x more views
✓ Google indexes profiles with >150 words more favorably
✓ Clients trust professionals with comprehensive profiles

QUICK WINS (5 minutes):
1. Add a professional bio (75-150 words)
2. List your specializations (S-Corp, SALT, crypto, etc.)
3. Add software proficiencies (Lacerte, Drake, etc.)
4. Upload a professional photo

Update your profile: ${data.profileEditUrl}

EXAMPLE BIO FOR ${data.credentialType}s:
${exampleBio.replace(/"/g, '')}

PRO TIPS:
• Be specific about what you do (not just "tax professional")
• Mention the types of clients you work with
• List 3-5 key specializations you want to be found for
• Keep it professional but let your personality show

NEED HELP?
Reply to this email with 3 bullet points about yourself and I'll draft a professional bio for you.

Example bullets:
• S-Corp and partnership taxation
• Work with tech startups and small businesses
• 12 years experience, licensed in CA and NV

Best regards,
The TaxProExchange Team

---
Manage email preferences: ${appUrl}/settings
  `;

  return {
    subject,
    html,
    text,
  };
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
      .select('id, first_name, last_name, public_email, credential_type, slug, bio, headline, opportunities, specializations, states')
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
        results.push({ 
          success: false, 
          email: profile.public_email, 
          reason: 'Profile already has sufficient content',
          profile_id: profile.id
        });
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


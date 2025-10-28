import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { supabaseService } from '@/lib/supabaseService';
import { auth } from '@clerk/nextjs/server';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com';

interface ContributorPublishedData {
  contributorName: string;
  contributorEmail: string;
  articleTitle: string;
  articleSlug: string;
}

export async function POST(request: Request) {
  try {
    // Admin-only endpoint
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may have a better auth check)
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json() as ContributorPublishedData;
    const { contributorName, contributorEmail, articleTitle, articleSlug } = body;

    if (!contributorEmail || !articleTitle || !articleSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send notification email
    const sharePageUrl = `${siteUrl}/ai/share-success/${articleSlug}`;
    const articleUrl = `${siteUrl}/ai/${articleSlug}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Article Is Live!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%); padding: 40px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">Your Article Is Live!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <p style="color: #2d3748; font-size: 18px; margin: 0 0 20px 0;">
              Hi <strong>${contributorName || 'there'}</strong>,
            </p>
            
            <p style="color: #4a5568; font-size: 16px; margin: 20px 0;">
              Congratulations! Your article <strong>"${articleTitle}"</strong> has been published on the TaxProExchange AI Hub.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${articleUrl}" style="background: #0EA5E9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                📖 View Your Published Article
              </a>
            </div>

            <div style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%); padding: 20px; border-radius: 6px; margin: 30px 0; border-left: 4px solid #0EA5E9;">
              <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 18px;">✨ Get Your Contributor Badge</h3>
              <p style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 14px;">
                We've created a special badge and social media graphics for you to share your achievement!
              </p>
              <div style="text-align: center;">
                <a href="${sharePageUrl}" style="background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 15px;">
                  🏆 Grab Your Badge & Share
                </a>
              </div>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 16px;">What You Get:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
              <li style="margin-bottom: 8px;">
                <strong>Contributor Badge</strong> – Display on your website or LinkedIn profile
              </li>
              <li style="margin-bottom: 8px;">
                <strong>Social Media Graphics</strong> – Custom shareable cards for LinkedIn, Twitter, etc.
              </li>
              <li style="margin-bottom: 8px;">
                <strong>Pre-written LinkedIn Caption</strong> – Copy and paste to promote your article
              </li>
              <li style="margin-bottom: 8px;">
                <strong>Dofollow Backlink</strong> – Full SEO benefits to your website
              </li>
            </ul>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
              <strong>💡 Tip:</strong> Sharing your article on LinkedIn and Twitter helps it reach more tax professionals and establishes you as a thought leader in AI for accounting.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #718096; text-align: center;">
            <p style="margin: 10px 0;">
              Thank you for contributing to TaxProExchange!
            </p>
            <p style="margin: 10px 0;">
              Questions? Reply to this email or contact us at <a href="mailto:koen@cardifftax.com" style="color: #0EA5E9;">koen@cardifftax.com</a>
            </p>
            <p style="margin: 10px 0;">
              – The TaxProExchange Team
            </p>
          </div>
        </body>
      </html>
    `;

    const text = `
Your Article Is Live! 🎉

Hi ${contributorName || 'there'},

Congratulations! Your article "${articleTitle}" has been published on the TaxProExchange AI Hub.

📖 View Your Published Article:
${articleUrl}

✨ Get Your Contributor Badge:
${sharePageUrl}

What You Get:
• Contributor Badge – Display on your website or LinkedIn profile
• Social Media Graphics – Custom shareable cards
• Pre-written LinkedIn Caption – Copy and paste to promote your article
• Dofollow Backlink – Full SEO benefits to your website

💡 Tip: Sharing your article on LinkedIn and Twitter helps it reach more tax professionals and establishes you as a thought leader in AI for accounting.

Thank you for contributing to TaxProExchange!

Questions? Reply to this email or contact us at koen@cardifftax.com

– The TaxProExchange Team
    `;

    await sendEmail({
      to: contributorEmail,
      subject: `Your Article Is Live on TaxProExchange AI Hub 🎉`,
      html,
      text,
      replyTo: 'koen@cardifftax.com',
      from: 'TaxProExchange <support@taxproexchange.com>',
    });

    return NextResponse.json({ 
      success: true,
      message: 'Notification email sent successfully'
    });

  } catch (error) {
    console.error('Error sending contributor notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}


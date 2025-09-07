export function verifiedListedHtml(opts: {
  firstName: string;
  profileUrl: string;
  foundingMemberUrl: string;
  shareLinkedInUrl: string;
  shareXUrl: string;
  inviteUrl: string;
  managePrefsUrl: string;
  siteUrl: string;
  year: number;
}) {
  const {
    firstName,
    profileUrl,
    foundingMemberUrl,
    shareLinkedInUrl,
    shareXUrl,
    inviteUrl,
    managePrefsUrl,
    siteUrl,
    year,
  } = opts;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 24px;color:#fff;">
                <h1 style="margin:0;font-size:22px;">You are verified and listed 🎉</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:.95;">People can now find and connect with you on TaxProExchange.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 14px;">Hi ${firstName || "there"},</p>
                <p style="margin:0 0 16px;">
                  Congrats. Your profile is now <strong>verified</strong> and <strong>publicly listed</strong>. You will show up in search and can receive connection requests.
                </p>

                <div style="text-align:center;margin:22px 0 28px;">
                  <a href="${profileUrl}" style="background:#10b981;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;display:inline-block;font-weight:600">View your profile</a>
                </div>

                <ul style="padding-left:18px;margin:0 0 18px;line-height:1.6;">
                  <li><strong>Connect and message</strong> other pros who fit your needs.</li>
                  <li><strong>Post jobs</strong> for overflow or specialist work. Optional.</li>
                </ul>

                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin:18px 0;">
                  <p style="margin:0;font-size:14px;">
                    Want to help shape the roadmap? Become a
                    <a href="${foundingMemberUrl}" style="color:#059669;text-decoration:underline;">Founding Member</a>.
                    This is optional. Your support helps us build faster.
                  </p>
                </div>

                <p style="margin:18px 0 10px;font-size:14px;">Want to help the community grow?</p>

                <!-- Share buttons (smaller, more subtle) -->
                <div style="text-align:center; margin:6px 0 22px;">
                  <!-- LinkedIn -->
                  <a href="${shareLinkedInUrl}" 
                     style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;background:#0a66c2;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;margin:0 4px 6px;vertical-align:middle;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Share on LinkedIn
                  </a>

                  <!-- X (Twitter) -->
                  <a href="${shareXUrl}" 
                     style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;margin:0 4px 6px;vertical-align:middle;">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X
                  </a>

                  <!-- Email invite -->
                  <a href="mailto:?subject=I%20got%20listed%20on%20TaxProExchange&body=${encodeURIComponent('I just got verified and listed on TaxProExchange. Here is my profile: ' + profileUrl + '\n\nJoin here: ' + siteUrl + '/join')}"
                     style="display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;background:#475569;color:#fff;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;margin:0 4px 6px;vertical-align:middle;">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    Invite via Email
                  </a>
                </div>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
                <p style="margin:0;color:#6b7280;font-size:12px;">
                  You are receiving this because your profile was approved.
                  <a href="${managePrefsUrl}" style="color:#059669;text-decoration:underline;">Manage notifications</a>
                  or email <a href="mailto:support@taxproexchange.com" style="color:#059669;text-decoration:underline;">support@taxproexchange.com</a>.
                </p>
              </td>
            </tr>

          </table>
          <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">© ${year} TaxProExchange</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function verifiedListedText(opts: {
  firstName: string;
  profileUrl: string;
  foundingMemberUrl: string;
  shareLinkedInUrl: string;
  shareXUrl: string;
  inviteUrl: string;
  managePrefsUrl: string;
  siteUrl: string;
  year: number;
}) {
  const {
    firstName, profileUrl, foundingMemberUrl,
    shareLinkedInUrl, shareXUrl, inviteUrl, managePrefsUrl, siteUrl, year
  } = opts;

  return `Hi ${firstName || "there"},

Congrats. Your profile is now VERIFIED and publicly listed. People can find you in search and send connection requests.

View your profile: ${profileUrl}

Next steps:
• Connect and message other pros who fit your needs.
• Post jobs for overflow or specialist work. Optional.

Optional: Help shape the roadmap by becoming a Founding Member:
${foundingMemberUrl}

Want to help the community grow?
Share on LinkedIn: ${shareLinkedInUrl}
Post on X: ${shareXUrl}
Invite by email: mailto link above

Manage notifications: ${managePrefsUrl}
Support: support@taxproexchange.com
© ${year} TaxProExchange`;
}

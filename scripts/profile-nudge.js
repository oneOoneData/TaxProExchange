/**
 * Profile Optimization Nudge Campaign
 * Sends ONE personalized email to listed users with no bio.
 * Respects: marketing_updates opt-out, already-emailed, empty public_email.
 * Includes signed unsubscribe link (type=marketing).
 */

const { createClient } = require('@supabase/supabase-js');
const { createHmac } = require('crypto');
require('dotenv').config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.taxproexchange.com').replace(/\/$/, '');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'fallback';

function signUnsubscribeToken(profileId) {
  return createHmac('sha256', WEBHOOK_SECRET).update(`unsub:${profileId}`).digest('hex');
}

function generateUnsubscribeUrl(profileId) {
  const token = signUnsubscribeToken(profileId);
  return `${APP_URL}/api/unsubscribe?pid=${profileId}&token=${token}&type=marketing`;
}

function buildEmail(user) {
  const firstName = user.first_name || 'there';
  const profileUrl = `${APP_URL}/profile/${user.slug}`;
  const unsubUrl = generateUnsubscribeUrl(user.id);

  const subject = `${firstName}, your TaxProExchange profile is missing something`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:24px;line-height:1.6">

  <p>Hi ${firstName},</p>

  <p>You're on TaxProExchange — but your profile is missing a bio and specializations. That means when someone searches for a tax pro with your background, you're not showing up.</p>

  <p>Takes 5 minutes to fix. Here's what to add:</p>

  <ul style="margin:16px 0;padding-left:20px">
    <li><strong>Bio</strong> — 2–4 sentences about your background and what you focus on</li>
    <li><strong>Specializations</strong> — pick the practice areas that describe your work</li>
    <li><strong>Years of experience</strong> — helps clients find the right fit</li>
  </ul>

  <p style="margin:24px 0">
    <a href="${profileUrl}/edit" style="background:#10b981;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600">Complete My Profile →</a>
  </p>

  <p>Profiles with complete bios get significantly more views. It's the single highest-leverage thing you can do right now.</p>

  <p>— Koen<br><span style="color:#666;font-size:14px">TaxProExchange</span></p>

  <hr style="border:none;border-top:1px solid #eee;margin:32px 0">
  <p style="font-size:12px;color:#999">
    You're receiving this because you have an account on TaxProExchange.<br>
    <a href="${unsubUrl}" style="color:#999">Unsubscribe from profile tips</a>
  </p>

</body>
</html>`;

  return { subject, html };
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Koen at TaxProExchange <koen@taxproexchange.com>',
      to: [to],
      subject,
      html,
      headers: {
        'List-Unsubscribe': `<${APP_URL}/api/unsubscribe?pid=__PID__&type=marketing>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function markEmailed(profileId) {
  await sb.from('profiles').update({ profile_optimization_emailed_at: new Date().toISOString() }).eq('id', profileId);
}

async function run() {
  const DRY_RUN = process.argv.includes('--dry-run');
  if (DRY_RUN) console.log('🔍 DRY RUN — no emails will be sent\n');

  // Fetch eligible users
  const { data, error } = await sb
    .from('profiles')
    .select('id, first_name, last_name, public_email, bio, slug, email_preferences, profile_optimization_emailed_at')
    .eq('is_listed', true)
    .eq('is_deleted', false)
    .or('bio.is.null,bio.eq.')
    .order('created_at', { ascending: true });

  if (error) { console.error('DB error:', error.message); process.exit(1); }

  const eligible = data.filter(p => {
    if (!p.public_email || p.public_email.trim() === '') return false;
    if (p.profile_optimization_emailed_at) { console.log(`⏭  Already emailed: ${p.first_name} ${p.last_name}`); return false; }
    const prefs = p.email_preferences;
    if (prefs && prefs.marketing_updates === false) { console.log(`🚫 Opted out: ${p.first_name} ${p.last_name}`); return false; }
    // Skip obvious test/fake accounts
    const fakeLastNames = ['Professional', 'Score', 'User'];
    if (fakeLastNames.includes(p.last_name)) { console.log(`🧪 Skipping test account: ${p.first_name} ${p.last_name}`); return false; }
    if (!p.first_name || p.first_name === p.public_email.split('@')[0]) { console.log(`🧪 Skipping suspicious account: ${p.first_name}`); return false; }
    return true;
  });

  console.log(`\n📋 ${eligible.length} eligible users to contact\n`);

  const log = [];

  for (const user of eligible) {
    const { subject, html } = buildEmail(user);
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    
    if (DRY_RUN) {
      console.log(`✉  Would send to: ${name} <${user.public_email}>`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Unsub: ${generateUnsubscribeUrl(user.id)}\n`);
      log.push({ name, email: user.public_email, status: 'dry-run' });
      continue;
    }

    try {
      const result = await sendEmail(user.public_email, subject, html);
      await markEmailed(user.id);
      console.log(`✅ Sent to ${name} <${user.public_email}> — id: ${result.id}`);
      log.push({ name, email: user.public_email, status: 'sent', resend_id: result.id });
      // polite delay
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`❌ Failed for ${name} <${user.public_email}>:`, err.message);
      log.push({ name, email: user.public_email, status: 'error', error: err.message });
    }
  }

  console.log('\n📊 Summary:', log);
  return log;
}

run().catch(console.error);

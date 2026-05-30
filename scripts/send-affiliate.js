const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'Koen at TaxProExchange <koen@taxproexchange.com>';

const emails = [
  {
    to: 'editor@goingconcern.com',
    subject: 'Affiliate opportunity for your CPA readers — $72/referral, recurring 12 months',
    text: `Hi Adrienne,

I've been a Going Concern reader for years — your coverage of the day-to-day realities of public accounting is unlike anything else out there, and your audience clearly trusts you for straight talk.

I'm Koen, founder of TaxProExchange.com — a hiring marketplace specifically for tax professionals. We just launched an affiliate program and I think your readership (firm owners, partners, EAs hunting for talent) is a natural fit.

The deal: 20% recurring commission for 12 months — that's $72 per firm that signs up. No caps, no hoops, just a clean affiliate link.

Full details: taxproexchange.com/partners. Happy to jump on a quick call or answer any questions.

Thanks for all you do for the profession,
Koen
TaxProExchange.com`
  },
  {
    to: 'blake@earmarkcpe.com',
    subject: 'Affiliate partnership idea — built for your CPA audience',
    text: `Hi Blake,

Long-time listener of The Accounting Podcast — your consistent push for CPAs to work smarter, not harder really resonated with me.

I'm Koen, founder of TaxProExchange.com — a dedicated hiring marketplace for tax professionals. Firms pay $30/month to access a curated pool of EAs, CPAs, and tax preparers, and many of your listeners are exactly who we're trying to reach.

We just launched an affiliate program: 20% recurring commission for 12 months, $72 per paying firm. Simple link, no complicated integrations.

Full program info: taxproexchange.com/partners. Would love to explore a fit — even a brief mention in your newsletter or show notes.

Best,
Koen
TaxProExchange.com`
  },
  {
    to: 'hector@qbkaccounting.com',
    subject: 'Affiliate partnership — hiring marketplace for CPAs and firm owners',
    text: `Hi Hector,

I've followed your YouTube channel for years — your QuickBooks and practice-building content has helped thousands of accountants run better businesses.

I'm Koen, founder of TaxProExchange.com — a job marketplace for tax professionals. Many of your viewers who run their own firms need to hire EAs and tax preparers, and we make that simple for $30/month.

Affiliate program: 20% recurring for 12 months, $72 per converted firm subscription. Even a brief mention in a relevant video could convert really well given your reach.

Full details: taxproexchange.com/partners. Happy to hop on a quick call.

Thanks,
Koen
TaxProExchange.com`
  },
  {
    to: 'info@natptax.com',
    subject: 'Affiliate/partner opportunity for NATP members — hiring marketplace',
    text: `Hi NATP Team,

NATP members are some of the most dedicated tax professionals in the country — and many of them run growing practices that need to hire qualified staff.

I'm Koen, founder of TaxProExchange.com — a hiring marketplace purpose-built for tax professionals where firms can find EAs, CPAs, and tax preparers for $30/month.

We'd love to discuss a formal affiliate or referral arrangement: 20% recurring commission for 12 months, $72 per referred firm. Whether a newsletter feature, chapter resource listing, or referral link — we're flexible.

Full program info: taxproexchange.com/partners.

Thank you,
Koen
TaxProExchange.com`
  },
  {
    to: 'support@ninjacpareview.com',
    subject: 'Affiliate idea — your EA students will need jobs once they pass',
    text: `Hi Jeff,

NINJA EA Review has built a massive following among exam candidates — and once they pass, those newly credentialed EAs need somewhere to work.

I'm Koen, founder of TaxProExchange.com — a hiring marketplace connecting tax professionals with firms. We serve both sides: firms looking to hire and EAs looking for roles. Your audience is perfectly positioned to benefit when they cross that finish line.

Affiliate program: 20% recurring for 12 months, $72 per paying firm. Even a mention in your post-pass resources or email sequences could convert well.

Full details: taxproexchange.com/partners. Happy to chat.

Koen
TaxProExchange.com`
  },
  {
    to: 'partnerships@gleim.com',
    subject: 'Affiliate / co-marketing opportunity — TaxProExchange job marketplace',
    text: `Hi Gleim Partnerships Team,

Gleim has helped millions of professionals pass their exams — but what happens after they pass? That's where TaxProExchange.com comes in.

I'm Koen, founder of TaxProExchange — a dedicated hiring marketplace for tax professionals. Firms subscribe at $30/month to post jobs and find qualified EAs and tax staff.

Affiliate program: 20% recurring for 12 months, $72 per firm that converts. I'd love to explore whether Gleim's post-exam content or resource pages could include a referral link.

More details: taxproexchange.com/partners.

Best regards,
Koen
TaxProExchange.com`
  },
  {
    to: 'hello@jetpackworkflow.com',
    subject: 'Affiliate partnership — hiring tool for your firm-owner audience',
    text: `Hi David,

Jetpack Workflow has become a go-to resource for accounting firm owners who take operations seriously — your podcast and newsletter consistently deliver practical, actionable content.

I'm Koen, founder of TaxProExchange.com — a $30/month hiring marketplace for tax firms. Your audience of firm owners who care about running a tight operation are exactly the people frustrated by expensive recruiting.

Affiliate program: 20% recurring for 12 months, $72 per converted firm.

Full details: taxproexchange.com/partners.

Best,
Koen
TaxProExchange.com`
  },
  {
    to: 'marketing@getcanopy.com',
    subject: 'Affiliate opportunity — hiring marketplace for your tax firm users',
    text: `Hi Canopy Team,

Canopy has built a strong community of tax professionals — your user base is full of exactly the firm owners who struggle with seasonal hiring.

I'm Koen, founder of TaxProExchange.com — a dedicated hiring marketplace for tax firms ($30/month). Affiliate program: 20% recurring for 12 months, $72 per converted firm.

Whether a blog post, email mention, or integration partner listing — I'm open to whatever makes sense.

Full details: taxproexchange.com/partners.

Best,
Koen
TaxProExchange.com`
  },
  {
    to: 'editorial@accountingtoday.com',
    subject: 'Affiliate / editorial partnership — TaxProExchange hiring marketplace',
    text: `Hi Accounting Today Team,

Your coverage of staffing and practice management is required reading for serious practitioners — and staffing is one of the perennial pain points your readers face.

I'm Koen, founder of TaxProExchange.com — a $30/month hiring marketplace built specifically for tax firms. Affiliate program: 20% recurring for 12 months, $72 per firm referred.

I'd love to discuss editorial coverage, a sponsored segment, or a straightforward affiliate arrangement.

Details: taxproexchange.com/partners.

Best,
Koen
TaxProExchange.com`
  },
  {
    to: 'info@markjkohler.com',
    subject: 'Affiliate partnership — tax hiring marketplace for your firm-owner audience',
    text: `Hi Mark,

Your Main Street Business podcast and YouTube channel explain tax strategy in a way that small business owners and practitioners actually understand. Genuinely rare.

I'm Koen, founder of TaxProExchange.com — a hiring marketplace for tax firms ($30/month). Many of your listeners who run CPA practices deal with the exact hiring problem we solve: finding qualified EAs and tax professionals.

Affiliate program: 20% recurring for 12 months, $72 per converted firm. Even a brief mention in your podcast or resources section could perform well.

Full details: taxproexchange.com/partners.

Koen
TaxProExchange.com`
  },
  {
    to: 'editor@cpapracticeadvisor.com',
    subject: 'Affiliate / editorial partnership — TaxProExchange hiring marketplace for tax firms',
    text: `Hi CPA Practice Advisor Team,

Your coverage shapes how practitioners think about building their practices — and staffing is one of the perennial pain points your readers face.

I'm Koen, founder of TaxProExchange.com — a $30/month job marketplace built specifically for tax firms looking to hire credentialed EAs, CPAs, and preparers.

Affiliate program: 20% recurring for 12 months, $72 per firm referred. Happy to discuss editorial coverage, sponsored content, or a straightforward affiliate arrangement.

Details: taxproexchange.com/partners.

Best,
Koen
TaxProExchange.com`
  }
];

async function send() {
  console.log(`Sending ${emails.length} affiliate outreach emails...`);
  for (const email of emails) {
    const r = await resend.emails.send({ from: FROM, to: email.to, subject: email.subject, text: email.text });
    console.log(`${email.to}: ${r.data?.id || r.error?.message}`);
    await new Promise(res => setTimeout(res, 400));
  }
  console.log('Done.');
}
send().catch(console.error);

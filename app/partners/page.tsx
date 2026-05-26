import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate & Partner Program | TaxProExchange',
  description: 'Earn 20% recurring commission for 12 months by referring accounting firms to TaxProExchange. Built for tax bloggers, CPAs, and accounting educators.',
  alternates: { canonical: 'https://www.taxproexchange.com/partners' },
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Affiliate Program
          </span>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Earn 20% recurring commission
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            Refer accounting firms to TaxProExchange. Earn 20% of their $30/month subscription for 12 months — $72 per customer you send our way.
          </p>
          <p className="text-slate-500 mb-8">
            No caps. No minimums. Pay out monthly.
          </p>
          <a
            href="mailto:koen@taxproexchange.com?subject=Affiliate Program&body=Hi Koen, I'm interested in joining the TaxProExchange affiliate program."
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Apply to Join
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Apply',
                desc: 'Email us and we\'ll set you up with a unique referral link. Takes less than 24 hours.',
              },
              {
                step: '2',
                title: 'Share',
                desc: 'Promote TaxProExchange to accounting firms through your blog, newsletter, podcast, or social channels.',
              },
              {
                step: '3',
                title: 'Earn',
                desc: 'When a firm subscribes through your link, you earn 20% of their monthly fee for the next 12 months.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission breakdown */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">The math</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left px-6 py-3 font-semibold text-slate-700">Referrals</th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-700">Monthly earnings</th>
                  <th className="text-right px-6 py-3 font-semibold text-slate-700">Annual earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { refs: 5, monthly: '$30', annual: '$360' },
                  { refs: 10, monthly: '$60', annual: '$720' },
                  { refs: 25, monthly: '$150', annual: '$1,800' },
                  { refs: 50, monthly: '$300', annual: '$3,600' },
                  { refs: 100, monthly: '$600', annual: '$7,200' },
                ].map((row) => (
                  <tr key={row.refs} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-700">{row.refs} paying firms</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">{row.monthly}</td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">{row.annual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">Based on $30/month × 20% commission × 12 months per referral</p>
        </div>
      </section>

      {/* Who's a good fit */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Who joins our affiliate program</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '✍️', label: 'Tax & accounting bloggers', desc: 'You write about running a tax practice. Your readers are our customers.' },
              { icon: '🎓', label: 'CPE & EA exam educators', desc: 'Your audience is credentialed professionals who run or work at firms.' },
              { icon: '🎙️', label: 'Podcast hosts', desc: 'Accounting, firm management, or practice growth shows.' },
              { icon: '👥', label: 'Association leaders', desc: 'NATP chapters, state CPA society staff, EA groups.' },
              { icon: '📱', label: 'Social media creators', desc: 'LinkedIn or YouTube creators focused on accounting/tax content.' },
              { icon: '🛠️', label: 'Tax software reviewers', desc: 'You already review tools tax professionals use.' },
            ].map((item) => (
              <div key={item.label} className="flex gap-4 p-4 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                  <p className="text-slate-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'How do I get paid?',
                a: 'Monthly via PayPal or bank transfer. Minimum payout $25.',
              },
              {
                q: 'How long does the commission last?',
                a: '20% of the monthly fee for 12 months from the date they subscribe. After that, commissions stop for that referral.',
              },
              {
                q: 'Is there a minimum traffic or audience requirement?',
                a: 'No. If you have any audience of accounting or tax professionals, we want to work with you.',
              },
              {
                q: 'Do you provide marketing materials?',
                a: 'Yes — we provide email copy, social media graphics, and a one-pager you can share. Or we can customize materials for your audience.',
              },
              {
                q: 'What counts as a conversion?',
                a: 'A firm signs up and starts a paid subscription ($30/month) using your referral link.',
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-slate-200 pb-6">
                <p className="font-semibold text-slate-900 mb-2">{item.q}</p>
                <p className="text-slate-600 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Ready to get started?</h2>
          <p className="text-slate-600 mb-8">
            Send us a quick email and we&apos;ll have you set up with a referral link within 24 hours.
          </p>
          <a
            href="mailto:koen@taxproexchange.com?subject=Affiliate Program&body=Hi Koen, I'm interested in joining the TaxProExchange affiliate program. Here's a bit about my audience: "
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Apply to Join →
          </a>
        </div>
      </section>
    </div>
  );
}

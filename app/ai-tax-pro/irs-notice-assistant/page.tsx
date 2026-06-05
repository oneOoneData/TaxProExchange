import { Metadata } from 'next';
import Link from 'next/link';
import AppNavigation from '@/components/AppNavigation';
import Footer from '@/components/Footer';
import { CopyButton } from '@/components/CopyButton';
import { siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'IRS Notice Response Assistant — Free AI Prompt Template | TaxProExchange',
  description: 'Download a ready-to-use AI system prompt and skill template for responding to IRS notices. Drop into ChatGPT, Claude, or Gemini and run today.',
  alternates: { canonical: `${siteUrl}/ai-tax-pro/irs-notice-assistant` },
  openGraph: {
    title: 'IRS Notice Response Assistant — Free AI Prompt Template',
    description: 'One real AI workflow you can run today. System prompt + skill template + example output.',
    url: `${siteUrl}/ai-tax-pro/irs-notice-assistant`,
    type: 'website',
  },
};

export default function IRSNoticeAssistant() {
  return (
    <>
      <AppNavigation />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
            <Link href="/ai-tax-pro" className="hover:text-slate-900">The AI Tax Pro</Link>
            <span>→</span>
            <span className="text-slate-900">IRS Notice Response Assistant</span>
          </nav>

          <header className="mb-10">
            <div className="text-4xl mb-4">📋</div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              IRS Notice Response Assistant
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              A ready-to-use AI workflow that drafts professional IRS notice responses
              in minutes. Copy, paste, customize, run.
            </p>
          </header>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-10">
            <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">How to use this</h3>
            <p className="text-blue-800 text-sm mb-0">
              Paste the <strong>System Prompt</strong> once into your AI tool (ChatGPT, Claude, Gemini).
              Then paste the <strong>Skill Template</strong> each time you need a notice response.
              Always de-identify client data and verify every draft before sending.
            </p>
          </div>

          <h2>System Prompt</h2>
          <p>Set this once. It tells the AI who you are and how you work.</p>
          <div className="bg-slate-900 text-slate-100 rounded-lg p-6 my-6">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono" id="system-prompt">{`You are an AI assistant for a licensed tax preparation firm. Your role is to draft professional, accurate responses to IRS notices and correspondence.

## Your firms standards
- Responses are professional, concise, and factual.
- Never admit liability or fault without explicit instructions from the preparer.
- Always include: notice number, tax year, taxpayer name, and response date.
- Use plain language. Avoid legalese. The IRS agent reading this handles hundreds of notices.
- When citing a tax code section, always include the full citation.

## Your constraints
- You DO NOT give tax advice. You draft responses for review and approval.
- You DO NOT sign anything. The licensed preparer owns every conclusion.
- You DO NOT include client PII unless it has been provided to you. Keep placeholders like [CLIENT NAME] where data is missing.
- If you are unsure of the correct response to a notice, say so and suggest the preparer research the specific issue.

## Response format
1. Notice summary (one sentence)
2. Proposed response
3. Supporting documentation suggested (bullet list)
4. Items requiring preparer review (bullet list)`}</pre>
            <CopyButton targetId="system-prompt" />
          </div>

          <h2>Skill Template</h2>
          <p>Paste this each time you need a notice response. Fill in the brackets.</p>
          <div className="bg-slate-900 text-slate-100 rounded-lg p-6 my-6">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono" id="skill-template">{`## IRS Notice Response Request

**Notice type:** [Notice number, e.g. CP2000, CP14, 3219A]
**Client:** [CLIENT NAME - use placeholder if sensitive]
**Tax year(s):** [YEAR(S)]
**IRS amount claimed:** $[AMOUNT]
**Deadline to respond:** [DATE]

**Context from preparer:**
[Briefly describe what the notice is about and any relevant client context]

**Draft a response that:**
1. Acknowledges the notice by number and date
2. Addresses each point the IRS raised
3. Includes supporting documentation where applicable
4. Ends with a clear next step (payment, additional info, dispute)

**Flag anything that needs preparer judgment before sending.**

**De-identification reminder:** Replace all client PII with [CLIENT NAME], [SSN-LAST4], [ADDRESS] before pasting. Re-identify in the final draft.`}</pre>
            <CopyButton targetId="skill-template" />
          </div>

          <h2>Example Output</h2>
          <p>A draft response to a CP2000 notice using this system:</p>
          <div className="bg-white border border-slate-200 rounded-lg p-6 my-6">
            <div className="text-sm text-slate-500 mb-4">CP2000 Response Draft</div>
            <div className="text-sm leading-relaxed space-y-3">
              <p><strong>Notice Summary:</strong> IRS CP2000 dated March 15, 2026, proposing an additional $3,450 for tax year 2024 based on unreported income from Form 1099-NEC.</p>
              <p><strong>Proposed Response:</strong></p>
              <p>We acknowledge receipt of Notice CP2000 dated March 15, 2026, for tax year 2024.</p>
              <p>Upon review of client records, the income referenced in the notice was reported on [CLIENT NAME]&apos;s return as part of Schedule C gross receipts and was not separately listed as a 1099-NEC entry due to a bookkeeping classification. The full amount was included in the $[AMOUNT] reported on Schedule C, Line 1.</p>
              <p>Enclosed is a reconciliation showing the 1099-NEC amount within the Schedule C total. No additional tax is due.</p>
              <p><strong>Supporting Documents:</strong></p>
              <ul>
                <li>Schedule C from 2024 return</li>
                <li>1099-NEC copy</li>
                <li>Reconciliation worksheet</li>
              </ul>
              <p className="text-amber-700 bg-amber-50 p-3 rounded"><strong>⚠ Needs preparer review:</strong> Confirm that the 1099-NEC amount is fully included in Schedule C gross receipts. Verify the reconciliation math. Sign and date before mailing.</p>
            </div>
          </div>

          <h2>Verification Checklist</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">Before you send, confirm each:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Client name, notice number, and tax year are correct</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Every factual claim is supported by client records</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Response is signed and dated by a licensed preparer</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> All attachments are included and labeled</li>
              <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">☐</span> Copy saved to client file</li>
            </ul>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <p className="text-slate-600 mb-4">Next step: build your full second brain</p>
            <Link href="/insights/ai-tax-pro-second-brain" className="inline-flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all">
              Read the Second Brain article →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

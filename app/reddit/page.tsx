// app/reddit/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import BuyMeACoffee from '@/components/BuyMeACoffee';

export const metadata: Metadata = {
  title: "TaxProExchange - For Reddit Tax Pros",
  description:
    "A verified directory + matchmaking platform for CPAs, EAs, and CTEC preparers to offload overflow work and find trusted pros. Free for founding members.",
  openGraph: {
    title: "TaxProExchange - For Reddit Tax Pros",
    description:
      "Verified profiles, simple job posts, and direct connections. Free for founding members.",
    url: "https://www.taxproexchange.com/reddit",
    siteName: "TaxProExchange",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxProExchange - For Reddit Tax Pros",
    description:
      "Verified profiles, simple job posts, and direct connections. Free for founding members.",
  },
};

export default function RedditLanding() {
  const joinHref = "/join?utm_source=reddit&utm_medium=landing&utm_campaign=launch";
  const homeHref = "/?utm_source=reddit&utm_medium=landing";

  return (
    <main className="min-h-screen bg-white">
      {/* Top notice */}
      <div className="w-full bg-amber-50 border-b border-amber-200">
        <div className="mx-auto max-w-5xl px-4 py-2 text-sm text-amber-900 flex items-center gap-2">
          <img 
            src="https://redditinc.com/hs-fs/hubfs/Reddit%20Inc/Content/Brand%20Page/Reddit_Logo.png?width=600&height=600&name=Reddit_Logo.png" 
            alt="Reddit" 
            className="h-4 w-4"
          />
          Built for Reddit tax pros — plain, transparent, and free for founding members.
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Founding Member badges available
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            TaxProExchange - <span className="text-slate-700">for Reddit Tax Pros</span>
          </h1>
          <p className="max-w-2xl text-slate-600">
            A verified directory + matchmaking platform for CPAs, EAs, and CTEC preparers to
            <span className="font-medium"> offload overflow work</span>,
            find <span className="font-medium">trusted handoff partners</span>, and build
            ongoing referral relationships.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={joinHref}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Join free
            </Link>
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-3 text-slate-700 hover:bg-slate-50"
            >
              Learn more
            </Link>
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <li>• Verified credentials (CPA, EA, CTEC)</li>
            <li>• Simple job posts & direct connections</li>
            <li>• Search by state, credential, specialty</li>
            <li>• No client files or payments handled</li>
          </ul>
        </div>
      </section>

      {/* Why do we need TaxProExchange? */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <h2 className="text-xl font-semibold text-slate-900">Why do we need TaxProExchange?</h2>
        <div className="mt-6 space-y-4 text-slate-700">
          <p>
            This web app, which aims to be a job marketplace for tax professionals grew out of two things:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>A reddit post where people were complaining about throwing money away on services that promise to offload tax work but don't deliver</li>
            <li>Frustrated Tax Pros that use expensive services to pick up tax work</li>
          </ol>
          <p>
            The result is what you can join and test today. A streamlined, very focussed job marketplace for Tax Pros to post their profiles and pick up jobs that match their skills.
          </p>
          <p>
            Our goal is to help people like us (we are <a href="https://www.cardifftax.com" target="_blank" rel="noopener noreferrer" className="text-slate-900 underline hover:text-slate-700">tax pros ourselves</a>) find good people to work with, not to build the next tech platform that is focussed on making as much money as possible.
          </p>
          <p>
            This app is new so you might still see some rough edges, but we can build and iterate fast. All we need is your expertise to make it great.
          </p>
          <p className="font-medium">
            Thanks for helping out.
          </p>
          <p className="font-medium">
            Koen
          </p>
          <p className="text-sm text-slate-500">
            Posted by <a href="https://www.reddit.com/user/RepliKoen/" 
            target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">
            u/RepliKoen</a> on Reddit
          </p>
        </div>
      </section>

      {/* Why join now */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
          <h2 className="text-xl font-semibold text-slate-900">Why join now?</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Card title="Free for founding members">
              No cost to try it with your real workflow.
            </Card>
            <Card title="Founding Member badge">
              Early credibility on your public profile.
            </Card>
            <Card title="Verified only">
              Profiles require valid credentials before listing.
            </Card>
            <Card title="Shape the roadmap">
              Your feedback drives job posts, SLAs, and notifications.
            </Card>
          </div>
        </div>
      </section>

      {/* What it is / isn't */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <h2 className="text-xl font-semibold text-slate-900">What it is (and isn't)</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-medium text-slate-900">✅ It is</h3>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li>• Verified directory of pros</li>
              <li>• Filters by credential, state, specialty</li>
              <li>• Post overflow jobs and connect directly</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-slate-900">❌ It isn't</h3>
            <ul className="mt-3 space-y-2 text-slate-700">
              <li>• A place to store client files</li>
              <li>• An escrow/payments platform (for now)</li>
              <li>• A consumer marketplace like Upwork/TaxFyle</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
          <h2 className="text-xl font-semibold text-slate-900">How it works</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Step n="1" label="Join" sub="Use Google or LinkedIn" />
            <Step n="2" label="Create profile" sub="Credential, specialties, states" />
            <Step n="3" label="Get verified" sub="We check licenses before listing" />
            <Step n="4" label="Post/connect" sub="Share jobs or respond to others" />
          </ol>
          <div className="mt-6">
            <Link
              href={joinHref}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
            >
              Get started free
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
        <div className="mt-6 space-y-6">
          <FAQ
            q="Is this free?"
            a={
              <div>
                <p>Yes, for as long as we can keep it free. Costs will run up at some point but our goal is to create value not become the next TaxFyle.</p>
                <p className="mt-2">Having said that, we can always use more coffee so we can keep coding.</p>
                <div className="mt-3">
                  <BuyMeACoffee />
                </div>
              </div>
            }
          />
          <FAQ
            q="Why not Upwork/TaxFyle?"
            a="Those focus on consumers. TaxProExchange is pros-only — CPAs, EAs, and preparers collaborating with each other."
          />
          <FAQ
            q="What do I need to join?"
            a="A valid credential (CPA, EA, CTEC, or PTIN). We verify before listing your profile in search."
          />
          <FAQ
            q="Do you handle client data or payments?"
            a="No. Keep client files in your own systems. Connect here, then work the way you already do."
          />
        </div>
        <div className="mt-8">
          <Link
            href={joinHref}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
          >
            Join now
          </Link>
        </div>
      </section>

      {/* Footer mini */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} TaxProExchange. Built for collaboration between tax professionals.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-medium text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{children}</p>
    </div>
  );
}

function Step({ n, label, sub }: { n: string; label: string; sub?: string }) {
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {n}
        </span>
        <span className="font-medium text-slate-900">{label}</span>
      </div>
      {sub && <p className="mt-2 text-sm text-slate-600">{sub}</p>}
    </li>
  );
}

function FAQ({ q, a }: { q: string; a: string | React.ReactNode }) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer list-none font-medium text-slate-900">
        {q}
      </summary>
      <div className="mt-2 text-slate-600">
        {typeof a === 'string' ? <p>{a}</p> : a}
      </div>
    </details>
  );
}

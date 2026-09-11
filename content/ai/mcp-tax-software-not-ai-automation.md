---
title: "Stop Trying to Automate the Whole Tax Return. Put an MCP on Your Tax Software Instead."
description: "The autonomous tax return is the wrong product for most firms. What tax pros actually need is ProSeries, Drake, or Lacerte with an MCP attached — so the professional works the return with AI instead of handing it over. Here's the case, the evidence, and what to demand."
author: "Koen Van Duyse"
authorLinkedIn: "https://www.linkedin.com/in/koenvanduyse/"
authorReddit: "https://www.reddit.com/user/RepliKoen/"
authorTPE: "https://www.taxproexchange.com/p/koen-van-duyse-8123510e"
authorBio: "Koen has been working in AI for the last two years, with an emphasis on conversational AI. In his spare time he is partner of a small tax firm in Southern California and runs the Tax Pro Exchange."
authorImage: "/images/authors/koen-van-duyse.jpg"
date: "2026-09-10"
category: "AI & Automation"
pillar: "Tax Technology"
slug: "/insights/mcp-tax-software-not-ai-automation"
keywords:
  - "MCP tax software"
  - "Model Context Protocol tax"
  - "AI tax preparation"
  - "ProSeries MCP"
  - "Drake tax API"
  - "Lacerte SDK integration"
  - "human in the loop tax AI"
  - "tax automation 2026"
  - "AI copilot tax pro"
  - "tax software integration"
previewImage: "/images/mcp-tax-software-not-ai-automation.jpg"
imageAlt: "A tax preparer working a paper return at a desk while a translucent AI assistant interface hovers beside it, connected by a glowing data thread"
canonical: "https://www.taxproexchange.com/insights/mcp-tax-software-not-ai-automation"
readingTime: 9
robots: "index,follow"
ogTitle: "Stop Automating the Whole Tax Return — Put an MCP on Your Tax Software Instead"
ogDescription: "Autonomous tax prep is the wrong product for most firms. What we need is ProSeries/Drake/Lacerte with an MCP attached, so pros work returns with AI — not hand them over."
ogImage: "/images/mcp-tax-software-not-ai-automation.jpg"
twitterCard: "summary_large_image"
twitterTitle: "We Don't Need AI That Does Returns. We Need an MCP on the Software."
twitterDescription: "The autonomous return is a black box. The MCP-on-your-tax-software path keeps the pro in control — and it's already starting to ship."
twitterImage: "/images/mcp-tax-software-not-ai-automation.jpg"
schemaType: "Article"
---

# Stop Trying to Automate the Whole Tax Return. Put an MCP on Your Tax Software Instead.

The pitch in the room right now is "autonomous tax preparation." You feed a firm's documents into a platform and it hands back a completed, review-ready return. No human touches the prep. The professional just signs.

I think that is the wrong product for the overwhelming majority of tax firms — and I think the thing we actually need is far less glamorous: **an MCP server bolted onto ProSeries, Drake, Lacerte, or UltraTax, so a tax pro can work the return *with* AI instead of letting AI do it.**

Let me argue the case, because the difference isn't cosmetic. It's the difference between replacing the preparer and arming them.

## The Autonomous Promise — and Who It's Actually Built For

Let's be fair to the autonomous players, because the technology is real and the results are not hype.

Black Ore's **Tax Autopilot**, which went broadly available in April 2026, runs the full lifecycle autonomously: document ingestion, extraction, federal and state computation, workpaper generation, and delivery of a "review-ready" return into existing firm workflows. The company reports 75 firms onboarded from a waitlist of nearly 4,000, including 40% of the Top 20 CPA firms. It's SOC 2 Type II, and it claims >99% accuracy with every data point linked back to source documents.

**Accrual** raised $75M from General Catalyst in February 2026 and reportedly has H&R Block and Armanino among early adopters, with claims of an 85% reduction in preparation time.

These are serious companies solving a serious problem. The talent math is brutal: Black Ore cites more than 300,000 accountants leaving the profession in two years, CPA exam candidates at a 17-year low, and an estimated 125-million-hour annual shortfall — the equivalent of $25 billion in unmet demand.

So the demand is real. My objection is about *shape*, not substance.

## Why "AI Does the Whole Return" Is the Wrong Abstraction for Most Firms

**1. You still own the sign-off — and now you own a black box.** The return is delivered "ready for final professional review." But review of *what*? If the AI assembled the return, your review is now a forensic exercise: reverse-engineering someone else's work product you didn't build. The liability doesn't move. It just gets harder to discharge. A preparer's signature means the preparer understands the return. "The model said so" is not a defense to anyone — not the IRS, not the client, not your E&O carrier.

**2. The bottleneck was never typing speed.** If prep is 85% faster but your review capacity is unchanged, you've moved the constraint, not removed it. Every firm I've talked to that piloted autonomous prep hits the same wall: the draft arrives, and the partner still has to open it, trust it, and defend it. Draft quality ≠ defensibility.

**3. It's built for volume firms, sold to everyone.** Look at the customer profile: Top 20 firms, high-net-worth returns with dozens of K-1s, firms with the return volume to justify a platform migration. There are hundreds of thousands of small firms in this country — the 1-to-20-person shops — whose economics don't support rip-and-replace. They already own Drake or ProSeries. The autonomous platform asks them to abandon that investment and trust a new system of record.

**4. When it's wrong, you can't see where.** Tax returns fail at the edges: a basis question, an allocation, a state conformity wrinkle, a K-1 footnote. The value of a great tax system is that every number is traceable and every override is intentional. If the AI produces a number, and you can't click into *why*, you've traded a known process for an opaque one.

None of this means autonomous prep is bad. It means it's a **big-firm tool**, and it's being marketed as a universal one.

## The Alternative: Don't Rebuild the Tax Engine. Attach an MCP to It.

Here's the thesis, stated plainly: **the hard part of tax software is not the AI anymore. It's the data model, the calculation engine, the state logic, the e-file plumbing, and the twenty years of edge cases baked into ProSeries, Drake, Lacerte, and UltraTax. Those are assets. The AI is the commodity. So stop rebuilding the engine — bolt the AI onto it.**

The protocol that makes this possible is **MCP — the Model Context Protocol**, which Anthropic introduced in November 2024 as an open standard for connecting AI assistants to external tools and data. Within about 18 months it was adopted across the major AI platforms and reported to be pulling tens of millions of monthly SDK downloads. The analogy everyone uses is USB-C: one standard port, any tool. MCP is that port for AI.

For tax software, MCP is the missing layer. It lets an AI assistant read and act on the systems you already run — **under your existing permissions, with your software remaining the system of record.** That's the difference between "an AI that emails you a finished return" and "an AI that sits inside your return, at your cursor, doing what you ask."

## This Isn't Theoretical — It's Already Shipping

Two data points that should change how you read every vendor announcement this year:

**TaxDome is building an MCP server.** Practice management — the software that already knows your jobs, clients, deadlines, and invoices — is getting an MCP front door. Query it in natural language, and eventually act on it, all under your firm's existing permissions.

**Grove is shipping an open-source MCP plugin for tax prep.** Their plugin installs into Claude, Codex, or Cursor and gives the assistant tools against your firm: `list_returns`, `read_fact_sheet`, `get_checklist`, `request_upload_url`, and `upload_return`. Today it imports **Lacerte and Drake backups** — you drop a client's prior-year file and ask, *"what should I ask them to send for 2025?"* — and the assistant derives the document checklist from what they filed last year.

That last example is the whole argument in miniature. Nobody automated the return. The pro stayed in the chair. The AI *rolled the client forward and drafted the request list* — a task that used to eat an hour of a preparer's afternoon.

## Why the Incumbents Are the Right Substrate

The reason this path is more promising than the autonomous one is boring and important: **the integration reality.**

- **Drake** has no modern public API. Its automation story is scripts and exports, not clean endpoints.
- **ProSeries** is, by most accounts, export-only — no open read/write API for third parties.
- **Lacerte** has a local SDK, but third-party integrations must register and the user must explicitly consent to data access.

In other words, the software most small firms actually use is *closed*. That's exactly why a standard like MCP matters: instead of every AI vendor negotiating a bespoke integration with every tax vendor (which is why the autonomous players had to build their own software stack in the first place), a single MCP layer lets any compliant assistant reach into the tool under governed permissions.

The autonomous platforms proved the AI can do the work. The MCP path is how the *rest* of the profession gets access to that capability without throwing away the software they trust.

## What "Working a Return With AI" Actually Looks Like

Concretely — and none of this requires the AI to "own" the return:

- **Roll-forward and organizer generation.** Import last year's file, derive this year's document checklist automatically.
- **Source-document reading into the return.** "Read this K-1 and stage Box 1, 2, and 11 into the entity's input screen." The AI proposes; you approve; the entries land where they belong.
- **Change detection.** "Compare 2024 to the client's 2025 organizer and flag every line that moved."
- **Client question drafting.** Missing a 1098? The AI drafts the exact follow-up email, from the return itself.
- **Review prep.** "Summarize the overrides on this return and why they exist," so your review starts warm instead of cold.

That is the product I want. Not a finished 1040 with a signature line. A preparer with an AI co-worker who can *see the return* and *act inside it*, one verifiable step at a time.

## The Honest Risks (Because This Isn't Free)

I'm not going to sell you the MCP path as risk-free. Three things have to be got right:

**1. The review bottleneck just moves — so demand a review UI.** If AI drafts more, the constraint becomes how fast you can verify. A good MCP integration must show *diffs*: what did the AI change, where did it come from, what's an override? Without that, you've automated the easy part and concentrated the risk.

**2. MCP security is real.** A tool that can read client documents can be attacked through them — a malicious instruction embedded in a PDF is a genuine prompt-injection vector. Over-broad permissions are the other half: if the AI inherits an admin account, it has admin powers. **Start read-only. Sandbox writes. Grant the narrowest scope that works.**

**3. Circular 230 doesn't pause for plumbing.** Confidentiality, competence, and diligence still apply to whatever the AI retrieves and drafts. The vendor's SOC 2 and data-handling posture are now part of *your* professional stack, not a footnote.

## What to Do About It

1. **Ask your tax software vendor for an MCP server or a governed read/write API** — with audit logs, granular permission scopes, and a user consent flow. If they can't answer, that's your answer about their roadmap.
2. **Connect read-only first.** Point an assistant at your practice management or return data in query-only mode before you let anything write.
3. **Insist on traceability.** A number the AI touched should be one click from its source document. No black boxes, even in a "co-pilot."
4. **Keep your software as the system of record.** The AI should be a front door, not a second database.
5. **Measure time-to-draft, not headcount replaced.** The win from augmentation is throughput and margin, not a layoff — and firms that frame it that way get their staff to actually adopt it.

## The Bottom Line

The autonomous return is a genuine achievement, and for a 500-return high-net-worth practice, it may be exactly right. But for the hundreds of thousands of small and mid-size firms that make up this profession, the answer isn't a platform that does the work *for* you. It's the software you already run, opened up through MCP, so AI can work *with* you — at your cursor, inside your return, under your signature.

We spent two years trying to automate the tax pro. The better product automates the *toil* and leaves the judgment exactly where it belongs: with the professional.

Put an MCP on the software. Keep the human on the return. That's the version of this that actually scales to the whole profession — and it's already starting to ship.

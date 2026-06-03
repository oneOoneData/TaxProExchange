---
title: "Could an AI Agent Run Your Tax Firm? We Asked One to Try."
description: "A thought experiment on what's technically possible today with agentic AI in tax — and why most firms should wait."
category: "AI & Automation"
date: "2026-05-31"
previewImage: "/images/ai-agent-tax-firm.jpg"
author: "TaxProExchange"
tags: ["AI", "automation", "tax technology", "practice management"]
slug: "/insights/could-an-ai-agent-run-your-tax-firm"
keywords:
  - "AI tax agent"
  - "agentic AI tax"
  - "autonomous tax preparation"
  - "OpenClaw"
  - "AI for accounting firms"
  - "tax practice automation"
  - "responsible AI adoption"
---

## March 15th, 4:23 PM

Your phone buzzes. A client messages: *"I just got a CP2000 notice. What do I do?"*

Normal response: you type a long answer, bookmark a link to the IRS page, promise to circle back Monday, and add it to the pile.

But what if an AI agent on your team could handle that instantly? Pull the client's file, scan the notice, check prior-year returns, draft a response, and surface relevant IRS guidance — all while you finish the return you're actually billing for.

This isn't science fiction. It's what an agentic AI system can do right now. The question isn't *whether* it's possible. It's whether you should let it.

## What Is an "AI Agent"?

You've used ChatGPT. You type a question, it types an answer. That's a **chatbot** — it has a mouth but no hands.

An **AI agent** is different. It has access to tools — databases, APIs, file systems — and can take actions. It doesn't just answer questions. It *does things*.

The system running this conversation? It's built on [OpenClaw](https://github.com/openclaw) — an open-source framework that gives AI agents access to tools like:

- Reading and writing files
- Searching the web
- Running SQL queries against client databases
- Sending messages and emails
- Generating images, videos, and documents
- Executing shell commands (sandboxed)

In other words: it can **work**, not just talk.

For a tax firm, that distinction changes everything.

## Tier 1: The Research Assistant (Low Risk)

**What it does:** Answers complex tax questions by cross-referencing your internal knowledge base, prior returns, and current IRS guidance.

**Example:** *"What's the California treatment of S corp distributions for a client who moved from Nevada mid-year?"*

**The agent:**
1. Queries your internal database for the client's entity type and filing history
2. Cross-references current CA FTB guidance on residency changes
3. Checks for any state-level conformity quirks on S corp distributions
4. Returns a concise answer with citations

**Risk:** Low. The agent is producing research, not filing a return. You still review and apply the answer yourself.

**Time saved:** 10-15 minutes per research query. If your team fields 10 such questions a week, that's 2-3 hours saved.

## Tier 2: The Intake Coordinator (Moderate Risk)

**What it does:** Manages the document collection and client communication pipeline.

**Example:** A prospect submits an engagement letter. The agent:
1. Creates a folder structure for the client
2. Sends an automated document request (W-2s, 1099s, prior returns, etc.)
3. Checks in weekly with follow-up reminders on missing items
4. Flags incomplete submissions and drafts a status summary for the preparer
5. Detects when a client uploads something unusual (like a K-1 you weren't expecting) and alerts the team

**Risk:** Moderate. The agent is handling client-facing communication and document intake. A hallucinated follow-up or a missed document flag could delay the engagement. But with proper review gates, the upside in efficiency is enormous.

**Time saved:** 3-5 hours per engagement on intake alone.

## Tier 3: The Prep Assistant (High Stakes)

**What it does:** Drafts return data entry from source documents.

**This is the line most firms shouldn't cross yet.**

Here's what it looks like when it works: A client uploads their tax organizer, W-2s, and 1099s. The agent extracts the data, maps it to the correct fields in your tax prep software, flags items that need human judgment (like "was this 1099-MISC for consulting or rental income?"), and presents you with a pre-populated return for review.

Here's what it looks like when it doesn't: The agent misreads a Form 1099-B and classifies a short-term capital gain as long-term, or misses a state filing requirement because it didn't check the nexus rules.

**Risk:** High. You're now relying on an AI to interpret source documents, apply tax law, and populate a filing. Errors in Tier 3 have real consequences — penalties, audits, client relationships.

## Why You Probably Shouldn't Do This Yet

I'm bullish on agentic AI for tax. But here's the honest truth for most firms:

### Hallucinations aren't solved

Even the best models occasionally fabricate facts. In tax, a fabricated IRC section or a confidently wrong state filing threshold can cost your client real money. Until agents can reliably say "I don't know" instead of making something up, you need a human in the loop.

### PII is a minefield

Giving an AI agent database access means it can read client PII. That's fine if your agent is running locally or on a compliant cloud instance. It's a regulatory disaster if the agent is using a public API where your data trains someone else's model.

### Liability doesn't transfer

If an AI agent makes a mistake, the IRS doesn't fine the agent. They fine you. Your professional liability insurance doesn't cover AI errors unless you've specifically reviewed your policy.

### The regulatory landscape is gray

The IRS hasn't issued formal guidance on agentic AI in tax preparation. Circular 230 requires practitioners to exercise "due diligence" — but how do you supervise an agent that works autonomously? The professional standards bodies are still figuring this out.

## What Responsible Early Adoption Looks Like

If you want to experiment with agentic AI in your firm, here's the playbook:

### 1. Start at Tier 1

Build a research assistant first. Let it query your knowledge base and pull client data for your review. No client-facing actions, no unsupervised data entry. This alone will save you hours and give you confidence in the technology.

### 2. Use guardrails

- **Read-only database access** — the agent can query but never write
- **Human approval gates** — every action is a suggestion, not an execution
- **Session isolation** — agents run in sandboxed environments with no access to production systems by default
- **Audit trails** — every action the agent takes is logged for review

### 3. Document your AI policy

Write down: what the agent can access, what it can do, who reviews its work, and how you handle errors. This isn't just good practice — it's your defense if the IRS or a professional board ever asks how you're maintaining due diligence.

### 4. Go firm-wide only when you trust it like a senior associate

Would you let a first-year associate file a return without review? Probably not. Treat your AI agent the same way. When you'd trust it to prep a return unsupervised, then you can flip the switch.

## The Closer

Ten years from now, every tax firm will use AI agents the way they use email today — it'll be infrastructure, not a differentiator.

But between now and then, there's a window. The firms that figure out how to use agents *responsibly* — starting with low-risk tasks, building internal policy, training their teams — will have a structural advantage over firms that either dive in recklessly or ignore it entirely.

That's why we're having this conversation at TaxProExchange. We're building a marketplace where tax professionals connect, share knowledge, and figure out the future of the profession together. Agentic AI is part of that future.

Whether you're experimenting with research agents today or waiting for the regulatory landscape to settle, you're in the right place. The firms that prepare now will be the ones competing — and winning — in the decade ahead.

---
title: "Should Your Tax Firm Build Its Own AI Tax Assistant?"
description: "AI is transforming how firms handle tax data. But should your firm build its own local AI tax assistant, or rely on trusted AI assistants like TaxGPT or BlueJ?"
author: "Koen Van Duyse"
authorLinkedIn: "https://www.linkedin.com/in/koenvanduyse/"
authorReddit: "https://www.reddit.com/user/RepliKoen/"
authorTPE: "https://www.taxproexchange.com/p/koen-van-duyse-8123510e"
authorBio: "Koen has been working in AI for the last two years, with an emphasis on conversational AI. In his spare time he is partner of a small tax firm in Southern California and runs the Tax Pro Exchange."
authorImage: "/images/authors/koen-van-duyse.jpg"
date: 2025-10-26
category: "AI"
pillar: "Future of Tax Work"
keywords: ["AI tax assistant","local AI for tax firms","private LLM for accountants","AI tax automation","best AI tax tools for CPAs"]
image: "/images/ai-tax-assistant-local-llm.png"
imageCaption: "Our very simple CPA-LLM up and running answering questions. Some GPU power would make the app a lot faster and better at reasoning."
previewImage: "/images/CPA_AI_Desktop.png"
readingTime: 9
slug: "/ai/ai-tax-assistant-local-llm"
canonical: "https://www.taxproexchange.com/ai/ai-tax-assistant-local-llm"
---

## Promises, Promises...

The biggest promise of AI is that it can take care of high-volume, low-EQ work: the tedious tasks that drain your team’s time.  
Think data entry from PDFs into tax software or digging through client documents for evidence.

With the AI boom, new tools keep appearing that promise to help: from auto-parsing PDFs that plug directly into Drake ("your tax tool will be supported soon as well!") to services claiming to generate and validate IRS forms (“for now only 1040s, but the rest is on the roadmap”). Everything, it seems, will be automated.

I’ve worked in AI for the past 18 months and have seen enough to know that the technology is real, and it’s coming to solve real problems. But the hype is just as real. The question is: who will actually deliver on the promise?

Another issue is data privacy and security. Name a cloud platform, and you’ll find a data breach report of that provider. It’s no surprise some firms want to run everything in-house. The question I want to dig into here is whether that’s doable and whether it makes sense. Let's dig in!

---

## The Best Way To Find Out Is To Build It Yourself

To answer that question, I built a local LLM prototype to act as a basic tax assistant. At minimum, I wanted it to:

- Manage years and clients  
- Store their files  
- Allow me to chat with those files  

Example query:  
> Did we miss any deductions for client X in 2023?

It’s an attractive idea for tech-forward firms that like to experiment.  
Imagine feeding your own client PDFs, internal memos, and prior-year workpapers into a secure model that understands your workflow and language.  
No external APIs. No vendor data-sharing clauses. Just your files, your model, your control.

---

## What I Actually Built

I know enough about building apps to realize I have to keep it simple: one question, one prototype.  
Could a local model read a Form 1040 PDF and correctly tell us what’s on Line 24 (Total Tax)?

To do that, I stitched together a minimal pipeline using open tools:

- **DeepSeek-OCR** to extract text from PDFs, including scans  
- **Mistral 7B**, a small open-source language model that can run on a single machine  
- **Ollama** to run that model locally  
- **LangChain**, a developer library that connects your documents to an AI so you can ask questions about them  
- **A tiny web app** for uploads, storage, and Q&A  

I ran everything on a Windows laptop with 32 GB RAM and no GPU. That alone tells you the app was slow, and that running this kind of setup in-house wouldn’t be cheap. You’d need serious hardware to support multiple users simultaneously.

In short, the local assistant worked. It could find the right values, explain where they came from, and reason with the data.  
But the biggest surprise: the model wasn’t the hard part. Reading the actual PDFs was.

Tools like ChatGPT hide enormous pre-processing pipelines. Before a model "reads" your tax document, entire systems handle OCR, document classification, and validation. Rebuilding even a small portion of that locally was doable, but with the following notes:
- The current best way to make PDF files available to LLMs is by first scanning them as high-resolution images. There are several libraries that do this automatically. DeepSeek (at the time of writing) scores very high but needs quite some compute power.
- After images are scanned (one per page), data can be extracted in chunks so RAG can be used to feed the right data to the LLM for reasoning. In practice, that means the AI only answers based on the documents you've uploaded, rather than guessing from its training data.
- I used Mistral for the model. It was okay at reasoning with the data, but I wouldn't trust it to file my returns. That's fine because it's just a test—for a full build, I would need to do some serious testing and validation.

---

## Why a Local AI Tax Assistant Might Make Sense

Running AI in-house isn’t for everyone, but it can make sense in certain situations:

- **Privacy-first engagements.** Some clients or regulators prohibit data from leaving your systems.  
- **Auditability.** Local setups can log every query and data source.  
- **Cost control.** No per-token API fees. You pay for hardware and maintenance you control.  
- **Customization.** You can bake in firm-specific rules or document templates.  
- **Offline reliability.** It keeps working even if your internet doesn’t.

If those factors matter to your firm, a local AI pilot may be worth exploring.

---

## The Trade-Offs

Every benefit comes with a trade-off:

- **Maintenance.** Models and dependencies change often; someone has to patch, test, and tune.  
- **Hardware limits.** Even small models can demand heavy compute under load.  
- **Scope creep.** Once people see results, they’ll want more: K-1s, schedules, multi-year comparisons.  
- **Opportunity cost.** Time spent maintaining AI is time not spent serving clients.

In short, what you build yourself, you must maintain yourself.

---

## Costs and Practical Realities

We ran our prototype on a basic machine. A small desktop GPU setup might cost $2,000–$3,000, but a reliable firm-grade configuration would likely run closer to $20,000. Most of the real cost isn’t hardware, it’s people. You’ll need ongoing technical effort to keep things running, since the stack changes constantly.

Here’s a quick way to anchor the numbers:

| Scenario | Example Components | Who It Serves | Approx. One-Time Cost | Ongoing Effort |
|---|---|---|---:|---|
| **Skunkworks Pilot** | Consumer desktop, 32–64 GB RAM, no GPU | 1 developer, 1–2 testers | $2k–$3k | A few hours per week to tinker |
| **Team Sandbox** | Workstation with entry GPU (e.g., 24 GB VRAM), 128 GB RAM, fast NVMe | 2–5 users, not concurrent heavy use | $6k–$10k | Part-time admin plus updates each month |
| **Firm-Grade** | Server chassis, 48–80 GB VRAM GPU, redundant storage, secure networking | 10–25 users, light concurrency | $15k–$25k | Dedicated admin processes, patching, monitoring |
| **Production-Ready** | Multiple GPUs, high-availability storage, SIEM logging, backup/DR | 25+ users, real concurrency | $40k+ | Formal change management and on-call support |

People time is the hidden line item. Someone has to own model updates, OCR tuning, prompt evaluation, and security hardening.

If you already have an internal IT or R&D group, they’ll manage fine. For most small and mid-sized firms, though, partnering with a vendor that already handles privacy and compliance will make more sense.

---

## DIY vs Vendor: Where Vendors Pull Ahead

A neutral comparison is helpful, but most firms care about risk and time to value. This is where established vendor tools usually lead:

- **Compliance updates.** Vendors track IRS form changes and state updates, then ship them inside their pipelines so you don't have to rebuild extractors each season.  
- **Liability and risk management.** If your DIY assistant misreads a line item and you rely on it, that risk sits squarely with your firm. Vendor tools usually carry SLAs, support, and audits that shift some of that liability.  
- **Security programs.** Reputable platforms operate under third-party audits like SOC 2, maintain audit logs, and provide role-based access controls. Rolling your own means designing, documenting, and testing all of this yourself.  
- **Data handling.** Mature tools offer PII redaction, retention controls, and tenant isolation. In-house builds require you to define and enforce those policies.  
- **Support and SLAs.** When something breaks on March 15, support coverage matters.  
- **Integrations.** Connectors to tax suites, storage, and e-signature tools reduce manual steps your staff would otherwise maintain.

That doesn’t mean DIY is wrong. It means the bar for “production ready” is higher than a working demo. If your goal is faster reviews, fewer keystrokes, and better documentation trails, compare the fully loaded cost of in-house maintenance against vendor subscriptions that already bundle these obligations.

Solutions like [TaxGPT](/partners/taxgpt), [BlueJ](/partners/bluej), and Black Ore focus on privacy-first architectures and move quickly with the ecosystem. For many firms, the smarter move is piloting with one of these tools, then deciding whether additional local components are worth the complexity.

---

## Key Takeaways

- Yes, you can build a private AI tax assistant.  
- The challenge is the data pipeline, not only the model.  
- It’s viable when data privacy is non-negotiable or when you need absolute control.  
- It’s heavy to maintain if you’re doing it alone.  
- Vendors earn their keep by absorbing compliance, security, updates, and integration work.

---

## Closing Thoughts

Local AI will have a place in the profession. But just because we can build it ourselves doesn’t mean every firm should.

For most, the better question isn’t “Can we run an AI model locally?”, it’s “How do we use AI safely to deliver better client outcomes?”

We built this prototype to understand what’s possible and to separate real value from hype. Now I’m curious: how would your firm balance control and convenience?

If you'd rather skip the maintenance and still keep client data private, take a look at our verified partners like [TaxGPT](/partners/taxgpt), [BlueJ](/partners/bluej), and Black Ore, tools built for tax professionals who want secure, AI-driven insights without running servers. Want to go deeper? Join the TaxProExchange community to compare pilots with peers, or register for our upcoming webinar where I'll demo the prototype and share implementation checklists.

---
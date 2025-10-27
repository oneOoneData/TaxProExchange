---
title: "Under the Hood: Building a Local CPA LLM Assistant for 1040s with OCR, Rules, and RAG"
description: "A technical deep dive into how we built a local CPA LLM assistant that parses 1040s using OCR, validation rules, and retrieval-augmented generation. Learn what worked, what didn't, and where this technology can go next."
author: "Koen Van Duyse"
authorLinkedIn: "https://www.linkedin.com/in/koenvanduyse/"
authorReddit: "https://www.reddit.com/user/RepliKoen/"
authorTPE: "https://www.taxproexchange.com/p/koen-van-duyse-8123510e"
authorBio: "Koen has been working in AI for the last two years, with an emphasis on conversational AI. In his spare time he is partner of a small tax firm in Southern California and runs the Tax Pro Exchange."
authorImage: "/images/authors/koen-van-duyse.jpg"
date: 2025-10-26
category: "AI"
pillar: "Local AI for Tax Firms"
keywords: ["CPA LLM assistant","local AI for tax firms","OCR 1040","RAG for PDFs","AI tax automation","private LLM accounting"]
image: "/images/local-cpa-llm-deep-dive.jpg"
previewImage: "/images/deepseek_ocr.png"
readingTime: 11
slug: "/ai/local-cpa-llm-deep-dive"
canonical: "https://www.taxproexchange.com/ai/local-cpa-llm-deep-dive"
---

## From Curiosity to Code

When we published our first piece about building a local AI tax assistant, the most common response I got was some version of, "But could that really work?"  
It's a fair question. Running large language models inside a firm feels like a moonshot, especially when you're used to sending data to cloud tools like ChatGPT or [TaxGPT](/partners/taxgpt).  

So we decided to find out. The experiment became our internal project, code-named *Thunderdome*. The goal was simple enough to measure: could we build a **local CPA LLM assistant** that reads a client's 1040, extracts the right numbers, and answers questions about them without any data leaving the office?

The answer is yes. But along the way we discovered that the hardest part of local AI isn't the model at all. It's the humble PDF.

---

## Step 1: Defining the Problem

We started with the simplest possible test: take a 2023 Form 1040 and get accurate values for key lines like total income, total tax, and refund.  
Digital PDFs with selectable text seemed easy enough, but scanned returns—the kind many clients still send—are where things fall apart.

Our success criteria were simple:  
1. The model had to pull accurate numbers.  
2. It had to show exactly where those numbers came from.  
3. It couldn't send data anywhere outside the local machine.  

That was the bar. Everything else—speed, UI, or even model choice—came second.

---

## Step 2: The First Parser and Its Early Failure

We began with **pdfplumber**, a Python library that can read text directly from PDFs. It worked perfectly for digital returns with text layers intact.  
Then we fed it a scanned return and watched it crumble.  

Scanned PDFs are basically photos. Without a text layer, there's nothing to extract. The parser couldn't tell where numbers were, only that "something" was on the page.  
That's when we realized this project was as much about **document engineering** as AI.

Lesson one: if you can't read the form, you can't reason about it.

---

## Step 3: Bringing in OCR

Our second attempt introduced **Optical Character Recognition (OCR)** through a combination of `pdf2image` and `pytesseract`.  
Now we could turn each page of a PDF into an image and run OCR to identify text.

This worked beautifully on legible scans. The model could now see both text and numbers.  
The problem was the layout. OCR isn't spatially aware by default. It reads line by line, guessing where each word belongs.  

That led to some truly entertaining results: "Michelle paid 37" instead of "Total tax $4,351."  
Numbers drifted out of context. Line labels were mixed up with values.  
We had solved visibility but lost structure.

Lesson two: OCR gives you eyes, not understanding.

---

## Step 4: Adding Structure, Anchors, and Rules

The breakthrough came when we stopped treating the 1040 like text and started treating it like a map.  
Every field on a tax form lives in a predictable spot. Line 24 is always on page 2, near the bottom right. That gave us an idea.

We created **zonal maps**—coordinates for each line on the form. The parser now looks for the phrase "Line 24," then extracts numbers from a bounding box to the right of it.  
That restored order to the chaos.

We also added **validation rules**:  
- Line 24 should equal 16 + 17 + other lines within tolerance.  
- Ignore non-numeric symbols and dots that appear between line items.  
- Flag exceptions when sums don't match or numbers are unreadable.

Each extracted value was stored with its page number and bounding box, creating a digital "anchor." Reviewers could click any number and jump straight to its source.  

This step turned the project from a toy into something that felt real.  
Accuracy jumped, and more importantly, reviewers could trust the results because they were traceable.

Lesson three: validation and provenance matter more than the AI itself.

---

## Step 5: The Local Model Layer

Once the extraction pipeline worked, it was time to make it conversational.  
We used **Mistral 7B**, a small open-source model that can run locally through **Ollama**.  
It's light enough for a modern laptop yet powerful enough to handle context-rich prompts.

To give it memory, we added **LangChain** and a **Chroma** embedding database.  
Each validated field and snippet of text became a searchable vector entry.  
When we asked, "What's the total tax?" the system didn't guess. It retrieved the validated value and cited the source page.

If the answer didn't exist, it simply said "Not found."  
No hallucinations, no invented numbers. Just facts from the extracted data.

Lesson four: RAG—retrieval augmented generation—works best when the retrieval part is rock solid.

---

## Step 6: The Frontend and Workflow

We built a small web interface in **Next.js**. It lets users upload a PDF, view parsed results, see validation logs, and chat with the local model.  
Behind the scenes, the app calls a Python script that runs the OCR and parsing steps, saves the results to a local database, and exposes them through an API.  

We used **Supabase** for structured storage and **Clerk** for authentication so we could run multiple test accounts safely.  
It's simple, but it works: upload → process → verify → ask questions.

Once we had the chat window talking to our validated data, something clicked. You could literally ask, "Compare this year's Line 24 to last year's," and get a clear, sourced answer.

It wasn't magic. It was plumbing.

---

## Step 7: Results and Benchmarks

We ran the assistant on a mix of returns:  
| Type | Accuracy | Average Time | Notes |
|------|-----------|---------------|-------|
| Digital 1040 | ~98% | 10 seconds | Nearly perfect |
| Scanned 1040 | ~85% | 20–40 seconds | OCR errors from dotted lines |
| Handwritten 1040 | ~70% | 30–60 seconds | Human review still required |

The key insight: trust came from **provenance**. Reviewers could click a number and instantly see the page region it came from.  
No one cared whether the model was "smart." They cared that it could show its work.

---

## Step 8: The Trade-Offs

Running an AI model locally has real benefits:  
- Data never leaves your machine.  
- No per-token API costs.  
- Complete control over how the model behaves.  

But it also introduces trade-offs:  
- Maintenance overhead when models update.  
- Hardware strain under heavy workloads.  
- Continuous calibration for new form layouts.  
- Extra time spent on IT instead of tax work.

Local AI is powerful, but it comes with a price. What you build, you own—and you maintain.

---

<details>
<summary>

## Hardware Requirements for a Medium-Sized Firm

</summary>

Running an AI tax assistant for a single user on a laptop is one thing.  
Scaling that setup to support an entire firm—say, 50 concurrent users—is a very different story.

From a recent Reddit discussion among IT managers at large accounting firms, one example **local LLM server build** shows just how high-end this can get.

### Example Enterprise-Grade Build

| Component | Spec | Estimated Cost |
|------------|------|----------------|
| **GPUs** | Dual NVIDIA RTX 6000 Ada (Pro) | $13 K – $14 K |
| **CPU** | AMD EPYC 9575F (128 cores / Genoa) | $8 K – $9 K |
| **Motherboard** | Supermicro H14SSL-NT-O | $700 – $1 K |
| **Memory** | 1.15 TB DDR5 ECC (96 GB × 12) | $6 K – $8 K |
| **Storage** | 4 × Kioxia CM7-R 3.84 TB NVMe SSD | ≈ $2.5 K |
| **Misc.** | Case, PSU, cooling, networking | ≈ $2 K |

**➡ Total ballpark:** $32 K – $36 K for one high-performance server.

### What That Means in Practice

- **Larger firms** experimenting with fully private AI environments (for parsing 1040s or hosting firm-wide copilots) should expect to spend **$30 K – $50 K per server**, plus maintenance and energy costs.  
- **Medium-sized firms** can sometimes get by with a lighter build — for example, a **single RTX 4090 + Threadripper / EPYC workstation**, usually **$7 K – $10 K** — though performance and concurrency will be limited.  
- **Smaller shops** rarely build their own. They typically:
  - Rent GPU servers in the cloud (**$2 – $6/hour** for A100/H100-class GPUs), or  
  - Partner with vendors offering hybrid setups that keep sensitive data on-prem while using hosted compute for model inference.

In short, running a private LLM for dozens of staff is feasible—but it's closer to a **data-center project** than an office PC upgrade.

</details>

---

## Step 9: Future Improvements

If we were starting again today, we'd replace `pytesseract` with **DeepSeek-OCR**, which handles complex tax forms with better accuracy.  
We'd also create a **rules DSL** so reviewers could edit validation logic without touching code.  

Other next steps include:  
- Support for K-1s and Schedules  
- Auto-deskewing and rotation detection for scanned forms  
- A dashboard to compare year-over-year metrics  
- Exportable audit logs for peer review  

The underlying framework is solid. It just needs refinement to move from prototype to production.

---

## Step 10: Build or Buy?

So, should your firm build its own CPA LLM assistant?  
It depends on your goals.

If privacy and control are non-negotiable, a local model makes sense.  
But if your team's time is better spent serving clients, partner tools like **[TaxGPT](/partners/taxgpt)** or **[BlueJ](/partners/bluej)** offer similar privacy benefits with far less overhead.  
They already include managed OCR pipelines, versioned models, and compliance reporting that would take months to rebuild internally.

My takeaway is simple: we built our own to understand the plumbing, not to replace the vendor ecosystem.  
Knowing what's behind the curtain makes you a better buyer and a smarter user.

---

## Conclusion

Our experiment proved that a **local CPA LLM assistant** is more than possible—it's practical within limits.  
The hard part isn't intelligence. It's reliable, validated data.  

AI doesn't replace the professional judgment of a CPA or EA. It augments it, as long as you can trust the numbers it gives back.  
Running it locally gives unmatched privacy, but at the cost of constant maintenance.  

I'm curious how your firm would approach this. Would you rather build a private model in-house, or lean on trusted AI tax partners that handle the heavy lifting?  

If you'd like to skip the engineering and still keep client data secure, check out verified partners like **[TaxGPT](/partners/taxgpt)** and **[BlueJ](/partners/bluej)**—both designed to give tax professionals AI-powered insights without losing control of their data.

---

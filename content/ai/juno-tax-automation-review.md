---
title: "Juno's Tax Automation Features: A Technical Review"
description: "A factual, technical review of Juno's tax automation platform, covering document intake, data extraction, exports, Reviewer quality checks, AI advisor tools, workflow impact, and future development roadmap."
author: "Koen Van Duyse"
authorLinkedIn: "https://www.linkedin.com/in/koenvanduyse/"
authorReddit: "https://www.reddit.com/user/RepliKoen/"
authorTPE: "https://www.taxproexchange.com/p/koen-van-duyse-8123510e"
authorBio: "Koen has been working in AI for the last two years, with an emphasis on conversational AI. In his spare time he is partner of a small tax firm in Southern California and runs the Tax Pro Exchange."
authorImage: "/images/authors/koen-van-duyse.jpg"
date: "2025-11-22"
category: "AI"
pillar: "Tax Technology"
slug: "/ai/juno-tax-automation-review"
keywords:
  - "Juno tax software"
  - "Juno tax automation review"
  - "AI tax workflow tools"
  - "1040 automation platforms"
  - "Juno Reviewer feature"
  - "tax document automation"
  - "Juno AI Advisor"
  - "SurePrep alternatives"
  - "tax technology review"
  - "AI in tax firms"
previewImage: "/images/juno-logo.png"
imageAlt: "Juno Tax Automation platform review"
canonical: "https://www.taxproexchange.com/ai/juno-tax-automation-review"
readingTime: 12
robots: "index,follow"
ogTitle: "Juno's Tax Automation Features: A Technical Review"
ogDescription: "An in-depth, technical, and non-salesy review of Juno's tax automation platform based on a recent demonstration."
ogImage: "/images/juno-logo.png"
twitterCard: "summary_large_image"
twitterTitle: "Juno's Tax Automation Features: A Technical Review"
twitterDescription: "A factual review of Juno's tax automation platform covering document intake, exports, Reviewer, and AI tools."
twitterImage: "/images/juno-logo.png"
schemaType: "Article"
---

This review is based on a recent demonstration of Juno's platform. The author is not affiliated with Juno.

Before diving in, you may also want to compare this with our analysis:  
- **SurePrep in an AI-First World**: [/ai/sureprep-in-an-ai-first-world](/ai/sureprep-in-an-ai-first-world)  
- **AI Tools Directory**: [/ai/tools](/ai/tools)

---

## 1. Document Input and Data Collection

Juno uses automation to process much of the initial tax preparation stage through its acceptance of many types of input formats:

- Scanned or photographed images  
- Hand-written notes  
- Spreadsheet files created in Microsoft Excel  
- Documents containing mixed formats  

No template or specific formatting requirements apply to documents submitted by clients.

### Data Collection and Classification

Juno identifies many commonly-used federal forms (W-2, 1099s, K-1s, Consolidated Brokerage Statements). State-level K-1 footnotes are still being developed to improve accuracy.

Fields that contain low-confidence or incomplete data are automatically flagged for manual review by Juno's users. Juno identifies duplicate or mismatched forms (for example, outdated tax year forms) before they are exported.

### Workpapers and Binder Functionality

Once Juno has processed the client's documentation, it creates a digital binder that contains:

- Document classifications  
- Extracted field values  
- Manual review flags  
- Items requiring user input  

Annotation tools, highlighting, calculation capabilities and better multi-state K-1 display functionality will be added in the next version of Juno.

---

## **Juno Data Intake Summary (For Featured Snippet Targeting)**

| Input Type | Supported | Notes |
|------------|-----------|-------|
| PDFs | ✔️ | No templates required |
| Photos / scans | ✔️ | Auto-orients files |
| Excel / spreadsheets | ✔️ | Reads multi-sheet files |
| Handwritten notes | ✔️ | Accuracy depends on clarity |
| State K-1 footnotes | ✔️ (Developing) | Still improving |

---

## 2. Exports and Prior Year Mappings to Tax Preparation Systems

Juno exports extracted data directly to supported tax preparation systems.

### Export Mechanics

- **Average export time:** 2–3 minutes per return.  
- Exports may be generated to both desktop tax software via a local agent and to cloud-based systems via a browser agent.  
- Multiple exports are permitted without additional charges.  
- Users may override export settings to avoid duplicating prior year data when exporting to a tax preparation system.

### Prior-Year Consistency

Juno attempts to match the prior year information in the following categories during export:

- Rental properties  
- Entities  
- Schedules for fixed assets  

This ensures that prior year structures are not duplicated or recreated within the tax preparation system.

The company will provide follow-up video demonstrations showing exports of the specific tax preparation software used by each firm.

---

## 3. Reviewer: Error Detection and Quality Assurance

Reviewer is a feature built into Juno to assist in detecting errors prior to the finalization of a return.

### Error Detection and Exception Identification

Reviewer compares the extracted source data with the final 1040 return data to highlight discrepancies and/or missing information.

### Diagnostic Checks ("Gotchas")

Reviewer performs several diagnostic checks on the extracted source data versus the final 1040 return data, which include:

- Filing status issues  
- Eligibility for credits  
- Penalty triggers  
- Carryover inconsistencies  
- Structural errors between forms  

### Workflow Functions

- Notes and timestamps  
- Multi-user handoffs (junior staff → preparer → reviewer)  
- Customized checklists by firm  
- Tracking status of each review step  

Firms that use Reviewer report significantly less time spent reviewing returns, and senior reviewers typically only review exceptional items.

---

## 4. AI Tools: Assistant and Advisor

Two AI-based modules are available for use in Juno.

### Assistant

A general-purpose tool that can be used for:

- General tax questions  
- Drafting emails  
- Summarizing IRS notices  
- Creating internal firm content  

The Assistant module **does not** assist with preparing returns.

### Advisor

A document-aware tool that analyzes the client's uploaded returns and documents to generate:

- Tax projections  
- Checklists for documents  
- Comparisons of years over year  
- Strategic summaries  
- Draft advisory reports generated from document analysis  

Advisor obtains tax rules from the IRS, Treasury Department and State Agencies and also includes citations and hyperlinks.  
Sources:  
- https://www.irs.gov/forms-instructions  
- https://home.treasury.gov/policy-issues/taxes  

An upcoming update will enable converting advisory reports into a presentation format.

---

## 5. Workflow Changes Made at One Firm

This one firm that uses Juno indicated the following structural changes occurred within their workflow:

- The firm moved from a larger team to **two full-time employees and three part-time/hourly accountants**.  
- Document handling administrative work was reduced by **approximately 95%**.  
- The average time spent per return decreased by **around 50%**.  
- Reviewers now spend **15–30 minutes** per return on average.  
- Contractor hourly rates are approximately **$55 to $60**, with flexible scheduling options for working parents.

This reflects the redesign of one firm's workflow and may not be representative of all Juno users.

---

## 6. Juno Platform Development and Future Plans

Juno is an AI-based platform designed for small to medium-sized tax firms. Current and planned development includes:

### Current Development Phase

- During beta, Juno processed approximately **20,000 returns**.  
- Rolled out to roughly **15 pilot firms**.  
- Venture-backed; the team expressed plans to reach **profitability by January**.  

### Future Developments

Planned improvements include:

- Increasing 1040 automation accuracy from **~90% to 97%**.  
- Expanding support for:  
  - Partnerships (Form 1065)  
  - S corporations (Form 1120-S)  
  - Trusts and Estates (Form 1041)  
- Improved binder UI  
- Better multi-state K-1 extraction  
- Additional Reviewer features for passive activity checks and year-over-year changes  

### Practice Management Integration Approach

Although Juno integrates with practice management tools such as TaxDome, it does not aim to be a full-service practice management system. The goal is to avoid locking firms into a single software ecosystem.

---

## 7. Conclusion: Juno's Current Role

With its current features, Juno is most suitable for firms that:

- Process large volumes of 1040s  
- Require automated document intake without templates  
- Need a structured export workflow with prior-year mapping  
- Use reviewers heavily and need discrepancy detection  
- Want AI assistance for analysis, communication, and basic advisory functions  

### Areas Still Developing

- Multi-state K-1 extraction for complex returns  
- Business returns (1120, 1120-S, 1065)  
- Trust and estate returns (1041)  
- Advanced practice management functionality  

---

## **Frequently Asked Questions About Juno's Tax Automation Platform**

**Is Juno a tax preparation system?**  
No. Juno extracts, organizes, and exports data but tax preparation occurs inside the user's tax software.

**Does Juno replace systems like SurePrep or GruntWorx?**  
It replaces some workflows (intake, extraction, workpapers) but uses a different AI-first approach.

**Does Juno prepare 1120-S, 1065, or 1041 returns?**  
Support for business returns and trust/estate returns is planned but not yet fully implemented.

**What tax software does Juno export to?**  
Juno exports to desktop and cloud-based tax preparation systems using local or browser agents. Common supported tax software includes Intuit Lacerte, Intuit ProSeries, Intuit ProConnect, Thomson Reuters UltraTax CS, Drake Tax, CCH Axcess Tax, CCH ProSystem fx Tax, and other major professional tax preparation systems. *At the time of writing.*

**What is Reviewer used for?**  
Reviewer checks for mismatches, missing information, filing issues, carryover discrepancies, and cross-form structural issues.


-- AI Tools directory refresh (Nov 2026)
-- * Adds review_url so tools can link to our own TPE review article
-- * Collapses 11 ad-hoc categories into 5 user-facing ones
-- * Fixes inaccurate descriptions (Juno, Bizora, CoCounsel, TaxGPT)
-- * Adds tools that became important in 2026
-- Non-destructive: no drops, idempotent inserts.

alter table ai_tools add column if not exists review_url text;

-- ---------- Categories ----------
update ai_tools set category = 'Tax Research', updated_at = now()
  where slug in ('bluej','bloomberg-tax-ai','cocounsel','taxbert','accordance','taxgpt','bizora');

update ai_tools set category = 'Return Prep & Data Entry', updated_at = now()
  where slug in ('black-ore','filed','hivetax','magnetic-tax','juno-tax','sureprep','gruntworx','k1x');

update ai_tools set category = 'Intake & Workflow', updated_at = now()
  where slug in ('stanfordtax','truss-ai','soraban','solomon');

update ai_tools set category = 'Planning & Advisory', updated_at = now()
  where slug in ('corvee');

update ai_tools set category = 'Bookkeeping & Accounting', updated_at = now()
  where slug in ('truewind');

-- ---------- Description fixes ----------
update ai_tools set
  short_description = 'Extracts data from W-2s, 1099s and K-1s into your tax software, then compares source documents against the return.',
  updated_at = now()
where slug = 'juno-tax';

update ai_tools set
  short_description = 'AI tax research and advisory platform that answers technical questions with citations and drafts client-ready memos.',
  updated_at = now()
where slug = 'bizora';

update ai_tools set
  short_description = 'Thomson Reuters'' agentic AI for tax and accounting, grounded in Checkpoint, with calculations, Excel workpapers and UltraTax integration.',
  website_url = 'https://tax.thomsonreuters.com',
  updated_at = now()
where slug = 'cocounsel';

update ai_tools set
  short_description = 'Tax-trained AI assistant for research, drafting, return review and IRS notice responses, now with an autonomous workflow agent.',
  updated_at = now()
where slug = 'taxgpt';

update ai_tools set
  short_description = 'Intake platform that builds checklists from prior-year data, collects documents without client logins, and handles delivery.',
  updated_at = now()
where slug = 'truss-ai';

-- ---------- Link our own reviews ----------
update ai_tools set review_url = '/insights/taxgpt-review-what-tax-pros-actually-say' where slug = 'taxgpt';
update ai_tools set review_url = '/insights/blue-j-review' where slug = 'bluej';
update ai_tools set review_url = '/insights/juno-tax-automation-review' where slug = 'juno-tax';
update ai_tools set review_url = '/insights/solomon-ai-review' where slug = 'solomon';
update ai_tools set review_url = '/insights/truss-ai-review' where slug = 'truss-ai';
update ai_tools set review_url = '/insights/accordance-ai-review' where slug = 'accordance';
update ai_tools set review_url = '/insights/sureprep-in-an-ai-first-world' where slug = 'sureprep';

-- ---------- New tools ----------
insert into ai_tools (name, slug, category, website_url, short_description, search_phrase, created_at, updated_at) values
  ('CCH Axcess Expert AI', 'cch-axcess-expert-ai', 'Return Prep & Data Entry', 'https://www.wolterskluwer.com/en/solutions/cch-axcess',
   'Wolters Kluwer''s AI inside CCH Axcess, with agentic tax preparation launched in October 2026 for firms already on Axcess.',
   'CCH Axcess AI', now(), now()),
  ('Intuit Assist', 'intuit-assist', 'Planning & Advisory', 'https://accountants.intuit.com',
   'Intuit''s AI assistant in Intuit Tax Advisor that suggests strategies and builds tax plans from ProConnect and Lacerte returns.',
   'Intuit Assist', now(), now()),
  ('Instead', 'instead', 'Return Prep & Data Entry', 'https://www.instead.com',
   'Tax prep software with a credit-based AI agent for research, preparation, filing and IRS notice defense.',
   'Instead tax software', now(), now()),
  ('Basis', 'basis', 'Bookkeeping & Accounting', 'https://www.getbasis.ai',
   'AI agents that complete accounting, tax and audit workflows end to end; raised $100M at a $1.15B valuation in Feb 2026.',
   'Basis AI accounting', now(), now()),
  ('Karbon', 'karbon', 'Intake & Workflow', 'https://karbonhq.com',
   'Practice management platform with Kai, an AI coworker that triages email, drafts replies and turns requests into tasks.',
   'Karbon', now(), now()),
  ('TaxDome', 'taxdome', 'Intake & Workflow', 'https://taxdome.com',
   'Practice management and client portal with AI document checklists, client requests, reminders and e-signatures.',
   'TaxDome', now(), now()),
  ('Holistiplan', 'holistiplan', 'Planning & Advisory', 'https://holistiplan.com',
   'Scans a client''s return and produces a plain-English tax report with planning opportunities; widely used by advisors.',
   'Holistiplan', now(), now()),
  ('TaxPlanIQ', 'taxplaniq', 'Planning & Advisory', 'https://www.taxplaniq.com',
   'Flat-rate tax planning software that builds client plans from a library of 130+ strategies.',
   'TaxPlanIQ', now(), now())
on conflict (slug) do nothing;

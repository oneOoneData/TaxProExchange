-- Add specialization groups and update specializations table
-- This migration adds the group structure for better organization of tax specializations

-- Create specialization groups table
CREATE TABLE IF NOT EXISTS specialization_groups (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

-- Add group_key column to specializations table
ALTER TABLE specializations ADD COLUMN IF NOT EXISTS group_key TEXT REFERENCES specialization_groups(key);

-- Insert specialization groups
INSERT INTO specialization_groups(key,label) VALUES
('returns_entities','Returns & Entities'),
('representation','Representation & Controversy'),
('multistate_local','Multi-State & Local'),
('international','International'),
('industry','Industry Vertical'),
('transactions_planning','Transactions & Planning'),
('credits_incentives','Credits & Incentives'),
('estate_gift_fiduciary','Estate, Gift & Fiduciary'),
('nonprofit','Nonprofit & Exempt Orgs'),
('bookkeeping_close','Bookkeeping & Close'),
('payroll_contractor','Payroll & Contractor Compliance'),
('disaster_special','Disaster & Special Situations'),
('life_events','Life Events & Individuals')
ON CONFLICT DO NOTHING;

-- Clear existing specializations to replace with new taxonomy
DELETE FROM specializations;

-- Insert new specializations with groups
INSERT INTO specializations(slug,label,group_key) VALUES
-- Returns & Entities
('1040_individual','Individual (Form 1040)','returns_entities'),
('1120s_s_corp','S-Corporation (1120-S)','returns_entities'),
('1120_c_corp','C-Corporation (1120)','returns_entities'),
('1065_partnership','Partnership (1065)','returns_entities'),
('1041_trust_estate','Trust & Estate (1041)','returns_entities'),
('990_nonprofit','Nonprofit (990)','returns_entities'),
('706_estate','Estate Tax (706)','returns_entities'),
('709_gift','Gift Tax (709)','returns_entities'),
('payroll_941_940','Payroll (941/940)','returns_entities'),
('sales_excise_returns','Sales & Excise Returns','returns_entities'),
('1099_information_reporting','1099 Information Reporting','returns_entities'),

-- Representation & Controversy
('irs_rep_exams_audits','IRS Exams & Audits','representation'),
('collections_ia_oic','Collections (IA/OIC)','representation'),
('penalty_abatement','Penalty Abatement','representation'),
('amended_returns','Amended Returns','representation'),
('notice_response_cp_letters','Notice Responses','representation'),
('payroll_tax_issue','Payroll Tax Issues','representation'),
('trust_fund_recovery_penalty','TFRP Defense','representation'),

-- Multi-State & Local
('multistate_apportionment','Apportionment (Multi-State)','multistate_local'),
('nexus_analysis','Nexus Analysis','multistate_local'),
('state_franchise_gross_receipts','State Franchise/Gross Receipts','multistate_local'),
('city_county_local_tax','City/County Local Tax','multistate_local'),
('ca_specific','California (CA)','multistate_local'),
('ny_specific','New York (NY)','multistate_local'),
('tx_specific','Texas (TX)','multistate_local'),

-- International
('expat_inbound_outbound','Expat / Inbound-Outbound','international'),
('fbar_fincen114','FBAR (FinCEN 114)','international'),
('fatca_8938','FATCA (8938)','international'),
('foreign_tax_credit_1116','Foreign Tax Credit (1116)','international'),
('foreign_earned_income_2555','Foreign Earned Income (2555)','international'),
('5471_cfc','CFC (5471)','international'),
('5472_fdi','Foreign-Owned US Corp (5472)','international'),
('8865_foreign_partnership','Foreign Partnership (8865)','international'),
('8858_disregarded_foreign','Foreign Disregarded Entity (8858)','international'),
('treaty_positions','Treaty Positions','international'),
('firpta_8288a','FIRPTA (8288-A)','international'),
('itin','ITIN Processing','international'),

-- Industry Vertical
('real_estate_investors','Real Estate Investors','industry'),
('short_term_rentals','Short-Term Rentals','industry'),
('construction_contractors','Construction & Contractors','industry'),
('healthcare_professionals','Healthcare Professionals','industry'),
('ecommerce_marketplaces','E-commerce & Marketplaces','industry'),
('crypto_defi_nft','Crypto / DeFi / NFT','industry'),
('gig_economy_platforms','Gig Economy','industry'),
('restaurants_food','Restaurants & Food','industry'),
('trucking_logistics','Trucking & Logistics','industry'),
('cannabis_state_compliant','Cannabis (State-Compliant)','industry'),
('manufacturing','Manufacturing','industry'),
('oil_gas','Oil & Gas','industry'),
('film_tv_section181','Film & TV (Sec. 181)','industry'),

-- Transactions & Planning
('entity_selection_8832_2553','Entity Selection (8832/2553)','transactions_planning'),
('s_election_2553','S-Election (2553)','transactions_planning'),
('m_and_a_structuring','M&A Structuring','transactions_planning'),
('338h10_336e','338(h)(10)/336(e)','transactions_planning'),
('754_743b_adjustments','§754/§743(b) Adjustments','transactions_planning'),
('1031_like_kind','1031 Exchanges','transactions_planning'),
('cost_segregation','Cost Segregation','transactions_planning'),
('qsbs_1202','QSBS (§1202)','transactions_planning'),
('equity_comp_isos_nsos_rsus','Equity Comp (ISOs/NSOs/RSUs)','transactions_planning'),
('r_and_d_credit_6765','R&D Credit (6765)','transactions_planning'),
('erc_review_support','ERC Review/Support','transactions_planning'),
('nol_planning','NOL Planning','transactions_planning'),
('salt_cap_workaround_passthrough','SALT Cap Workaround (PTET)','transactions_planning'),
('retirement_plans_sep_solo401k','Retirement Plans (SEP/Solo 401k)','transactions_planning'),
('estimated_tax_planning','Estimated Tax Planning','transactions_planning'),

-- Credits & Incentives
('eitc_ctc_actc','EITC/CTC/ACTC','credits_incentives'),
('education_credits_aotc_llc','Education Credits (AOTC/LLC)','credits_incentives'),
('energy_credits_5695_ev_8936','Home/EV Energy Credits','credits_incentives'),
('45l_179d_building_efficiency','§45L/§179D Efficiency','credits_incentives'),
('wotc','WOTC','credits_incentives'),

-- Estate, Gift & Fiduciary
('estate_admin_reporting','Estate Administration','estate_gift_fiduciary'),
('gift_reporting_planning','Gift Reporting & Planning','estate_gift_fiduciary'),
('portability_8971_basis_consistency','Portability & Basis Consistency','estate_gift_fiduciary'),
('fiduciary_accounting','Fiduciary Accounting','estate_gift_fiduciary'),

-- Nonprofit & Exempt Orgs
('1023_1024_application','Exemption (1023/1024)','nonprofit'),
('ubit_990t','UBIT (990-T)','nonprofit'),
('state_charity_registration','State Charity Registration','nonprofit'),

-- Bookkeeping & Close
('qbo_xero_setup_cleanup','QBO/Xero Setup & Cleanup','bookkeeping_close'),
('monthly_close_kpis','Monthly Close & KPIs','bookkeeping_close'),
('inventory_job_costing','Inventory & Job Costing','bookkeeping_close'),
('chart_of_accounts_design','Chart of Accounts Design','bookkeeping_close'),

-- Payroll & Contractor Compliance
('payroll_setup_multistate','Payroll Setup & Multistate','payroll_contractor'),
('fringe_benefits_taxability','Fringe Benefits Taxability','payroll_contractor'),
('1099_k_cp2100_b_notice_workflow','1099-K/CP2100(B) Workflows','payroll_contractor'),

-- Disaster & Special Situations
('casualty_disaster_relief','Casualty & Disaster Relief','disaster_special'),
('injured_spouse_innocent_spouse','Injured/Innocent Spouse','disaster_special'),

-- Life Events & Individuals
('marriage_divorce_tax','Marriage/Divorce','life_events'),
('new_child_dependents','New Child & Dependents','life_events'),
('home_purchase_sale','Home Purchase/Sale','life_events'),
('education_savings_529','Education Savings (529)','life_events'),
('retirement_income_ss_medicare','Retirement, SS & Medicare','life_events')
ON CONFLICT (slug) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_specializations_group_key ON specializations(group_key);
CREATE INDEX IF NOT EXISTS idx_specializations_slug ON specializations(slug);

// /constants/specializations.ts
export type SpecItem = {
  value: string;        // stored string; keep identical to previous labels where possible
  label: string;        // display label
  synonyms?: string[];  // for search (lowercase match)
};

export type SpecCategory = {
  id: string;
  label: string;
  advanced?: boolean;   // collapse by default when true
  items: SpecItem[];
};

// 1) Common Work (bread & butter) — pre-expanded and shown first
export const COMMON_WORK: SpecItem[] = [
  { value: "Individual (Form 1040)", label: "Individual (Form 1040)", synonyms: ["individual", "1040", "personal"] },
  { value: "S-Corporation (1120-S)", label: "S-Corporation (1120-S)", synonyms: ["s corp", "1120s"] },
  { value: "Partnership (1065)", label: "Partnership (1065)", synonyms: ["partnership", "1065"] },
  { value: "C-Corporation (1120)", label: "C-Corporation (1120)", synonyms: ["c corp", "1120"] },
  { value: "Payroll (941/940)", label: "Payroll (941/940)", synonyms: ["payroll", "941", "940", "quarterly"] },
  { value: "Sales & Excise Returns", label: "Sales & Excise Returns", synonyms: ["sales tax", "excise", "boe", "cdtfa"] },
  { value: "Amended Returns", label: "Amended Returns", synonyms: ["amend", "back taxes", "1040x"] },
  { value: "Representation & Notices", label: "Representation & Notices", synonyms: ["audit", "exam", "notice", "collections", "cp2000", "oic", "ia"] },
];

// 2) Full catalog grouped (kept as provided, but organized)
export const CATEGORIES: SpecCategory[] = [
  {
    id: "returns-entities",
    label: "Core Returns & Entities",
    items: [
      { value: "1099 Information Reporting", label: "1099 Information Reporting", synonyms: ["1099", "information reporting"] },
      { value: "C-Corporation (1120)", label: "C-Corporation (1120)" },
      { value: "Estate Tax (706)", label: "Estate Tax (706)", synonyms: ["706", "estate tax return"] },
      { value: "Gift Tax (709)", label: "Gift Tax (709)", synonyms: ["709", "gift return"] },
      { value: "Individual (Form 1040)", label: "Individual (Form 1040)" },
      { value: "Nonprofit (990)", label: "Nonprofit (990)" },
      { value: "Partnership (1065)", label: "Partnership (1065)" },
      { value: "Payroll (941/940)", label: "Payroll (941/940)" },
      { value: "S-Corporation (1120-S)", label: "S-Corporation (1120-S)" },
      { value: "Sales & Excise Returns", label: "Sales & Excise Returns" },
      { value: "Trust & Estate (1041)", label: "Trust & Estate (1041)", synonyms: ["1041", "trust return", "estate return"] },
    ],
  },
  {
    id: "bookkeeping-close",
    label: "Bookkeeping & Close",
    items: [
      { value: "Bookkeeping & Close", label: "Bookkeeping & Close" },
      { value: "Chart of Accounts Design", label: "Chart of Accounts Design" },
      { value: "Inventory & Job Costing", label: "Inventory & Job Costing" },
      { value: "Monthly Close & KPIs", label: "Monthly Close & KPIs", synonyms: ["close", "kpi"] },
      { value: "QBO/Xero Setup & Cleanup", label: "QBO/Xero Setup & Cleanup", synonyms: ["quickbooks", "xero", "cleanup", "catch up"] },
    ],
  },
  {
    id: "credits-incentives",
    label: "Credits & Incentives",
    items: [
      { value: "§45L/§179D Efficiency", label: "§45L/§179D Efficiency", synonyms: ["45l", "179d", "energy efficient"] },
      { value: "Education Credits (AOTC/LLC)", label: "Education Credits (AOTC/LLC)" },
      { value: "EITC/CTC/ACTC", label: "EITC/CTC/ACTC" },
      { value: "Home/EV Energy Credits", label: "Home/EV Energy Credits", synonyms: ["ev", "energy credit"] },
      { value: "WOTC", label: "WOTC", synonyms: ["work opportunity"] },
      { value: "R&D Credit (6765)", label: "R&D Credit (6765)", synonyms: ["research credit", "r&d"] },
      { value: "ERC Review/Support", label: "ERC Review/Support", synonyms: ["employee retention credit"] },
    ],
  },
  {
    id: "disaster-special",
    label: "Disaster & Special Situations",
    items: [
      { value: "Casualty & Disaster Relief", label: "Casualty & Disaster Relief" },
      { value: "Injured/Innocent Spouse", label: "Injured/Innocent Spouse" },
    ],
  },
  {
    id: "estate-fiduciary",
    label: "Estate, Gift & Fiduciary",
    advanced: true,
    items: [
      { value: "Estate Administration", label: "Estate Administration" },
      { value: "Fiduciary Accounting", label: "Fiduciary Accounting" },
      { value: "Gift Reporting & Planning", label: "Gift Reporting & Planning" },
      { value: "Portability & Basis Consistency", label: "Portability & Basis Consistency", synonyms: ["706 portability", "basis consistency"] },
    ],
  },
  {
    id: "industry-vertical",
    label: "Industry Focus",
    advanced: true,
    items: [
      { value: "Cannabis (State-Compliant)", label: "Cannabis (State-Compliant)" },
      { value: "Construction & Contractors", label: "Construction & Contractors" },
      { value: "Crypto / DeFi / NFT", label: "Crypto / DeFi / NFT", synonyms: ["crypto", "defi", "nft"] },
      { value: "E-commerce & Marketplaces", label: "E-commerce & Marketplaces" },
      { value: "Film & TV (Sec. 181)", label: "Film & TV (Sec. 181)", synonyms: ["181", "film", "tv"] },
      { value: "Gig Economy", label: "Gig Economy", synonyms: ["rideshare", "uber", "fiverr", "1099-k"] },
      { value: "Healthcare Professionals", label: "Healthcare Professionals" },
      { value: "Manufacturing", label: "Manufacturing" },
      { value: "Oil & Gas", label: "Oil & Gas" },
      { value: "Real Estate Investors", label: "Real Estate Investors", synonyms: ["landlord", "rental", "depreciation"] },
      { value: "Restaurants & Food", label: "Restaurants & Food" },
      { value: "Short-Term Rentals", label: "Short-Term Rentals", synonyms: ["airbnb", "str", "vrbo"] },
      { value: "Trucking & Logistics", label: "Trucking & Logistics" },
    ],
  },
  {
    id: "international",
    label: "International",
    advanced: true,
    items: [
      { value: "CFC (5471)", label: "CFC (5471)", synonyms: ["5471", "cfc"] },
      { value: "Expat / Inbound-Outbound", label: "Expat / Inbound-Outbound", synonyms: ["expat", "nonresident", "inbound", "outbound"] },
      { value: "FATCA (8938)", label: "FATCA (8938)", synonyms: ["8938", "fatca"] },
      { value: "FBAR (FinCEN 114)", label: "FBAR (FinCEN 114)", synonyms: ["fbar", "finCEN 114"] },
      { value: "FIRPTA (8288-A)", label: "FIRPTA (8288-A)", synonyms: ["firpta", "8288", "8288-a"] },
      { value: "Foreign Disregarded Entity (8858)", label: "Foreign Disregarded Entity (8858)", synonyms: ["8858"] },
      { value: "Foreign Earned Income (2555)", label: "Foreign Earned Income (2555)", synonyms: ["2555", "fei", "housing exclusion"] },
      { value: "Foreign Partnership (8865)", label: "Foreign Partnership (8865)", synonyms: ["8865"] },
      { value: "Foreign Tax Credit (1116)", label: "Foreign Tax Credit (1116)", synonyms: ["1116", "ftc"] },
      { value: "Foreign-Owned US Corp (5472)", label: "Foreign-Owned US Corp (5472)", synonyms: ["5472"] },
      { value: "ITIN Processing", label: "ITIN Processing", synonyms: ["itin", "acceptance agent"] },
      { value: "Treaty Positions", label: "Treaty Positions", synonyms: ["treaty", "article"] },
    ],
  },
  {
    id: "life-events",
    label: "Life Events & Individuals",
    items: [
      { value: "Education Savings (529)", label: "Education Savings (529)", synonyms: ["529", "college savings"] },
      { value: "Home Purchase/Sale", label: "Home Purchase/Sale", synonyms: ["home sale", "gain exclusion", "121"] },
      { value: "Marriage/Divorce", label: "Marriage/Divorce" },
      { value: "New Child & Dependents", label: "New Child & Dependents" },
      { value: "Retirement, SS & Medicare", label: "Retirement, SS & Medicare", synonyms: ["ira", "roth", "rmd", "ssa-1099"] },
    ],
  },
  {
    id: "multistate-local",
    label: "Multi-State & Local",
    items: [
      { value: "Apportionment (Multi-State)", label: "Apportionment (Multi-State)", synonyms: ["apportionment", "multistate", "allocation"] },
      { value: "California (CA)", label: "California (CA)" },
      { value: "City/County Local Tax", label: "City/County Local Tax" },
      { value: "New York (NY)", label: "New York (NY)" },
      { value: "Nexus Analysis", label: "Nexus Analysis" },
      { value: "State Franchise/Gross Receipts", label: "State Franchise/Gross Receipts" },
      { value: "Texas (TX)", label: "Texas (TX)" },
    ],
  },
  {
    id: "nonprofit",
    label: "Nonprofit & Exempt Orgs",
    advanced: true,
    items: [
      { value: "Exemption (1023/1024)", label: "Exemption (1023/1024)", synonyms: ["1023", "1024", "exempt app"] },
      { value: "State Charity Registration", label: "State Charity Registration" },
      { value: "UBIT (990-T)", label: "UBIT (990-T)", synonyms: ["990-t", "unrelated business income"] },
    ],
  },
  {
    id: "payroll-compliance",
    label: "Payroll & Contractor Compliance",
    items: [
      { value: "1099-K/CP2100(B) Workflows", label: "1099-K/CP2100(B) Workflows", synonyms: ["cp2100", "b notice"] },
      { value: "Fringe Benefits Taxability", label: "Fringe Benefits Taxability", synonyms: ["benefits", "perk"] },
      { value: "Payroll Setup & Multistate", label: "Payroll Setup & Multistate", synonyms: ["payroll", "registration"] },
    ],
  },
  {
    id: "representation",
    label: "Representation & Controversy",
    items: [
      { value: "Amended Returns", label: "Amended Returns" },
      { value: "Collections (IA/OIC)", label: "Collections (IA/OIC)", synonyms: ["oic", "installment agreement", "ia"] },
      { value: "IRS Exams & Audits", label: "IRS Exams & Audits", synonyms: ["audit", "exam"] },
      { value: "Notice Responses", label: "Notice Responses", synonyms: ["notice", "cp", "ltr"] },
      { value: "Payroll Tax Issues", label: "Payroll Tax Issues" },
      { value: "Penalty Abatement", label: "Penalty Abatement" },
      { value: "TFRP Defense", label: "TFRP Defense", synonyms: ["trust fund", "recovery penalty"] },
    ],
  },
  {
    id: "transactions-planning",
    label: "Transactions & Planning",
    advanced: true,
    items: [
      { value: "§754/§743(b) Adjustments", label: "§754/§743(b) Adjustments", synonyms: ["754", "743b"] },
      { value: "1031 Exchanges", label: "1031 Exchanges" },
      { value: "338(h)(10)/336(e)", label: "338(h)(10)/336(e)", synonyms: ["338h10", "336e"] },
      { value: "Cost Segregation", label: "Cost Segregation" },
      { value: "Entity Selection (8832/2553)", label: "Entity Selection (8832/2553)", synonyms: ["entity selection", "8832", "2553"] },
      { value: "Equity Comp (ISOs/NSOs/RSUs)", label: "Equity Comp (ISOs/NSOs/RSUs)", synonyms: ["stock options", "rsu", "iso", "nso"] },
      { value: "Estimated Tax Planning", label: "Estimated Tax Planning" },
      { value: "M&A Structuring", label: "M&A Structuring", synonyms: ["merger", "acquisition"] },
      { value: "NOL Planning", label: "NOL Planning" },
      { value: "QSBS (§1202)", label: "QSBS (§1202)", synonyms: ["1202", "qsbs"] },
      { value: "Retirement Plans (SEP/Solo 401k)", label: "Retirement Plans (SEP/Solo 401k)", synonyms: ["sep", "solo 401k"] },
      { value: "S-Election (2553)", label: "S-Election (2553)", synonyms: ["s election", "2553"] },
      { value: "SALT Cap Workaround (PTET)", label: "SALT Cap Workaround (PTET)", synonyms: ["ptet", "salt cap"] },
    ],
  },
];

// Flatten list for search and legacy matching
export const ALL_ITEMS: SpecItem[] = [
  ...COMMON_WORK,
  ...CATEGORIES.flatMap((c) => c.items),
];

// Quick map for lookup by value
export const ITEM_BY_VALUE = new Map(ALL_ITEMS.map((i) => [i.value, i]));

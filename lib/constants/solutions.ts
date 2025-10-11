/**
 * Solution pages configuration
 * Each solution targets a specific B2B use case for tax firms
 */

export interface Solution {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  whenToUse: string[];
  searchQuery: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const SOLUTIONS: Solution[] = [
  {
    slug: 'overflow-staffing',
    title: 'Overflow Staffing for CPA Firms',
    description: 'Find verified CPAs and EAs to handle seasonal overflow and peak workload periods without full-time commitments.',
    h1: 'Overflow Staffing for CPA Firms',
    intro: `Managing seasonal surges doesn't require full-time hires. TaxProExchange connects your firm with verified CPAs, EAs, and tax professionals who can step in during busy season, handle overflow returns, or support your team when workload spikes. All professionals are credential-verified before they appear in our directory, ensuring you work with qualified, licensed pros you can trust.

Whether you need someone to prep returns, review work, or handle specific client engagements, our platform makes it easy to find professionals by credential type, state license, specialization, and availability. No long-term commitments, no file uploads—just direct connections with vetted professionals who understand the urgency of tax season.

Firms use TaxProExchange for temporary capacity during extension season, year-end crunches, or when a team member is out. Search by the exact credentials and expertise you need, reach out directly, and arrange scope and payment on your terms.`,
    whenToUse: [
      'Your firm is experiencing seasonal overflow during tax season or extension deadlines',
      'You need qualified help without the overhead of recruiting and onboarding full-time staff',
      'You want to maintain quality and compliance by working only with verified, licensed professionals'
    ],
    searchQuery: '/search?accepting_work=true',
    faqs: [
      {
        question: 'How are professionals verified?',
        answer: 'We manually check CPA state board records, IRS EA enrollment status, and CTEC registration before any profile goes live. Only verified, active credentials appear in search results.'
      },
      {
        question: 'Can I hire someone for just a few weeks?',
        answer: 'Absolutely. TaxProExchange is built for flexible, project-based engagements. You negotiate scope, timeline, and payment directly with the professional.'
      },
      {
        question: 'Do you handle contracts or payments?',
        answer: 'No. TaxProExchange is a connection-only platform. You handle contracts, payments, and file exchange directly with the professional you hire.'
      },
      {
        question: 'What if I need someone in a specific state?',
        answer: 'Our search filters let you narrow by state license, credential type, and specialization so you find exactly the right fit for your engagement.'
      },
      {
        question: 'Is there a fee to connect with professionals?',
        answer: 'Creating a firm account and browsing verified professionals is free. We may introduce premium features in the future, but our core directory remains accessible.'
      }
    ]
  },
  {
    slug: 'review-and-signoff',
    title: 'Review & Sign-Off Services for Tax Firms',
    description: 'Connect with experienced CPAs and EAs for independent review and sign-off on complex returns and client engagements.',
    h1: 'Review & Sign-Off Services for Tax Firms',
    intro: `When you need an independent, experienced eye on a complex return or client engagement, TaxProExchange connects you with CPAs and EAs who specialize in review and sign-off. Whether it's a partnership return with tricky allocations, a multi-state S-corp, or a high-stakes individual return, our verified professionals provide the expertise and credentials you need.

Review and sign-off arrangements are common in overflow situations, white-label engagements, or when your firm needs a second opinion before filing. All professionals in our directory are credential-verified, so you know you're working with licensed, active CPAs or EAs who can legally sign returns in the jurisdictions you need.

Search by credential type, state, and specialization to find reviewers with the exact background your engagement requires. Reach out directly, discuss scope and fees, and arrange the engagement on your terms—no platform fees, no file uploads, just direct professional connections.`,
    whenToUse: [
      'You need an independent CPA or EA to review and sign complex returns your team prepared',
      'Your firm handles preparation but requires a licensed professional in a specific state for sign-off',
      'You want a second opinion on a high-risk or high-value engagement before filing'
    ],
    searchQuery: '/search?accepting_work=true&specialization=review',
    faqs: [
      {
        question: 'What types of returns can be reviewed and signed?',
        answer: 'Our professionals handle individual (1040), partnership (1065), S-corp (1120-S), C-corp (1120), trust, estate, and specialty returns. Filter by specialization to find the right expertise.'
      },
      {
        question: 'Can a professional in another state sign my returns?',
        answer: 'Signing authority depends on state licensing and IRS rules. Many CPAs and EAs are licensed in multiple states or have IRS representation authority. Confirm jurisdiction with the professional during your initial conversation.'
      },
      {
        question: 'How do I know the reviewer is qualified?',
        answer: 'Every profile shows verified credentials (CPA, EA, CTEC), state licenses, years of experience, and specializations. We manually verify all credentials before profiles go live.'
      },
      {
        question: 'What if I need ongoing review services?',
        answer: 'Many professionals on TaxProExchange offer ongoing or seasonal arrangements. Discuss your needs directly and set up a recurring engagement if it makes sense for both parties.'
      },
      {
        question: 'Do you provide engagement letters or liability coverage?',
        answer: 'No. TaxProExchange is a connection platform only. You and the professional are responsible for engagement terms, liability, and insurance.'
      }
    ]
  },
  {
    slug: 'irs-representation-ea-cpa',
    title: 'IRS Representation: CPAs & Enrolled Agents',
    description: 'Find experienced CPAs and EAs for IRS audits, appeals, collections, and penalty abatement representation.',
    h1: 'IRS Representation: CPAs & Enrolled Agents',
    intro: `When clients face IRS notices, audits, or collections issues, they need representation from a licensed CPA or Enrolled Agent. TaxProExchange makes it easy to find verified professionals with IRS representation experience—whether you're a firm referring out a case, a preparer looking to partner with a rep specialist, or a solo practitioner building your network.

All CPAs and EAs on TaxProExchange are credential-verified, so you know they have legal authority to represent taxpayers before the IRS. Search by specialization (audit defense, collections, penalty abatement, appeals) and state to find professionals who match your client's needs.

IRS representation is time-sensitive. Our platform lets you quickly identify and connect with qualified professionals, discuss case details, and make referrals without delay. No file uploads, no platform middleman—just direct, professional connections.`,
    whenToUse: [
      'Your firm doesn't handle IRS representation in-house and needs trusted referral partners',
      'A client has received an audit notice or collections letter and needs immediate representation',
      'You want to expand your referral network with verified CPAs and EAs who specialize in IRS cases'
    ],
    searchQuery: '/search?accepting_work=true&specialization=irs_rep',
    faqs: [
      {
        question: 'What IRS matters can CPAs and EAs handle?',
        answer: 'CPAs and EAs have unlimited practice rights before the IRS. They can represent clients in audits, appeals, collections, penalty abatement, and other tax matters at all administrative levels.'
      },
      {
        question: 'How do I verify someone's IRS representation authority?',
        answer: 'All EA credentials are verified against the IRS Enrolled Agent database. CPA credentials are verified with state boards. You can also confirm active status with the IRS Office of Professional Responsibility.'
      },
      {
        question: 'Can I refer a client to a professional on TaxProExchange?',
        answer: 'Yes. Many firms use TaxProExchange to find representation specialists for client referrals. Connect directly with the professional to discuss case details and referral terms.'
      },
      {
        question: 'Do you handle Power of Attorney (Form 2848) or client communication?',
        answer: 'No. TaxProExchange is a directory and connection platform only. The professional you connect with will handle POA, client communication, and case management directly.'
      },
      {
        question: 'What if my client's case is in a specific state?',
        answer: 'IRS representation authority is federal, but many professionals also have state tax experience. Use our state filter to find professionals licensed and experienced in the jurisdictions you need.'
      }
    ]
  },
  {
    slug: 'multi-state-salt',
    title: 'Multi-State & SALT Expertise for Tax Firms',
    description: 'Connect with CPAs specializing in state and local tax (SALT), nexus, apportionment, and multi-state compliance.',
    h1: 'Multi-State & SALT Expertise for Tax Firms',
    intro: `State and local tax (SALT) issues are complex, jurisdiction-specific, and constantly evolving. When your firm encounters a multi-state client, nexus question, or apportionment challenge, TaxProExchange connects you with CPAs who specialize in SALT and multi-state compliance.

Our directory includes professionals with deep experience in state income tax, sales tax, nexus analysis, apportionment, credits and incentives, and controversy. Whether you need a consultant for a specific state return, a reviewer for a multi-state S-corp, or a referral partner for ongoing SALT work, you'll find verified professionals with the credentials and experience you need.

Search by state, specialization (SALT, 1120-S, partnership, nexus), and availability to find the right expert for your engagement. Reach out directly to discuss case details, scope, and fees—no platform fees, no barriers to connection.`,
    whenToUse: [
      'Your client operates in multiple states and you need expertise in nexus, apportionment, or state-specific rules',
      'You're handling a complex S-corp or partnership with multi-state activities and need a second set of eyes',
      'Your firm wants to expand SALT capabilities without hiring a full-time specialist'
    ],
    searchQuery: '/search?accepting_work=true&specialization=multi_state',
    faqs: [
      {
        question: 'What states do professionals on TaxProExchange cover?',
        answer: 'Our professionals are licensed and practice across all 50 states. Use the state filter to find CPAs and EAs with specific state credentials and experience.'
      },
      {
        question: 'Can I find someone for just a nexus study or specific advisory project?',
        answer: 'Yes. Many SALT professionals on TaxProExchange offer project-based consulting, nexus studies, and advisory services in addition to return preparation and review.'
      },
      {
        question: 'Do you verify state licenses in addition to CPA credentials?',
        answer: 'Yes. We verify CPA licenses with state boards of accountancy. Professionals list all states where they're licensed, and we spot-check state credentials during verification.'
      },
      {
        question: 'What if I need help with a SALT controversy or audit?',
        answer: 'Search for professionals with SALT, audit defense, or state controversy experience. Many CPAs on TaxProExchange have represented clients in state audits and administrative appeals.'
      },
      {
        question: 'Can I hire someone for ongoing multi-state compliance?',
        answer: 'Absolutely. Discuss your needs directly with the professional and set up a seasonal or ongoing engagement if it works for both parties.'
      }
    ]
  },
  {
    slug: 'crypto-tax',
    title: 'Crypto & Digital Asset Tax Specialists',
    description: 'Find CPAs and EAs with expertise in cryptocurrency, NFTs, DeFi, and digital asset taxation and reporting.',
    h1: 'Crypto & Digital Asset Tax Specialists',
    intro: `Cryptocurrency and digital asset taxation is a specialized, high-demand niche. When your firm encounters clients with crypto trading, staking, DeFi transactions, or NFT sales, TaxProExchange connects you with CPAs and EAs who specialize in digital asset tax compliance and reporting.

Our directory includes professionals experienced in crypto cost basis tracking, tax lot accounting, Form 8949 reporting, staking income, DeFi yield, and more. Whether you need a specialist to handle a complex crypto return, a reviewer for a high-volume trader, or a referral partner for ongoing crypto clients, you'll find verified professionals with the niche expertise you need.

Crypto tax is still evolving, and expertise matters. Search by specialization (crypto tax, digital assets) and credential type to find professionals who stay current with IRS guidance, software tools, and reporting best practices.`,
    whenToUse: [
      'Your client has significant cryptocurrency trading activity, staking income, or DeFi transactions you're not equipped to handle',
      'You need an expert to review crypto cost basis calculations, tax lot tracking, or Form 8949 reporting',
      'Your firm wants to refer crypto clients to a specialist rather than turn them away'
    ],
    searchQuery: '/search?accepting_work=true&specialization=crypto',
    faqs: [
      {
        question: 'What crypto tax issues do professionals on TaxProExchange handle?',
        answer: 'Our crypto specialists handle trading gains/losses, staking income, DeFi yield, NFT sales, airdrops, hard forks, cost basis tracking, and IRS reporting (Form 8949, Schedule 1, etc.).'
      },
      {
        question: 'Do crypto tax professionals use specific software?',
        answer: 'Many use tools like CoinTracker, Koinly, TaxBit, or CryptoTrader.Tax for transaction tracking and reporting. Ask about their workflow and software during your initial conversation.'
      },
      {
        question: 'Can I refer a client with only crypto income?',
        answer: 'Yes. Many professionals on TaxProExchange specialize exclusively in crypto tax. They can handle the entire return or just the crypto component if you prefer to retain the client relationship.'
      },
      {
        question: 'What if the client's transactions span multiple years?',
        answer: 'Crypto specialists are experienced in multi-year cost basis reconstruction, amended returns, and prior-year corrections. Discuss the scope during your initial outreach.'
      },
      {
        question: 'How do I know a professional is up-to-date on crypto tax rules?',
        answer: 'Profiles show specializations, years of experience, and professional background. During your conversation, ask about recent IRS guidance, software they use, and their approach to complex scenarios.'
      }
    ]
  },
  {
    slug: 'trusts-and-estates',
    title: 'Trust & Estate Tax Specialists',
    description: 'Connect with CPAs experienced in fiduciary returns (1041), estate tax (706), gift tax, and trust administration.',
    h1: 'Trust & Estate Tax Specialists',
    intro: `Trust and estate taxation is a specialized practice area requiring knowledge of fiduciary accounting, distribution rules, and estate planning. TaxProExchange connects your firm with CPAs who specialize in Form 1041 (fiduciary returns), Form 706 (estate tax), gift tax reporting, and trust administration.

Whether you need help with a complex estate return, a trust with multiple beneficiaries, or a grantor trust election, our directory includes professionals with the credentials and experience to handle sophisticated fiduciary engagements. All professionals are credential-verified, and many have years of experience in estate planning and trust administration.

Search by specialization (trusts, estates, fiduciary returns) and state to find professionals who match your engagement. Reach out directly to discuss case complexity, deadlines, and fees—no platform barriers, just professional connections.`,
    whenToUse: [
      'Your firm handles individual returns but doesn't have in-house expertise for trust and estate filings',
      'You need a specialist to review a complex 1041 or 706 return before filing',
      'A client's trust or estate administration requires fiduciary accounting expertise you don't have on staff'
    ],
    searchQuery: '/search?accepting_work=true&specialization=trusts_estates',
    faqs: [
      {
        question: 'What types of fiduciary returns do professionals handle?',
        answer: 'Our specialists handle Form 1041 (simple and complex trusts, estates), Form 706 (estate tax), Form 709 (gift tax), and state fiduciary returns. Many also advise on trust administration and distributions.'
      },
      {
        question: 'Can I refer estate planning clients to someone on TaxProExchange?',
        answer: 'Yes. Many CPAs on TaxProExchange work with estate planning attorneys and can handle the tax side of estate planning engagements, including projections, return preparation, and administration.'
      },
      {
        question: 'What if the estate or trust has real estate, business interests, or investments?',
        answer: 'Our trust and estate specialists are experienced in complex asset structures, valuation, and basis reporting. Discuss asset mix during your initial conversation.'
      },
      {
        question: 'Do you verify credentials for trust and estate specialists?',
        answer: 'Yes. All CPA credentials are verified with state boards. Professionals list their specializations and experience, and you can review their profile before reaching out.'
      },
      {
        question: 'Can I hire someone for ongoing fiduciary return preparation?',
        answer: 'Absolutely. Many trust and estate professionals offer ongoing arrangements for recurring filings. Negotiate scope and fees directly.'
      }
    ]
  },
  {
    slug: 'k1-surge-support',
    title: 'K-1 & Partnership Return Surge Support',
    description: 'Find CPAs experienced in Form 1065, K-1 preparation, and partnership taxation for seasonal overflow and complex engagements.',
    h1: 'K-1 & Partnership Return Surge Support',
    intro: `Partnership returns (Form 1065) and K-1 preparation require specialized knowledge of allocations, basis tracking, and partner distributions. When your firm faces a surge of partnership returns or encounters a complex multi-tier structure, TaxProExchange connects you with CPAs who specialize in partnership taxation.

Our directory includes professionals experienced in 1065 preparation, K-1 generation, partner basis calculations, and complex allocations (special allocations, 704(c), 754 elections). Whether you need overflow support during busy season, a reviewer for a complex partnership, or a referral partner for ongoing partnership work, you'll find verified CPAs with the expertise you need.

Partnership taxation is detail-intensive and error-prone. Work with professionals who understand the rules, use the right software, and can deliver accurate K-1s on deadline.`,
    whenToUse: [
      'Your firm has a surge of partnership returns during busy season and needs qualified help',
      'You're handling a complex partnership with special allocations, tiered structures, or multi-state issues',
      'You need a reviewer to check K-1s and partner basis before issuing to clients'
    ],
    searchQuery: '/search?accepting_work=true&specialization=partnership',
    faqs: [
      {
        question: 'What partnership tax issues do professionals on TaxProExchange handle?',
        answer: 'Our specialists handle Form 1065 preparation, K-1 generation, partner basis tracking, capital accounts, 704(b) book-ups, 754 elections, special allocations, and more.'
      },
      {
        question: 'Can someone help with just K-1 review or basis reconciliation?',
        answer: 'Yes. Many professionals offer project-based services like K-1 review, basis calculations, or second-opinion work in addition to full return preparation.'
      },
      {
        question: 'What software do partnership specialists use?',
        answer: 'Common tools include ProSeries, Lacerte, UltraTax, and Drake. Profiles show software proficiency, and you can confirm compatibility during your initial conversation.'
      },
      {
        question: 'What if the partnership has international partners or activities?',
        answer: 'Search for professionals with international tax or partnership experience. Many CPAs handle withholding (1042), FDAP, and branch reporting.'
      },
      {
        question: 'Can I hire someone for the entire partnership season?',
        answer: 'Absolutely. Discuss your seasonal volume and deadlines directly with the professional and set up a recurring engagement if it works for both parties.'
      }
    ]
  },
  {
    slug: 'white-label-tax-prep',
    title: 'White-Label Tax Preparation Services',
    description: 'Find CPAs and EAs who provide white-label tax prep, allowing your firm to scale without adding staff.',
    h1: 'White-Label Tax Preparation Services',
    intro: `White-label tax preparation allows your firm to scale capacity without hiring full-time staff or turning away clients. TaxProExchange connects you with CPAs and EAs who specialize in behind-the-scenes preparation work—you retain the client relationship, they handle the technical prep and review.

Our directory includes professionals who understand white-label engagements: clean work product, timely communication, and discretion. Whether you need help with individual returns, small business filings, or specialty returns, you'll find verified professionals who can integrate seamlessly with your firm's workflow.

White-label arrangements are common during busy season, when launching a new service line, or when expanding into a new market. Search by credential type, specialization, and availability to find professionals who match your firm's standards and client mix.`,
    whenToUse: [
      'Your firm wants to scale capacity during busy season without hiring full-time staff',
      'You're expanding into a new service area (trusts, crypto, SALT) and need back-end technical support',
      'You want to maintain your client relationships while outsourcing preparation and review work'
    ],
    searchQuery: '/search?accepting_work=true',
    faqs: [
      {
        question: 'What is white-label tax preparation?',
        answer: 'White-label means the professional prepares returns under your firm's brand. You maintain the client relationship, they handle the technical work. You review and sign (or they sign, depending on your arrangement).'
      },
      {
        question: 'Can I maintain confidentiality with white-label work?',
        answer: 'Yes. Discuss confidentiality, NDAs, and client communication protocols directly with the professional during your initial conversation.'
      },
      {
        question: 'Who signs the return in a white-label arrangement?',
        answer: 'It depends on your arrangement. Some firms have the white-label professional sign as preparer, others review and sign themselves. Clarify signing authority and state licensing before engaging.'
      },
      {
        question: 'How do I find professionals open to white-label work?',
        answer: 'Search for professionals marked as "accepting work" and discuss white-label arrangements during your outreach. Many CPAs and EAs on TaxProExchange are experienced in these engagements.'
      },
      {
        question: 'What types of returns can be white-labeled?',
        answer: 'Any return type: 1040, 1065, 1120-S, 1120, 1041, 990, and more. Filter by specialization to find professionals with the expertise your firm needs.'
      }
    ]
  }
];


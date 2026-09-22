import {
  Archive, Database, Layers, PowerOff, Scale, ShieldCheck, Sparkles, Landmark, HeartPulse, Factory,
  Building2, ShoppingBag, Zap, RadioTower, Umbrella, Server, Gauge, Cloud, Vault, RefreshCw, BrainCircuit,
  FileText, Video, BookOpen, Newspaper, Mic2, CalendarDays, Mail, FlaskConical,
} from "lucide-react";

export const NAV = [
  {
    label: "Products",
    to: "/products",
    blurb: "One governed platform for every system and every era of enterprise data.",
    featured: { title: "Solix Enterprise Edition", desc: "Put AI in the hands of your business.", to: "/products/enterprise-edition" },
    items: [
      { label: "Common Data Platform", desc: "The foundation: 150+ connectors, governed zones", to: "/products/common-data-platform", icon: Layers },
      { label: "Enterprise Archiving", desc: "Cut infrastructure cost up to 80%", to: "/products/enterprise-archiving", icon: Archive },
      { label: "Enterprise Data Lake", desc: "AI-ready, catalogued, open formats", to: "/products/enterprise-data-lake", icon: Database },
      { label: "Application Retirement", desc: "Decommission legacy apps, keep the data", to: "/products/application-retirement", icon: PowerOff },
      { label: "eDiscovery", desc: "Search, hold and produce with confidence", to: "/products/ediscovery", icon: Scale },
      { label: "Consumer Data Privacy", desc: "GDPR, CCPA, HIPAA automation", to: "/products/consumer-data-privacy", icon: ShieldCheck },
      { label: "Enterprise AI", desc: "Agents and copilots on trusted data", to: "/products/enterprise-ai", icon: Sparkles },
    ],
  },
  {
    label: "Solutions",
    to: "/solutions",
    blurb: "Outcome-led programs built on the Common Data Platform.",
    featured: { title: "AI & Analytics Readiness", desc: "Make every dataset discoverable, governed and usable by AI.", to: "/solutions#ai-readiness" },
    items: [
      { label: "Infrastructure Optimization", desc: "Shrink production footprints", to: "/solutions#infrastructure-optimization", icon: Gauge },
      { label: "Compliance & Governance", desc: "Retention, legal hold, audit trails", to: "/solutions#compliance-governance", icon: ShieldCheck },
      { label: "AI & Analytics Readiness", desc: "Unified, trusted data for models", to: "/solutions#ai-readiness", icon: BrainCircuit },
      { label: "Cloud Migration", desc: "Move less, migrate faster", to: "/solutions#cloud-migration", icon: Cloud },
      { label: "Data Preservation", desc: "Immutable records for every era", to: "/solutions#data-preservation", icon: Vault },
      { label: "Legacy Modernization", desc: "Exit mainframe and ERP debt", to: "/solutions#legacy-modernization", icon: RefreshCw },
    ],
  },
  {
    label: "Industries",
    to: "/industries",
    blurb: "Regulated, data-intensive industries trust Solix at petabyte scale.",
    featured: { title: "Financial Services", desc: "SEC 17a-4, FINRA, Basel-ready archives and AI.", to: "/industries/financial-services" },
    items: [
      { label: "Financial Services", to: "/industries/financial-services", icon: Landmark },
      { label: "Healthcare & Life Sciences", to: "/industries/healthcare", icon: HeartPulse },
      { label: "Manufacturing", to: "/industries/manufacturing", icon: Factory },
      { label: "Public Sector", to: "/industries/public-sector", icon: Building2 },
      { label: "Retail & CPG", to: "/industries/retail", icon: ShoppingBag },
      { label: "Energy & Utilities", to: "/industries/energy", icon: Zap },
      { label: "Telecommunications", to: "/industries/telecom", icon: RadioTower },
      { label: "Insurance", to: "/industries/insurance", icon: Umbrella },
    ],
  },
  {
    label: "Resources",
    to: "/resources",
    blurb: "Field-tested guidance from two decades of enterprise data programs.",
    featured: { title: "White Paper", desc: "How to build an enterprise archive in the cloud.", to: "/resources?type=whitepaper" },
    items: [
      { label: "Blog", to: "/resources?type=blog", icon: Newspaper },
      { label: "White Papers", to: "/resources?type=whitepaper", icon: FileText },
      { label: "Webinars", to: "/resources?type=webinar", icon: Video },
      { label: "Case Studies", to: "/resources?type=casestudy", icon: BookOpen },
      { label: "Podcast", to: "/resources?type=podcast", icon: Mic2 },
      { label: "Events", to: "/resources?type=event", icon: CalendarDays },
    ],
  },
  {
    label: "Company",
    to: "/company",
    blurb: "Founded in 2002 and headquartered in Santa Clara, California.",
    featured: { title: "We're hiring", desc: "Build the data layer for the AI-driven enterprise.", to: "/careers" },
    items: [
      { label: "About Solix", to: "/company", icon: Building2 },
      { label: "Careers", to: "/careers", icon: Sparkles },
      { label: "Partners", to: "/partners", icon: Layers },
      { label: "Newsroom", to: "/newsroom", icon: Newspaper },
      { label: "Contact", to: "/contact", icon: Mail },
    ],
  },
];

export const STATS = [
  { value: 150, suffix: "+", label: "Enterprise application connectors" },
  { value: 80, suffix: "%", label: "Infrastructure cost reduction, typical" },
  { value: 20, suffix: "+", label: "Years engineering data at scale" },
  { value: 12, suffix: " PB", label: "Preserved for a single customer" },
];

export const PRODUCTS = [
  {
    slug: "enterprise-edition",
    category: "Platform",
    name: "Solix Enterprise Edition",
    tagline: "Put AI in the hands of your business.",
    description:
      "Enterprise Edition activates your data across every system and every era, so the people who know your business can build the solutions they need, inside the trust perimeter IT defines.",
    icon: Sparkles,
    accent: "ember",
    image: "/images/hero-architecture.jpg",
    features: [
      { title: "Every system, every era", desc: "Connect live ERP, CRM and SaaS alongside retired applications, mainframe extracts and file shares." },
      { title: "Trust perimeter", desc: "Policy-driven access, masking and lineage so business builders never step outside governance." },
      { title: "Builder workspace", desc: "Low-code agents, copilots and dashboards on curated, semantic data products." },
      { title: "Unified metadata", desc: "One catalog across archive, lake and operational sources with automated classification." },
      { title: "Any deployment", desc: "SOLIXCloud, your cloud, on-premises or hybrid, with the same controls everywhere." },
      { title: "Outcome telemetry", desc: "Track adoption, cost savings and compliance posture from a single console." },
    ],
    steps: [
      { title: "Connect", desc: "Ingest from 150+ connectors and any file format with schema evolution handled for you." },
      { title: "Govern", desc: "Classify, retain, mask and audit automatically against policy templates." },
      { title: "Activate", desc: "Publish trusted data products to analysts, agents and applications." },
    ],
    outcomes: [
      { value: "10x", label: "faster time to first AI use case" },
      { value: "1", label: "governed platform instead of six point tools" },
      { value: "0", label: "copies of sensitive data outside policy" },
    ],
    chart: [{ metric: "Time to first AI use case", before: 100, after: 10, unit: "weeks (index)" }, { metric: "Point tools in the stack", before: 100, after: 17, unit: "count (index)" }, { metric: "Sensitive data copies", before: 100, after: 0, unit: "copies (index)" }],
  },
  {
    slug: "common-data-platform",
    category: "Foundation",
    name: "Common Data Platform",
    tagline: "Enterprise data management. Migration. Preservation.",
    description:
      "The enterprise-scale data platform that connects to 150+ applications, ingests structured and unstructured data, and provides the governed Preservation Zone that powers every Solix solution. Deployable today.",
    icon: Layers,
    accent: "teal",
    image: "/images/prod-cdp.jpg",
    features: [
      { title: "150+ connectors", desc: "SAP, Oracle, PeopleSoft, Salesforce, Workday, ServiceNow, mainframe, email and files." },
      { title: "Preservation Zone", desc: "Immutable, WORM-capable storage with retention, legal hold and defensible deletion." },
      { title: "Open formats", desc: "Parquet, Iceberg and JSON so your data is never locked in." },
      { title: "Metadata & catalog", desc: "Business glossary, lineage and automated PII discovery." },
      { title: "Elastic compute", desc: "Scale ingest and query independently in any cloud." },
      { title: "Security by design", desc: "Encryption at rest and in transit, RBAC/ABAC, SSO, full audit." },
    ],
    steps: [
      { title: "Land", desc: "Bulk and incremental ingest with validation and reconciliation reports." },
      { title: "Organize", desc: "Zones for raw, curated, preserved and published data." },
      { title: "Serve", desc: "SQL, REST, search and vector interfaces for every consumer." },
    ],
    outcomes: [
      { value: "PB", label: "scale, proven in production" },
      { value: "150+", label: "application connectors" },
      { value: "3", label: "deployment models, one control plane" },
    ],
    chart: [{ metric: "Time to onboard a new source", before: 100, after: 20, unit: "days (index)" }, { metric: "Storage cost per TB", before: 100, after: 12, unit: "$ (index)" }, { metric: "Catalog coverage", before: 35, after: 100, unit: "% of estate" }],
  },
  {
    slug: "enterprise-archiving",
    category: "Optimize",
    name: "Enterprise Archiving",
    tagline: "Move inactive data out of production. Keep it one click away.",
    description:
      "Tier inactive records from ERP, CRM, databases and files to a low-cost, compliant archive with full-text search, retention policies and legal hold, while production gets faster and cheaper.",
    icon: Archive,
    accent: "ember",
    image: "/images/prod-archiving.jpg",
    features: [
      { title: "Policy-based tiering", desc: "Business rules decide what moves, when and where." },
      { title: "Transparent access", desc: "Users query archived data from familiar screens and reports." },
      { title: "Compliance ready", desc: "SEC 17a-4, HIPAA, GDPR retention and hold templates." },
      { title: "Any source", desc: "Databases, applications, email, documents, logs." },
      { title: "Cost intelligence", desc: "Chargeback and savings dashboards per application." },
      { title: "Search everything", desc: "Elastic full-text and structured search across the archive." },
    ],
    steps: [
      { title: "Assess", desc: "Profile growth, access patterns and regulatory retention." },
      { title: "Archive", desc: "Move eligible data with validation and referential integrity." },
      { title: "Retire", desc: "Defensibly delete at end of life with full audit trail." },
    ],
    outcomes: [
      { value: "80%", label: "lower infrastructure cost" },
      { value: "3x", label: "faster batch and reporting cycles" },
      { value: "100%", label: "audit-ready retention" },
    ],
    chart: [{ metric: "Production database size", before: 100, after: 35, unit: "TB (index)" }, { metric: "Infrastructure cost", before: 100, after: 20, unit: "$ (index)" }, { metric: "Batch & reporting time", before: 100, after: 33, unit: "hours (index)" }],
  },
  {
    slug: "enterprise-data-lake",
    category: "Analyze",
    name: "Enterprise Data Lake",
    tagline: "A governed lake your analysts and models actually trust.",
    description:
      "Consolidate structured, semi-structured and unstructured data into an open, catalogued lake with self-service access, quality controls and lineage, ready for BI, data science and AI.",
    icon: Database,
    accent: "teal",
    image: "/images/prod-data-lake.jpg",
    features: [
      { title: "Open table formats", desc: "Iceberg and Parquet with time travel and schema evolution." },
      { title: "Data quality", desc: "Rules, anomaly detection and scorecards per dataset." },
      { title: "Self-service", desc: "Marketplace of certified data products with request workflows." },
      { title: "Lineage", desc: "Column-level lineage from source to dashboard to model." },
      { title: "Vector ready", desc: "Embeddings and semantic search for RAG use cases." },
      { title: "Fine-grained security", desc: "Row, column and attribute-based access control." },
    ],
    steps: [
      { title: "Ingest", desc: "Streaming and batch pipelines with CDC." },
      { title: "Curate", desc: "Transform, certify and publish governed products." },
      { title: "Analyze", desc: "Connect any BI, notebook or AI framework." },
    ],
    outcomes: [
      { value: "60%", label: "less time finding data" },
      { value: "1", label: "catalog for lake, archive and apps" },
      { value: "∞", label: "consumers, zero copies" },
    ],
    chart: [{ metric: "Time analysts spend finding data", before: 100, after: 40, unit: "hours (index)" }, { metric: "Data copies per team", before: 100, after: 0, unit: "copies (index)" }, { metric: "Certified datasets", before: 20, after: 100, unit: "% of catalog" }],
  },
  {
    slug: "application-retirement",
    category: "Modernize",
    name: "Application Retirement",
    tagline: "Switch off legacy applications. Never lose the data.",
    description:
      "Decommission redundant, obsolete and legacy applications while preserving data with full business context for reporting, compliance and eDiscovery. Eliminate licenses, hardware and specialist skills.",
    icon: PowerOff,
    accent: "ember",
    image: "/images/prod-retirement.jpg",
    features: [
      { title: "Any application", desc: "SAP ECC, Oracle EBS, PeopleSoft, JDE, Lotus Notes, mainframe, custom." },
      { title: "Context preserved", desc: "Retain relationships, attachments and business views." },
      { title: "Report continuity", desc: "Pre-built and custom reports on retired data." },
      { title: "Factory approach", desc: "Templates and automation to retire portfolios, not one-offs." },
      { title: "Chain of custody", desc: "Validation, reconciliation and certified extracts." },
      { title: "Retention by record", desc: "Apply granular retention and hold to retired data." },
    ],
    steps: [
      { title: "Inventory", desc: "Rationalize the portfolio, prioritize by cost and risk." },
      { title: "Extract", desc: "Move data and metadata to the Preservation Zone." },
      { title: "Decommission", desc: "Shut down, cancel licenses, reclaim budget." },
    ],
    outcomes: [
      { value: "$M", label: "annual license and hardware savings" },
      { value: "90%", label: "faster than manual decommissioning" },
      { value: "0", label: "compliance gaps" },
    ],
    chart: [{ metric: "Legacy run cost", before: 100, after: 8, unit: "$ (index)" }, { metric: "Decommission time per app", before: 100, after: 10, unit: "weeks (index)" }, { metric: "Records still accessible", before: 100, after: 100, unit: "%" }],
  },
  {
    slug: "ediscovery",
    category: "Comply",
    name: "eDiscovery",
    tagline: "Find, hold and produce records in hours, not weeks.",
    description:
      "Search across archived and live data, place legal holds, cull and review, and produce defensible records for litigation, audits and investigations, all on the same governed platform.",
    icon: Scale,
    accent: "teal",
    image: "/images/prod-ediscovery.jpg",
    features: [
      { title: "Unified search", desc: "Email, documents, structured records and chat in one query." },
      { title: "Legal hold", desc: "Custodian-based holds with notifications and audit." },
      { title: "Early case assessment", desc: "Cull by date, custodian, keywords and concepts." },
      { title: "Review & tag", desc: "Collaborative review with privilege and redaction." },
      { title: "Production", desc: "Export to standard load files and formats." },
      { title: "Defensibility", desc: "Immutable audit trail for every action." },
    ],
    steps: [
      { title: "Identify", desc: "Locate relevant data across every source." },
      { title: "Preserve", desc: "Apply holds instantly, across systems." },
      { title: "Produce", desc: "Review and export with a full chain of custody." },
    ],
    outcomes: [
      { value: "70%", label: "lower outside review cost" },
      { value: "hrs", label: "from request to hold" },
      { value: "1", label: "source of truth for legal and IT" },
    ],
    chart: [{ metric: "Outside review cost", before: 100, after: 30, unit: "$ (index)" }, { metric: "Request to legal hold", before: 100, after: 4, unit: "hours (index)" }, { metric: "Sources searched per request", before: 40, after: 100, unit: "% of estate" }],
  },
  {
    slug: "consumer-data-privacy",
    category: "Comply",
    name: "Consumer Data Privacy",
    tagline: "Know where personal data lives. Prove you handle it right.",
    description:
      "Discover and classify personal data across the enterprise, automate DSAR and right-to-be-forgotten requests, enforce consent and retention, and demonstrate compliance with GDPR, CCPA, HIPAA and more.",
    icon: ShieldCheck,
    accent: "ember",
    image: "/images/prod-privacy.jpg",
    features: [
      { title: "PII discovery", desc: "ML classification across structured and unstructured data." },
      { title: "DSAR automation", desc: "Intake, verification, fulfilment and reporting workflows." },
      { title: "Right to be forgotten", desc: "Orchestrated deletion with legal exceptions." },
      { title: "Consent management", desc: "Capture and enforce purpose-based consent." },
      { title: "Retention enforcement", desc: "Policy-driven minimization across sources." },
      { title: "Regulator-ready reports", desc: "Evidence packs for audits and assessments." },
    ],
    steps: [
      { title: "Discover", desc: "Map personal data and processing activities." },
      { title: "Automate", desc: "Turn regulations into executable policies." },
      { title: "Prove", desc: "Continuous evidence for every jurisdiction." },
    ],
    outcomes: [
      { value: "95%", label: "DSARs fulfilled without manual effort" },
      { value: "30+", label: "regulations covered by templates" },
      { value: "1", label: "privacy view across the enterprise" },
    ],
    chart: [{ metric: "Manual effort per DSAR", before: 100, after: 5, unit: "hours (index)" }, { metric: "Fulfilment time", before: 100, after: 6, unit: "hours (index)" }, { metric: "Systems covered", before: 45, after: 100, unit: "% of estate" }],
  },
  {
    slug: "enterprise-ai",
    category: "Activate",
    name: "Enterprise AI",
    tagline: "Agents and copilots on data you already trust.",
    description:
      "Build governed retrieval, agents and AI-ready pipelines on the Common Data Platform. Business users create copilots on curated data products while IT keeps policy, lineage and cost under control.",
    icon: BrainCircuit,
    accent: "teal",
    image: "/images/ai-neural.jpg",
    features: [
      { title: "Governed RAG", desc: "Retrieval respects access policy, masking and retention." },
      { title: "Agent studio", desc: "Compose tools, prompts and guardrails without code." },
      { title: "Model choice", desc: "Bring OpenAI, Anthropic, Gemini or private models." },
      { title: "Evaluation", desc: "Test sets, grounding scores and drift monitoring." },
      { title: "Cost control", desc: "Budgets, quotas and per-team attribution." },
      { title: "Audit every answer", desc: "Trace each response to its sources." },
    ],
    steps: [
      { title: "Curate", desc: "Publish AI-ready data products with semantic context." },
      { title: "Build", desc: "Assemble agents and copilots in the studio." },
      { title: "Operate", desc: "Monitor quality, cost and compliance in production." },
    ],
    outcomes: [
      { value: "weeks", label: "not quarters, to production AI" },
      { value: "100%", label: "answers traceable to source" },
      { value: "0", label: "shadow data copies" },
    ],
    chart: [{ metric: "Time to production copilot", before: 100, after: 15, unit: "weeks (index)" }, { metric: "Answers traceable to source", before: 20, after: 100, unit: "%" }, { metric: "Shadow data exports", before: 100, after: 0, unit: "copies (index)" }],
  },
];

export const SOLUTIONS = [
  { id: "infrastructure-optimization", icon: Gauge, title: "Infrastructure Optimization", desc: "Shrink production databases, retire redundant applications and reclaim storage, licenses and compute, without losing access to a single record.", products: ["enterprise-archiving", "application-retirement"], metric: "80% lower TCO", span: "lg:col-span-7" },
  { id: "compliance-governance", icon: ShieldCheck, title: "Compliance & Governance", desc: "Retention, legal hold, defensible deletion and audit trails that satisfy SEC, FINRA, HIPAA, GDPR and sector regulators.", products: ["ediscovery", "consumer-data-privacy"], metric: "30+ regulations", span: "lg:col-span-5" },
  { id: "ai-readiness", icon: BrainCircuit, title: "AI & Analytics Readiness", desc: "Make every dataset discoverable, trustworthy and usable by analysts and AI agents through a governed lake and semantic catalog.", products: ["enterprise-data-lake", "enterprise-ai"], metric: "10x faster to first use case", span: "lg:col-span-5" },
  { id: "cloud-migration", icon: Cloud, title: "Cloud Migration", desc: "Migrate less by archiving first. Move only active data to the cloud, preserve the rest, and cut migration time and cost dramatically.", products: ["common-data-platform", "enterprise-archiving"], metric: "50% smaller migrations", span: "lg:col-span-7" },
  { id: "data-preservation", icon: Vault, title: "Data Preservation", desc: "Immutable, searchable preservation of records from every era and every system in a governed Preservation Zone.", products: ["common-data-platform"], metric: "PB-scale", span: "lg:col-span-6" },
  { id: "legacy-modernization", icon: RefreshCw, title: "Legacy Modernization", desc: "Exit mainframe, ERP and custom application debt on your timeline while preserving business context and reporting.", products: ["application-retirement"], metric: "$M reclaimed annually", span: "lg:col-span-6" },
];

export const INDUSTRIES = [
  { slug: "financial-services", image: "/images/ind-financial-services.jpg", icon: Landmark, name: "Financial Services", headline: "Compliance-grade archives and AI for banks, brokers and asset managers.", desc: "Meet SEC 17a-4, FINRA and Basel retention while shrinking core banking and trading system footprints.", challenges: ["Books-and-records retention across email, chat and trades", "Legacy core systems too costly to run and too risky to retire", "AI initiatives blocked by data lineage and privacy concerns"], results: ["WORM-compliant preservation with supervisory search", "Retired 40+ legacy applications at a top-20 US bank", "Governed RAG for advisor copilots on trusted client data"] },
  { slug: "healthcare", image: "/images/ind-healthcare.jpg", icon: HeartPulse, name: "Healthcare & Life Sciences", headline: "Protect patient data. Preserve clinical history. Accelerate research.", desc: "Archive legacy EHRs, retire acquired systems and enable HIPAA-compliant analytics and AI.", challenges: ["Dozens of legacy EHR/EMR systems after M&A", "HIPAA retention and breach exposure", "Research data locked in silos"], results: ["Legacy EHR retirement with clinician-friendly access", "Automated PHI discovery and minimization", "Governed research lake for clinical analytics"] },
  { slug: "manufacturing", image: "/images/ind-manufacturing.jpg", icon: Factory, name: "Manufacturing", headline: "Leaner ERP. Longer product memory. Smarter operations.", desc: "Archive SAP and Oracle history, retire plant-level systems and unify OT/IT data for predictive AI.", challenges: ["ERP growth slowing month-end and upgrades", "Decades of product and quality records to preserve", "OT and IT data never meet"], results: ["S/4HANA migration 50% smaller via archive-first", "Preserved 25 years of quality records for audits", "Predictive maintenance on unified plant data"] },
  { slug: "public-sector", image: "/images/ind-public-sector.jpg", icon: Building2, name: "Public Sector", headline: "Transparent, compliant, cost-effective records for the public.", desc: "Meet records management mandates, respond to FOIA quickly and modernize aging systems within budget.", challenges: ["Strict records schedules and FOIA response times", "Aging systems with retiring specialist staff", "Budget pressure and cloud mandates"], results: ["Sub-day FOIA search across archived records", "Retired mainframe systems ahead of staff attrition", "FedRAMP-aligned deployments"] },
  { slug: "retail", image: "/images/ind-retail.jpg", icon: ShoppingBag, name: "Retail & CPG", headline: "Every transaction preserved. Every customer respected.", desc: "Manage explosive POS and e-commerce growth, automate consumer privacy and power personalization safely.", challenges: ["Billions of transactions inflating databases", "CCPA/GDPR consumer requests at volume", "Personalization needs trusted, consented data"], results: ["POS archive cut database size 70%", "DSAR automation across 30+ systems", "Consent-aware customer 360 for AI"] },
  { slug: "energy", image: "/images/ind-energy.jpg", icon: Zap, name: "Energy & Utilities", headline: "Regulatory memory for critical infrastructure.", desc: "Preserve asset, meter and safety records for decades while retiring legacy systems and enabling grid analytics.", challenges: ["Multi-decade regulatory retention", "Legacy asset systems after mergers", "Smart-meter data volumes"], results: ["Preserved 12 PB of meter and asset history", "Retired 60 applications post-merger", "Governed lake for grid reliability AI"] },
  { slug: "telecom", image: "/images/ind-telecom.jpg", icon: RadioTower, name: "Telecommunications", headline: "CDR-scale data management, subscriber privacy built in.", desc: "Archive call detail and billing records, retire legacy BSS/OSS and unlock churn and network AI.", challenges: ["Petabytes of CDR and billing data", "Lawful intercept and retention obligations", "Legacy BSS/OSS after consolidation"], results: ["Petabyte CDR archive with second-level search", "Automated subscriber privacy workflows", "Churn models on unified subscriber data"] },
  { slug: "insurance", image: "/images/ind-insurance.jpg", icon: Umbrella, name: "Insurance", headline: "Policies and claims preserved for the life of the promise.", desc: "Retire legacy policy administration systems, meet retention rules and enable underwriting AI.", challenges: ["Long-tail policy and claims retention", "Multiple PAS platforms after acquisitions", "Underwriting AI needs historical claims"], results: ["Retired legacy PAS with full claim history access", "Retention by product line and jurisdiction", "Claims history lake for pricing models"] },
];

export const LOGOS = [
  "Meridian Bank", "Northwind Health", "Atlas Energy", "Helios Retail", "Vantage Insurance", "Orion Telecom", "Summit Manufacturing", "Civic Cloud", "Aurora Pharma", "Keystone Capital",
];

export const TESTIMONIALS = [
  { quote: "We retired forty legacy applications in eighteen months and every record is still one search away. Solix turned a compliance liability into a governed asset our AI teams can finally use.", role: "Chief Data Officer", org: "Top-20 US Bank" },
  { quote: "Our S/4HANA migration was half the size it would have been. Archive-first with Solix paid for itself before we even cut over.", role: "VP, Enterprise Applications", org: "Global Manufacturer" },
  { quote: "DSAR fulfilment went from a two-week scramble across thirty systems to a two-hour automated workflow. Legal and IT finally share one source of truth.", role: "Head of Privacy", org: "Multinational Retailer" },
];

export const RESOURCES = [
  { id: 1, slug: "build-enterprise-archive-in-the-cloud", type: "whitepaper", title: "How to Build an Enterprise Archive in the Cloud", desc: "A reference architecture for compliant, low-cost archiving with SOLIXCloud and the Common Data Platform.", tag: "Architecture", readTime: "24 min", date: "May 2026", gated: true, icon: FileText, author: "Solix Field Engineering", authorRole: "Reference architectures & delivery" },
  { id: 2, slug: "archive-first-fastest-path-to-s4hana", type: "blog", title: "Why Archive-First Is the Fastest Path to S/4HANA", desc: "Migrate less, cut risk and land on time by moving inactive ERP history before you move the system.", tag: "SAP", readTime: "7 min", date: "Jun 2026", icon: Newspaper, author: "Solix SAP Practice", authorRole: "ERP archiving & migration" },
  { id: 3, slug: "governed-rag-enterprise-ai-without-shadow-copies", type: "webinar", title: "Governed RAG: Enterprise AI Without the Shadow Copies", desc: "Live walkthrough of building a policy-aware copilot on curated data products.", tag: "Enterprise AI", readTime: "45 min", date: "Jun 2026", icon: Video, author: "Solix Enterprise AI Team", authorRole: "Product & platform engineering" },
  { id: 4, slug: "retiring-60-applications-after-utility-merger", type: "casestudy", title: "Retiring 60 Applications After a Utility Merger", desc: "How one energy company preserved 12 PB of records and cut $18M in annual run cost.", tag: "Energy", readTime: "12 min", date: "Apr 2026", gated: true, icon: BookOpen, author: "Solix Customer Success", authorRole: "Program outcomes" },
  { id: 5, slug: "trust-perimeter-model-for-business-led-ai", type: "blog", title: "The Trust Perimeter: A New Model for Business-Led AI", desc: "Why IT should define boundaries, not build every solution, and how Enterprise Edition makes it real.", tag: "Strategy", readTime: "9 min", date: "May 2026", icon: Newspaper, author: "Office of the CTO, Solix", authorRole: "Platform strategy" },
  { id: 6, slug: "consumer-data-privacy-automation-playbook", type: "whitepaper", title: "Consumer Data Privacy Automation Playbook", desc: "From PII discovery to DSAR fulfilment: operating models, KPIs and reference workflows.", tag: "Privacy", readTime: "31 min", date: "Mar 2026", gated: true, icon: FileText, author: "Solix Privacy Practice", authorRole: "Privacy engineering & compliance" },
  { id: 7, slug: "data-of-every-era-conversations-on-preservation", type: "podcast", title: "Data of Every Era: Conversations on Preservation", desc: "Episode 14: A CDO on treating decades-old records as first-class AI inputs.", tag: "Podcast", readTime: "38 min", date: "Jun 2026", icon: Mic2, author: "Solix Editorial", authorRole: "Podcast production" },
  { id: 8, slug: "solix-empower-2026-santa-clara", type: "event", title: "Solix Empower 2026 - Santa Clara", desc: "Our annual customer summit on data management for the AI-driven enterprise. October 14-15.", tag: "Event", readTime: "2 days", date: "Oct 2026", icon: CalendarDays, author: "Solix Events", authorRole: "Customer programs" },
  { id: 9, slug: "hipaa-compliant-legacy-ehr-retirement-at-scale", type: "casestudy", title: "HIPAA-Compliant Legacy EHR Retirement at Scale", desc: "A health system consolidated 23 EHR systems while keeping clinicians one click from history.", tag: "Healthcare", readTime: "10 min", date: "Feb 2026", gated: true, icon: BookOpen, author: "Solix Healthcare Practice", authorRole: "Clinical data programs" },
  { id: 10, slug: "application-retirement-factory-templates-that-scale", type: "webinar", title: "Application Retirement Factory: Templates That Scale", desc: "How to decommission portfolios, not one-offs, with reusable patterns.", tag: "Modernization", readTime: "40 min", date: "Apr 2026", icon: Video, author: "Solix Professional Services", authorRole: "Retirement factory delivery" },
];

export const RESOURCE_TYPES = [
  { key: "all", label: "All" },
  { key: "blog", label: "Blog" },
  { key: "whitepaper", label: "White Papers" },
  { key: "webinar", label: "Webinars" },
  { key: "casestudy", label: "Case Studies" },
  { key: "podcast", label: "Podcast" },
  { key: "event", label: "Events" },
];

export const TIMELINE = [
  { year: "2002", title: "Founded in Silicon Valley", desc: "Solix begins with a simple idea: enterprise data should be managed for its whole life, not just its first year." },
  { year: "2008", title: "Enterprise Data Management Suite", desc: "Archiving, test data management and application retirement ship as a unified suite for ERP-heavy enterprises." },
  { year: "2014", title: "Big Data Suite", desc: "Hadoop-native archiving and data lake capabilities bring petabyte scale to regulated industries." },
  { year: "2017", title: "Common Data Platform", desc: "One platform for structured and unstructured data with a governed Preservation Zone." },
  { year: "2020", title: "SOLIXCloud", desc: "Fully managed archiving, retirement and privacy as a service on public cloud." },
  { year: "2024", title: "Enterprise AI", desc: "Governed retrieval and agent building on trusted data products." },
  { year: "2026", title: "Enterprise Edition", desc: "Put AI in the hands of your business: every system, every era, inside the trust perimeter." },
];

export const VALUES = [
  { icon: Vault, title: "Preserve the record", desc: "Data of every era is a first-class asset. We never trade integrity for convenience." },
  { icon: ShieldCheck, title: "Trust is the product", desc: "Governance is not a feature we bolt on. It is the reason customers choose us." },
  { icon: Server, title: "Engineer for scale", desc: "Petabytes and decades are our normal operating conditions." },
  { icon: Sparkles, title: "Activate, don't accumulate", desc: "Data that is not usable by the business is a cost. We make it a capability." },
];

export const LEADERSHIP = [
  { name: "Sai Gundavelli", role: "Founder & Chief Executive Officer", initials: "SG", bio: "Founded Solix in 2002 with the conviction that enterprise data deserves lifecycle-long stewardship." },
  { name: "Chief Technology Officer", role: "Platform & Engineering", initials: "CT", bio: "Leads the Common Data Platform, SOLIXCloud and Enterprise AI engineering organizations." },
  { name: "Chief Customer Officer", role: "Customer Success & Services", initials: "CC", bio: "Owns outcomes for hundreds of enterprise programs across regulated industries." },
  { name: "Chief Revenue Officer", role: "Sales & Partnerships", initials: "CR", bio: "Drives global go-to-market with hyperscaler, SI and technology partners." },
];

export const OFFICES = [
  { city: "Santa Clara, CA", label: "Headquarters", address: "4701 Patrick Henry Drive, Bldg 20, Santa Clara, CA 95054, USA" },
  { city: "Hyderabad, India", label: "Engineering Center", address: "HITEC City, Hyderabad, Telangana" },
  { city: "London, UK", label: "EMEA", address: "City of London" },
  { city: "Singapore", label: "APAC", address: "Marina Bay" },
];

export const JOBS = [
  { id: "sr-platform-eng", title: "Senior Platform Engineer", team: "Engineering", location: "Santa Clara, CA / Hybrid", type: "Full-time", desc: "Own ingestion and storage services on the Common Data Platform. Kubernetes, Go/Java, Iceberg, object storage at petabyte scale." },
  { id: "ai-solutions-arch", title: "AI Solutions Architect", team: "Field Engineering", location: "Remote, US", type: "Full-time", desc: "Design governed RAG and agent architectures for Fortune 500 customers on Enterprise AI." },
  { id: "product-mgr-privacy", title: "Product Manager, Consumer Data Privacy", team: "Product", location: "Santa Clara, CA", type: "Full-time", desc: "Shape DSAR automation, consent and retention capabilities against a fast-moving regulatory landscape." },
  { id: "sap-archiving-consultant", title: "SAP Archiving Consultant", team: "Professional Services", location: "Hyderabad, India", type: "Full-time", desc: "Lead archive-first S/4HANA programs and application retirement engagements for global manufacturers." },
  { id: "enterprise-ae", title: "Enterprise Account Executive", team: "Sales", location: "New York, NY", type: "Full-time", desc: "Own financial services accounts in the Northeast. Complex, multi-stakeholder enterprise sales." },
  { id: "ux-designer", title: "Senior Product Designer", team: "Design", location: "Remote, US", type: "Full-time", desc: "Design the builder workspace and console experiences for Enterprise Edition." },
];

export const PERKS = [
  "Competitive salary and equity", "Health, dental and vision", "401(k) with company match", "Flexible hybrid work", "Learning budget and certifications", "Parental leave", "Annual Empower summit", "Volunteer days",
];

export const PARTNER_TIERS = [
  { icon: Cloud, title: "Cloud Partners", desc: "Deploy SOLIXCloud and the Common Data Platform natively on the hyperscalers your enterprise already trusts.", partners: ["Amazon Web Services", "Microsoft Azure", "Google Cloud", "Oracle Cloud"] },
  { icon: Layers, title: "Technology Partners", desc: "Certified integrations with the platforms that run your business.", partners: ["SAP", "Oracle", "Salesforce", "Workday", "ServiceNow", "Snowflake", "Databricks", "OpenAI"] },
  { icon: Building2, title: "System Integrators", desc: "Global and regional SIs who deliver Solix programs from assessment to run.", partners: ["Accenture", "Deloitte", "Capgemini", "Infosys", "TCS", "Wipro"] },
  { icon: FlaskConical, title: "Resellers & MSPs", desc: "Bring Solix to regulated mid-market customers with packaged managed offerings.", partners: ["Regional VARs", "Managed service providers", "Compliance consultancies"] },
];

export const PARTNER_BENEFITS = [
  { title: "Deal registration & margins", desc: "Protected opportunities with tiered incentives." },
  { title: "Technical enablement", desc: "Certification paths, sandboxes and architecture support." },
  { title: "Co-marketing", desc: "Joint campaigns, events and customer stories." },
  { title: "Dedicated partner team", desc: "Named managers from onboarding to renewal." },
];

export const INTERESTS = [
  { value: "enterprise-edition", label: "Solix Enterprise Edition" },
  { value: "common-data-platform", label: "Common Data Platform" },
  { value: "enterprise-archiving", label: "Enterprise Archiving" },
  { value: "enterprise-data-lake", label: "Enterprise Data Lake" },
  { value: "application-retirement", label: "Application Retirement" },
  { value: "ediscovery", label: "eDiscovery" },
  { value: "consumer-data-privacy", label: "Consumer Data Privacy" },
  { value: "enterprise-ai", label: "Enterprise AI" },
  { value: "other", label: "Something else" },
];

export const CHAT_SUGGESTIONS = [
  "What is Solix Enterprise Edition?",
  "How does archiving cut infrastructure cost?",
  "Can you retire SAP ECC and keep the data?",
  "Book a demo for me",
];

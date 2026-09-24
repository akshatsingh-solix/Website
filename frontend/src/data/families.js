import {
  AlertTriangle, Archive, Cloud, Database, EyeOff, FileCheck2, FileSearch, Gavel, Globe2, Inbox, Layers,
  MessageSquareText, Network, Plug, ScanSearch, Search, ShieldCheck, Tags,
} from "lucide-react";

/**
 * The five product families. Each has an OpenArt visual (see
 * openart-media.json, keyed by `id`), a hands-on explorer, and a four-stop
 * visual tour drawn over the render. `x`/`y` place a stop on the 4:3 stage,
 * in percent; `links` are the flows animated between stops.
 */
export const FAMILIES = [
  {
    id: "archiving",
    tone: "red",
    name: "Archiving & retirement",
    tagline: "Move inactive data out of production. Keep every record one click away.",
    explorer: "Savings calculator",
    products: ["enterprise-archiving", "application-retirement", "data-preservation", "sap-archiving", "oracle-oebs-archiving", "mainframe-archiving", "email-archiving", "file-archiving", "database-archiving", "active-archiving-compliance"],
    stops: [
      { id: "source", x: 18, y: 38, icon: Database, label: "Production", title: "Production systems", desc: "ERP, CRM, mainframe and file shares keep only the data people still change. Everything inactive becomes a candidate to move." },
      { id: "policy", x: 42, y: 66, icon: ShieldCheck, label: "Policy", title: "Retention rules decide", desc: "Business rules choose what moves and when: age, status, legal hold and each country's retention period." },
      { id: "archive", x: 66, y: 34, icon: Archive, label: "Archive", title: "A compliant, low-cost archive", desc: "Records land in immutable, compressed storage with referential integrity intact, so they stay complete and audit-ready." },
      { id: "access", x: 84, y: 66, icon: Search, label: "Access", title: "Still one click away", desc: "People search archived records from familiar screens and reports, and legal can place a hold in seconds." },
    ],
    links: [["source", "policy"], ["policy", "archive"], ["archive", "access"], ["source", "archive"]],
  },
  {
    id: "ai",
    tone: "blue",
    name: "Enterprise AI",
    tagline: "Ask questions of governed enterprise data and get answers you can cite.",
    explorer: "Ask-your-data sandbox",
    products: ["enterprise-ai", "data-sense", "data-ask", "application-knowledge-graph", "ai-warehouse", "agentic", "ai-healthcare", "eai-pharma"],
    stops: [
      { id: "sources", x: 18, y: 62, icon: Database, label: "Sources", title: "Governed sources", desc: "Archives, warehouses, documents and live applications are connected without copying data into another silo." },
      { id: "graph", x: 40, y: 30, icon: Network, label: "Knowledge graph", title: "A graph of what data means", desc: "The Application Knowledge Graph maps tables, fields and business terms, so the AI understands the question behind the words." },
      { id: "policy", x: 62, y: 64, icon: ShieldCheck, label: "Policy", title: "Every query checked", desc: "Queries run with the asker's own permissions, and sensitive fields are masked before any model sees them." },
      { id: "answer", x: 82, y: 36, icon: MessageSquareText, label: "Answer", title: "A cited answer", desc: "The reply comes in plain language with its sources, the query that ran and the policies applied, ready for audit." },
    ],
    links: [["sources", "graph"], ["graph", "policy"], ["policy", "answer"], ["sources", "policy"]],
  },
  {
    id: "governance",
    tone: "blue",
    name: "Governance & privacy",
    tagline: "Find, protect and prove control of sensitive data in every jurisdiction.",
    explorer: "Privacy policy explorer",
    products: ["ai-governance", "enterprise-data-governance", "consumer-data-privacy"],
    stops: [
      { id: "discover", x: 18, y: 40, icon: ScanSearch, label: "Discover", title: "Find sensitive data", desc: "Classifiers scan databases, files and cloud applications for personal and regulated data, wherever it hides." },
      { id: "classify", x: 40, y: 66, icon: Tags, label: "Classify", title: "Tag it once", desc: "Each field is tagged as an identifier, financial, health or other category, and mapped to the rules that apply to it." },
      { id: "mask", x: 62, y: 34, icon: EyeOff, label: "Mask", title: "Show each person what they may see", desc: "The same record appears in full, masked or tokenised depending on who is asking and from where." },
      { id: "prove", x: 82, y: 64, icon: FileCheck2, label: "Prove", title: "Prove compliance", desc: "Access and erasure requests under GDPR, CCPA, LGPD, DPDP and PDPA are fulfilled and logged, with legal holds respected." },
    ],
    links: [["discover", "classify"], ["classify", "mask"], ["mask", "prove"], ["discover", "mask"]],
  },
  {
    id: "platform",
    tone: "red",
    name: "Platform",
    tagline: "One governed foundation that runs in our cloud, yours or your data centre.",
    explorer: "Deployment explorer",
    products: ["enterprise-edition", "common-data-platform", "enterprise-data-lake"],
    stops: [
      { id: "connect", x: 16, y: 58, icon: Plug, label: "Connect", title: "Connect once", desc: "Connectors for databases, applications, mainframes, files and streams bring each source in a single time." },
      { id: "cdp", x: 40, y: 32, icon: Layers, label: "Common Data Platform", title: "One shared foundation", desc: "Storage, metadata, security and lineage live in one governed layer that every Solix product builds on." },
      { id: "run", x: 62, y: 64, icon: Cloud, label: "Deploy", title: "Run it where you want", desc: "Choose SOLIXCloud, your own AWS, Azure, Google Cloud or OCI account, on-premises or a hybrid of them." },
      { id: "residency", x: 84, y: 36, icon: Globe2, label: "Residency", title: "Keep data in its country", desc: "Pin each dataset to the region its regulators expect, and keep processing there too." },
    ],
    links: [["connect", "cdp"], ["cdp", "run"], ["run", "residency"], ["cdp", "residency"]],
  },
  {
    id: "content",
    tone: "blue",
    name: "Content services & eDiscovery",
    tagline: "Understand every document, in any language, and find what matters fast.",
    explorer: "Document explorer",
    products: ["enterprise-content-services", "ediscovery"],
    stops: [
      { id: "capture", x: 16, y: 40, icon: Inbox, label: "Capture", title: "Capture everything", desc: "Email, scans, contracts and office files arrive from shared drives, inboxes and business applications." },
      { id: "understand", x: 38, y: 66, icon: FileSearch, label: "Understand", title: "Understand each document", desc: "Documents are classified and their key fields extracted, whichever language they were written in." },
      { id: "flag", x: 62, y: 34, icon: AlertTriangle, label: "Flag", title: "Flag what's sensitive", desc: "Personal data, payment details and privileged content are flagged before anyone shares them." },
      { id: "produce", x: 84, y: 62, icon: Gavel, label: "Review", title: "Review and produce", desc: "Legal teams search, tag and produce defensible document sets for litigation and investigations." },
    ],
    links: [["capture", "understand"], ["understand", "flag"], ["flag", "produce"], ["capture", "flag"]],
  },
];

export const familyOf = (slug) => FAMILIES.find((f) => f.products.includes(slug)) || null;

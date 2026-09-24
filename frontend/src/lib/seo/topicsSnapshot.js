// A dated research snapshot of what the industry was discussing when the SEO
// dashboard was built (news search, 24 Sep 2026). The Hot topics tab shows
// this only until the backend's live radar (Google News, Hacker News, Reddit,
// refreshed every 6 hours) is reachable. Every headline links to its source.

const item = (title, url, at, source, kind = "news") => ({ title, url, at: `${at}T12:00:00Z`, source, kind, engagement: 1 });

export const TOPICS_SNAPSHOT = {
  fetched_at: "2026-09-24T12:00:00Z",
  source: "research",
  topics: [
    {
      topic: "AI governance & the EU AI Act",
      voices: { news: 6, analysts: 2 },
      rising_terms: ["article 50", "transparency obligations", "third-party ai agents", "shadow ai", "chatbot disclosure"],
      angle: "Article 50 transparency guidance took effect in August 2026 and privacy teams are comparing tooling. Publish a practical 'EU AI Act Article 50 checklist for enterprise data teams' and map each obligation to lineage, masking and audit evidence.",
      top: [
        item("EU AI Act Article 50: New Guidance Expands Enterprise AI Compliance Obligations", "https://www.law.com/corpcounsel/2026/09/08/eu-ai-act-article-50-new-guidance-expands-enterprise-ai-compliance-obligations/", "2026-09-08", "Law.com Corporate Counsel"),
        item("How to effectively govern third-party AI agents across the enterprise", "https://www.ibm.com/think/perspectives/how-to-effectively-govern-third-party-ai-agents-across-the-enterprise", "2026-09-23", "IBM Think", "vendor"),
        item("The EU AI Act Is a CX Problem Now", "https://www.cxtoday.com/security-privacy-compliance/the-eu-ai-act-is-a-cx-problem-now-ttecdigital-cs-0062/", "2026-09-22", "CX Today"),
        item("Consent Management Platform Comparison 2026 (OneTrust vs Securiti vs TrustArc)", "https://tech-insider.org/onetrust-vs-securiti-vs-trustarc-2026/", "2026-09-22", "Tech Insider", "analysts"),
        item("AI Governance Market to Reach $9,799.74 Million by 2035", "https://www.globenewswire.com/news-release/2026/09/16/3363475/0/en/ai-governance-market-to-reach-9799-74-million-by-2035-as-regulatory-pressure-and-responsible-ai-adoption-accelerate-research-by-sns-insider.html", "2026-09-16", "GlobeNewswire / SNS Insider", "analysts"),
        item("Patient rights and AI medical chatbots: Alignment between the GDPR and EU AI Act", "https://iapp.org/news/a/patient-rights-and-ai-medical-chatbots-alignment-between-the-gdpr-and-eu-ai-act", "2026-09-03", "IAPP"),
      ],
    },
    {
      topic: "Agentic AI needs trusted, AI-ready enterprise data",
      voices: { news: 4, vendor: 2 },
      rising_terms: ["data readiness", "govern agents", "semantic context", "lineage", "autonomous ams"],
      angle: "SAP, IBM and Google Cloud all published on agent-ready data in the last week. Answer the question buyers now ask ('how do I make archived and legacy data safe for AI agents?') with a governed-RAG explainer and a short readiness self-assessment.",
      top: [
        item("How to prepare enterprise data for advanced AI", "https://www.techtarget.com/data-technologies/feature/How-to-prepare-enterprise-data-for-advanced-AI", "2026-09-24", "TechTarget"),
        item("AI-Readiness in Enterprise Data Architecture", "https://www.dbta.com/DBTA-Downloads/WhitePapers/AI-Readiness-in-Enterprise-Data-Architecture-14935.aspx", "2026-09-24", "DBTA", "analysts"),
        item("Can Agentic AI Bridge the Gap with Trusted Enterprise Data?", "https://news.sap.com/2026/09/can-agentic-ai-bridge-gap-with-trusted-enterprise-data/", "2026-09-23", "SAP News", "vendor"),
        item("From AI pilots to autonomous AMS: The enterprise readiness test for SAP", "https://www.ibm.com/think/insights/from-ai-pilots-autonomous-ams", "2026-09-23", "IBM Think", "vendor"),
        item("Google Cloud unveils secure agentic AI blueprint for manufacturing", "https://industrialcyber.co/manufacturing/google-cloud-unveils-secure-agentic-ai-blueprint-for-manufacturing-amid-push-to-scale-industrial-ai/", "2026-09-21", "Industrial Cyber"),
        item("How Actionable Data, Governance Can Unlock Agentic AI Power", "https://mexicobusiness.news/logistics/news/how-actionable-data-governance-can-unlock-agentic-ai-power", "2026-09-21", "Mexico Business News"),
      ],
    },
    {
      topic: "SAP ECC end of maintenance (Dec 2027) & S/4HANA migration",
      voices: { news: 4, analysts: 1, competitor: 1 },
      rising_terms: ["ecc deadline", "december 2027", "rise with sap", "ai-ready", "compliance resilience"],
      angle: "With about 15 months to the ECC cutoff, 'archive before you migrate' is a live buying trigger, and a competitor (Archon) is already publishing on it. Refresh the SAP archiving pages with a data-volume ROI calculator and an 'ECC to S/4HANA: what to archive first' guide.",
      top: [
        item("SAP's cloud backlog hits €22.9 billion as the ECC migration countdown enters its final stretch", "https://startupfortune.com/saps-cloud-backlog-hits-229-billion-as-the-ecc-migration-countdown-enters-its-final-stretch/", "2026-07-23", "Startup Fortune"),
        item("The ECC Deadline: What It Means for Your SAP Career", "https://ignitesap.com/the-ecc-deadline-what-it-means-for-your-sap-career/", "2026-06-16", "IgniteSAP", "practitioners"),
        item("Why SAP S/4HANA Migration Alone Won't Make You AI-Ready", "https://erp.today/enterprise-data-layer-sap-s4hana-ai-readiness/", "2026-06-12", "ERP Today"),
        item("SAP ECC end of life: What leaders need to know", "https://rsmus.com/insights/services/business-strategy-operations/sap-ecc-end-of-life.html", "2026-04-07", "RSM", "analysts"),
        item("How Archon Data Store Strengthens Compliance Resilience During SAP ECC to S/4 HANA Migration", "https://techbullion.com/how-archon-data-store-strengthens-compliance-resilience-during-sap-ecc-to-s-4-hana-migration/", "2026-03-03", "TechBullion", "competitor"),
      ],
    },
    {
      topic: "Legacy decommissioning in modernization programs",
      voices: { news: 3, practitioners: 1, competitor: 1 },
      rising_terms: ["decommission safely", "healthcare modernization", "7 rs", "turn off the old system", "ai-assisted"],
      angle: "Healthcare and public-sector writers are arguing that modernization is not done until the old system is switched off. Publish industry-specific retirement playbooks (healthcare first) that show how to keep records accessible for audits after shutdown.",
      top: [
        item("Modernizing Legacy Systems in Healthcare: A Practical Guide", "https://appinventiv.com/blog/legacy-systems-in-healthcare/", "2026-09-22", "Appinventiv", "practitioners"),
        item("The Missing Discipline in Healthcare Modernization", "https://hitconsultant.net/2026/08/04/missing-discipline-healthcare-modernization/", "2026-08-04", "HIT Consultant"),
        item("Legacy system modernization: the 7 Rs decision framework", "https://www.netguru.com/blog/legacy-system-modernization-without-breaking-the-business", "2026-07-27", "Netguru"),
        item("How Does AI Accelerate IT Modernization?", "https://www.govtech.com/artificial-intelligence/how-does-ai-accelerate-it-modernization", "2026-04-28", "GovTech"),
        item("The data archiving snowball effect: start small and build momentum", "https://blogs.opentext.com/the-data-archiving-snowball-effect-start-small-and-build-momentum/", "2026-02-03", "OpenText blog", "competitor"),
      ],
    },
    {
      topic: "Data sovereignty & sovereign cloud",
      voices: { news: 4, analysts: 2 },
      rising_terms: ["sovereign ai", "stackit", "data residency", "digital autonomy", "regulated industries"],
      angle: "Sovereign AI has moved from geopolitics to architecture. Show how archived and governed data can stay in-country (data residency by design) with a Germany/France-focused page, which also supports the DE and FR competitor sets.",
      top: [
        item("Snowflake Integrates with STACKIT for EU Data Sovereignty", "https://www.snowflake.com/en/blog/snowflake-integration-stackit-data-sovereignty/", "2026-09-18", "Snowflake blog", "vendor"),
        item("Sovereign AI Without Data Silos: Implementing Data Sovereignty in a Distributed IT Landscape", "https://www.hpcwire.com/2026/09/11/sovereign-ai-without-data-silos-implementing-data-sovereignty-in-a-distributed-it-landscape/", "2026-09-11", "HPCwire"),
        item("Sovereign cloud and digital autonomy: Industry trends and what's next", "https://www.cio.com/article/4220781/sovereign-cloud-and-digital-autonomy-industry-trends-and-whats-next.html", "2026-09-10", "CIO.com"),
        item("Free Pro & Broadcom: Sovereignty Without Compromise", "https://www.broadcom.com/company/news/articles/partner-spotlight/free-pro-broadcom-sovereignty-without-compromise-trusted-environments", "2026-09-10", "Broadcom", "vendor"),
        item("Sovereign Cloud Market Companies, Size & Trends 2026-2035", "https://www.precedenceresearch.com/sovereign-cloud-market", "2026-09-10", "Precedence Research", "analysts"),
      ],
    },
    {
      topic: "Storage costs & archive limits (practitioner chatter)",
      voices: { community: 3 },
      rising_terms: ["storage prices", "auto-expanding archive", "cold storage", "3 tb", "purview"],
      angle: "Practitioners are feeling storage price pressure, and Microsoft Purview just doubled its auto-expanding archive limit. A 'true cost of keeping inactive data in production' calculator post fits this moment and feeds the archiving product pages.",
      top: [
        item("Microsoft Purview is doubling the auto-expanding archive limit from 1.5 TB to 3 TB", "https://www.reddit.com/r/AdminDroid/comments/1wnbdtv/microsoft_purview_is_doubling_autoexpanding/", "2026-09-22", "r/AdminDroid", "community"),
        item("3.5\" vs 2.5\" external drive for long-term cold data storage, concerned about rising storage costs", "https://www.reddit.com/r/datastorage/comments/1wnbp27/35_vs_25_external_hard_drive_for_long_term_cold/", "2026-09-22", "r/datastorage", "community"),
        item("Linus Tech Tips: The Unlikely Solution to Storage Prices", "https://www.reddit.com/r/LinusTechTips/comments/1wh7ccc/linus_tech_tips_the_unlikely_solution_to_storage/", "2026-09-15", "r/LinusTechTips", "community"),
      ],
    },
  ].map((t) => ({ ...t, mentions_30d: t.top.length, mentions_7d: t.top.filter((i) => i.at >= "2026-09-17").length })),
};

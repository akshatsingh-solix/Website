import { localizedSource } from "@/i18n/localize";

/*
 * Per-industry context behind the industry lens: the regulations each
 * industry's records answer to, how long they have to live, the shape of the
 * data (which drives the industry's data-terrain signature), and the Solix
 * products its programs usually start with (the platform explorer lights
 * their layers).
 *
 * Regulations are the ones the industry pages already cite plus the
 * standard record-keeping rules each industry is known for. Retention is
 * worded generally on purpose: the binding schedule is always the
 * customer's own, set by their counsel.
 *
 * Each industry's data-terrain signature (motion and palette) lives with
 * the component, in components/materials/terrainSignatures.js.
 */
const INDUSTRY_CONTEXT_EN = [
  {
    slug: "financial-services",
    character: "High-frequency and supervised",
    horizon: "3 to 6 years, some for the life of the firm",
    regulations: ["SEC 17a-4", "FINRA 4511", "BCBS 239", "GLBA"],
    products: ["active-archiving-compliance", "email-archiving", "application-retirement", "ediscovery", "enterprise-ai"],
  },
  {
    slug: "healthcare",
    character: "Long clinical memory",
    horizon: "6+ years, clinical records often decades",
    regulations: ["HIPAA", "HITECH", "21st Century Cures Act"],
    products: ["application-retirement", "consumer-data-privacy", "ai-healthcare", "enterprise-data-lake"],
  },
  {
    slug: "manufacturing",
    character: "Cyclical, decades deep",
    horizon: "Life of the product, quality records for decades",
    regulations: ["ISO 9001", "SOX", "ITAR / EAR"],
    products: ["sap-archiving", "oracle-oebs-archiving", "data-preservation", "enterprise-data-lake", "enterprise-ai"],
  },
  {
    slug: "public-sector",
    character: "Steady and permanent",
    horizon: "Set by records schedules, some permanent",
    regulations: ["FOIA", "NARA records schedules", "FedRAMP"],
    products: ["ediscovery", "mainframe-archiving", "application-retirement", "data-preservation"],
  },
  {
    slug: "pharma-biotech",
    character: "Lineage from lab to submission",
    horizon: "Often decades, per GxP predicate rules",
    regulations: ["21 CFR Part 11", "GxP", "EU Annex 11"],
    products: ["eai-pharma", "data-preservation", "application-retirement", "enterprise-data-governance"],
  },
  {
    slug: "retail",
    character: "Transaction bursts at scale",
    horizon: "As short as allowed, as long as required",
    regulations: ["CCPA / CPRA", "GDPR", "PCI DSS"],
    products: ["database-archiving", "consumer-data-privacy", "enterprise-ai"],
  },
  {
    slug: "energy",
    character: "Grid-scale, decades long",
    horizon: "Decades, often the life of the asset",
    regulations: ["NERC CIP", "FERC 18 CFR 125", "PHMSA"],
    products: ["application-retirement", "data-preservation", "enterprise-data-lake", "enterprise-ai"],
  },
  {
    slug: "telecom",
    character: "Billions of events a day",
    horizon: "Months to years, by jurisdiction",
    regulations: ["CALEA", "FCC CPNI", "GDPR / ePrivacy"],
    products: ["database-archiving", "consumer-data-privacy", "enterprise-data-lake", "enterprise-ai"],
  },
  {
    slug: "insurance",
    character: "Long-tail promises",
    horizon: "Life of the policy, plus the claims tail",
    regulations: ["NAIC model laws", "Solvency II", "IFRS 17", "GLBA"],
    products: ["application-retirement", "data-preservation", "enterprise-data-lake", "enterprise-ai"],
  },
];

export const INDUSTRY_CONTEXT = localizedSource(INDUSTRY_CONTEXT_EN);

/** Context for one industry slug (or undefined). */
export const industryContext = (slug) => INDUSTRY_CONTEXT.find((c) => c.slug === slug);

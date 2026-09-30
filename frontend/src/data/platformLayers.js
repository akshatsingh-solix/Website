import { localizedSource } from "@/i18n/localize";

/*
 * The four layers of the Solix platform, top to bottom, as the site draws
 * them everywhere (the key-slabs render, the homepage platform frame, the
 * Products architecture stack), with every product placed on the layer
 * that does its work. The platform explorer (components/platform) renders
 * this in 3D; `tone` picks the layer colour (components/platform/colors.js)
 * and `products` are product slugs.
 */
const PLATFORM_LAYERS_EN = [
  {
    key: "activate",
    tone: "red",
    label: "Activate",
    summary: "Governed data becomes answers: agents, copilots, analytics and applications, with no shadow copies.",
    products: ["enterprise-edition", "enterprise-ai", "data-sense", "data-ask", "application-knowledge-graph", "ai-warehouse", "agentic", "ai-healthcare", "eai-pharma"],
  },
  {
    key: "comply",
    tone: "navy",
    label: "Comply",
    summary: "Retention, legal hold, privacy and audit, applied once and carried by every record.",
    products: ["ediscovery", "consumer-data-privacy", "data-preservation", "active-archiving-compliance", "ai-governance"],
  },
  {
    key: "optimize",
    tone: "slate",
    label: "Optimize & Modernize",
    summary: "Inactive data leaves production and retired applications switch off, with their history one search away.",
    products: ["enterprise-archiving", "application-retirement", "enterprise-data-lake", "sap-archiving", "oracle-oebs-archiving", "mainframe-archiving", "database-archiving", "email-archiving", "file-archiving"],
  },
  {
    key: "foundation",
    tone: "blue",
    label: "Foundation",
    summary: "The Common Data Platform: 150+ connectors, one catalog, one policy engine and the Preservation Zone.",
    products: ["common-data-platform", "enterprise-data-governance", "enterprise-content-services"],
  },
];

export const PLATFORM_LAYERS = localizedSource(PLATFORM_LAYERS_EN);

/** The layer a product runs on (its key), or undefined. */
export const layerOfProduct = (slug) => PLATFORM_LAYERS_EN.find((l) => l.products.includes(slug))?.key;

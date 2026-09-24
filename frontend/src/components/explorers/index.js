import { lazy } from "react";

// One hands-on explorer per product family, loaded only on product pages.
const Savings = lazy(() => import("./SavingsCalculator"));
const Ask = lazy(() => import("./AskSandbox"));
const Policy = lazy(() => import("./PolicyExplorer"));
const Deploy = lazy(() => import("./DeploymentExplorer"));
const Content = lazy(() => import("./ContentExplorer"));

const BY_SLUG = {
  "enterprise-edition": Deploy, "common-data-platform": Deploy, "enterprise-data-lake": Deploy,
  "enterprise-archiving": Savings, "application-retirement": Savings, "data-preservation": Savings, "sap-archiving": Savings,
  "oracle-oebs-archiving": Savings, "mainframe-archiving": Savings, "email-archiving": Savings, "file-archiving": Savings,
  "database-archiving": Savings, "active-archiving-compliance": Savings,
  "enterprise-ai": Ask, "data-sense": Ask, "data-ask": Ask, "application-knowledge-graph": Ask, "ai-warehouse": Ask,
  "agentic": Ask, "ai-healthcare": Ask, "eai-pharma": Ask,
  "ai-governance": Policy, "enterprise-data-governance": Policy, "consumer-data-privacy": Policy,
  "ediscovery": Content, "enterprise-content-services": Content,
};

export const explorerFor = (slug) => BY_SLUG[slug] || null;

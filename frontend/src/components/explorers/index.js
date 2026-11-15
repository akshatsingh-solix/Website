import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { familyOf } from "@/data/families";

// One hands-on explorer per product family, loaded only on product pages.
const BY_FAMILY = {
  archiving: lazyWithRetry(() => import("./SavingsCalculator")),
  ai: lazyWithRetry(() => import("./AskSandbox")),
  governance: lazyWithRetry(() => import("./PolicyExplorer")),
  platform: lazyWithRetry(() => import("./DeploymentExplorer")),
  content: lazyWithRetry(() => import("./ContentExplorer")),
};

export const explorerFor = (slug) => BY_FAMILY[familyOf(slug)?.id] || null;

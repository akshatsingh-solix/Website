import { lazy } from "react";
import { familyOf } from "@/data/families";

// One hands-on explorer per product family, loaded only on product pages.
const BY_FAMILY = {
  archiving: lazy(() => import("./SavingsCalculator")),
  ai: lazy(() => import("./AskSandbox")),
  governance: lazy(() => import("./PolicyExplorer")),
  platform: lazy(() => import("./DeploymentExplorer")),
  content: lazy(() => import("./ContentExplorer")),
};

export const explorerFor = (slug) => BY_FAMILY[familyOf(slug)?.id] || null;

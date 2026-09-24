import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Globe2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { ExplorerShell, Segmented, prefillLead, useExplorerTracking } from "./kit";

const MODELS = [
  { id: "solixcloud", label: "SOLIXCloud", boundary: "Solix-managed cloud", tone: "#EE2424", manage: { infra: "Solix", upgrades: "Solix", security: "Shared", policy: "You" } },
  { id: "yourcloud", label: "Your cloud", boundary: "Your cloud account", tone: "#0088CF", manage: { infra: "You", upgrades: "Solix", security: "Shared", policy: "You" } },
  { id: "onprem", label: "On-premises", boundary: "Your data centre", tone: "#2C4A66", manage: { infra: "You", upgrades: "You", security: "You", policy: "You" } },
  { id: "hybrid", label: "Hybrid", boundary: "Cloud + your data centre", tone: "#7C3AED", manage: { infra: "Shared", upgrades: "Shared", security: "Shared", policy: "You" } },
];
const CLOUDS = ["AWS", "Microsoft Azure", "Google Cloud", "Oracle Cloud"];
const REGIONS = [
  { id: "us", label: "United States", city: "Virginia" }, { id: "eu", label: "European Union", city: "Frankfurt" }, { id: "uk", label: "United Kingdom", city: "London" },
  { id: "in", label: "India", city: "Mumbai" }, { id: "sg", label: "Singapore", city: "Singapore" }, { id: "ae", label: "United Arab Emirates", city: "Dubai" },
  { id: "au", label: "Australia", city: "Sydney" }, { id: "ca", label: "Canada", city: "Montréal" }, { id: "jp", label: "Japan", city: "Tokyo" },
];
const SOURCES = ["SAP", "Oracle EBS", "Mainframe", "Salesforce", "Files & email", "Legacy apps"];
const LAYERS = ["Connect & ingest", "Govern: policy, lineage, retention", "Store: archive, lake, warehouse", "Serve: SQL, APIs, AI"];
const CONSUMERS = ["BI & reports", "AI agents", "Business apps", "Auditors & regulators"];
const ROWS = [["infra", "Infrastructure"], ["upgrades", "Upgrades"], ["security", "Security patching"], ["policy", "Data policies & access"]];

export default function DeploymentExplorer({ product }) {
  const tx = useTx();
  const [model, setModel] = useState("solixcloud");
  const [cloud, setCloud] = useState("AWS");
  const [region, setRegion] = useState("eu");
  const engaged = useExplorerTracking("deployment-explorer", useMemo(() => [product.slug], [product.slug]));
  const m = MODELS.find((x) => x.id === model);
  const reg = REGIONS.find((x) => x.id === region);

  // Diagram geometry (viewBox 900 x 360)
  const srcY = (i) => 40 + i * 52;
  const conY = (i) => 70 + i * 70;
  return (
    <ExplorerShell title={tx("Deploy {{name}} your way", { name: product.name })} subtitle={tx("Pick a deployment model and a region. The architecture, the data-residency boundary and who runs what update live.")} testId="explorer-deploy">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented options={MODELS.map((x) => ({ value: x.id, label: tx(x.label) }))} value={model} onChange={(v) => { setModel(v); engaged(`model:${v}`); }} testId="deploy-model" />
        {model === "yourcloud" && <Segmented size="sm" options={CLOUDS.map((c) => ({ value: c, label: c }))} value={cloud} onChange={setCloud} />}
        <label className="ml-auto flex items-center gap-2 text-sm">
          <Globe2 className="h-4 w-4 text-teal" />
          <select value={region} onChange={(e) => { setRegion(e.target.value); engaged(`region:${e.target.value}`); }} className="h-9 rounded-lg border border-line/15 bg-background px-3 text-sm" aria-label={tx("Data residency region")} data-testid="deploy-region">
            {REGIONS.map((x) => <option key={x.id} value={x.id}>{tx(x.label)}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-6 overflow-x-auto">
        <svg viewBox="0 0 900 360" className="min-w-[680px] w-full" role="img" aria-label={tx("Architecture diagram")}>
          <defs>
            <marker id="dx-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9FB0C4" /></marker>
          </defs>
          {/* residency boundary */}
          <motion.rect key={model} initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="262" y="14" width="376" height="332" rx="22" fill={`${m.tone}10`} stroke={m.tone} strokeDasharray="6 6" strokeWidth="1.5" />
          <text x="282" y="40" fontSize="12" fill={m.tone} fontWeight="600">{tx(m.boundary)}{model === "yourcloud" ? ` · ${cloud}` : ""}</text>
          <text x="282" y="58" fontSize="11" fill="#3D6288">{tx("Data at rest stays in {{place}}", { place: `${reg.city}, ${tx(reg.label)}` })}</text>
          {model === "hybrid" && <line x1="450" y1="70" x2="450" y2="340" stroke={m.tone} strokeDasharray="3 5" opacity="0.5" />}
          {/* sources */}
          {SOURCES.map((s, i) => (
            <g key={s}>
              <rect x="10" y={srcY(i) - 16} width="170" height="32" rx="8" fill="#fff" stroke="rgba(13,25,45,0.12)" />
              <text x="24" y={srcY(i) + 4} fontSize="12" fill="#0D192D">{tx(s)}</text>
              <path d={`M182,${srcY(i)} C 225,${srcY(i)} 240,190 290,190`} fill="none" stroke="#C5D0DD" strokeWidth="1.2" markerEnd="url(#dx-arrow)" />
              <circle r="3" fill={m.tone}><animateMotion dur={`${2.4 + i * 0.3}s`} repeatCount="indefinite" path={`M182,${srcY(i)} C 225,${srcY(i)} 240,190 290,190`} /></circle>
            </g>
          ))}
          {/* platform layers */}
          {LAYERS.map((l, i) => (
            <g key={l}>
              <rect x="296" y={80 + i * 64} width="308" height="50" rx="12" fill="#fff" stroke={i === 1 ? m.tone : "rgba(13,25,45,0.12)"} strokeWidth={i === 1 ? 1.6 : 1} />
              <text x="314" y={110 + i * 64} fontSize="12.5" fill="#0D192D" fontWeight={i === 1 ? 600 : 400}>{tx(l)}</text>
            </g>
          ))}
          {/* consumers */}
          {CONSUMERS.map((c, i) => (
            <g key={c}>
              <path d={`M606,190 C 660,190 670,${conY(i)} 712,${conY(i)}`} fill="none" stroke="#C5D0DD" strokeWidth="1.2" markerEnd="url(#dx-arrow)" />
              <circle r="3" fill="#0088CF"><animateMotion dur={`${2 + i * 0.4}s`} repeatCount="indefinite" path={`M606,190 C 660,190 670,${conY(i)} 712,${conY(i)}`} /></circle>
              <rect x="716" y={conY(i) - 16} width="174" height="32" rx="8" fill="#fff" stroke="rgba(13,25,45,0.12)" />
              <text x="730" y={conY(i) + 4} fontSize="12" fill="#0D192D">{tx(c)}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-line/10 lg:col-span-7">
          <table className="w-full text-sm" data-testid="deploy-table">
            <thead><tr className="border-b border-line/10 bg-muted/60 text-left text-xs text-muted-foreground"><th className="px-4 py-2 font-medium">{tx("Who runs what")}</th><th className="px-4 py-2 font-medium">{tx(m.label)}</th></tr></thead>
            <tbody>
              {ROWS.map(([k, label]) => (
                <tr key={k} className="border-b border-line/5 last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground">{tx(label)}</td>
                  <td className="px-4 py-2.5"><span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", m.manage[k] === "Solix" ? "bg-primary/10 text-primary-ink" : m.manage[k] === "You" ? "bg-teal/10 text-teal" : "bg-violet-500/10 text-violet-700")}>{tx(m.manage[k])}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-line/10 bg-muted/50 p-4 lg:col-span-5">
          <p className="flex items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" />{tx("Same platform, same policies and the same audit trail in every model. Only where it runs, and who operates the infrastructure, changes.")}</p>
          <Button size="sm" onClick={() => prefillLead(tx("We're interested in {{name}} deployed as {{model}} with data residency in {{region}}.", { name: product.name, model: tx(m.label) + (model === "yourcloud" ? ` (${cloud})` : ""), region: tx(reg.label) }))} data-testid="deploy-cta">
            {tx("Plan this deployment with us")} <ArrowRight />
          </Button>
        </div>
      </div>
    </ExplorerShell>
  );
}

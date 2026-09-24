import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Database, Download, Eye, EyeOff, Gavel, Hash, Search, Shield, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTx } from "@/i18n/tx";
import { ExplorerShell, Segmented, prefillLead, useExplorerTracking } from "./kit";

// Fictional people, one per jurisdiction, so the sample feels local.
const REGIONS = [
  { id: "eu", label: "EU · GDPR", deadline: "1 month", person: { name: "Lena Hoffmann", email: "lena.hoffmann@example.de", phone: "+49 30 1234 5678", idLabel: "Tax ID", id: "12 345 678 901", dob: "1987-03-14", address: "Kastanienallee 12, Berlin", card: "4539 1488 0343 6467" } },
  { id: "uk", label: "UK · UK GDPR", deadline: "1 month", person: { name: "Oliver Bennett", email: "o.bennett@example.co.uk", phone: "+44 20 7946 0958", idLabel: "NI number", id: "QQ 12 34 56 C", dob: "1990-07-02", address: "14 Rose Lane, Manchester", card: "5425 2334 3010 9903" } },
  { id: "us", label: "California · CCPA", deadline: "45 days", person: { name: "Maya Johnson", email: "maya.j@example.com", phone: "+1 415 555 0142", idLabel: "SSN", id: "123-45-6789", dob: "1992-11-21", address: "221 Mission St, San Francisco", card: "4716 0123 4567 8910" } },
  { id: "br", label: "Brazil · LGPD", deadline: "15 days", person: { name: "Ana Souza", email: "ana.souza@example.com.br", phone: "+55 11 91234 5678", idLabel: "CPF", id: "123.456.789-09", dob: "1985-05-30", address: "Rua Augusta 500, São Paulo", card: "5162 3456 7890 1234" } },
  { id: "in", label: "India · DPDP", deadline: null, person: { name: "Priya Raman", email: "priya.r@example.in", phone: "+91 98765 43210", idLabel: "Aadhaar", id: "1234 5678 9012", dob: "1991-09-09", address: "MG Road 45, Bengaluru", card: "4111 1111 1111 1111" } },
  { id: "sg", label: "Singapore · PDPA", deadline: null, person: { name: "Wei Ling Tan", email: "weiling.tan@example.sg", phone: "+65 6123 4567", idLabel: "NRIC", id: "S1234567D", dob: "1989-01-17", address: "8 Marina View, Singapore", card: "4000 0566 5566 5556" } },
];

const FIELDS = [
  { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "id", label: "National ID" },
  { key: "dob", label: "Date of birth" }, { key: "address", label: "Address" }, { key: "card", label: "Payment card" },
];

// show | partial | token | hide
const ROLES = [
  { id: "support", label: "Customer support", policy: { name: "show", email: "show", phone: "show", id: "partial", dob: "hide", address: "show", card: "partial" } },
  { id: "marketing", label: "Marketing analyst", policy: { name: "partial", email: "token", phone: "hide", id: "hide", dob: "partial", address: "partial", card: "hide" } },
  { id: "datascience", label: "Data scientist", policy: { name: "token", email: "token", phone: "token", id: "token", dob: "partial", address: "partial", card: "hide" } },
  { id: "agent", label: "AI agent", policy: { name: "token", email: "hide", phone: "hide", id: "hide", dob: "hide", address: "partial", card: "hide" } },
  { id: "auditor", label: "Auditor", policy: { name: "show", email: "show", phone: "show", id: "show", dob: "show", address: "show", card: "partial" } },
];

const token = (v) => `tok_${Math.abs([...v].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36).slice(0, 8)}`;
const partial = (key, v) => {
  if (key === "email") return v.replace(/^(.).*(@.*)$/, "$1•••$2");
  if (key === "dob") return `${v.slice(0, 4)}-••-••`;
  if (key === "address") return `••• ${v.split(",").pop().trim()}`;
  if (key === "name") return `${v.split(" ")[0][0]}. ${v.split(" ").slice(-1)[0]}`;
  return `${"•".repeat(Math.max(0, v.length - 4))}${v.slice(-4)}`;
};
const TREAT = {
  show: { Icon: Eye, label: "Visible", cls: "text-foreground" },
  partial: { Icon: EyeOff, label: "Partially masked", cls: "text-amber-700" },
  token: { Icon: Hash, label: "Tokenised", cls: "text-teal" },
  hide: { Icon: Shield, label: "Hidden", cls: "text-muted-foreground" },
};

const SYSTEMS = [
  { name: "CRM", n: 42 }, { name: "ERP (orders)", n: 118 }, { name: "Email archive", n: 367 }, { name: "Call recordings", n: 12 },
  { name: "Retired billing system", n: 204 }, { name: "Data lake", n: 89 },
];

export default function PolicyExplorer({ product }) {
  const tx = useTx();
  const [region, setRegion] = useState("eu");
  const [role, setRole] = useState("marketing");
  const [scan, setScan] = useState(-1);
  const [hold, setHold] = useState(false);
  const [action, setAction] = useState(null);
  const timers = useRef([]);
  const engaged = useExplorerTracking("policy-explorer", useMemo(() => [product.slug], [product.slug]));
  const r = REGIONS.find((x) => x.id === region);
  const policy = ROLES.find((x) => x.id === role).policy;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { setScan(-1); setAction(null); }, [region]);

  const startScan = () => {
    timers.current.forEach(clearTimeout);
    setAction(null);
    setScan(0);
    SYSTEMS.forEach((_, i) => timers.current.push(setTimeout(() => setScan(i + 1), 450 * (i + 1))));
    engaged("dsar-scan");
  };
  const total = SYSTEMS.slice(0, Math.max(scan, 0)).reduce((s, x) => s + x.n, 0);
  const value = (f) => {
    const v = r.person[f.key];
    const t = policy[f.key];
    if (t === "show") return v;
    if (t === "partial") return partial(f.key, v);
    if (t === "token") return token(v);
    return "—";
  };

  return (
    <ExplorerShell title={tx("See your privacy policies in action")} subtitle={tx("Choose who is looking and where the customer lives. The same record is masked, tokenised or hidden automatically. Fictional sample data.")} testId="explorer-policy">
      <div className="flex flex-wrap gap-3">
        <Segmented size="sm" options={REGIONS.map((x) => ({ value: x.id, label: tx(x.label) }))} value={region} onChange={(v) => { setRegion(v); engaged(`region:${v}`); }} testId="policy-region" />
      </div>
      <div className="mt-3">
        <Segmented size="sm" options={ROLES.map((x) => ({ value: x.id, label: tx(x.label) }))} value={role} onChange={(v) => { setRole(v); engaged(`role:${v}`); }} testId="policy-role" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-line/10">
            <div className="flex items-center justify-between border-b border-line/10 bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="font-mono uppercase tracking-[0.14em]">{tx("Customer record")}</span>
              <span>{tx("Viewed as: {{role}}", { role: tx(ROLES.find((x) => x.id === role).label) })}</span>
            </div>
            <dl className="divide-y divide-line/5" data-testid="policy-record">
              {FIELDS.map((f) => {
                const t = TREAT[policy[f.key]];
                return (
                  <div key={f.key} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-3 px-4 py-2.5 text-sm">
                    <dt className="text-muted-foreground">{f.key === "id" ? tx(r.person.idLabel) : tx(f.label)}</dt>
                    <AnimatePresence mode="wait">
                      <motion.dd key={`${role}-${region}-${f.key}`} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className={cn("truncate font-mono text-[13px]", t.cls)}>{value(f)}</motion.dd>
                    </AnimatePresence>
                    <span className={cn("inline-flex items-center gap-1 text-[11px]", t.cls)} title={tx(t.label)}><t.Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{tx(t.label)}</span></span>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-line/10 bg-muted/50 p-4">
            <p className="flex items-center gap-2 text-sm font-medium"><Search className="h-4 w-4 text-teal" />{tx("Data subject request")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {r.deadline ? tx("{{name}} asks for all their data. Statutory deadline: {{d}}.", { name: r.person.name, d: tx(r.deadline) }) : tx("{{name}} asks for all their data. Deadline applied as set in your policy.", { name: r.person.name })}
            </p>
            <Button size="sm" className="mt-3" onClick={startScan} data-testid="policy-scan">{tx("Find everything about this person")}</Button>
            {scan >= 0 && (
              <ul className="mt-4 space-y-1.5 text-xs">
                {SYSTEMS.map((s, i) => (
                  <li key={s.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><Database className={cn("h-3.5 w-3.5", scan > i ? "text-teal" : "text-muted-foreground/40")} />{tx(s.name)}</span>
                    <span className="font-mono tabular-nums">{scan > i ? s.n : "…"}</span>
                  </li>
                ))}
              </ul>
            )}
            {scan >= SYSTEMS.length && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 border-t border-line/10 pt-4" data-testid="policy-result">
                <p className="text-sm font-medium">{tx("{{n}} records in {{s}} systems", { n: total, s: SYSTEMS.length })}</p>
                <label className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><Gavel className="h-3.5 w-3.5" />{tx("Legal hold on this customer")}</span>
                  <Switch checked={hold} onCheckedChange={(v) => { setHold(v); setAction(null); }} />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setAction("export"); engaged("dsar-export"); }}><Download /> {tx("Export")}</Button>
                  <Button size="sm" variant="outline" onClick={() => { setAction("delete"); engaged("dsar-delete"); }} data-testid="policy-delete"><Trash2 /> {tx("Erase")}</Button>
                </div>
                {action && (
                  <p className="mt-3 rounded-lg bg-background p-3 text-xs leading-relaxed" data-testid="policy-action">
                    {action === "export"
                      ? tx("A single package with all {{n}} records is prepared, with an audit trail of who approved it.", { n: total })
                      : hold
                        ? tx("Erasure is blocked: a legal hold applies. The request is logged and the customer is told why.")
                        : tx("Records are deleted or anonymised in every system, including the retired billing system, and a certificate of erasure is issued.")}
                  </p>
                )}
              </motion.div>
            )}
          </div>
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => prefillLead(tx("I tried the {{name}} policy explorer ({{region}}). I'd like to see this on our systems.", { name: product.name, region: tx(r.label) }))} data-testid="policy-cta">
            {tx("See this on your systems")} <ArrowRight />
          </Button>
        </div>
      </div>
    </ExplorerShell>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, Mail, ScanText, ShieldAlert, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { ExplorerShell, prefillLead, useExplorerTracking } from "./kit";

// Fictional documents in several languages.
const DOCS = [
  {
    file: "Rechnung_2026-0117.pdf", Icon: FileText, language: "German", type: "Supplier invoice", sensitivity: "Confidential", retention: "10 years",
    preview: "Rechnung Nr. 2026-0117 · Globex Components GmbH · Betrag: 12.480,00 € · IBAN DE89 3704 0044 0532 0130 00 · Fällig: 15.10.2026",
    entities: [["Supplier", "Globex Components GmbH"], ["Amount", "€12,480.00"], ["Due date", "2026-10-15"], ["Bank account", "DE89 •••• 3000"]],
    sensitive: ["Bank account"], actions: ["Route to accounts payable", "Apply retention", "Mask bank details"],
  },
  {
    file: "Contrato_Servicios_MX.docx", Icon: FileText, language: "Spanish", type: "Services contract", sensitivity: "Confidential", retention: "Contract term + 6 years",
    preview: "Contrato de prestación de servicios entre Initech México S.A. de C.V. y Solix · Vigencia: 36 meses · Renovación automática · Ley aplicable: México",
    entities: [["Parties", "Initech México, Solix"], ["Term", "36 months"], ["Renewal", "Automatic"], ["Governing law", "Mexico"]],
    sensitive: [], actions: ["Add renewal reminder", "Apply retention", "Link to supplier record"],
  },
  {
    file: "Discharge_summary_4821.pdf", Icon: FileText, language: "English", type: "Clinical document", sensitivity: "Restricted (health data)", retention: "Per health-records policy",
    preview: "Discharge summary · Patient MRN 4821 · DOB 1958-04-02 · Dx: Type 2 diabetes (E11.9) · Follow-up in 2 weeks",
    entities: [["Patient", "MRN 4821"], ["Date of birth", "1958-04-02"], ["Diagnosis", "E11.9 Type 2 diabetes"], ["Follow-up", "2 weeks"]],
    sensitive: ["Patient", "Date of birth", "Diagnosis"], actions: ["Restrict to care team", "File to patient record", "Redact for research"],
  },
  {
    file: "RE_Q3_pricing.eml", Icon: Mail, language: "English", type: "Business email", sensitivity: "Internal", retention: "7 years",
    preview: "From: sales-lead@… To: pricing@… Subject: RE: Q3 pricing for Umbrella · \"Let's hold the 12% discount until the contract is signed…\"",
    entities: [["Customer", "Umbrella Corp"], ["Topic", "Pricing, discount"], ["People", "2 employees"], ["Thread", "6 messages"]],
    sensitive: [], actions: ["Place on legal hold", "Add to case: Umbrella dispute", "Apply retention"],
  },
  {
    file: "秘密保持契約_東京.pdf", Icon: FileText, language: "Japanese", type: "Non-disclosure agreement", sensitivity: "Confidential", retention: "Agreement term + 5 years",
    preview: "秘密保持契約書 · 甲: 株式会社フーリ · 乙: Solix · 有効期間: 3年 · 準拠法: 日本法",
    entities: [["Parties", "Hooli K.K., Solix"], ["Term", "3 years"], ["Governing law", "Japan"], ["Signed", "Yes"]],
    sensitive: [], actions: ["Link to contract register", "Apply retention", "Translate summary"],
  },
  {
    file: "Payslip_Bengaluru_Aug.pdf", Icon: FileText, language: "English", type: "Payslip (HR)", sensitivity: "Restricted (personal)", retention: "8 years",
    preview: "Payslip · Aug 2026 · Employee: R. Kumar · PAN ABCDE1234F · Net pay ₹1,84,500 · Bank ••••6621",
    entities: [["Employee", "R. Kumar"], ["Tax ID (PAN)", "ABCDE1234F"], ["Net pay", "₹1,84,500"], ["Bank account", "•••• 6621"]],
    sensitive: ["Employee", "Tax ID (PAN)", "Bank account"], actions: ["Restrict to HR", "Mask tax ID", "Apply retention"],
  },
];

export default function ContentExplorer({ product }) {
  const tx = useTx();
  const [sel, setSel] = useState(null);
  const [phase, setPhase] = useState(0); // 0 idle, 1 reading, 2 done
  const [done, setDone] = useState([]);
  const timer = useRef(null);
  const engaged = useExplorerTracking("content-explorer", useMemo(() => [product.slug], [product.slug]));
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = (d) => {
    clearTimeout(timer.current);
    setSel(d);
    setDone([]);
    setPhase(1);
    timer.current = setTimeout(() => setPhase(2), 1400);
    engaged(d.type);
  };

  return (
    <ExplorerShell title={tx("Drop in a document, see what {{name}} understands", { name: product.name })} subtitle={tx("Pick a sample file in any language. It's classified, key facts are extracted, sensitive data is flagged and the right policy is suggested. Fictional documents.")} testId="explorer-content">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          {DOCS.map((d) => (
            <button key={d.file} type="button" onClick={() => pick(d)} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors", sel === d ? "border-primary/50 bg-primary/5" : "border-line/10 hover:border-line/30 hover:bg-muted")} data-testid="content-doc">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-teal"><d.Icon className="h-4 w-4" /></span>
              <span className="min-w-0">
                <span className="block truncate font-mono text-xs">{d.file}</span>
                <span className="block text-[11px] text-muted-foreground">{tx(d.language)}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="min-h-[360px] rounded-2xl border border-line/10 bg-muted/50 p-4 sm:p-5 lg:col-span-7" aria-live="polite">
          {!sel && <div className="grid h-full place-items-center text-center text-sm text-muted-foreground"><div><ScanText className="mx-auto h-8 w-8 text-primary/60" /><p className="mt-3 max-w-xs">{tx("Choose a document on the left.")}</p></div></div>}
          {sel && (
            <div>
              <div className="relative overflow-hidden rounded-xl border border-line/10 bg-background p-4">
                <p className="font-mono text-[11px] text-muted-foreground">{sel.file}</p>
                <p className="mt-2 text-sm leading-relaxed">{sel.preview}</p>
                {phase === 1 && <motion.div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-teal/0 via-teal/15 to-teal/0" initial={{ y: "-100%" }} animate={{ y: "300%" }} transition={{ duration: 1.3, ease: "easeInOut" }} />}
              </div>
              {phase === 1 && <p className="mt-4 text-xs text-muted-foreground">{tx("Reading, classifying and extracting…")}</p>}
              <AnimatePresence>
                {phase === 2 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4" data-testid="content-result">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      {[["Type", sel.type], ["Language", sel.language], ["Sensitivity", sel.sensitivity], ["Retention", sel.retention]].map(([k, v]) => (
                        <div key={k} className="rounded-lg bg-background p-2.5"><p className="text-muted-foreground">{tx(k)}</p><p className="mt-0.5 font-medium">{tx(v)}</p></div>
                      ))}
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium"><Tag className="h-3.5 w-3.5 text-teal" />{tx("Extracted")}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sel.entities.map(([k, v]) => (
                          <span key={k} className={cn("rounded-full border px-3 py-1 text-xs", sel.sensitive.includes(k) ? "border-amber-500/40 bg-amber-500/10" : "border-line/10 bg-background")}>
                            <span className="text-muted-foreground">{tx(k)}:</span> {v}
                            {sel.sensitive.includes(k) && <ShieldAlert className="-mt-0.5 ml-1 inline h-3 w-3 text-amber-700" />}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium">{tx("Suggested actions")}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sel.actions.map((a) => (
                          <button key={a} type="button" onClick={() => { setDone((x) => (x.includes(a) ? x : [...x, a])); engaged(a); }} className={cn("rounded-full border px-3 py-1.5 text-xs transition-colors", done.includes(a) ? "border-teal/40 bg-teal/10 text-teal" : "border-line/15 bg-background hover:border-primary/50")}>
                            {done.includes(a) ? "✓ " : ""}{tx(a)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => prefillLead(tx("I tried the {{name}} document explorer and would like to see it on our content.", { name: product.name }))} data-testid="content-cta">
                      {tx("Try it on your documents")} <ArrowRight />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </ExplorerShell>
  );
}

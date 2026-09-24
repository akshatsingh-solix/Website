// Loads everything the SEO dashboard needs for one country, falling back to
// labelled sample data whenever live data isn't available, and says why.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { clearAdminCache, fetchSeoConfig, fetchSeoSnapshot, fetchSeoStatus, formatApiError, syncSeo } from "@/lib/adminApi";
import { sampleSnapshot } from "@/lib/seo/sample";

// Mirrors the backend defaults (backend/seo.py) so the dashboard works even
// when the backend has no SEO module deployed yet.
const GLOBAL = ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "archive360.com", "delphix.com", "bigid.com", "smarsh.com", "globalrelay.com", "platform3solutions.com", "cohesity.com", "rubrik.com"];
export const DEFAULT_CONFIG = {
  domain: "solix.com", live_domain: "", brand: "Solix",
  geos: [["us", "United States"], ["uk", "United Kingdom"], ["ca", "Canada"], ["de", "Germany"], ["fr", "France"], ["in", "India"], ["au", "Australia"], ["sg", "Singapore"], ["ae", "UAE"]].map(([code, label]) => ({ code, label })),
  competitors: {
    us: [...GLOBAL, "infobelt.com", "avepoint.com"],
    uk: ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "archive360.com", "mimecast.com", "smarsh.com", "globalrelay.com", "bigid.com", "onetrust.com", "ironmountain.com", "avepoint.com"],
    ca: GLOBAL,
    de: ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "ser.de", "d-velop.de", "easy-software.com", "dataglobal.com", "fabasoft.com", "kgs-software.com", "bigid.com", "cohesity.com"],
    fr: ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "archive360.com", "cohesity.com", "rubrik.com", "bigid.com", "onetrust.com", "ironmountain.com", "avepoint.com", "mimecast.com"],
    in: ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "newgensoft.com", "bigid.com", "cohesity.com", "rubrik.com", "delphix.com", "securiti.ai", "archive360.com", "ironmountain.com"],
    au: ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "archive360.com", "mimecast.com", "smarsh.com", "globalrelay.com", "bigid.com", "avepoint.com", "cohesity.com", "rubrik.com"],
    sg: ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "archive360.com", "bigid.com", "securiti.ai", "onetrust.com", "cohesity.com", "rubrik.com", "smarsh.com", "delphix.com"],
    ae: ["informatica.com", "commvault.com", "opentext.com", "veritas.com", "archive360.com", "bigid.com", "securiti.ai", "onetrust.com", "cohesity.com", "rubrik.com", "newgensoft.com", "mimecast.com"],
  },
  brand_names: {
    "solix.com": "Solix", "informatica.com": "Informatica", "commvault.com": "Commvault", "opentext.com": "OpenText", "veritas.com": "Veritas", "archive360.com": "Archive360",
    "delphix.com": "Delphix", "bigid.com": "BigID", "smarsh.com": "Smarsh", "globalrelay.com": "Global Relay", "platform3solutions.com": "Archon", "cohesity.com": "Cohesity",
    "rubrik.com": "Rubrik", "infobelt.com": "Infobelt", "avepoint.com": "AvePoint", "mimecast.com": "Mimecast", "onetrust.com": "OneTrust", "ironmountain.com": "Iron Mountain",
    "securiti.ai": "Securiti", "newgensoft.com": "Newgen", "ser.de": "SER", "d-velop.de": "d.velop", "easy-software.com": "EASY Software", "dataglobal.com": "dataglobal",
    "fabasoft.com": "Fabasoft", "kgs-software.com": "KGS",
  },
  industry_keywords: ["data archiving", "application retirement", "legacy application decommissioning", "sap data archiving", "database archiving", "email archiving", "data governance", "ai governance", "data privacy compliance", "records retention", "enterprise ai", "data lakehouse", "unstructured data management", "ediscovery", "data masking"],
  topics: ["data archiving", "application retirement", "AI governance", "EU AI Act", "data governance", "enterprise AI agents", "SAP S/4HANA migration", "data privacy regulation", "records retention", "unstructured data", "data sovereignty", "RAG enterprise data"],
  ai_prompts: [
    "What are the best enterprise data archiving platforms?",
    "How do I retire legacy applications like Oracle E-Business Suite while staying compliant?",
    "Which vendors offer SAP data archiving for an S/4HANA migration?",
    "What are the leading AI governance and data governance platforms for enterprises?",
    "What are good alternatives to Informatica for application retirement and test data management?",
    "How can an enterprise make archived data usable for generative AI securely?",
  ],
};

export function useSeo(geo) {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [snap, setSnap] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    (async () => {
      let st = null, cfg = DEFAULT_CONFIG;
      try {
        st = await fetchSeoStatus();
        cfg = await fetchSeoConfig().catch(() => DEFAULT_CONFIG);
      } catch (e) {
        st = { semrush: false, ai: false, synced: {}, missing: e?.response?.status === 404 || !e?.response };
      }
      if (!live) return;
      setStatus(st);
      setConfig(cfg);
      if (st.synced?.[geo]) {
        try {
          const s = await fetchSeoSnapshot(geo);
          if (live) { setSnap(s); setReason(""); setLoading(false); }
          return;
        } catch { /* fall through to sample */ }
      }
      if (!live) return;
      setSnap(sampleSnapshot(geo, cfg));
      setReason(st.missing ? "The backend doesn't have the SEO module deployed yet." : !st.semrush ? "Semrush isn't connected (add SEMRUSH_API_KEY to the backend)." : "This country hasn't been synced from Semrush yet.");
      setLoading(false);
    })();
    return () => { live = false; };
  }, [geo, tick]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const s = await syncSeo(geo);
      clearAdminCache();
      setSnap(s);
      setReason("");
      setStatus((st) => ({ ...st, synced: { ...(st?.synced || {}), [geo]: s.fetched_at } }));
      toast.success(`Synced ${s.keywords.length} keywords, ${s.pages.length} pages and ${s.competitors.length} competitors.`);
      if (s.warnings?.length) toast.warning(`${s.warnings.length} report(s) came back incomplete. See the notes at the bottom of the Overview.`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setSyncing(false);
    }
  }, [geo]);

  return { status, config, setConfig, snap, sample: snap?.source === "sample", reason, loading, syncing, sync, reload: () => setTick((t) => t + 1) };
}

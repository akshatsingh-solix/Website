import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchOutboundSettings, formatApiError } from "@/lib/adminApi";
import { useCan } from "@/components/admin/kit";
import { ApprovalsPanel, ContactsPanel, OverviewPanel, RepliesPanel, SequencesPanel } from "@/components/admin/OutboundPanels";
import { CompliancePanel, HealthPanel } from "@/components/admin/OutboundOps";

const TABS = [["overview", "Overview"], ["approvals", "Approvals"], ["contacts", "Contacts"], ["sequences", "Sequences"], ["replies", "Replies"], ["compliance", "Compliance"], ["health", "Health"]];

export default function AdminOutbound() {
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const [settings, setSettings] = useState(null);
  const tab = params.get("tab") || (can("editLeads") || can("manage") ? "overview" : "compliance");

  const loadSettings = useCallback(() => fetchOutboundSettings().then(setSettings).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { loadSettings(); }, [loadSettings]);

  const state = !settings ? null : settings.paused ? { label: "Paused", tone: "border-red-400/40 bg-red-400/10 text-red-200", detail: settings.pause_reason || "Paused by hand" }
    : settings.sending_enabled ? { label: settings.provider === "dry_run" ? "Dry run" : "Sending", tone: settings.provider === "dry_run" ? "border-sky-400/40 bg-sky-400/10 text-sky-200" : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200", detail: `via ${settings.provider.replace("_", " ")}, up to ${settings.daily_cap} a day` }
      : { label: "Sending off", tone: "border-line/20 bg-line/5 text-muted-foreground", detail: "Enrollments queue up until sending is turned on in Compliance" };

  return (
    <div data-testid="admin-outbound-page">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Outbound · EchoLocate</p>
          <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Signal-led outreach, gated and measured.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Contacts from Radar accounts pass a compliance gate, get an opener written from their account's real signal, wait for approval, then send within your caps. Replies stop every other touch and land in the lead funnel.</p>
        </div>
        {state && (
          <div className={cn("rounded-2xl border px-4 py-3 text-sm", state.tone)} data-testid="outbound-state">
            <p className="font-medium">{state.label}</p>
            <p className="text-xs opacity-80">{state.detail}</p>
          </div>
        )}
      </div>
      <nav className="mt-6 flex gap-1 overflow-x-auto pb-1" aria-label="Outbound sections">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setParams(k === "overview" ? {} : { tab: k })} className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs", tab === k ? "border-primary bg-primary text-white" : "border-line/15 text-muted-foreground hover:text-foreground")}>{l}</button>
        ))}
      </nav>
      <div className="mt-6">
        {tab === "overview" && <OverviewPanel />}
        {tab === "approvals" && <ApprovalsPanel />}
        {tab === "contacts" && <ContactsPanel />}
        {tab === "sequences" && <SequencesPanel />}
        {tab === "replies" && <RepliesPanel />}
        {tab === "compliance" && <CompliancePanel settings={settings} onSaved={setSettings} />}
        {tab === "health" && <HealthPanel />}
      </div>
    </div>
  );
}

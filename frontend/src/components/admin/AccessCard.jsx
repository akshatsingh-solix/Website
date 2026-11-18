import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clearAdminCache, fetchAccess, formatApiError, saveAccess, saveUserAccess } from "@/lib/adminApi";
import { selectCls } from "@/components/admin/kit";
import { cn } from "@/lib/utils";

const LEVEL_LABEL = { none: "No access", view: "View", edit: "Edit", full: "Full" };
const LEVEL_TONE = { none: "text-muted-foreground", view: "text-foreground", edit: "text-teal", full: "text-primary-ink" };
const EDITABLE_ROLES = ["sales", "editor", "viewer", "compliance"];

const Section = ({ title, sub, children, open: initial = false, testId }) => {
  const [open, setOpen] = useState(initial);
  return (
    <div className="rounded-xl border border-line/10" data-testid={testId}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span>
          <span className="block text-sm font-medium">{title}</span>
          {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-line/10 p-4">{children}</div>}
    </div>
  );
};

/** Settings > Access: what each role can see and change, features switched off for everyone, and per-person
 *  overrides, seniority and landing dashboard. Admins always keep full access; the server enforces all of it. */
export function AccessCard() {
  const [data, setData] = useState(null);
  const [roles, setRoles] = useState(null);
  const [busy, setBusy] = useState(false);
  const [person, setPerson] = useState(null);

  const take = (d) => {
    setData(d);
    setRoles(JSON.parse(JSON.stringify(d.roles)));
    clearAdminCache();
  };
  useEffect(() => { fetchAccess().then(take).catch((e) => toast.error(formatApiError(e))); }, []);

  const dirty = useMemo(() => data && roles && JSON.stringify(roles) !== JSON.stringify(data.roles), [data, roles]);
  const act = async (fn, msg) => {
    setBusy(true);
    try {
      take(await fn());
      if (msg) toast.success(msg);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <section className="rounded-2xl border border-line/10 bg-card p-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></section>;
  const featureLabel = Object.fromEntries(data.features.map((f) => [f.key, f.label]));
  const toggle = (key) => act(() => saveAccess({ disabled: data.disabled.includes(key) ? data.disabled.filter((k) => k !== key) : [...data.disabled, key] }),
    data.disabled.includes(key) ? `${featureLabel[key]} switched on` : `${featureLabel[key]} switched off for everyone but admins`);
  const selected = data.users.find((u) => u.id === person);

  return (
    <section className="rounded-2xl border border-line/10 bg-card p-6" data-testid="access-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-accent/50 text-teal"><ShieldCheck className="h-5 w-5" strokeWidth={1.5} /></span>
        <div>
          <p className="font-display text-lg font-medium">Access and dashboards</p>
          <p className="text-xs text-muted-foreground">Who sees and changes what, and which dashboard each person lands on. Admins always have full access.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Section title="Features in use" sub="Switch a whole area off for everyone except admins" testId="access-features" open>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.features.map((f) => {
              const on = !data.disabled.includes(f.key);
              return (
                <label key={f.key} className={cn("flex items-center justify-between gap-3 rounded-lg border border-line/10 px-3 py-2 text-sm", !on && "opacity-60")}>
                  <span>{f.label}</span>
                  <input type="checkbox" checked={on} disabled={busy || f.key === "settings"} onChange={() => toggle(f.key)} className="h-4 w-4 accent-[#0088cf]"
                    aria-label={`${f.label} ${on ? "on" : "off"}`} title={f.key === "settings" ? "Settings stays on: access is managed here" : undefined} />
                </label>
              );
            })}
          </div>
        </Section>

        <Section title="What each role can do" sub="View reads, Edit does the role's normal work, Full adds what is otherwise admin-only" testId="access-roles">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-normal">Feature</th>
                  {EDITABLE_ROLES.map((r) => <th key={r} className="pb-2 font-normal">{data.role_labels[r]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/5">
                {data.features.map((f) => (
                  <tr key={f.key} className={cn(data.disabled.includes(f.key) && "opacity-50")}>
                    <td className="py-1.5 pr-3">{f.label}</td>
                    {EDITABLE_ROLES.map((r) => (
                      <td key={r} className="py-1.5 pr-2">
                        <select value={roles[r][f.key]} onChange={(e) => setRoles({ ...roles, [r]: { ...roles[r], [f.key]: e.target.value } })}
                          className={cn(selectCls, "h-8 w-full text-xs", LEVEL_TONE[roles[r][f.key]])} aria-label={`${data.role_labels[r]}: ${f.label}`}>
                          {data.levels.map((lv) => <option key={lv} value={lv}>{LEVEL_LABEL[lv]}</option>)}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 pr-3 text-muted-foreground">Lands on dashboard</td>
                  {EDITABLE_ROLES.map((r) => (
                    <td key={r} className="py-1.5 pr-2">
                      <select value={data.role_dashboards[r]} disabled={busy} onChange={(e) => act(() => saveAccess({ role_dashboards: { ...data.role_dashboards, [r]: e.target.value } }), "Default dashboard saved")}
                        className={cn(selectCls, "h-8 w-full text-xs")} aria-label={`${data.role_labels[r]} dashboard`}>
                        {Object.keys(data.dashboards).map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" disabled={!dirty || busy} onClick={() => act(() => saveAccess({ roles }), "Role access saved")} data-testid="access-save-roles">
              {busy ? <Loader2 className="animate-spin" /> : null} Save role access
            </Button>
            {dirty && <Button size="sm" variant="ghost" onClick={() => setRoles(JSON.parse(JSON.stringify(data.roles)))}>Undo</Button>}
          </div>
        </Section>

        <Section title="People" sub="Seniority, landing dashboard and exceptions to their role" testId="access-people" open>
          <ul className="divide-y divide-line/5">
            {data.users.map((u) => (
              <li key={u.id} className="py-2">
                <button type="button" onClick={() => setPerson(person === u.id ? null : u.id)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={person === u.id}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm">{u.name || u.email}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {data.role_labels[u.role] || u.role} · {data.seniority[u.seniority || "individual"]} · lands on {u.lands_on}
                      {Object.keys(u.overrides).length > 0 && ` · ${Object.keys(u.overrides).length} exception${Object.keys(u.overrides).length > 1 ? "s" : ""}`}
                    </span>
                  </span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", person === u.id && "rotate-180")} />
                </button>
                {selected?.id === u.id && <PersonAccess u={u} data={data} busy={busy} act={act} />}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </section>
  );
}

function PersonAccess({ u, data, busy, act }) {
  const save = (body, msg) => act(() => saveUserAccess(u.id, body), msg);
  if (u.role === "admin") return <p className="mt-2 text-xs text-muted-foreground">Admins always have full access to everything.</p>;
  const roleLevels = data.roles[u.role] || {};
  return (
    <div className="mt-3 space-y-3 rounded-lg bg-line/[0.03] p-3" data-testid={`access-person-${u.email}`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-muted-foreground">Seniority
          <select value={u.seniority || "individual"} disabled={busy} onChange={(e) => save({ seniority: e.target.value }, "Seniority saved")} className={cn(selectCls, "mt-1 h-8 w-full text-xs")}>
            {Object.entries(data.seniority).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">Dashboard
          <select value={u.dashboard || ""} disabled={busy} onChange={(e) => save({ dashboard: e.target.value }, "Dashboard saved")} className={cn(selectCls, "mt-1 h-8 w-full text-xs")}>
            <option value="">{u.dashboard ? "Follow role and seniority" : `Follow role and seniority (${u.lands_on})`}</option>
            {Object.entries(data.dashboards).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {data.features.map((f) => {
          const own = u.overrides[f.key];
          return (
            <label key={f.key} className="flex items-center justify-between gap-2 text-xs">
              <span className={cn("truncate", own && "font-medium")}>{f.label}</span>
              <select value={own || ""} disabled={busy || data.disabled.includes(f.key)} onChange={(e) => save({ access: { [f.key]: e.target.value || null } }, "Access saved")}
                className={cn(selectCls, "h-7 w-36 shrink-0 text-xs", LEVEL_TONE[u.effective[f.key]])} aria-label={`${u.email}: ${f.label}`}>
                <option value="">Role ({LEVEL_LABEL[roleLevels[f.key]]})</option>
                {data.levels.map((lv) => <option key={lv} value={lv}>{LEVEL_LABEL[lv]}</option>)}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
}

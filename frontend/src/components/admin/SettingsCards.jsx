import { useEffect, useState } from "react";
import { Check, Copy, Gauge, KeyRound, Loader2, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword, createUser, fetchScoring, fetchUsers, formatApiError, saveScoring, updateUser } from "@/lib/adminApi";
import { ROLE_LABELS, inputCls, productName, selectCls, useCan } from "@/components/admin/kit";
import { useAdmin } from "@/components/admin/AdminAuth";
import { cn } from "@/lib/utils";

const Card = ({ icon: Icon, title, sub, children, testId }) => (
  <section className="rounded-2xl border border-line/10 bg-card p-6" data-testid={testId}>
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-accent/50 text-teal"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
      <div>
        <p className="font-display text-lg font-medium">{title}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
    <div className="mt-5">{children}</div>
  </section>
);

const EVENT_NAMES = {
  page_view: "Product page view", engaged: "45s+ reading a topic page", deep_scroll: "Read to 75%+", resource_view: "Opened a resource",
  resource_download: "Downloaded gated material", chat_topic: "Asked the concierge about it", cta_click: "Clicked demo/trial/contact", pricing_intent: "Asked about pricing", search: "Searched for it",
};

export function ScoringCard() {
  const can = useCan();
  const [s, setS] = useState(null);
  const [form, setForm] = useState({ mql_threshold: 45, half_life_days: 30 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchScoring().then((d) => {
      setS(d);
      setForm({ mql_threshold: d.mql_threshold, half_life_days: d.half_life_days });
    }).catch((e) => toast.error(formatApiError(e)));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const d = await saveScoring({ mql_threshold: Number(form.mql_threshold), half_life_days: Number(form.half_life_days) });
      setS(d);
      toast.success(`Scoring saved · ${d.rescored} lead${d.rescored === 1 ? "" : "s"} rescored`);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card icon={Gauge} title="Lead scoring & MQL rules" sub="How visitor intent becomes a product-tagged MQL" testId="scoring-card">
      {!s ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
        <>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">MQL threshold
              <Input type="number" min={5} max={500} value={form.mql_threshold} onChange={(e) => setForm({ ...form, mql_threshold: e.target.value })} disabled={!can("manage")} className={cn(inputCls, "mt-1.5")} data-testid="scoring-threshold" />
              <span className="mt-1 block normal-case tracking-normal">Top product-line intent + fit must reach this.</span>
            </label>
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Interest half-life (days)
              <Input type="number" min={3} max={365} value={form.half_life_days} onChange={(e) => setForm({ ...form, half_life_days: e.target.value })} disabled={!can("manage")} className={cn(inputCls, "mt-1.5")} />
              <span className="mt-1 block normal-case tracking-normal">Old activity fades: half its points after this long.</span>
            </label>
            {can("manage") && <div className="sm:col-span-2"><Button type="submit" size="sm" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Check />} Save & rescore leads</Button></div>}
          </form>
          <div className="mt-6 grid gap-6 text-xs sm:grid-cols-2">
            <div>
              <p className="mb-2 font-medium text-foreground">Behaviour points (per product)</p>
              <ul className="space-y-1 text-muted-foreground">
                {Object.entries(s.event_weights).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>{EVENT_NAMES[k] || k}</span><span className="font-mono text-foreground">+{v}</span></li>)}
                {Object.entries(s.submission_weights).filter(([, v]) => v).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>Form: {k}</span><span className="font-mono text-foreground">+{v}</span></li>)}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-medium text-foreground">Fit points (max 40)</p>
              <ul className="space-y-1 text-muted-foreground">
                {Object.entries(s.fit).map(([k, v]) => <li key={k} className="flex justify-between gap-2"><span>{k.replace("_", " ")}</span><span className="text-right font-mono text-foreground">{v}</span></li>)}
              </ul>
              <p className="mb-2 mt-4 font-medium text-foreground">Always MQL (hand-raisers)</p>
              <p className="text-muted-foreground">{s.hand_raise.join(", ")} requests</p>
            </div>
          </div>
          <details className="mt-5 text-xs text-muted-foreground">
            <summary className="cursor-pointer text-foreground">Product lines and the products in each</summary>
            <ul className="mt-2 space-y-1.5">
              {s.lines.map((l) => <li key={l.key}><span className="text-foreground">{l.label}:</span> {l.products.map(productName).join(", ")}</li>)}
            </ul>
          </details>
        </>
      )}
    </Card>
  );
}

export function UsersCard() {
  const { user: me } = useAdmin();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", role: "viewer" });
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState(null);

  const load = () => fetchUsers().then(setUsers).catch((e) => toast.error(formatApiError(e)));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await createUser(form);
      setSecret({ email: r.user.email, password: r.temporary_password });
      setForm({ name: "", email: "", role: "viewer" });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const patch = async (u, body, msg) => {
    try {
      const r = await updateUser(u.id, body);
      if (r.temporary_password) setSecret({ email: u.email, password: r.temporary_password });
      toast.success(msg);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <Card icon={UsersRound} title="Team logins" sub="Who can open this admin, and what they can do" testId="users-card">
      {secret && (
        <div className="mb-4 rounded-xl border border-teal/30 bg-teal/10 p-4 text-sm" data-testid="temp-password">
          <p>Temporary password for <strong>{secret.email}</strong>. Share it privately; they should change it under “Your password”. It won't be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded bg-background px-2 py-1 font-mono text-foreground">{secret.password}</code>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(secret.password).then(() => toast.success("Copied"))}><Copy /> Copy</Button>
            <Button size="sm" variant="ghost" onClick={() => setSecret(null)}>Done</Button>
          </div>
        </div>
      )}
      <ul className="divide-y divide-line/5">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm" data-testid="user-row">
            <div className="min-w-0">
              <p className={cn("truncate", u.disabled && "text-muted-foreground line-through")}>{u.name} <span className="text-xs text-muted-foreground">{u.email}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <select value={u.role} onChange={(e) => patch(u, { role: e.target.value }, "Role updated")} disabled={u.id === me?.id} className={cn(selectCls, "h-8 text-xs")} aria-label={`Role for ${u.email}`}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {u.id !== me?.id && (
                <>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => patch(u, { reset_password: true }, "Password reset")}>Reset password</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => patch(u, { disabled: !u.disabled }, u.disabled ? "Access restored" : "Access removed")}>{u.disabled ? "Enable" : "Disable"}</Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" required className={inputCls} data-testid="user-name" />
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Work email" required className={inputCls} data-testid="user-email" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={selectCls} aria-label="Role" data-testid="user-role">
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Button type="submit" size="sm" className="h-10" disabled={busy} data-testid="user-add">{busy ? <Loader2 className="animate-spin" /> : <UserPlus />} Add</Button>
      </form>
      <p className="mt-3 text-[11px] text-muted-foreground">Admin: everything · Sales: work leads · Content editor: publish content · Leadership: read-only dashboard, leads and exports.</p>
    </Card>
  );
}

export function PasswordCard() {
  const [form, setForm] = useState({ current_password: "", new_password: "" });
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await changePassword(form);
      setForm({ current_password: "", new_password: "" });
      toast.success("Password changed");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card icon={KeyRound} title="Your password" sub="At least 10 characters with letters and numbers" testId="password-card">
      <form onSubmit={save} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <Input type="password" autoComplete="current-password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} placeholder="Current password" required className={inputCls} />
        <Input type="password" autoComplete="new-password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} placeholder="New password" required className={inputCls} />
        <Button type="submit" size="sm" className="h-10" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Check />} Change</Button>
      </form>
    </Card>
  );
}

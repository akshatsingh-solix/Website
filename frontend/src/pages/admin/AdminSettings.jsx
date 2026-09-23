import { useEffect, useState } from "react";
import { BellRing, Check, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fetchNotifications, fetchSettings, formatApiError, saveSettings } from "@/lib/adminApi";
import { TeamCard } from "@/components/admin/TeamCard";

const STATUS = { sent: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10", failed: "text-red-300 border-red-500/30 bg-red-500/10", skipped: "text-amber-300 border-amber-500/30 bg-amber-500/10" };

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [log, setLog] = useState([]);

  const load = () => Promise.all([fetchSettings(), fetchNotifications()]).then(([s, n]) => { setSettings(s); setEmail(s.alert_email || ""); setLog(n); }).catch((e) => toast.error(formatApiError(e)));
  useEffect(() => { load(); }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const s = await saveSettings({ alert_email: email.trim() || null });
      setSettings(s);
      toast.success("Alert recipient saved");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="admin-settings-page">
      <p className="eyebrow mb-2">Alerts & settings</p>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Where new leads get announced, and who works them.</h1>

      <div className="mt-10 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
        <form onSubmit={onSave} className="rounded-2xl border border-line/10 bg-card p-6" data-testid="admin-alert-form">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-accent/50 text-primary-ink"><BellRing className="h-5 w-5" strokeWidth={1.5} /></span>
            <div>
              <p className="font-display text-lg font-medium">Sales alert inbox</p>
              <p className="text-xs text-muted-foreground">Instant email for every new lead</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Label htmlFor="alert-email" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Recipient email</Label>
            <Input id="alert-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sales@yourcompany.com" className="h-11 rounded-lg border-line/15 bg-background px-4 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0" data-testid="admin-alert-email-input" />
            <p className="text-xs text-muted-foreground">Alerts are sent for: {settings?.alert_types?.join(", ") || "…"}. Newsletter sign-ups never trigger email.</p>
          </div>
          <Button type="submit" className="mt-6" disabled={saving || !settings} data-testid="admin-alert-save">{saving ? <Loader2 className="animate-spin" /> : <Check />} Save recipient</Button>
        </form>
        <TeamCard />
        </div>

        <div className="rounded-2xl border border-line/10 bg-card p-6 lg:col-span-7">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-accent/50 text-teal"><Mail className="h-5 w-5" strokeWidth={1.5} /></span>
            <div>
              <p className="font-display text-lg font-medium">Recent alert deliveries</p>
              <p className="text-xs text-muted-foreground">Last {log.length} notifications</p>
            </div>
          </div>
          <ul className="mt-6 divide-y divide-line/5" data-testid="admin-notifications-list">
            {log.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">No alerts yet. Submit a form on the site to see one here.</li>}
            {log.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm" data-testid="admin-notification-row">
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]", STATUS[n.status] || STATUS.skipped)}>{n.status}</span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{n.type}</span>
                  <span className="text-muted-foreground">{n.lead_email}</span>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{n.recipient ? `→ ${n.recipient}` : n.detail}</p>
                  <p className="font-mono">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

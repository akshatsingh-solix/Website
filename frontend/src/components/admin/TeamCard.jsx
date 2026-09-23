import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchTeam, formatApiError, saveTeam } from "@/lib/adminApi";

export const TeamCard = () => {
  const [members, setMembers] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeam().then((t) => setMembers(t.members)).catch((e) => toast.error(formatApiError(e)));
  }, []);

  const persist = async (next) => {
    setSaving(true);
    try {
      const t = await saveTeam(next);
      setMembers(t.members);
      toast.success("Sales team updated");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const add = (e) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a name and a valid email.");
      return;
    }
    persist([...(members || []), { name: name.trim(), email: email.trim() }]);
    setName("");
    setEmail("");
  };

  const cls = "h-10 rounded-lg border-line/15 bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0";

  return (
    <div className="rounded-2xl border border-line/10 bg-card p-6" data-testid="admin-team-card">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-line/10 bg-accent/50 text-primary-ink"><Users className="h-5 w-5" strokeWidth={1.5} /></span>
        <div>
          <p className="font-display text-lg font-medium">Sales team</p>
          <p className="text-xs text-muted-foreground">People leads can be assigned to</p>
        </div>
      </div>
      <ul className="mt-5 divide-y divide-line/5" data-testid="admin-team-list">
        {members === null && <li className="py-4 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" /></li>}
        {members?.length === 0 && <li className="py-4 text-center text-sm text-muted-foreground" data-testid="admin-team-empty">No team members yet. Add your first salesperson below.</li>}
        {members?.map((m) => (
          <li key={m.email} className="flex items-center justify-between py-2.5 text-sm" data-testid={`admin-team-member-${m.email.replace(/[^a-z0-9]/gi, "-")}`}>
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <button onClick={() => persist(members.filter((x) => x.email !== m.email))} disabled={saving} aria-label={`Remove ${m.name}`} data-testid="admin-team-remove" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-300">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.3fr_auto]" data-testid="admin-team-form">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={cls} data-testid="admin-team-name-input" aria-label="Name" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" type="email" className={cls} data-testid="admin-team-email-input" aria-label="Email" />
        <Button type="submit" size="sm" className="h-10" disabled={saving} data-testid="admin-team-add"><Plus /> Add</Button>
      </form>
    </div>
  );
};

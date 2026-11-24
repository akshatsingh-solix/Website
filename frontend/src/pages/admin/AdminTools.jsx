import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, KeyRound, Loader2, Lock, Play, Route, ShieldCheck, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createMcpToken, dryRunTool, executeTool, fetchMcpTokens, fetchToolAudit, fetchTools, formatApiError, revokeMcpToken, routeTools, runRouterEval, saveToolPolicy,
} from "@/lib/adminApi";
import { useAdmin } from "@/components/admin/AdminAuth";
import { Badge, Panel, StatTile, ago, inputCls, selectCls } from "@/components/admin/kit";

const ACCESS_TONE = { read: "border-sky-400/40 text-sky-200", write: "border-amber-400/40 text-amber-200", delete: "border-red-400/40 text-red-200" };
const API_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

const call = async (fn, ok) => {
  try {
    const r = await fn();
    if (ok) toast.success(ok);
    return r;
  } catch (e) {
    toast.error(formatApiError(e));
    return null;
  }
};

export default function AdminTools() {
  const { user } = useAdmin();
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState(null);
  const load = useCallback(() => fetchTools().then(setData).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Loader2 className="mx-auto my-24 h-6 w-6 animate-spin text-primary-ink" />;
  const allowed = data.tools.filter((t) => t.allowed_read_only || t.allowed);
  return (
    <div data-testid="admin-tools-page">
      <p className="eyebrow mb-2">AI tools & MCP</p>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">What an AI can do in MarkHub, and nothing more.</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Sol, connected assistants (Claude, ChatGPT and any MCP client) and this console share one tool registry. A fast router hands a model only the few tools a request needs.
        Every tool is scoped to your access level, sessions start read-only, and any change needs a dry run you can see before it happens.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Tools you can read with" value={data.tools.filter((t) => t.allowed_read_only).length} sub={`of ${data.tools.length} staff tools`} />
        <StatTile label="Tools you can change with" value={data.tools.filter((t) => t.allowed && t.access !== "read").length} sub="each needs a dry run and confirmation" />
        <StatTile label="AI writes" value={data.policy.writes_enabled ? "On" : "Off"} sub={data.policy.writes_enabled ? "admins can switch every write off" : "switched off by an admin"} />
        <StatTile label="MCP access" value={data.policy.mcp_enabled ? "On" : "Off"} sub="/api/mcp" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RouterPanel />
        <ConsolePanel tools={allowed} />
        <McpPanel isAdmin={isAdmin} role={user?.role} />
        {isAdmin && <PolicyPanel policy={data.policy} tools={data.tools} onSaved={load} />}
        <RegistryPanel tools={data.tools} sol={data.sol_tools} />
        <AuditPanel isAdmin={isAdmin} />
      </div>
    </div>
  );
}

function RouterPanel() {
  const [q, setQ] = useState("which strong accounts have no owner");
  const [surface, setSurface] = useState("mcp");
  const [r, setR] = useState(null);
  const [ev, setEv] = useState(null);
  const go = async () => setR(await call(() => routeTools(q, surface)));
  useEffect(() => { go(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Panel title="Semantic router" testId="router-panel" sub="Type a request the way someone would ask it. The router picks the top tools in a fraction of a millisecond; only their schemas are loaded."
      action={<Button size="sm" variant="outline" onClick={async () => setEv(await call(runRouterEval))}><Wand2 /> Run accuracy eval</Button>}>
      <div className="flex gap-2">
        <Input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} />
        <select className={selectCls} value={surface} onChange={(e) => setSurface(e.target.value)} aria-label="Surface"><option value="mcp">Staff tools</option><option value="sol">Sol (visitors)</option></select>
        <Button onClick={go}><Route /> Route</Button>
      </div>
      {r && (
        <div className="mt-4">
          <ol className="space-y-1.5 text-sm">
            {r.tools.map((t, i) => (
              <li key={t.name} className="flex items-center justify-between gap-2"><span><span className="text-muted-foreground">{i + 1}.</span> <code>{t.name}</code> <Badge className={ACCESS_TONE[t.access]}>{t.access}</Badge></span><span className="text-xs text-muted-foreground">score {t.score}</span></li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted-foreground">Routed in {r.ms} ms · {r.tokens_routed} schema tokens loaded instead of {r.tokens_all_schemas} ({Math.round(100 - (100 * r.tokens_routed) / Math.max(1, r.tokens_all_schemas))}% fewer)</p>
        </div>
      )}
      {ev && (
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
          {["mcp", "mcp_heldout", "sol"].map((s) => (
            <div key={s} className="rounded-lg border border-line/10 p-2.5">
              <p className="font-medium">{s === "mcp" ? "Staff tools" : s === "mcp_heldout" ? "Staff, unseen wording" : "Sol"}</p>
              <p className="mt-1 text-muted-foreground">Right tool in top 3: <b className="text-foreground">{Math.round(ev[s].top3 * 1000) / 10}%</b></p>
              <p className="text-muted-foreground">Ranked first: {Math.round(ev[s].top1 * 1000) / 10}% · p95 {ev[s].p95_ms} ms · {ev[s].cases} cases</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ConsolePanel({ tools }) {
  const [name, setName] = useState(tools[0]?.name || "");
  const tool = tools.find((t) => t.name === name);
  const [args, setArgs] = useState("{}");
  const [dry, setDry] = useState(null);
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const props = tool?.parameters?.properties || {};
    setArgs(JSON.stringify(Object.fromEntries((tool?.parameters?.required || []).map((k) => [k, props[k]?.type === "boolean" ? false : ""])), null, 2));
    setDry(null); setOut(null);
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  const parsed = () => { try { return JSON.parse(args || "{}"); } catch { toast.error("Arguments must be valid JSON"); return null; } };
  const doDry = async () => {
    const a = parsed();
    if (!a) return;
    setBusy(true); setOut(null);
    if (tool.access === "read") setOut(await call(() => executeTool(name, a)));
    else setDry(await call(() => dryRunTool(name, a)));
    setBusy(false);
  };
  const confirm = async () => {
    const a = parsed();
    if (!a) return;
    setBusy(true);
    setOut(await call(() => executeTool(name, a, dry.confirm_token), "Done"));
    setDry(null); setBusy(false);
  };
  return (
    <Panel title="Tool console" testId="tool-console" sub="Run any tool you're allowed to, exactly as an AI would. Changes always show a dry run first; nothing happens until you confirm.">
      <select className={cn(selectCls, "w-full")} value={name} onChange={(e) => setName(e.target.value)} aria-label="Tool">
        {tools.map((t) => <option key={t.name} value={t.name} disabled={!t.allowed && t.access !== "read"}>{t.name} ({t.access}){!t.allowed && t.access !== "read" ? " - not allowed" : ""}</option>)}
      </select>
      {tool && <p className="mt-2 text-xs text-muted-foreground">{tool.description}</p>}
      <Textarea className="mt-3 min-h-[110px] font-mono text-xs" value={args} onChange={(e) => setArgs(e.target.value)} aria-label="Arguments (JSON)" />
      <Button className="mt-3" disabled={busy || !tool} onClick={doDry}>{tool?.access === "read" ? <><Play /> Run</> : <><ShieldCheck /> Dry run</>}</Button>
      {dry && (
        <div className={cn("mt-4 rounded-xl border px-4 py-3 text-sm", dry.ok ? "border-amber-400/30 bg-amber-400/5" : "border-red-400/30 bg-red-400/5")} data-testid="dry-run-result">
          {dry.ok ? <p className="font-medium text-amber-100">This would change data. Check it, then confirm.</p> : <p className="font-medium text-red-200">Stopped before anything changed:</p>}
          {(dry.problems || []).map((p) => <p key={p} className="text-xs text-red-200">{p}</p>)}
          {dry.preview && <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">{JSON.stringify(dry.preview, null, 2)}</pre>}
          {dry.ok && <Button size="sm" className="mt-3" disabled={busy} onClick={confirm}>Confirm the change</Button>}
        </div>
      )}
      {out && <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-line/10 bg-line/5 p-3 text-[11px]">{JSON.stringify(out, null, 2)}</pre>}
    </Panel>
  );
}

function McpPanel({ role }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ mode: "read", days: 30, label: "Claude Desktop" });
  const [fresh, setFresh] = useState(null);
  const load = useCallback(() => fetchMcpTokens().then((r) => setItems(r.items)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const endpoint = fresh?.endpoint?.startsWith("http") ? fresh.endpoint : `${API_BASE}/api/mcp`;
  const config = useMemo(() => fresh && JSON.stringify({ mcpServers: { markhub: { type: "http", url: endpoint, headers: { Authorization: `Bearer ${fresh.token}` } } } }, null, 2), [fresh, endpoint]);
  return (
    <Panel title="Connect an AI assistant (MCP)" testId="mcp-panel"
      sub="Issue a personal token for Claude, ChatGPT or any MCP client. It acts as you, with your access, and lists two tools (find_tools, call_tool) so the assistant loads only what it needs. Read tokens can't change anything.">
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={selectCls} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} aria-label="Mode">
          <option value="read">Read only (default)</option>{role !== "viewer" && <option value="write">Read and write (dry run + confirm)</option>}
        </select>
        <select className={selectCls} value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} aria-label="Expires"><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select>
        <Input className={inputCls} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} aria-label="Label" />
      </div>
      <Button className="mt-3" onClick={async () => { const r = await call(() => createMcpToken(form), "Token created: copy it now, it's shown once"); if (r) { setFresh(r); load(); } }}><KeyRound /> Create token</Button>
      {fresh && (
        <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-3 text-xs">
          <p className="font-medium text-emerald-200">Add this to your assistant's MCP settings (shown once):</p>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all">{config}</pre>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => { navigator.clipboard?.writeText(config); toast.success("Copied"); }}><Copy /> Copy</Button>
        </div>
      )}
      <ul className="mt-4 divide-y divide-line/10 text-sm">
        {items.map((t) => (
          <li key={t.jti} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>{t.label} <Badge className={t.mode === "write" ? ACCESS_TONE.write : ACCESS_TONE.read}>{t.mode}</Badge> {t.revoked && <Badge>revoked</Badge>}</span>
            <span className="text-xs text-muted-foreground">{t.email} · used {t.last_used_at ? ago(t.last_used_at) : "never"} · expires {t.expires_at?.slice(0, 10)}</span>
            {!t.revoked && <Button size="sm" variant="ghost" onClick={async () => { if (await call(() => revokeMcpToken(t.jti), "Revoked")) load(); }}><Trash2 /> Revoke</Button>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function PolicyPanel({ policy, tools, onSaved }) {
  const [p, setP] = useState(policy);
  useEffect(() => setP(policy), [policy]);
  const save = async (patch) => { if (await call(() => saveToolPolicy(patch), "Policy saved")) onSaved(); };
  return (
    <Panel title="Policy (admins)" testId="policy-panel" sub="Kill switches that apply to every AI surface at once.">
      <div className="space-y-3 text-sm">
        {[["writes_enabled", "AI tools may change data (after dry run and confirmation)"], ["mcp_enabled", "Connected assistants (MCP) may sign in"],
          ["sol_deferred", "Sol loads only the tools each turn needs (deferred loading)"]].map(([k, l]) => (
          <label key={k} className="flex items-center gap-3"><input type="checkbox" checked={!!p[k]} onChange={(e) => save({ [k]: e.target.checked })} /> {l}</label>
        ))}
        <div>
          <p className="text-xs text-muted-foreground">Switch individual tools off</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tools.filter((t) => t.access !== "read").map((t) => {
              const off = p.disabled.includes(t.name);
              return <Button key={t.name} size="sm" variant={off ? "default" : "outline"} onClick={() => save({ disabled: off ? p.disabled.filter((x) => x !== t.name) : [...p.disabled, t.name] })}>{off && <Lock />}{t.name}</Button>;
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RegistryPanel({ tools, sol }) {
  return (
    <Panel title="Tool registry" className="lg:col-span-2" testId="registry-panel" sub="Every tool, what it does, what it needs and whether your access allows it. Sol's visitor tools are separate and can never touch staff data.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2 font-normal">Tool</th><th className="font-normal">Access</th><th className="font-normal">Area</th><th className="font-normal">You</th><th className="font-normal">What it does</th></tr></thead>
          <tbody className="divide-y divide-line/10">
            {tools.map((t) => (
              <tr key={t.name}>
                <td className="py-2"><code className="text-xs">{t.name}</code></td>
                <td><Badge className={ACCESS_TONE[t.access]}>{t.access}</Badge></td>
                <td className="text-xs text-muted-foreground">{t.feature}</td>
                <td className="text-xs">{t.allowed ? <span className="text-emerald-300">allowed</span> : t.allowed_read_only ? <span className="text-sky-300">read</span> : <span className="text-muted-foreground" title={t.why_not}>no</span>}</td>
                <td className="max-w-md py-2 text-xs text-muted-foreground">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Sol (website visitors): {sol.map((t) => `${t.name}${t.core ? " (always loaded)" : ""}`).join(", ")}.</p>
    </Panel>
  );
}

function AuditPanel({ isAdmin }) {
  const [items, setItems] = useState([]);
  useEffect(() => { fetchToolAudit({ limit: 60 }).then((r) => setItems(r.items)).catch(() => {}); }, []);
  return (
    <Panel title={isAdmin ? "Audit trail (everyone)" : "Your audit trail"} className="lg:col-span-2" testId="audit-panel" sub="Every route, dry run, call and refusal. Personal values in arguments are masked.">
      {items.length === 0 ? <p className="text-sm text-muted-foreground">No tool activity yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <tbody className="divide-y divide-line/10">
              {items.map((a, i) => (
                <tr key={`${a.at}-${i}`}>
                  <td className="py-1.5 text-muted-foreground">{ago(a.at)}</td>
                  <td>{a.surface}</td>
                  <td>{a.user}</td>
                  <td><code>{a.tool || "router"}</code></td>
                  <td className={a.ok ? "text-emerald-300" : "text-red-300"}>{a.phase}</td>
                  <td className="max-w-xs truncate text-muted-foreground" title={a.detail}>{a.detail}</td>
                  <td className="text-muted-foreground">{a.ms != null ? `${a.ms} ms` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

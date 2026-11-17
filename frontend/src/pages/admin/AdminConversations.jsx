import { useCallback, useEffect, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Loader2, MessagesSquare, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge, ago, fmtDateTime, inputCls, useLiveRefresh } from "@/components/admin/kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SolControlTab, SolKnowledgeTab, SolQualityTab } from "@/components/admin/SolControl";
import { fetchChat, fetchChats, fetchSolConfig, fetchSolProfile, formatApiError } from "@/lib/adminApi";

const PAGE_SIZE = 25;
const LEAD_LABEL = { demo: "Demo booked", contact: "Expert question", chat: "Contact shared" };

// Sol's replies use **bold**, bullets and [label](/path) links; show them as plain text here.
const plain = (text) => text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)");

const Transcript = ({ sessionId, onClose }) => {
  const [messages, setMessages] = useState(null);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!sessionId) return;
    setMessages(null);
    setProfile(null);
    fetchChat(sessionId).then(setMessages).catch((e) => toast.error(formatApiError(e)));
    fetchSolProfile(sessionId).then(setProfile).catch(() => {});
  }, [sessionId]);
  const facts = profile && [["Problem", profile.problem], ["Industry", profile.industry], ["Systems", profile.systems?.join(", ")], ["Goals", profile.goals?.join(", ")],
    ["Data volume", profile.data_volume], ["Timeline", profile.timeline], ["Stage", profile.stage]].filter(([, v]) => v);

  return (
    <Dialog open={!!sessionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" data-testid="admin-chat-transcript">
        <DialogHeader>
          <DialogTitle>Conversation</DialogTitle>
          <DialogDescription className="font-mono text-xs">{sessionId}</DialogDescription>
        </DialogHeader>
        {facts?.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl border border-line/10 bg-muted/40 px-4 py-3 text-xs" data-testid="admin-chat-profile">
            {facts.flatMap(([k, v]) => [<dt key={`${k}-k`} className="text-muted-foreground">{k}</dt>, <dd key={`${k}-v`}>{v}</dd>])}
          </dl>
        )}
        {!messages ? (
          <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <ol className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={cn("rounded-xl border px-4 py-3 text-sm", m.role === "user" ? "border-primary/20 bg-primary/5" : "border-line/10 bg-muted/50")}>
                <p className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {m.role === "user" ? <UserRound className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  <span className="font-medium text-foreground">{m.role === "user" ? "Visitor" : "Sol"}</span>
                  <span>{fmtDateTime(m.created_at)}</span>
                  {m.page && <span className="font-mono">on {m.page}</span>}
                  {m.model && <span className="font-mono">{m.provider}/{m.model}</span>}
                  {m.latency_ms && <span>{(m.latency_ms / 1000).toFixed(1)} s</span>}
                  {m.guard && <span className="text-amber-600">guard: {[].concat(m.guard).join(", ")}</span>}
                  {m.tools?.length > 0 && <span className="font-mono">used {m.tools.join(", ")}</span>}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{plain(m.content)}</p>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ConversationsTab = () => {
  const [data, setData] = useState({ total: 0, items: [] });
  const [status, setStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    return fetchChats({ page, page_size: PAGE_SIZE, q: query || undefined }, { fresh: silent })
      .then(setData)
      .catch((e) => !silent && toast.error(formatApiError(e)))
      .finally(() => !silent && setLoading(false));
  }, [page, query]);
  useEffect(() => { load(); }, [load]);
  useLiveRefresh(() => load({ silent: true }));
  useEffect(() => { fetchSolConfig().then(setStatus).catch(() => {}); }, []);

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const ai = status && status.answer_chain.length > 0;
  return (
    <div>
      {status && (
        <p className={cn("mt-2 rounded-xl border px-4 py-3 text-sm", ai ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")} data-testid="admin-sol-status">
          {ai
            ? <>AI answers are on via <strong>{status.answer_chain.join(" → ")}</strong> (tried in that order), grounded in {status.knowledge.documents} pages and content items ({status.knowledge.chunks} passages).</>
            : <>No AI provider is switched on, so Sol answers with its built-in script. Add a provider key to the backend, or a local model, then switch it on under Control.</>}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages" className={cn(inputCls, "pl-9")} data-testid="admin-chats-search" />
        </div>
        <p className="text-sm text-muted-foreground">{data.total} conversation{data.total === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-4 divide-y divide-line/10 rounded-2xl border border-line/10 bg-card">
        {loading && !data.items.length ? (
          <Loader2 className="mx-auto my-10 h-5 w-5 animate-spin text-muted-foreground" />
        ) : !data.items.length ? (
          <p className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-muted-foreground"><MessagesSquare className="h-4 w-4" /> No conversations yet.</p>
        ) : (
          data.items.map((c) => (
            <button key={c.session_id} onClick={() => setOpen(c.session_id)} className="flex w-full flex-col gap-1.5 px-5 py-4 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-4" data-testid="admin-chat-row">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.first_question || "(conversation)"}</span>
                {c.contact && (
                  <span className="mt-0.5 block truncate text-xs text-foreground" data-testid="admin-chat-contact">
                    {[c.contact.name, c.contact.job_title, c.contact.company, c.contact.email, c.contact.phone].filter(Boolean).join(" · ")}
                  </span>
                )}
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {c.messages} messages{c.pages.length > 0 && <> · {c.pages.join(", ")}</>}{c.models.length > 0 && <> · {c.models.join(", ")}</>}
                </span>
              </span>
              {c.lead && <Badge className="border-primary/30 bg-primary/10 text-primary-ink">{LEAD_LABEL[c.lead] || c.lead}</Badge>}
              <span className="shrink-0 text-xs text-muted-foreground" title={fmtDateTime(c.last_at)}>{ago(c.last_at)}</span>
            </button>
          ))
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft /></Button>
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight /></Button>
        </div>
      )}

      <Transcript sessionId={open} onClose={() => setOpen(null)} />
    </div>
  );
};

export default function AdminConversations() {
  const [tab, setTab] = useState("conversations");
  return (
    <div data-testid="admin-conversations-page">
      <p className="eyebrow mb-2">Sol concierge</p>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">What visitors ask Sol, and how it answers.</h1>
      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="control" data-testid="sol-tab-control">Control</TabsTrigger>
          <TabsTrigger value="knowledge" data-testid="sol-tab-knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="quality" data-testid="sol-tab-quality">Quality</TabsTrigger>
        </TabsList>
        <TabsContent value="conversations"><ConversationsTab /></TabsContent>
        <TabsContent value="control" className="mt-4">{tab === "control" && <SolControlTab />}</TabsContent>
        <TabsContent value="knowledge" className="mt-4">{tab === "knowledge" && <SolKnowledgeTab />}</TabsContent>
        <TabsContent value="quality" className="mt-4">{tab === "quality" && <SolQualityTab />}</TabsContent>
      </Tabs>
    </div>
  );
}

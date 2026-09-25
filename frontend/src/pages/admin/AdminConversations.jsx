import { useCallback, useEffect, useState } from "react";
import { Bot, ChevronLeft, ChevronRight, Loader2, MessagesSquare, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge, ago, fmtDateTime, inputCls, useLiveRefresh } from "@/components/admin/kit";
import { fetchChat, fetchChats, fetchSolStatus, formatApiError } from "@/lib/adminApi";

const PAGE_SIZE = 25;
const LEAD_LABEL = { demo: "Demo booked", contact: "Expert question", chat: "Contact shared" };

// Sol's replies use **bold**, bullets and [label](/path) links; show them as plain text here.
const plain = (text) => text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)");

const Transcript = ({ sessionId, onClose }) => {
  const [messages, setMessages] = useState(null);
  useEffect(() => {
    if (!sessionId) return;
    setMessages(null);
    fetchChat(sessionId).then(setMessages).catch((e) => toast.error(formatApiError(e)));
  }, [sessionId]);

  return (
    <Dialog open={!!sessionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto" data-testid="admin-chat-transcript">
        <DialogHeader>
          <DialogTitle>Conversation</DialogTitle>
          <DialogDescription className="font-mono text-xs">{sessionId}</DialogDescription>
        </DialogHeader>
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

export default function AdminConversations() {
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
  useEffect(() => { fetchSolStatus().then(setStatus).catch(() => {}); }, []);

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div data-testid="admin-conversations-page">
      <p className="eyebrow mb-2">Sol concierge</p>
      <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">What visitors ask Sol, and how it answers.</h1>

      {status && (
        <p className={cn("mt-4 rounded-xl border px-4 py-3 text-sm", status.ai ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")} data-testid="admin-sol-status">
          {status.ai
            ? <>AI answers are on via <strong>{status.providers.join(" → ")}</strong> (tried in that order), grounded in {status.knowledge_chunks} pieces of site content.</>
            : <>No AI provider is configured, so Sol answers with its built-in script. Add a free <span className="font-mono">GEMINI_API_KEY</span> or <span className="font-mono">GROQ_API_KEY</span> to the backend to turn on AI answers.</>}
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
}

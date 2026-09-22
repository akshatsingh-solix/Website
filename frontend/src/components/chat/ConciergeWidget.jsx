import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CalendarCheck, MessageSquare, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_SUGGESTIONS } from "@/data/site";
import { Button } from "@/components/ui/button";
import { clearChatHistory, fetchChatHistory, streamChat } from "@/lib/api";

const SESSION_KEY = "solix_chat_session";

const getSession = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const renderInline = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong> : part
  );

const Markdown = ({ text }) => {
  const lines = text.split("\n");
  const out = [];
  let list = null;
  lines.forEach((line, i) => {
    const m = /^\s*(?:[-*•]|\d+\.)\s+(.*)$/.exec(line);
    if (m) {
      list = list || [];
      list.push(<li key={i}>{renderInline(m[1])}</li>);
      return;
    }
    if (list) {
      out.push(<ul key={`l${i}`} className="my-1.5 list-disc space-y-1 pl-5">{list}</ul>);
      list = null;
    }
    if (line.trim() === "") return;
    out.push(<p key={i} className="my-1 first:mt-0 last:mb-0">{renderInline(line)}</p>);
  });
  if (list) out.push(<ul key="last" className="my-1.5 list-disc space-y-1 pl-5">{list}</ul>);
  return <>{out}</>;
};

const BookingCard = ({ name, email, company }) => (
  <div className="flex justify-start" data-testid="chat-booking-card">
    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-teal/30 bg-teal/5 px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-display font-medium text-teal"><CalendarCheck className="h-4 w-4" /> Demo request saved</p>
      <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        <div className="flex gap-2"><dt className="w-16 text-muted-foreground">Name</dt><dd>{name}</dd></div>
        <div className="flex gap-2"><dt className="w-16 text-muted-foreground">Email</dt><dd>{email}</dd></div>
        <div className="flex gap-2"><dt className="w-16 text-muted-foreground">Company</dt><dd>{company}</dd></div>
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">A Solix expert will reach out within one business day.</p>
    </div>
  </div>
);

const Bubble = ({ role, content, streaming }) => (
  <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")} data-testid={`chat-message-${role}`}>
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        role === "user" ? "whitespace-pre-wrap rounded-br-md bg-primary text-white" : "rounded-bl-md border border-white/10 bg-ink-900 text-slate-200"
      )}
    >
      {role === "user" ? content : <Markdown text={content} />}
      {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-teal" />}
    </div>
  </div>
);

export const ConciergeWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(getSession);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("solix:open-chat", openChat);
    return () => window.removeEventListener("solix:open-chat", openChat);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchChatHistory(sessionId).then((h) => setMessages(h.map((m) => ({ role: m.role, content: m.content })))).catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 250);
  }, [open, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "", streaming: true }]);
    const append = (delta) =>
      setMessages((m) => {
        const next = [...m];
        const last = { ...next[next.length - 1] };
        last.content += delta;
        next[next.length - 1] = last;
        return next;
      });
    try {
      await streamChat({
        sessionId,
        message,
        onDelta: append,
        onEvent: (evt) => {
          if (evt.event === "demo_booked") {
            setMessages((m) => {
              const next = [...m];
              const last = next.pop();
              return [...next, { role: "booking", name: evt.name, email: evt.email, company: evt.company }, last];
            });
          }
        },
        onError: (err) => append(err),
      });
    } catch {
      append("The concierge is unavailable right now. Please try again shortly.");
    } finally {
      setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, streaming: false } : x)));
      setBusy(false);
    }
  };

  const reset = async () => {
    await clearChatHistory(sessionId).catch(() => {});
    const fresh = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, fresh);
    setSessionId(fresh);
    setMessages([]);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-[60] flex h-[min(620px,calc(100vh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] sm:right-6"
            data-testid="chat-panel"
            role="dialog"
            aria-label="Solix AI concierge"
          >
            <div className="relative flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                <Bot className="h-5 w-5" strokeWidth={1.75} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-950 bg-teal" />
              </span>
              <div className="flex-1">
                <p className="font-display text-sm font-semibold">Sol · Solix AI Concierge</p>
                <p className="text-[11px] text-muted-foreground">Answers about products, solutions and next steps</p>
              </div>
              <button onClick={reset} aria-label="New conversation" data-testid="chat-reset-button" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close chat" data-testid="chat-close-button" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-testid="chat-messages">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="rounded-2xl rounded-bl-md border border-white/10 bg-ink-900 px-4 py-3 text-sm text-slate-200">
                    Hi, I'm Sol. Ask me anything about Solix — archiving, application retirement, governed AI, pricing conversations, or how to get a demo.
                  </div>
                  <div className="grid gap-2">
                    {CHAT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        data-testid="chat-suggestion"
                        className="group flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm text-muted-foreground transition-[border-color,color,background-color] duration-200 hover:border-primary/50 hover:bg-white/5 hover:text-foreground"
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (m.role === "booking" ? <BookingCard key={i} {...m} /> : <Bubble key={i} {...m} />))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Solix…"
                disabled={busy}
                data-testid="chat-input"
                className="h-11 flex-1 rounded-full border border-white/10 bg-ink-900 px-4 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Send" data-testid="chat-send-button" className="h-11 w-11 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close AI concierge" : "Open AI concierge"}
        data-testid="chat-toggle-button"
        className="group fixed bottom-5 right-4 z-[60] flex h-14 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-white shadow-[0_18px_40px_-12px_rgba(237,36,35,0.7)] transition-[transform,background-color] duration-300 hover:-translate-y-1 hover:bg-ember-deep sm:right-6"
      >
        {!open && <span className="absolute inset-0 -z-10 rounded-full bg-primary/60 animate-pulse-ring" />}
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
        <span className="font-display text-sm font-semibold">{open ? "Close" : "Ask Sol"}</span>
      </button>
    </>
  );
};

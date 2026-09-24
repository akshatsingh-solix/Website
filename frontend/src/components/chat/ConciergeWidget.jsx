import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CalendarCheck, MessageSquare, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_SUGGESTIONS } from "@/data/site";
import { Button } from "@/components/ui/button";
import { clearChatHistory, fetchChatHistory, streamChat } from "@/lib/api";
import { createLocalConcierge } from "@/lib/localConcierge";
import { useTranslation } from "react-i18next";
import { useTx } from "@/i18n/tx";

const SESSION_KEY = "solix_chat_session";

const getSession = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

// no-i18n
const linkCls = "font-medium text-teal underline underline-offset-2 hover:text-foreground";

// **bold** and [label](/path) - internal paths use the router, others open in a new tab.
const renderInline = (text) =>
  text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <Link key={i} to={href} className={linkCls}>{label}</Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noreferrer" className={linkCls}>{label}</a>
      );
    }
    return part;
  });

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

const BookingCard = ({ name, email, company }) => {
  const tx = useTx();
  return (
  <div className="flex justify-start" data-testid="chat-booking-card">
    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-teal/30 bg-teal/5 px-4 py-3 text-sm">
      <p className="flex items-center gap-2 font-display font-medium text-teal"><CalendarCheck className="h-4 w-4" /> {tx("Demo request saved")}</p>
      <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        <div className="flex gap-2"><dt className="w-16 text-muted-foreground">{tx("Name")}</dt><dd>{name}</dd></div>
        <div className="flex gap-2"><dt className="w-16 text-muted-foreground">{tx("Email")}</dt><dd>{email}</dd></div>
        <div className="flex gap-2"><dt className="w-16 text-muted-foreground">{tx("Company")}</dt><dd>{company}</dd></div>
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">{tx("A Solix expert will reach out within one business day.")}</p>
    </div>
  </div>
  );
};

const Bubble = ({ role, content, streaming }) => (
  <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")} data-testid={`chat-message-${role}`}>
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        role === "user" ? "whitespace-pre-wrap rounded-br-md bg-primary text-white" : "rounded-bl-md border border-line/10 bg-muted text-foreground"
      )}
    >
      {role === "user" ? content : <Markdown text={content} />}
      {streaming && <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-teal" />}
    </div>
  </div>
);

export const ConciergeWidget = () => {
  const tx = useTx();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(getSession);
  // "ai" until the backend turns out to have no model (or is unreachable);
  // after that the built-in concierge answers for the rest of the session.
  const [mode, setMode] = useState("ai");
  const local = useRef(null);
  if (!local.current) local.current = createLocalConcierge();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("solix:open-chat", openChat);
    return () => window.removeEventListener("solix:open-chat", openChat);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchChatHistory(sessionId).then((h) => h.length && setMessages(h.map((m) => ({ role: m.role, content: m.content })))).catch(() => {});
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
    const answerLocally = async () => {
      const { text: reply, booking } = await local.current.reply(message, i18n.language);
      if (booking) {
        setMessages((m) => {
          const next = [...m];
          const last = next.pop();
          return [...next, { role: "booking", ...booking }, last];
        });
      }
      // Type the reply out in small chunks so it reads like the AI version.
      const chunks = reply.match(/\S+\s*/g) || [reply];
      for (let i = 0; i < chunks.length; i += 3) {
        append(chunks.slice(i, i + 3).join(""));
        await new Promise((r) => setTimeout(r, 24));
      }
    };
    try {
      if (mode === "local") {
        await new Promise((r) => setTimeout(r, 350));
        await answerLocally();
        return;
      }
      const status = await streamChat({
        sessionId,
        message,
        language: i18n.language,
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
        onError: (err) => append(tx(err)),
      });
      if (status === "unavailable") {
        setMode("local");
        await answerLocally();
      }
    } catch {
      append(tx("The concierge is unavailable right now. Please try again shortly."));
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
    local.current.reset();
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
            className="fixed bottom-24 right-4 z-[60] flex h-[min(620px,calc(100vh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line/10 bg-background shadow-[0_2px_8px_rgba(13,25,45,0.06),0_40px_100px_-30px_rgba(13,25,45,0.45)] sm:right-6"
            data-testid="chat-panel"
            role="dialog"
            aria-label={tx("Solix AI concierge")}
          >
            <div className="dark relative flex items-center gap-3 bg-background px-4 py-3 text-foreground">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary-ink">
                <Bot className="h-5 w-5" strokeWidth={1.75} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-teal" />
              </span>
              <div className="flex-1">
                <p className="font-display text-sm font-semibold">{mode === "local" ? tx("Sol · Solix Concierge") : tx("Sol · Solix AI Concierge")}</p>
                <p className="text-[11px] text-muted-foreground">{tx("Answers about products, solutions and next steps")}</p>
              </div>
              <button onClick={reset} aria-label={tx("New conversation")} data-testid="chat-reset-button" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-line/5 hover:text-foreground">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} aria-label={tx("Close chat")} data-testid="chat-close-button" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-line/5 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-testid="chat-messages">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="rounded-2xl rounded-bl-md border border-line/10 bg-muted px-4 py-3 text-sm text-foreground">
                    {tx("Hi, I'm Sol. Ask me anything about Solix — archiving, application retirement, governed AI, pricing conversations, or how to get a demo.")}
                  </div>
                  <div className="grid gap-2">
                    {CHAT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        data-testid="chat-suggestion"
                        className="group flex items-center gap-2 rounded-xl border border-line/10 px-3 py-2.5 text-left text-sm text-muted-foreground transition-[border-color,color,background-color] duration-200 hover:border-primary/40 hover:bg-muted hover:text-foreground"
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-ink" />
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
              className="flex items-center gap-2 border-t border-line/10 p-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tx("Ask about Solix…")}
                disabled={busy}
                data-testid="chat-input"
                className="h-11 flex-1 rounded-full border border-line/15 bg-muted/60 px-4 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
              />
              <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label={tx("Send")} data-testid="chat-send-button" className="h-11 w-11 rounded-full">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? tx("Close AI concierge") : tx("Open AI concierge")}
        data-testid="chat-toggle-button"
        className="group fixed bottom-5 right-4 z-[60] flex h-14 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-white shadow-[0_18px_40px_-12px_rgba(237,36,35,0.7)] transition-[transform,background-color] duration-300 hover:-translate-y-1 hover:bg-ember-deep sm:right-6"
      >
        {!open && <span className="absolute inset-0 -z-10 rounded-full bg-primary/60 animate-pulse-ring" />}
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
        <span className="font-display text-sm font-semibold">{open ? tx("Close") : tx("Ask Sol")}</span>
      </button>
    </>
  );
};

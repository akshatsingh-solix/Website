import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Bot, Building2, CalendarDays, CornerDownLeft, FileText, LayoutGrid, LogIn, Mail, Search, Sparkles, Target } from "lucide-react";
import { INDUSTRIES, NAV, PRODUCTS, RESOURCES, SOLUTIONS } from "@/data/site";
import { useTx } from "@/i18n/tx";
import { empowerLink } from "@/lib/empower";
import { NAV_LABEL_KEYS } from "@/components/layout/Navbar";
import { useTranslation } from "react-i18next";

const Item = ({ icon: Icon, title, subtitle, value, onSelect, tone = "blue" }) => (
  <Command.Item
    value={value}
    onSelect={onSelect}
    className="group flex cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-2.5 outline-none transition-colors data-[selected=true]:bg-line/[0.08]"
  >
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line/10 ${tone === "red" ? "bg-primary/15 text-primary-ink" : "bg-teal/10 text-teal"} group-data-[selected=true]:border-line/25`}>
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-[15px] text-foreground">{title}</span>
      {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
    </span>
    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-data-[selected=true]:translate-x-0.5 group-data-[selected=true]:opacity-100" />
  </Command.Item>
);

/**
 * Site-wide command palette (Cmd/Ctrl + K, or "/"): every page, product,
 * solution, industry and resource in one searchable list, plus the actions
 * people come for (demo, sales, trial, the AI concierge). Keyboard first:
 * arrows move, Enter opens, Esc closes.
 */
export default function CommandPalette({ open, onOpenChange }) {
  const tx = useTx();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const go = (fn) => () => {
    onOpenChange(false);
    // Let the dialog close (and release the scroll lock) before navigating.
    setTimeout(fn, 60);
  };
  const to = (path) => go(() => navigate(path));

  const pages = useMemo(
    () => [
      ...NAV.map((n) => ({ label: NAV_LABEL_KEYS[n.label] ? t(NAV_LABEL_KEYS[n.label]) : tx(n.label), to: n.to })),
      { label: tx("Industries"), to: "/industries" },
      { label: tx("Careers"), to: "/careers" },
      { label: tx("Newsroom"), to: "/newsroom" },
      { label: tx("Contact"), to: "/contact" },
    ],
    [t, tx]
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#0D192D]/60 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="dark fixed left-1/2 top-[10vh] z-[71] w-[min(700px,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-line/15 bg-background/90 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.3),0_60px_140px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-4"
          data-testid="command-palette"
        >
          <DialogPrimitive.Title className="sr-only">{tx("Search Solix")}</DialogPrimitive.Title>
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
          <span className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.18),transparent)]" />
          <span className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.2),transparent)]" />
          <Command label={tx("Search Solix")} loop className="relative [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted-foreground">
            <div className="flex items-center gap-3 border-b border-line/10 px-5">
              <Search className="h-5 w-5 shrink-0 text-teal" />
              <Command.Input
                autoFocus
                placeholder={tx("Search products, solutions, industries, resources…")}
                className="h-16 w-full bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground/70"
                data-testid="command-palette-input"
              />
              <kbd className="hidden shrink-0 rounded-md border border-line/15 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">esc</kbd>
            </div>
            <Command.List className="max-h-[min(62vh,520px)] overflow-y-auto overscroll-contain p-2" data-lenis-prevent>
              <Command.Empty className="px-4 py-12 text-center text-sm text-muted-foreground">{tx("No matches. Try a product name, a system like SAP, or a topic like retention.")}</Command.Empty>

              <Command.Group heading={tx("Quick actions")}>
                <Item icon={CalendarDays} tone="red" title={tx("Request a demo")} subtitle={tx("A 45-minute working session on your data")} value="request a demo book meeting" onSelect={to("/contact?type=demo")} />
                <Item icon={Bot} tone="red" title={tx("Ask Sol, the AI concierge")} subtitle={tx("Answers about products, pricing and fit")} value="ask sol ai concierge chat help" onSelect={go(() => window.dispatchEvent(new CustomEvent("solix:open-chat")))} />
                <Item icon={Sparkles} title={tx("Start your 30-day free trial")} subtitle="Solix ECS" value="trial sign up free ecs" onSelect={to("/signup")} />
                <Item icon={Mail} title={tx("Contact sales")} value="contact sales pricing" onSelect={to("/contact?type=contact")} />
                <Item icon={LogIn} title={tx("Login")} value="login sign in account" onSelect={to("/signin")} />
                <Item icon={CalendarDays} title="SOLIXEmpower 2026" subtitle={tx("Oct 28-30, San Diego")} value="solixempower event conference" onSelect={go(() => { window.location.href = empowerLink("search"); })} />
              </Command.Group>

              <Command.Group heading={tx("Pages")}>
                {pages.map((p) => <Item key={p.to} icon={LayoutGrid} title={p.label} value={`page ${p.label} ${p.to}`} onSelect={to(p.to)} />)}
              </Command.Group>

              <Command.Group heading={tx("Products")}>
                {PRODUCTS.map((p) => <Item key={p.slug} icon={p.icon || LayoutGrid} title={p.name} subtitle={p.tagline} value={`product ${p.name} ${p.tagline} ${p.category}`} onSelect={to(`/products/${p.slug}`)} />)}
              </Command.Group>

              <Command.Group heading={tx("Solutions")}>
                {SOLUTIONS.map((s) => <Item key={s.id} icon={s.icon || Target} title={s.title} subtitle={s.metric} value={`solution ${s.title} ${s.desc}`} onSelect={to(`/solutions#${s.id}`)} />)}
              </Command.Group>

              <Command.Group heading={tx("Industries")}>
                {INDUSTRIES.map((i) => <Item key={i.slug} icon={i.icon || Building2} title={i.name} subtitle={i.headline} value={`industry ${i.name} ${i.headline}`} onSelect={to(`/industries/${i.slug}`)} />)}
              </Command.Group>

              <Command.Group heading={tx("Resources")}>
                {RESOURCES.map((r) => <Item key={r.id} icon={r.icon || FileText} title={r.title} subtitle={`${r.readTime} · ${r.date}`} value={`resource ${r.title} ${r.desc} ${r.tag}`} onSelect={to(`/resources/${r.slug}`)} />)}
              </Command.Group>
            </Command.List>
            <div className="flex items-center justify-between gap-4 border-t border-line/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-line/15 px-1">↑</kbd><kbd className="rounded border border-line/15 px-1">↓</kbd> {tx("Navigate")}</span>
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-line/15 px-1"><CornerDownLeft className="h-3 w-3" /></kbd> {tx("Open")}</span>
              </span>
              <span className="hidden sm:inline">Solix · {tx("Search")}</span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

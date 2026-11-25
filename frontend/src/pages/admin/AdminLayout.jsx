import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, FileText, Inbox, LayoutDashboard, LogOut, Settings, Users, CalendarDays, Globe2, MonitorCog, Radar, MessagesSquare, Crosshair, Send, Search, Moon, Sun, RefreshCw, Bot, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkHubLockup, useMarkHubChrome } from "@/components/admin/MarkHubBrand";
import { useAdmin } from "@/components/admin/AdminAuth";
import { ROLE_LABELS, canAccess } from "@/components/admin/kit";
import { useAdminTheme } from "@/components/admin/theme";
import { EASE, LiveDot } from "@/components/admin/motion";
import { clearAdminCache } from "@/lib/adminApi";
import { InternalViewSwitch } from "@/components/admin/InternalTraffic";
import { INTERNAL_VIEWS, useInternalView } from "@/lib/internalTraffic";
import { SafePresence } from "@/components/motion/SafePresence";
import { RouteErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";

// `feature` is the access area (Settings > Access) that decides whether the section shows. Settings always shows:
// everyone changes their own password there.
const ALL_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, feature: "dashboard" },
  { to: "/admin/leads", label: "Leads", icon: Users, feature: "leads" },
  { to: "/admin/radar", label: "Radar", icon: Crosshair, feature: "radar" },
  { to: "/admin/outbound", label: "Outbound", icon: Send, feature: "outbound" },
  { to: "/admin/conversations", label: "Sol chats", icon: MessagesSquare, feature: "sol" },
  { to: "/admin/seo", label: "SEO", icon: Radar, feature: "seo" },
  { to: "/admin/content", label: "Content", icon: FileText, feature: "content" },
  { to: "/admin/migrate", label: "Migrate", icon: Globe2, feature: "migrate" },
  { to: "/admin/website", label: "Website", icon: MonitorCog, feature: "website" },
  { to: "/admin/events", label: "Events", icon: CalendarDays, feature: "events" },
  { to: "/admin/inbox", label: "Form inbox", icon: Inbox, feature: "inbox" },
  { to: "/admin/tools", label: "AI tools", icon: Bot },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];
export const visibleLinks = (user) => ALL_LINKS.filter((l) => !l.feature || canAccess(user, l.feature));

const initials = (user) => {
  const src = (user?.name || user?.email || "?").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const isActive = (pathname, l) => (l.end ? pathname === l.to || pathname === `${l.to}/` : pathname.startsWith(l.to));

export default function AdminLayout() {
  const { user, logout } = useAdmin();
  const { theme, toggle } = useAdminTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const now = useClock();
  const [palette, setPalette] = useState(false);
  const [internalView, setInternalView] = useInternalView();
  useMarkHubChrome();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (fn) => () => {
    setPalette(false);
    fn();
  };
  const section = location.pathname.split("/").slice(0, 3).join("/");
  const links = visibleLinks(user);
  const blocked = ALL_LINKS.find((l) => l.feature && isActive(location.pathname, l) && !canAccess(user, l.feature));

  return (
    <div className="min-h-screen text-foreground" data-testid="admin-layout">
      <header className="sticky top-0 z-40">
        <div className="border-b border-line/[0.06] bg-background/55 backdrop-blur-2xl backdrop-saturate-150">
          <div className="container flex h-16 items-center justify-between gap-4">
            <Link to="/admin" className="flex shrink-0 items-center" aria-label="MarkHub for Solix: admin home">
              <MarkHubLockup compact />
            </Link>

            <button
              type="button"
              onClick={() => setPalette(true)}
              className="group hidden h-9 min-w-[240px] items-center gap-2 rounded-full border border-line/10 bg-line/[0.04] px-3 text-left text-xs text-muted-foreground transition-colors hover:border-line/20 hover:text-foreground md:flex"
              data-testid="admin-command-open"
            >
              <Search className="h-3.5 w-3.5" /> Jump to a section or action…
              <kbd className="ml-auto rounded-md border border-line/10 bg-line/5 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </button>

            <div className="flex shrink-0 items-center gap-1.5">
              <InternalViewSwitch className="hidden lg:inline-flex" />
              <span className="mr-1 hidden items-center gap-1.5 font-mono text-[10px] text-muted-foreground xl:inline-flex">
                <LiveDot className="h-1.5 w-1.5 [&>span]:h-1.5 [&>span]:w-1.5" /> Live · {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </span>
              <button type="button" onClick={() => setPalette(true)} className="grid h-9 w-9 place-items-center rounded-full border border-line/10 text-muted-foreground transition-colors hover:text-foreground md:hidden" aria-label="Search sections">
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggle}
                className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-line/10 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={theme === "dark" ? "Switch to day theme" : "Switch to night theme"}
                data-testid="admin-theme-toggle"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={theme} initial={{ y: 14, rotate: -40, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -14, rotate: 40, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </motion.span>
                </AnimatePresence>
              </button>
              <a href={`${process.env.PUBLIC_URL || ""}/`} target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-1.5 rounded-full border border-line/10 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
                <ExternalLink className="h-3.5 w-3.5" /> View site
              </a>
              <div className="ml-1 flex items-center gap-2 rounded-full border border-line/10 py-1 pl-1 pr-1 sm:pr-3">
                <span className="relative grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#0088cf] to-[#ee2424] p-[1.5px]" title={user?.email}>
                  <span className="grid h-full w-full place-items-center rounded-full bg-background font-display text-[10px] font-semibold">{initials(user)}</span>
                </span>
                <span className="hidden text-left leading-tight lg:block">
                  <span className="block max-w-[160px] truncate font-mono text-[11px] text-foreground/90" data-testid="admin-user-email">{user?.email}</span>
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">{ROLE_LABELS[user?.role] || user?.role}</span>
                </span>
                <button type="button" onClick={logout} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-line/10 hover:text-foreground sm:ml-1" aria-label="Sign out" data-testid="admin-logout-button">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Below lg the internal-traffic switch gets its own row, so it is always one tap away. */}
          <div className="container flex justify-end pb-2 lg:hidden"><InternalViewSwitch /></div>
          {/* Its own row at every width: twelve sections never fit beside the logo and account buttons. */}
          <LayoutGroup id="admin-nav">
            <nav className="container flex gap-1 overflow-x-auto pb-2.5 [scrollbar-width:none]" aria-label="Admin sections">
              {links.map((l) => {
                const active = isActive(location.pathname, l);
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    data-testid={`admin-nav-${l.label.toLowerCase().split(" ")[0]}`}
                    className={cn("relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors xl:text-sm", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    {active && (
                      <motion.span layoutId="admin-nav-pill" className="absolute inset-0 rounded-full border border-line/10 bg-line/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                    )}
                    <l.icon className={cn("relative h-3.5 w-3.5 xl:h-4 xl:w-4", active && "text-primary")} strokeWidth={1.5} />
                    <span className="relative">{l.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </LayoutGroup>
        </div>
        <div className="admin-header-rim h-px w-full opacity-60" />
      </header>

      <main className="container py-8 sm:py-10">
        {/* Only the page area waits for a page's code; the navigation stays put. */}
        {/* SafePresence: if a section's exit ever stalls, the next section still shows instead of a blank page. */}
        <SafePresence swapKey={section} mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.34, ease: EASE }}
          >
            <RouteErrorBoundary>
              {/* Keyed on the internal-traffic view: the page remounts and reloads its numbers, whose reads carry the view. */}
              <Suspense key={internalView} fallback={<div className="min-h-[50vh]" aria-busy="true" />}>
                {blocked ? (
                  <div className="mx-auto max-w-md py-24 text-center" data-testid="admin-no-access">
                    <p className="font-display text-lg">You don't have access to {blocked.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">An admin can give you access in Settings, under Access.</p>
                    <Link to={links[0]?.to || "/admin/settings"} className="mt-4 inline-block text-sm text-primary-ink underline">Go to {links[0]?.label || "Settings"}</Link>
                  </div>
                ) : (
                  <Outlet />
                )}
              </Suspense>
            </RouteErrorBoundary>
          </motion.div>
        </SafePresence>
      </main>

      <CommandDialog open={palette} onOpenChange={setPalette} title="Jump to" contentClassName="admin-glass max-w-xl rounded-2xl border-line/10 bg-popover/80 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
        <CommandInput placeholder="Where to? Type a section or action…" data-testid="admin-command-input" />
        <CommandList>
          <CommandEmpty>Nothing matches.</CommandEmpty>
          <CommandGroup heading="Go to">
            {links.map((l) => (
              <CommandItem key={l.to} value={`go ${l.label}`} onSelect={run(() => navigate(l.to))}>
                <l.icon className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> {l.label}
                {isActive(location.pathname, l) && <CommandShortcut>here</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="new lead view mql unassigned" onSelect={run(() => navigate("/admin/leads?stage=mql&owner=unassigned"))}>
              <Users className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> Unassigned MQLs
            </CommandItem>
            {INTERNAL_VIEWS.filter((m) => m.value !== internalView).map((m) => (
              <CommandItem key={m.value} value={`internal traffic staff solix ${m.label}`} onSelect={run(() => setInternalView(m.value))}>
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> {m.label} traffic in metrics
              </CommandItem>
            ))}
            <CommandItem value="refresh data reload" onSelect={run(() => { clearAdminCache(); window.dispatchEvent(new CustomEvent("solix:admin-refresh")); })}>
              <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> Refresh data
            </CommandItem>
            <CommandItem value="theme toggle day night light dark" onSelect={run(toggle)}>
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4 text-muted-foreground" /> : <Moon className="mr-2 h-4 w-4 text-muted-foreground" />} Switch to {theme === "dark" ? "day" : "night"} theme
            </CommandItem>
            <CommandItem value="view public site" onSelect={run(() => window.open(`${process.env.PUBLIC_URL || ""}/`, "_blank", "noopener"))}>
              <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> View site
            </CommandItem>
            <CommandItem value="sign out logout" onSelect={run(logout)}>
              <LogOut className="mr-2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

import { Link, NavLink, Outlet } from "react-router-dom";
import { ExternalLink, FileText, Inbox, LayoutDashboard, LogOut, Settings, Users, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { useAdmin } from "@/components/admin/AdminAuth";
import { ROLE_LABELS } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/leads", label: "Leads", icon: Users },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/inbox", label: "Form inbox", icon: Inbox },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAdmin();
  return (
    <div className="dark min-h-screen bg-background text-foreground" data-testid="admin-layout">
      <header className="sticky top-0 z-40 border-b border-line/10 bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link to="/admin" className="flex shrink-0 items-center gap-3">
              <Logo compact />
              <span className="font-display text-sm font-semibold tracking-tight">Admin</span>
            </Link>
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} data-testid={`admin-nav-${l.label.toLowerCase().split(" ")[0]}`} className={({ isActive }) => cn("inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors", isActive ? "bg-line/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <l.icon className="h-4 w-4" strokeWidth={1.5} /> {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-right leading-tight xl:block">
              <span className="block font-mono text-[11px] text-muted-foreground" data-testid="admin-user-email">{user?.email}</span>
              <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground/80">{ROLE_LABELS[user?.role] || user?.role}</span>
            </span>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/" target="_blank"><ExternalLink /> View site</Link></Button>
            <Button variant="outline" size="sm" onClick={logout} data-testid="admin-logout-button"><LogOut /> <span className="hidden sm:inline">Sign out</span></Button>
          </div>
        </div>
        <nav className="container flex gap-1 overflow-x-auto pb-2 lg:hidden" aria-label="Admin sections">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors", isActive ? "bg-line/10 text-foreground" : "text-muted-foreground")}>
              <l.icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container py-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

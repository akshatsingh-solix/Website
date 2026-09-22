import { Link, NavLink, Outlet } from "react-router-dom";
import { ExternalLink, LogOut, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { useAdmin } from "@/components/admin/AdminAuth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/admin", label: "Leads", icon: Users, end: true },
  { to: "/admin/settings", label: "Alerts & settings", icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAdmin();
  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="admin-layout">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Logo compact />
              <span className="font-display text-sm font-semibold tracking-tight">Admin</span>
            </div>
            <nav className="hidden items-center gap-1 sm:flex">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} data-testid={`admin-nav-${l.label.toLowerCase().split(" ")[0]}`} className={({ isActive }) => cn("inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors", isActive ? "bg-white/10 text-foreground" : "text-slate-300 hover:text-foreground")}>
                  <l.icon className="h-4 w-4" strokeWidth={1.5} /> {l.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[11px] text-muted-foreground md:inline" data-testid="admin-user-email">{user?.email}</span>
            <Button asChild variant="ghost" size="sm"><Link to="/" target="_blank"><ExternalLink /> View site</Link></Button>
            <Button variant="outline" size="sm" onClick={logout} data-testid="admin-logout-button"><LogOut /> Sign out</Button>
          </div>
        </div>
      </header>
      <main className="container py-10">
        <Outlet />
      </main>
    </div>
  );
}

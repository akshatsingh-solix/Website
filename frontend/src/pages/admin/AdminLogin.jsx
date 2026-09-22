import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";
import { useAdmin } from "@/components/admin/AdminAuth";
import { formatApiError } from "@/lib/adminApi";

export default function AdminLogin() {
  const { user, login } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/admin"} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const cls = "h-11 rounded-lg border-white/15 bg-ink-900 px-4 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0";

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4" data-testid="admin-login-page">
      <div className="absolute inset-0 grid-lines opacity-50" />
      <div className="absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-teal" /> Admin</span>
        </div>
        <div className="rounded-3xl border border-white/10 bg-card/80 p-8 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur">
          <h1 className="font-display text-3xl font-medium tracking-tight">Sign in to the leads dashboard.</h1>
          <p className="mt-2 text-sm text-muted-foreground">Restricted to Solix administrators.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-5" data-testid="admin-login-form">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Email</Label>
              <Input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={cls} data-testid="admin-email-input" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Password</Label>
              <Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={cls} data-testid="admin-password-input" required />
            </div>
            {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" data-testid="admin-login-error">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="admin-login-submit">
              {busy ? <Loader2 className="animate-spin" /> : <>Sign in <ArrowRight /></>}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

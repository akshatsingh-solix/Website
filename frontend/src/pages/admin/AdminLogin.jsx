import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { EASE, LiveDot } from "@/components/admin/motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkHubLockup, useMarkHubChrome } from "@/components/admin/MarkHubBrand";
import { useAdmin } from "@/components/admin/AdminAuth";
import { formatApiError } from "@/lib/adminApi";
import { api } from "@/lib/api";

export default function AdminLogin() {
  const { user, login } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get("/", { noRetry: true }).catch(() => {}); }, []); // wake the API early
  useMarkHubChrome();

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

  const cls = "h-11 rounded-xl border-line/15 bg-background/60 px-4 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0";

  const rise = (i) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay: 0.08 * i } });

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 text-foreground" data-testid="admin-login-page">
      <motion.div className="relative w-full max-w-md" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: EASE }}>
        <motion.div className="mb-8 flex items-center justify-between" {...rise(0)}>
          <MarkHubLockup />
          <span className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-teal" /> Admin</span>
        </motion.div>
        <div className="spot admin-glass relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <span className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/25 blur-3xl" aria-hidden="true" />
          <motion.p className="relative mb-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground" {...rise(1)}><LiveDot /> Leads, Radar and outbound, live</motion.p>
          <motion.h1 className="relative font-display text-3xl font-medium tracking-tight sm:text-4xl" {...rise(2)}>
            Sign in to the <span className="bg-gradient-to-r from-[#38bdf8] via-[#3987e5] to-[#ee2424] bg-clip-text text-transparent">command centre</span>.
          </motion.h1>
          <motion.p className="relative mt-2 text-sm text-muted-foreground" {...rise(3)}>Restricted to Solix administrators.</motion.p>
          <motion.form onSubmit={onSubmit} className="relative mt-8 space-y-5" data-testid="admin-login-form" {...rise(4)}>
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Email</Label>
              <Input id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={cls} data-testid="admin-email-input" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Password</Label>
              <Input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={cls} data-testid="admin-password-input" required />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 3, 0] }} transition={{ duration: 0.45 }} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" data-testid="admin-login-error">{error}</motion.p>
            )}
            <Button type="submit" size="lg" className="btn-sheen w-full rounded-full shadow-[0_12px_40px_-12px_rgba(238,36,36,0.8)]" disabled={busy} data-testid="admin-login-submit">
              {busy ? <Loader2 className="animate-spin" /> : <>Sign in <ArrowRight /></>}
            </Button>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}

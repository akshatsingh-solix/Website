import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useTx } from "@/i18n/tx";
import { useAccount } from "@/components/account/AccountAuth";
import { accountForgotPassword, apiErrorMessage, isEmail } from "@/lib/accountApi";
import { AuthCard, AuthShell } from "./AuthShell";
import { CardLanguage, Field, PasswordInput, PrivacyNote, SsoButtons, SubmitButton, inputCls } from "./AuthParts";

/**
 * Two-step sign-in, as on solix.com/ai/signin: business email first
 * ("Next"), then the password. A third view handles "Forgot your password?".
 */
export default function SignIn() {
  const tx = useTx();
  const navigate = useNavigate();
  const location = useLocation();
  const { account, signin } = useAccount();
  const [step, setStep] = useState("email"); // email | password | forgot | forgot-sent
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    document.title = `${tx("Sign in to Solix ECS")} | Solix`;
  }, [tx]);

  if (account) return <Navigate to={location.state?.from || "/account"} replace />;

  const goPassword = (e) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setError(tx("Enter a valid business email address."));
      emailRef.current?.focus();
      return;
    }
    setError("");
    setStep("password");
  };

  const doSignin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError(tx("Enter your password."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signin(email.trim(), password);
      navigate(location.state?.from || "/account", { replace: true });
    } catch (err) {
      setError(tx(apiErrorMessage(err, "We couldn't sign you in right now. Please try again.")));
    } finally {
      setBusy(false);
    }
  };

  const doForgot = async (e) => {
    e.preventDefault();
    if (!isEmail(email)) {
      setError(tx("Enter a valid business email address."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await accountForgotPassword(email.trim());
      setStep("forgot-sent");
    } catch (err) {
      setError(tx(apiErrorMessage(err, "We couldn't send the request right now. Please try again.")));
    } finally {
      setBusy(false);
    }
  };

  const forgotLink = (
    <button type="button" onClick={() => { setError(""); setStep("forgot"); }} className="text-xs font-semibold text-teal hover:underline" data-testid="signin-forgot">
      {tx("Forgot your password?")}
    </button>
  );

  return (
    <AuthShell>
      <AuthCard testId="signin-card">
        {step === "forgot" || step === "forgot-sent" ? (
          <>
            <button type="button" onClick={() => { setError(""); setStep("email"); }} className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> {tx("Back to sign in")}
            </button>
            <h2 className="font-display text-xl font-semibold">{tx("Reset your password")}</h2>
            {step === "forgot-sent" ? (
              <div className="mt-5 rounded-xl border border-teal/20 bg-accent/60 p-4 text-sm text-foreground" role="status" data-testid="signin-forgot-sent">
                <Check className="mb-2 h-5 w-5 text-teal" />
                {tx("If an account exists for {{email}}, the Solix team will contact you with reset instructions.", { email: email.trim() })}
              </div>
            ) : (
              <form onSubmit={doForgot} noValidate className="mt-5 space-y-5">
                <p className="text-sm text-muted-foreground">{tx("Enter the business email you signed up with and we'll help you get back in.")}</p>
                <Field id="forgot-email" label={tx("Business Email")} error={error}>
                  <input id="forgot-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" aria-invalid={!!error || undefined} className={inputCls} data-testid="forgot-email-input" autoFocus />
                </Field>
                <SubmitButton busy={busy} testId="forgot-submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />} {tx("Send reset request")}</SubmitButton>
              </form>
            )}
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-semibold">{tx("Sign in to Solix ECS")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {tx("Don't have an account?")} <Link to="/signup" className="font-semibold text-teal hover:underline" data-testid="signin-to-signup">{tx("Sign up")}</Link>
            </p>

            {step === "email" ? (
              <form onSubmit={goPassword} noValidate className="mt-6">
                <Field id="signin-email" label={tx("Business Email")} error={error}>
                  <input id="signin-email" ref={emailRef} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" aria-invalid={!!error || undefined} aria-describedby={error ? "signin-email-error" : undefined} className={inputCls} data-testid="signin-email-input" autoFocus />
                </Field>
                <div className="mt-2 flex justify-end">{forgotLink}</div>
                <div className="mt-5"><PrivacyNote /></div>
                <div className="mt-4"><SubmitButton testId="signin-next">{tx("Next")}</SubmitButton></div>
              </form>
            ) : (
              <form onSubmit={doSignin} noValidate className="mt-6">
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-line/10 bg-muted px-3.5 py-2.5 text-sm">
                  <span className="truncate text-foreground" data-testid="signin-email-chip">{email.trim()}</span>
                  <button type="button" onClick={() => { setPassword(""); setError(""); setStep("email"); }} className="shrink-0 text-xs font-semibold text-teal hover:underline">{tx("Change")}</button>
                </div>
                {/* Keeps the username available to password managers on this step. */}
                <input type="email" autoComplete="username" value={email} readOnly hidden />
                <Field id="signin-password" label={tx("Password")} error={error}>
                  <PasswordInput id="signin-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" invalid={!!error} testId="signin-password-input" autoFocus />
                </Field>
                <div className="mt-2 flex justify-end">{forgotLink}</div>
                <div className="mt-5">
                  <SubmitButton busy={busy} testId="signin-submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />} {tx("Sign in")}</SubmitButton>
                </div>
              </form>
            )}
            <SsoButtons />
          </>
        )}
        <CardLanguage />
      </AuthCard>
    </AuthShell>
  );
}

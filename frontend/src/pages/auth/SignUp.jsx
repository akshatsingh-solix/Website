import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { useAccount } from "@/components/account/AccountAuth";
import { ECS_TERMS_URL, PASSWORD_RULES, apiErrorMessage, isBusinessEmail, isEmail, isStrongPassword } from "@/lib/accountApi";
import { AuthCard, AuthShell } from "./AuthShell";
import { visitorId } from "@/lib/intent";
import { CardLanguage, Field, PasswordInput, PrivacyNote, SsoButtons, SubmitButton, inputCls } from "./AuthParts";

const COMPANY_SIZES = ["1–49", "50–249", "250–999", "1,000–4,999", "5,000–19,999", "20,000+"];
// i18n: options are translated at render; the English value is stored.
const USE_CASES = [
  "Contract intelligence",
  "Invoice and document processing",
  "Email and records search",
  "Compliance and retention",
  "Knowledge base for AI agents",
  "Something else",
];
// i18n
const COUNTRIES = [
  "United States", "Canada", "Mexico", "Brazil", "Argentina", "Colombia", "Chile", "United Kingdom", "Ireland", "Germany", "Austria",
  "Switzerland", "France", "Belgium", "Netherlands", "Luxembourg", "Spain", "Portugal", "Italy", "Sweden", "Norway", "Denmark",
  "Finland", "Poland", "United Arab Emirates", "Saudi Arabia", "Israel", "South Africa", "India", "Singapore", "Malaysia",
  "Indonesia", "Philippines", "Japan", "South Korea", "Australia", "New Zealand", "Other",
];

const EMPTY = { first_name: "", last_name: "", company: "", email: "", phone: "", password: "", job_title: "", company_size: "", country: "", use_case: "", marketing_opt_in: false };

/**
 * Two-step Solix ECS trial sign-up, as on solix.com/ai/signup:
 * step 1 identity + password, step 2 a little about the team.
 */
export default function SignUp() {
  const tx = useTx();
  const { i18n } = useTranslation();
  const { account, signup } = useAccount();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  // Set just before the account is created, so the redirect below (which
  // fires as soon as the session exists) can greet a brand-new account.
  const justCreated = useRef(false);

  useEffect(() => {
    document.title = `${tx("Create your Solix ECS Account")} | Solix`;
  }, [tx]);

  if (account) return <Navigate to="/account" replace state={{ welcome: justCreated.current }} />;

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const validateStep1 = () => {
    const next = {};
    if (!form.first_name.trim()) next.first_name = tx("Enter your first name.");
    if (!form.last_name.trim()) next.last_name = tx("Enter your last name.");
    if (!form.company.trim()) next.company = tx("Enter your business name.");
    if (!isEmail(form.email)) next.email = tx("Enter a valid business email address.");
    else if (!isBusinessEmail(form.email)) next.email = tx("Please use your business email address, not a personal one.");
    if (form.phone && !/^[+()\d\s.-]{6,40}$/.test(form.phone)) next.phone = tx("Enter a valid phone number.");
    if (!isStrongPassword(form.password)) next.password = tx("Password must be 6-30 characters and include a letter, a number and a symbol.");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onContinue = (e) => {
    e.preventDefault();
    setFormError("");
    if (validateStep1()) setStep(2);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    justCreated.current = true;
    try {
      await signup({
        ...form,
        ...(visitorId() ? { visitor_id: visitorId() } : {}),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        job_title: form.job_title.trim() || null,
        company_size: form.company_size || null,
        country: form.country || null,
        use_case: form.use_case || null,
        language: i18n.language,
      });
    } catch (err) {
      justCreated.current = false;
      const msg = tx(apiErrorMessage(err, "We couldn't create your account right now. Please try again."));
      setFormError(msg);
      if (err?.response?.status === 409 || err?.response?.status === 422) setStep(1);
    } finally {
      setBusy(false);
    }
  };

  const text = (key, label, props = {}) => (
    <Field id={`signup-${key}`} label={label} error={errors[key]} className={props.className}>
      <input
        id={`signup-${key}`}
        value={form[key]}
        onChange={set(key)}
        aria-invalid={!!errors[key] || undefined}
        aria-describedby={errors[key] ? `signup-${key}-error` : undefined}
        className={inputCls}
        data-testid={`signup-${key}-input`}
        {...props.input}
      />
    </Field>
  );

  const select = (key, label, options, placeholder) => (
    <Field id={`signup-${key}`} label={label}>
      <select id={`signup-${key}`} value={form[key]} onChange={set(key)} className={cn(inputCls, "cursor-pointer pr-8", !form[key] && "text-muted-foreground/80")} data-testid={`signup-${key}-select`}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{tx(o)}</option>)}
      </select>
    </Field>
  );

  return (
    <AuthShell>
      <AuthCard testId="signup-card">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">{step === 1 ? tx("Create your Solix ECS Account") : tx("Tell us about your team")}</h2>
          <span className="mt-1 shrink-0 font-mono text-[11px] font-semibold text-muted-foreground" data-testid="signup-step">{step} / 2</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className={cn("h-full rounded-full bg-gradient-to-r from-teal to-primary transition-[width] duration-500", step === 1 ? "w-1/2" : "w-full")} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {tx("Already have an account?")} <Link to="/signin" className="font-semibold text-teal hover:underline" data-testid="signup-to-signin">{tx("Sign in")}</Link>
        </p>

        {formError && <p className="mt-4 rounded-lg border border-primary/25 bg-primary/5 px-3.5 py-2.5 text-sm text-primary-ink" role="alert" data-testid="signup-error">{formError}</p>}

        {step === 1 ? (
          <form onSubmit={onContinue} noValidate className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {text("first_name", tx("First Name"), { input: { autoComplete: "given-name", placeholder: tx("First Name"), autoFocus: true } })}
              {text("last_name", tx("Last Name"), { input: { autoComplete: "family-name", placeholder: tx("Last Name") } })}
            </div>
            {text("company", tx("Business Name"), { input: { autoComplete: "organization", placeholder: tx("Business Name") } })}
            {text("email", tx("Business Email"), { input: { type: "email", autoComplete: "email", placeholder: "name@company.com" } })}
            {text("phone", tx("Phone Number"), { input: { type: "tel", autoComplete: "tel", placeholder: "+1 555 000 0000" } })}
            <Field id="signup-password" label={tx("Password")} error={errors.password}>
              <PasswordInput id="signup-password" value={form.password} onChange={set("password")} placeholder={tx("6–30 chars, A-z, 0-9, symbol")} autoComplete="new-password" invalid={!!errors.password} testId="signup-password-input" />
            </Field>
            {form.password && (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1" aria-live="polite" data-testid="signup-password-rules">
                {PASSWORD_RULES.map((r) => {
                  const ok = r.test(form.password);
                  return (
                    <li key={r.key} className={cn("flex items-center gap-1.5 text-[11px]", ok ? "text-teal" : "text-muted-foreground")}>
                      <Check className={cn("h-3 w-3", ok ? "opacity-100" : "opacity-30")} /> {tx(r.label)}
                    </li>
                  );
                })}
              </ul>
            )}
            <PrivacyNote />
            <SubmitButton testId="signup-continue">{tx("Continue")}</SubmitButton>
          </form>
        ) : (
          <form onSubmit={onCreate} noValidate className="mt-5 space-y-4">
            {text("job_title", tx("Job Title"), { input: { autoComplete: "organization-title", placeholder: tx("e.g. Head of Legal Operations"), autoFocus: true } })}
            <div className="grid gap-4 sm:grid-cols-2">
              {select("company_size", tx("Company Size"), COMPANY_SIZES, tx("Select"))}
              {select("country", tx("Country"), COUNTRIES, tx("Select"))}
            </div>
            {select("use_case", tx("What will you use Solix ECS for?"), USE_CASES, tx("Select a use case"))}
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
              <input type="checkbox" checked={form.marketing_opt_in} onChange={set("marketing_opt_in")} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0088CF]" data-testid="signup-optin" />
              {tx("Send me product updates, best practices and event invitations from Solix. You can unsubscribe at any time.")}
            </label>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              {tx("By creating an account you agree to the Solix ECS")}{" "}
              <a href={ECS_TERMS_URL} target="_blank" rel="noreferrer" className="font-medium text-teal underline underline-offset-2">{tx("Terms of Service")}</a>.
            </p>
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <button type="button" onClick={() => setStep(1)} className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted" data-testid="signup-back">
                <ArrowLeft className="h-4 w-4" /> {tx("Back")}
              </button>
              <SubmitButton busy={busy} testId="signup-create">{busy && <Loader2 className="h-4 w-4 animate-spin" />} {tx("Start my free trial")}</SubmitButton>
            </div>
          </form>
        )}

        {step === 1 && <SsoButtons />}
        <CardLanguage />
      </AuthCard>
    </AuthShell>
  );
}

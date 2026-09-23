import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { ECS_PRIVACY_URL } from "@/lib/accountApi";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

// no-i18n
export const inputCls =
  "h-11 w-full rounded-lg border border-input bg-background px-3.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:opacity-60 aria-[invalid=true]:border-primary aria-[invalid=true]:ring-primary/15";

export const Field = ({ id, label, error, hint, children, className }) => (
  <div className={className}>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-foreground">{label}</label>
    {children}
    {error ? (
      <p id={`${id}-error`} className="mt-1.5 text-xs text-primary-ink" role="alert">{error}</p>
    ) : hint ? (
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
);

export const PasswordInput = ({ id, value, onChange, placeholder, invalid, autoComplete, testId, autoFocus }) => {
  const tx = useTx();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        maxLength={30}
        autoFocus={autoFocus}
        className={cn(inputCls, "pr-11")}
        data-testid={testId}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? tx("Hide password") : tx("Show password")}
        className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
};

export const PrivacyNote = () => {
  const tx = useTx();
  return (
    <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
      {tx("By clicking the button below you understand that Solix will process your personal information in accordance with its")}{" "}
      <a href={ECS_PRIVACY_URL} target="_blank" rel="noreferrer" className="font-medium text-teal underline underline-offset-2">{tx("Privacy Notice")}</a>.
    </p>
  );
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
    <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
    <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
    <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
  </svg>
);

/**
 * "or sign in with" Google / Microsoft. Single sign-on needs OAuth client
 * IDs registered with Google and Microsoft for this domain; until those
 * are configured the buttons say so instead of failing silently.
 */
export const SsoButtons = () => {
  const tx = useTx();
  const notice = (provider) =>
    toast.info(tx("{{provider}} sign-in isn't enabled on this site yet. Please continue with your business email.", { provider }));
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="h-px flex-1 bg-line/15" /> {tx("or sign in with")} <span className="h-px flex-1 bg-line/15" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => notice("Google")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-muted" data-testid="sso-google">
          <GoogleIcon /> Google
        </button>
        <button type="button" onClick={() => notice("Microsoft")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-muted" data-testid="sso-microsoft">
          <MicrosoftIcon /> Microsoft
        </button>
      </div>
    </>
  );
};

export const CardLanguage = () => (
  <div className="mt-6 flex justify-center">
    <LanguageSwitcher className="rounded-lg border border-input px-3 py-1.5 text-xs" />
  </div>
);

export const SubmitButton = ({ children, busy, testId, disabled }) => (
  <button
    type="submit"
    disabled={busy || disabled}
    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_rgba(238,36,36,0.7)] transition-[background-color,transform] hover:bg-ember-deep active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    data-testid={testId}
  >
    {children}
  </button>
);

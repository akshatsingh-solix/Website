import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ArrowRight, CheckCircle2, Loader2, Mail, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { INTERESTS } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submissionError, submitLead, warmBackend } from "@/lib/api";
import { leadContext, track } from "@/lib/intent";
import { useTx } from "@/i18n/tx";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid work email"),
  company: z.string().min(2, "Company is required"),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  interest: z.string().optional(),
  message: z.string().max(2000).optional(),
});

// no-i18n
const inputCls = "h-11 rounded-lg border-line/15 bg-background px-4 focus-visible:ring-primary/60 focus-visible:ring-2 focus-visible:ring-offset-0";

const Field = ({ label, error, htmlFor, children, optional }) => {
  const tx = useTx();
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {tx(label)} {optional && <span className="normal-case tracking-normal text-muted-foreground/70">{tx("(optional)")}</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-primary-ink" data-testid={`error-${htmlFor}`}>{tx(error)}</p>}
    </div>
  );
};

export const LeadForm = ({
  type = "demo",
  defaultInterest,
  extra = {},
  submitLabel = "Request a demo",
  successTitle = "Thank you — we'll be in touch shortly.",
  successDesc = "A Solix expert will reach out within one business day to schedule your session.",
  showInterest = true,
  showMessage = true,
  compact = false,
  className,
  onSuccess,
}) => {
  const tx = useTx();
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState(null);
  const [slow, setSlow] = useState(false);
  const slowTimer = useRef(null);
  const known = INTERESTS.some((i) => i.value === defaultInterest);
  const {
    register, handleSubmit, control, getValues, setValue, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { interest: known ? defaultInterest : "", name: "", email: "", company: "", phone: "", job_title: "", message: "" } });

  // Wake the backend while the visitor is still typing (it may be asleep).
  useEffect(() => { warmBackend(); return () => clearTimeout(slowTimer.current); }, []);
  // Interactive explorers on the page can hand over what the visitor tried.
  useEffect(() => {
    if (!showMessage) return undefined;
    const onPrefill = (e) => e.detail?.message && setValue("message", e.detail.message.slice(0, 2000));
    window.addEventListener("solix:prefill-lead", onPrefill);
    return () => window.removeEventListener("solix:prefill-lead", onPrefill);
  }, [showMessage, setValue]);

  const groups = useMemo(() => {
    const out = [];
    for (const i of INTERESTS) {
      const g = out.find((x) => x.name === i.group);
      if (g) g.items.push(i); else out.push({ name: i.group, items: [i] });
    }
    return out;
  }, []);

  const onSubmit = async (values) => {
    setFailure(null);
    setSlow(false);
    slowTimer.current = setTimeout(() => setSlow(true), 5000);
    try {
      const created = await submitLead({ type, ...values, ...extra, ...leadContext(), source_page: window.location.pathname });
      if (type === "download") track("resource_download", { meta: { title: extra?.resource } });
      setDone(true);
      toast.success(tx("Submission received."));
      onSuccess?.(created);
    } catch (err) {
      setFailure(submissionError(err));
    } finally {
      clearTimeout(slowTimer.current);
      setSlow(false);
    }
  };

  // Last resort: the same details, pre-filled in an email to the team.
  const mailto = () => {
    const v = getValues();
    const label = INTERESTS.find((i) => i.value === v.interest)?.label || v.interest || "";
    const body = [`Name: ${v.name}`, `Email: ${v.email}`, `Company: ${v.company}`, v.job_title && `Job title: ${v.job_title}`, v.phone && `Phone: ${v.phone}`, label && `Interest: ${label}`, v.message && `\n${v.message}`, `\nPage: ${window.location.href}`].filter(Boolean).join("\n");
    return `mailto:info@solix.com?subject=${encodeURIComponent(`${type === "demo" ? "Demo request" : "Website enquiry"}${label ? `: ${label}` : ""}`)}&body=${encodeURIComponent(body)}`;
  };

  if (done) {
    return (
      <div className={cn("rounded-2xl border border-teal/30 bg-teal/5 p-8 text-center", className)} data-testid="lead-form-success">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal" strokeWidth={1.5} />
        <h3 className="mt-4 font-display text-xl font-medium">{tx(successTitle)}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{tx(successDesc)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-5", className)} data-testid={`lead-form-${type}`} noValidate>
      <div className={cn("grid gap-5", !compact && "sm:grid-cols-2")}>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" placeholder="Jane Rivera" /* no-i18n: sample name */ className={inputCls} data-testid="lead-name-input" {...register("name")} />
        </Field>
        <Field label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="jane@company.com" className={inputCls} data-testid="lead-email-input" {...register("email")} />
        </Field>
        <Field label="Company" htmlFor="company" error={errors.company?.message}>
          <Input id="company" placeholder="Acme Corporation" /* no-i18n: sample name */ className={inputCls} data-testid="lead-company-input" {...register("company")} />
        </Field>
        <Field label="Job title" htmlFor="job_title" optional>
          <Input id="job_title" placeholder={tx("VP, Data Platforms")} className={inputCls} data-testid="lead-title-input" {...register("job_title")} />
        </Field>
        <Field label="Phone" htmlFor="phone" optional>
          <Input id="phone" placeholder="+1 (555) 000-0000" className={inputCls} data-testid="lead-phone-input" {...register("phone")} />
        </Field>
        {showInterest && (
          <Field label="I'm interested in" htmlFor="interest" optional>
            <Controller
              control={control}
              name="interest"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="interest" className={cn(inputCls, "text-left")} data-testid="lead-interest-select">
                    <SelectValue placeholder={tx("Select a product or solution")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-80 border-line/10 bg-popover">
                    {groups.map((g) => (
                      <SelectGroup key={g.name}>
                        <SelectLabel className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{tx(g.name)}</SelectLabel>
                        {g.items.map((i) => (
                          <SelectItem key={i.value} value={i.value} data-testid={`lead-interest-option-${i.value}`}>{i.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        )}
      </div>
      {showMessage && (
        <Field label="What are you trying to solve?" htmlFor="message" optional>
          <Textarea id="message" rows={4} placeholder={tx("Tell us about the systems, data volumes or deadlines involved.")} className="rounded-lg border-line/15 bg-background px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0" data-testid="lead-message-input" {...register("message")} />
        </Field>
      )}
      {failure && (
        <div role="alert" className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm" data-testid="lead-form-error">
          <p className="flex items-start gap-2 text-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" />{tx(failure)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="submit" size="sm" variant="outline" disabled={isSubmitting} data-testid="lead-retry-button"><RotateCcw /> {tx("Try again")}</Button>
            <Button asChild size="sm" variant="ghost"><a href={mailto()} data-testid="lead-email-fallback"><Mail /> {tx("Email info@solix.com instead")}</a></Button>
          </div>
        </div>
      )}
      {isSubmitting && slow && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite" data-testid="lead-form-slow">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {tx("Connecting to our servers. This can take up to a minute the first time, so please keep this page open.")}
        </p>
      )}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{tx("By submitting you agree to our privacy policy. No spam, ever.")}</p>
        <Button type="submit" size="lg" disabled={isSubmitting} data-testid="lead-submit-button" className="h-auto min-h-12 shrink-0 whitespace-normal py-3 text-center sm:whitespace-nowrap">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <>{tx(submitLabel)} <ArrowRight /></>}
        </Button>
      </div>
    </form>
  );
};

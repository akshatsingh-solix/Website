import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { INTERESTS } from "@/data/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitLead } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid work email"),
  company: z.string().min(2, "Company is required"),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  interest: z.string().optional(),
  message: z.string().max(2000).optional(),
});

const inputCls = "h-11 rounded-lg border-white/15 bg-ink-900 px-4 focus-visible:ring-primary/60 focus-visible:ring-2 focus-visible:ring-offset-0";

const Field = ({ label, error, htmlFor, children, optional }) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {label} {optional && <span className="normal-case tracking-normal text-muted-foreground/70">(optional)</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-red-400" data-testid={`error-${htmlFor}`}>{error}</p>}
  </div>
);

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
  const [done, setDone] = useState(false);
  const {
    register, handleSubmit, control, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { interest: defaultInterest ?? "", name: "", email: "", company: "", phone: "", job_title: "", message: "" } });

  const onSubmit = async (values) => {
    try {
      await submitLead({ type, ...values, ...extra, source_page: window.location.pathname });
      setDone(true);
      toast.success("Submission received.");
      onSuccess?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (done) {
    return (
      <div className={cn("rounded-2xl border border-teal/30 bg-teal/5 p-8 text-center", className)} data-testid="lead-form-success">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal" strokeWidth={1.5} />
        <h3 className="mt-4 font-display text-xl font-medium">{successTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{successDesc}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-5", className)} data-testid={`lead-form-${type}`} noValidate>
      <div className={cn("grid gap-5", !compact && "sm:grid-cols-2")}>
        <Field label="Full name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" placeholder="Jane Rivera" className={inputCls} data-testid="lead-name-input" {...register("name")} />
        </Field>
        <Field label="Work email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="jane@company.com" className={inputCls} data-testid="lead-email-input" {...register("email")} />
        </Field>
        <Field label="Company" htmlFor="company" error={errors.company?.message}>
          <Input id="company" placeholder="Acme Corporation" className={inputCls} data-testid="lead-company-input" {...register("company")} />
        </Field>
        <Field label="Job title" htmlFor="job_title" optional>
          <Input id="job_title" placeholder="VP, Data Platforms" className={inputCls} data-testid="lead-title-input" {...register("job_title")} />
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
                    <SelectValue placeholder="Select a product or solution" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-ink-900">
                    {INTERESTS.map((i) => (
                      <SelectItem key={i.value} value={i.value} data-testid={`lead-interest-option-${i.value}`}>{i.label}</SelectItem>
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
          <Textarea id="message" rows={4} placeholder="Tell us about the systems, data volumes or deadlines involved." className="rounded-lg border-white/15 bg-ink-900 px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0" data-testid="lead-message-input" {...register("message")} />
        </Field>
      )}
      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">By submitting you agree to our privacy policy. No spam, ever.</p>
        <Button type="submit" size="lg" disabled={isSubmitting} data-testid="lead-submit-button" className="shrink-0">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <>{submitLabel} <ArrowRight /></>}
        </Button>
      </div>
    </form>
  );
};

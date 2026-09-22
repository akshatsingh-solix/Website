import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";

export const CTABand = ({
  eyebrow = "Ready when you are",
  title = "See your data activated in a live demo.",
  description = "Bring one system you wish you could switch off, one dataset your AI team can't touch, or one audit you dread. We'll show you the path.",
  primary = { label: "Request a demo", to: "/contact" },
  secondary = { label: "Talk to an expert", to: "/contact?type=contact" },
}) => (
  <section className="relative overflow-hidden border-t border-white/5">
    <div className="absolute inset-0 grid-lines opacity-60" />
    <div className="absolute -left-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
    <div className="absolute -right-40 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-teal/10 blur-3xl" />
    <div className="container relative py-24 sm:py-32">
      <Reveal className="grid items-end gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="eyebrow mb-4">{eyebrow}</p>
          <h2 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl lg:text-6xl">{title}</h2>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
          <Button asChild size="lg" data-testid="cta-band-primary">
            <Link to={primary.to}>{primary.label} <ArrowRight /></Link>
          </Button>
          {secondary && (
            <Button asChild size="lg" variant="outline" data-testid="cta-band-secondary">
              <Link to={secondary.to}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </Reveal>
    </div>
  </section>
);

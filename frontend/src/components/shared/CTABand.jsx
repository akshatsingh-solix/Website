import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { Reveal } from "./Reveal";
import { Picture } from "@/components/shared/Picture";

/**
 * The closing "act" of every page: a contained navy panel on the light
 * canvas, with a real render at full strength on the right. It leads
 * straight into the (also navy) footer, so each page ends on one
 * confident dark chord.
 */
export const CTABand = ({
  eyebrow = "Ready when you are",
  title = "See your data activated in a live demo.",
  description = "Bring one system you wish you could switch off, one dataset your AI team can't touch, or one audit you dread. We'll show you the path.",
  primary = { label: "Request a demo", to: "/contact" },
  secondary = { label: "Talk to an expert", to: "/contact?type=contact" },
  image = "/Website/images/prod-cdp.jpg",
}) => {
  const tx = useTx();
  return (
  <section className="relative bg-background pb-20 pt-4 sm:pb-24" data-testid="cta-band">
    <div className="container">
      <Reveal>
        <div className="dark relative isolate overflow-hidden rounded-[32px] bg-background text-foreground shadow-[0_60px_120px_-60px_rgba(13,25,45,0.7)]">
          <Picture src={image} sizes="(min-width: 1024px) 58vw, 100vw" className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover opacity-60 sm:opacity-100 lg:w-[58%]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/20 lg:via-background/80 lg:to-transparent" />
          <div className="absolute inset-0 -z-10 grid-lines opacity-60" />
          <div className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.35),transparent)]" />
          <div className="grid gap-10 px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-12 lg:px-16 lg:py-20">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-4">{tx(eyebrow)}</p>
              <h2 className="text-balance text-4xl font-medium tracking-tight sm:text-5xl">{tx(title)}</h2>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{tx(description)}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg" data-testid="cta-band-primary">
                  <Link to={primary.to}>{tx(primary.label)} <ArrowRight /></Link>
                </Button>
                {secondary && (
                  <Button asChild size="lg" variant="outline" className="bg-background/40 backdrop-blur" data-testid="cta-band-secondary">
                    <Link to={secondary.to}>{tx(secondary.label)}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
  );
};

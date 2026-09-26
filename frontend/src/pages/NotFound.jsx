import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { SignalField } from "@/components/motion/signal/SignalField";
import { SplitWords } from "@/components/motion/KineticText";
import { useDarkSurface } from "@/components/layout/navTone";

/**
 * Lost record: the data field gathers into "404" - push it around with the
 * pointer, click to send a shockwave through it - while the copy points the
 * way home.
 */
export default function NotFound() {
  const tx = useTx();
  const ref = useRef(null);
  useDarkSurface(ref);
  return (
    <section ref={ref} className="dark relative flex min-h-[100svh] items-end overflow-hidden bg-background text-foreground" data-testid="not-found-page">
      <div className="absolute inset-0 grid-lines grid-fade opacity-70" />
      <div className="absolute left-1/2 top-[38%] h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.18),rgba(0,136,207,0.1)_50%,transparent)]" />
      <div className="absolute inset-0">
        <SignalField formations={["cloud", "text:404"]} progress={1} place={{ x: 0, y: 0.22, scale: 1.05, mx: 0, my: 0.3 }} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="container relative pb-20 pt-40 sm:pb-24">
        <p className="eyebrow mb-4">404 · {tx("Record not found")}</p>
        <h1 className="max-w-4xl text-balance font-display text-[clamp(2.4rem,1.6rem+3.4vw,4.8rem)] font-medium leading-[1] tracking-[-0.035em]">
          <SplitWords text={tx("This record was archived somewhere else.")} play delay={0.3} />
        </h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }} className="mt-6 max-w-lg text-muted-foreground md:text-lg">
          {tx("The page you're looking for has moved or never existed. Even our Preservation Zone can't find it.")}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.8 }} className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" data-testid="not-found-home">
            <Link to="/"><ArrowLeft /> {tx("Back to home")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-background/40 backdrop-blur">
            <Link to="/resources"><Search /> {tx("Browse resources")}</Link>
          </Button>
        </motion.div>
        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{tx("Tip: click anywhere to send a pulse through the data")}</p>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Info, Leaf, Server, Timer, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { CURRENCIES, ExplorerShell, SliderField, defaultCurrency, money, num, prefillLead, useExplorerTracking, useLocale } from "./kit";

// Indicative industry averages (USD). Shown to the visitor under "Assumptions".
const A = {
  primaryPerTB: 3000,   // tier-1 storage incl. backup, DR copies, admin, per TB per year
  archivePerTB: 320,    // governed cloud archive tier, per TB per year
  appRunCost: 180000,   // license, maintenance, infrastructure and support per legacy app per year
  retireOneOff: 60000,  // one-off retirement project cost per app
  archiveOneOff: 250,   // one-off archiving effort per TB moved
  co2Primary: 0.2,      // t CO2e per TB per year on primary infrastructure
  co2Archive: 0.03,
};

const PRESETS = {
  "application-retirement": { tb: 80, inactive: 90, apps: 12, growth: 15 },
  "mainframe-archiving": { tb: 150, inactive: 75, apps: 4, growth: 8 },
  "sap-archiving": { tb: 60, inactive: 55, apps: 2, growth: 20 },
  "oracle-oebs-archiving": { tb: 40, inactive: 55, apps: 2, growth: 18 },
  "email-archiving": { tb: 120, inactive: 70, apps: 1, growth: 25 },
  "file-archiving": { tb: 400, inactive: 65, apps: 0, growth: 30 },
  "database-archiving": { tb: 90, inactive: 60, apps: 3, growth: 22 },
  default: { tb: 200, inactive: 60, apps: 5, growth: 20 },
};

export default function SavingsCalculator({ product }) {
  const tx = useTx();
  const locale = useLocale();
  const { i18n } = useTranslation();
  const p = PRESETS[product.slug] || PRESETS.default;
  const [tb, setTb] = useState(p.tb);
  const [inactive, setInactive] = useState(p.inactive);
  const [apps, setApps] = useState(p.apps);
  const [growth, setGrowth] = useState(p.growth);
  const [currency, setCurrency] = useState(defaultCurrency(i18n.language));
  const [showA, setShowA] = useState(false);
  const engaged = useExplorerTracking("savings-calculator", useMemo(() => [product.slug], [product.slug]));
  useEffect(() => setCurrency(defaultCurrency(i18n.language)), [i18n.language]);

  const r = useMemo(() => {
    const years = [1, 2, 3].map((y) => {
      const total = tb * (1 + growth / 100) ** (y - 1);
      const moved = total * (inactive / 100);
      const before = total * A.primaryPerTB + apps * A.appRunCost;
      const after = (total - moved) * A.primaryPerTB + moved * A.archivePerTB;
      return { year: y, before, after, saved: before - after };
    });
    const oneOff = apps * A.retireOneOff + tb * (inactive / 100) * A.archiveOneOff;
    const annual = years[0].saved;
    const threeYear = years.reduce((s, y) => s + y.saved, 0) - oneOff;
    const paybackMonths = annual > 0 ? Math.max(1, Math.round((oneOff / annual) * 12)) : null;
    const co2 = tb * (inactive / 100) * (A.co2Primary - A.co2Archive);
    return { years, annual, threeYear, paybackMonths, co2, primaryCut: inactive };
  }, [tb, inactive, apps, growth]);

  const chart = r.years.map((y) => ({ name: tx("Year {{n}}", { n: y.year }), before: Math.round(y.before), after: Math.round(y.after) }));
  const fmt = (v) => money(v, currency, locale);
  const change = (setter) => (v) => { setter(v); engaged("adjust"); };

  const summary = tx("Estimate from the website calculator: {{tb}} TB, {{pct}}% inactive, {{apps}} legacy apps, {{growth}}% annual growth. Indicative annual savings {{annual}}, 3-year net {{net}}.", {
    tb, pct: inactive, apps, growth, annual: fmt(r.annual), net: fmt(r.threeYear),
  });

  const tiles = [
    { Icon: Wallet, label: tx("Annual savings"), value: fmt(r.annual), testId: "calc-annual" },
    { Icon: Server, label: tx("3-year net savings"), value: fmt(r.threeYear) },
    { Icon: Timer, label: tx("Payback"), value: r.paybackMonths ? tx("{{n}} months", { n: r.paybackMonths }) : "—" },
    { Icon: Leaf, label: tx("CO₂e avoided per year"), value: `${num(r.co2, locale, { maximumFractionDigits: 0 })} t` },
  ];

  return (
    <ExplorerShell title={tx("What could {{name}} save you?", { name: product.name })} subtitle={tx("Move the sliders to match your estate. The estimate updates as you go, in your currency.")} testId="explorer-savings">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <SliderField label={tx("Data under management")} value={tb} min={5} max={2000} step={5} onChange={change(setTb)} format={(v) => `${num(v, locale)} TB`} testId="calc-tb" />
          <SliderField label={tx("Share that is inactive (rarely accessed)")} value={inactive} min={10} max={95} onChange={change(setInactive)} format={(v) => `${v}%`} testId="calc-inactive" />
          <SliderField label={tx("Legacy applications you could retire")} value={apps} min={0} max={60} onChange={change(setApps)} testId="calc-apps" />
          <SliderField label={tx("Annual data growth")} value={growth} min={0} max={60} onChange={change(setGrowth)} format={(v) => `${v}%`} />
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{tx("Currency")}</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-9 rounded-lg border border-line/15 bg-background px-3 text-sm" data-testid="calc-currency">
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </label>
        </div>
        <div className="lg:col-span-7">
          <div className="grid grid-cols-2 gap-3">
            {tiles.map(({ Icon, label, value, testId }) => (
              <motion.div key={label} layout className="rounded-2xl border border-line/10 bg-muted/60 p-4">
                <p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-teal" />{label}</p>
                <motion.p key={value} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-1 font-display text-2xl font-medium tracking-tight tabular-nums" data-testid={testId}>{value}</motion.p>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: 8 }} barGap={6}>
                <CartesianGrid vertical={false} stroke="rgba(13,25,45,0.07)" />
                <XAxis dataKey="name" tick={{ fill: "#3D6288", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => money(v, currency, locale)} width={84} tick={{ fill: "#3D6288", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} cursor={{ fill: "rgba(13,25,45,0.04)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="before" name={tx("Today")} fill="rgba(61,98,136,0.3)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="after" name={tx("With {{name}}", { name: product.name })} fill="#EE2424" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setShowA((v) => !v)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"><Info className="h-3.5 w-3.5" />{tx("Assumptions")}</button>
            <Button size="sm" onClick={() => { engaged("assessment"); prefillLead(summary); }} data-testid="calc-assessment">{tx("Get a validated assessment")} <ArrowRight /></Button>
          </div>
          {showA && (
            <p className="mt-3 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
              {tx("Indicative industry averages, not a quote: primary storage {{p}}/TB/yr including backup and DR copies; governed archive {{a}}/TB/yr; {{app}}/yr to run each legacy application; one-off {{ret}} per retired app and {{mv}} per TB archived. Your assessment replaces these with your own numbers.", {
                p: fmt(A.primaryPerTB), a: fmt(A.archivePerTB), app: fmt(A.appRunCost), ret: fmt(A.retireOneOff), mv: fmt(A.archiveOneOff),
              })}
            </p>
          )}
        </div>
      </div>
    </ExplorerShell>
  );
}

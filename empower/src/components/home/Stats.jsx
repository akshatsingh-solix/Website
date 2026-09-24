import { AGENDA, SPEAKERS } from "@/data/program";
import { HISTORY } from "@/data/event";
import { Reveal } from "../ui";

const sessions = AGENDA.flatMap((d) => d.sessions).filter((s) => !/Break|Lunch|Networking|Dinner/.test(s.type)).length;
const STATS = [
  ["3", "days on the UC San Diego campus"],
  [`${SPEAKERS.length}+`, "speakers from industry, academia and Solix"],
  [`${sessions}`, "keynotes, panels and workshops"],
  [`${HISTORY.length + 1}th`, "edition since 2016"],
];

export default function Stats() {
  return (
    <section className="border-b border-line/10 bg-background">
      <div className="container grid grid-cols-2 divide-line/10 md:grid-cols-4 md:divide-x">
        {STATS.map(([n, l], i) => (
          <Reveal key={l} delay={i * 0.06} className="px-2 py-9 md:px-8">
            <p className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{n}</p>
            <p className="mt-2 text-sm text-muted-foreground">{l}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

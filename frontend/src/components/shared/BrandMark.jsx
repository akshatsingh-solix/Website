import { siGooglecloud, siSap, siSnowflake, siDatabricks, siAccenture, siTcs, siWipro, siInfosys } from "simple-icons";

// Real, permissively-licensed brand marks (simple-icons) for partners that have
// one available. Simple Icons deliberately excludes several major enterprise
// brands (AWS, Azure, Oracle, Salesforce, Workday, ServiceNow, OpenAI,
// Deloitte, Capgemini) over trademark-license terms — those fall back to a
// clean typographic wordmark instead of a fabricated logo.
const ICONS = {
  "Google Cloud": siGooglecloud,
  SAP: siSap,
  Snowflake: siSnowflake,
  Databricks: siDatabricks,
  Accenture: siAccenture,
  TCS: siTcs,
  Wipro: siWipro,
  Infosys: siInfosys,
};

export const BrandMark = ({ name, className = "" }) => {
  const icon = ICONS[name];

  return (
    <div
      className={`group flex h-20 items-center justify-center rounded-xl border border-white/10 bg-ink-950/60 px-5 transition-colors duration-300 hover:border-white/25 ${className}`}
      style={icon ? { "--brand": `#${icon.hex}` } : undefined}
      title={icon ? icon.title : name}
    >
      {icon ? (
        <span
          className="h-7 w-full text-muted-foreground transition-colors duration-300 [&_svg]:mx-auto [&_svg]:h-7 [&_svg]:w-auto [&_svg]:fill-current group-hover:[&_svg]:fill-[var(--brand)]"
          dangerouslySetInnerHTML={{ __html: icon.svg }}
        />
      ) : (
        <span className="font-display text-sm font-semibold tracking-tight text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
          {name}
        </span>
      )}
    </div>
  );
};

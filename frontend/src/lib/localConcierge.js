// Built-in concierge: answers from the site's own content when the AI
// backend isn't available (no model configured, or the API is unreachable).
// It costs nothing to run and needs no keys. Replies are written in the
// visitor's language through the same translation catalog as the rest of
// the site, and demo requests go to the regular submissions endpoint.
import { SOURCE } from "@/data/site";
import { localizeData } from "@/i18n/localize";
import { translateText } from "@/i18n/tx";
import { submitLead } from "@/lib/api";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalize = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9@.+\-/\s]/g, " ").replace(/\s+/g, " ").trim();

// A keyword matches as a word prefix ("archiv" matches "archiving",
// "archivado", "archivage"); multi-word keywords match as phrases.
// Short keywords (sap, ecs, hi) must match a whole word.
const hit = (text, kw) => {
  const k = kw.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${k}${kw.trim().length <= 3 ? "($|[^a-z0-9])" : ""}`).test(text);
};
const score = (text, kws) => kws.reduce((n, kw) => (hit(text, kw) ? n + kw.length : n), 0);

// Extra ways people ask for each product, in en/es/fr/de. Product names are
// matched automatically.
// no-i18n: matching keywords, not display copy.
const PRODUCT_KEYWORDS = {
  "enterprise-edition": ["enterprise edition", "edicion enterprise"],
  "common-data-platform": ["common data platform", "cdp", "data platform", "plataforma de datos", "plateforme de donnees", "datenplattform"],
  "enterprise-archiving": ["archiv", "inactive data", "datos inactivos", "donnees inactives", "inaktive daten"],
  "enterprise-data-lake": ["data lake", "lago de datos", "lac de donnees", "datalake"],
  "application-retirement": ["retire", "retiring", "retirement", "decommission", "sunset", "legacy app", "retirar", "retirada", "desmantel", "decommissionn", "stilleg", "abschalt"],
  ediscovery: ["ediscovery", "e-discovery", "legal hold", "litigation", "litigio", "litige", "rechtsstreit"],
  "consumer-data-privacy": ["privacy", "gdpr", "ccpa", "dsar", "personal data", "privacidad", "datos personales", "rgpd", "confidentialite", "donnees personnelles", "datenschutz", "dsgvo", "personenbezogen"],
  "enterprise-ai": ["enterprise ai", "rag", "copilot", "genai", "generative ai", "ia generativa", "ia generative", "generative ki"],
  "data-sense": ["data sense", "classif", "discover"],
  "data-ask": ["data ask", "natural language", "ask questions", "lenguaje natural", "langage naturel", "naturliche sprache"],
  "application-knowledge-graph": ["knowledge graph", "grafo", "graphe", "wissensgraph"],
  "ai-warehouse": ["ai warehouse", "vector", "embedding"],
  agentic: ["agentic", "agent", "agente", "agenten"],
  "ai-governance": ["ai governance", "model governance", "gobernanza de ia", "gouvernance de l ia", "ki-governance"],
  "ai-healthcare": ["ai healthcare", "clinical ai", "claims"],
  "data-preservation": ["preservation", "preserv", "immutable", "worm", "conserva", "bewahr"],
  "sap-archiving": ["sap", "ecc", "s/4hana", "s4hana", "hana"],
  "oracle-oebs-archiving": ["oracle", "oebs", "e-business suite", "ebs"],
  "mainframe-archiving": ["mainframe", "cobol", "db2", "vsam"],
  "email-archiving": ["email archiv", "e-mail archiv", "mail archiv", "mailbox", "exchange", "archivado de correo", "archivo de correo", "correo", "archivage des e-mails", "archivage e-mail", "archivage des courriels", "courriel", "e-mail-archiv", "postfach"],
  "file-archiving": ["file archiv", "file share", "cold files", "archivado de archivos", "archivos", "archivage de fichiers", "fichiers", "dateiarchiv", "dateien"],
  "database-archiving": ["database", "base de datos", "base de donnees", "datenbank"],
  "active-archiving-compliance": ["retention", "defensible deletion", "retencion", "conservation", "aufbewahrung"],
  "eai-pharma": ["pharma", "gxp", "21 cfr", "clinical trial", "farma", "pharmazeut"],
  "enterprise-data-governance": ["data governance", "governance", "lineage", "gobernanza", "gouvernance", "governance"],
  "enterprise-content-services": ["ecs", "content services", "documents", "documentos", "unstructured", "no estructurad", "non structur", "unstrukturiert", "dokument"],
};

// no-i18n: matching keywords, not display copy.
const INDUSTRY_KEYWORDS = {
  "financial-services": ["bank", "financ", "insurance broker", "asset manag", "fintech", "banco", "banque", "finanz", "sec 17a-4", "finra"],
  healthcare: ["health", "hospital", "patient", "ehr", "emr", "hipaa", "salud", "sanidad", "hospital", "sante", "hopital", "gesundheit", "krankenhaus"],
  manufacturing: ["manufactur", "factory", "plant", "fabrica", "manufactur", "fabricacion", "industrie", "usine", "fertigung", "produktion"],
  "public-sector": ["government", "public sector", "federal", "state agency", "foia", "gobierno", "sector publico", "gouvernement", "secteur public", "regierung", "offentlich", "behorde"],
  "pharma-biotech": ["biotech", "life science", "farmac", "pharmaceut", "biotec"],
  retail: ["retail", "cpg", "ecommerce", "e-commerce", "store", "pos ", "minorista", "comercio", "commerce de detail", "distribution", "einzelhandel", "handel"],
  energy: ["energy", "utilit", "power", "grid", "oil", "gas", "energia", "energie", "strom", "versorg"],
  telecom: ["telecom", "telco", "carrier", "cdr", "telecomunic", "telekommunik"],
  insurance: ["insur", "claims", "underwrit", "seguro", "asegur", "assur", "versicher"],
};

// no-i18n: matching keywords, not display copy.
const INTENTS = {
  greeting: ["hi", "hello", "hey", "good morning", "good afternoon", "hola", "buenos dias", "buenas", "bonjour", "salut", "bonsoir", "hallo", "guten tag", "moin", "servus"],
  thanks: ["thank", "thx", "cheers", "gracias", "merci", "danke"],
  bye: ["bye", "goodbye", "see you", "adios", "hasta luego", "au revoir", "tschuss", "auf wiedersehen"],
  demo: ["demo", "book", "schedule", "meeting", "talk to sales", "sales", "call me", "contact me", "demostracion", "reunion", "ventas", "rendez-vous", "reunion", "commercial", "vorfuhrung", "termin", "vertrieb", "gesprach"],
  pricing: ["price", "pricing", "cost of solix", "how much", "quote", "license", "licence", "precio", "cuanto cuesta", "cotizacion", "prix", "tarif", "combien", "devis", "preis", "kosten", "angebot", "lizenz"],
  trial: ["trial", "free", "sign up", "signup", "register", "create an account", "prueba", "gratis", "registr", "essai", "gratuit", "inscri", "testversion", "kostenlos", "registrier"],
  login: ["log in", "login", "sign in", "signin", "password", "iniciar sesion", "contrasena", "connexion", "se connecter", "mot de passe", "anmelden", "passwort"],
  contact: ["contact", "phone", "call", "email address", "address", "office", "headquarter", "where are you", "located", "contacto", "telefono", "direccion", "oficina", "telephone", "adresse", "bureau", "siege", "kontakt", "telefon", "buro", "standort", "sitz"],
  careers: ["career", "job", "hiring", "work at", "work for", "vacanc", "position", "empleo", "trabajo", "vacante", "carrera", "emploi", "carriere", "recrut", "poste", "stelle", "karriere", "job"],
  partners: ["partner", "reseller", "integrator", "alliance", "socio", "alianza", "partenaire", "revendeur", "partnerschaft"],
  press: ["press", "news", "announcement", "media", "prensa", "noticias", "presse", "actualite", "nachrichten", "pressemitteil"],
  company: ["about solix", "who are you", "what is solix", "what does solix do", "history", "founded", "company", "quienes son", "que es solix", "empresa", "qui etes", "qu est-ce que solix", "entreprise", "societe", "was ist solix", "unternehmen", "gegrundet"],
  cost: ["cut cost", "reduce cost", "save money", "infrastructure cost", "tco", "savings", "reducir costos", "ahorro", "reduire les couts", "economies", "kosten senken", "einsparung"],
  deployment: ["cloud", "on-prem", "on prem", "hybrid", "aws", "azure", "google cloud", "deploy", "solixcloud", "nube", "despliegue", "deploiement", "bereitstell"],
  security: ["security", "secure", "soc 2", "soc2", "compliance", "certif", "seguridad", "cumplimiento", "securite", "conformite", "sicherheit", "compliance"],
  languages: ["language", "spanish", "french", "german", "idioma", "langue", "sprache"],
  help: ["help", "what can you do", "options", "menu", "ayuda", "que puedes", "aide", "que pouvez", "hilfe", "was kannst"],
};
// no-i18n: matching keywords, not display copy.
const YES = ["yes", "y", "yep", "yeah", "sure", "ok", "okay", "go ahead", "please do", "confirm", "correct", "si", "claro", "vale", "de acuerdo", "correcto", "oui", "d accord", "bien sur", "confirme", "ja", "genau", "gerne", "richtig", "bestatig", "jawohl", "passt"];
// no-i18n: matching keywords, not display copy.
const NO = ["no", "nope", "cancel", "stop", "never mind", "nevermind", "not now", "cancelar", "ahora no", "non", "annuler", "pas maintenant", "nein", "abbrechen", "nicht jetzt"];

const isAnswer = (text, list) => list.some((w) => text === w || text.startsWith(`${w} `) || text.endsWith(` ${w}`) || text.includes(` ${w} `));

const bestMatch = (text, table) => {
  let best = null;
  let bestScore = 0;
  for (const [key, kws] of Object.entries(table)) {
    const s = score(text, kws);
    if (s > bestScore) {
      best = key;
      bestScore = s;
    }
  }
  return { key: best, score: bestScore };
};

const productKeywords = (p) => [normalize(p.name), ...(PRODUCT_KEYWORDS[p.slug] || [])];
// English name, the name in the visitor's language, and extra keywords.
const industryKeywords = (i, localName) => [normalize(i.name.split(" & ")[0]), normalize(localName.split(" & ")[0]), ...(INDUSTRY_KEYWORDS[i.slug] || [])];

/** Products a free-text question is about (used for intent tracking). */
export const detectTopics = (raw) => {
  const text = normalize(raw || "");
  const product = bestMatch(text, Object.fromEntries(SOURCE.PRODUCTS.map((p) => [p.slug, productKeywords(p)])));
  return product.score >= 3 ? [product.key] : [];
};

export const isPricingQuestion = (raw) => bestMatch(normalize(raw || ""), INTENTS).key === "pricing";

/**
 * One conversation per chat session. `reply(message, lng)` resolves to
 * { text, booking? } where booking carries a saved demo request.
 */
export const createLocalConcierge = () => {
  // Booking flow: null | { step: "name" | "email" | "company" | "confirm", name, email, company, interest }
  let booking = null;
  let lastProduct = null;
  // True right after Sol offered to book a demo, so a plain "yes" starts it.
  let offered = false;

  const reply = async (raw, lng) => {
    const result = await answer(raw, lng);
    const offers = ["Want me to set up a demo for you right here?", "Or send a message through the [contact page](/contact). Want me to book a demo instead?"];
    offered = !booking && offers.some((o) => result.text.includes(translateText(o, null, lng)));
    return result;
  };

  const answer = async (raw, lng) => {
    const tx = (s, vars) => translateText(s, vars, lng);
    const products = localizeData(SOURCE.PRODUCTS, lng);
    const industries = localizeData(SOURCE.INDUSTRIES, lng);
    const text = normalize(raw);
    const said = (list) => isAnswer(text, list);

    const startBooking = (intro) => {
      booking = { step: "name", interest: lastProduct?.name };
      return { text: `${intro ? `${intro}\n\n` : ""}${tx("I can set up a demo right here. What's your **full name**?")}` };
    };

    // --- Demo booking flow --------------------------------------------------
    if (booking) {
      if (said(NO) && booking.step !== "email") {
        booking = null;
        return { text: tx("No problem, I've cancelled that. What else can I help you with?") };
      }
      if (booking.step === "name") {
        const name = raw.trim().replace(/^(my name is|i am|i'm|me llamo|soy|je m'appelle|je suis|ich bin|ich heisse|ich heiße|mein name ist)\s+/i, "");
        if (name.length < 2 || name.length > 80) return { text: tx("Could you tell me your full name?") };
        booking = { ...booking, name, step: "email" };
        return { text: tx("Thanks, {{name}}. What's your **work email**?", { name: name.split(" ")[0] }) };
      }
      if (booking.step === "email") {
        const email = (raw.match(/[^\s@]+@[^\s@]+\.[^\s@]+/) || [""])[0].replace(/[.,;]+$/, "");
        if (!EMAIL_RX.test(email)) return { text: tx("That doesn't look like an email address. Could you check it?") };
        booking = { ...booking, email, step: "company" };
        return { text: tx("And which **company** are you with?") };
      }
      if (booking.step === "company") {
        const company = raw.trim();
        if (company.length < 2 || company.length > 120) return { text: tx("Which company are you with?") };
        booking = { ...booking, company, step: "confirm" };
        return {
          text: `${tx("Here's what I'll send to the Solix team:")}\n- **${tx("Name")}:** ${booking.name}\n- **${tx("Email")}:** ${booking.email}\n- **${tx("Company")}:** ${company}${booking.interest ? `\n- **${tx("Interest")}:** ${booking.interest}` : ""}\n\n${tx("Shall I send this over?")}`,
        };
      }
      if (booking.step === "confirm") {
        if (!said(YES)) return { text: tx("Just reply **yes** to send it, or **no** to cancel.") };
        const { name, email, company, interest } = booking;
        try {
          await submitLead({ type: "demo", name, email, company, interest: interest || null, message: "Requested through the Sol concierge on the website.", source_page: "chat:sol" });
        } catch {
          return { text: tx("I couldn't send that just now. Please try again in a moment, or use the [contact form](/contact).") };
        }
        booking = null;
        return {
          text: tx("Done! Thanks, {{name}}. A Solix expert will reach out within one business day. Anything else I can help with meanwhile?", { name: name.split(" ")[0] }),
          booking: { name, email, company },
        };
      }
    }

    if (offered && said(YES)) return startBooking();
    if (offered && said(NO)) return { text: tx("No problem. What else would you like to know?") };

    // --- Intents ------------------------------------------------------------
    const intent = bestMatch(text, INTENTS);
    const product = bestMatch(text, Object.fromEntries(SOURCE.PRODUCTS.map((p) => [p.slug, productKeywords(p)])));
    const industry = bestMatch(text, Object.fromEntries(SOURCE.INDUSTRIES.map((i, n) => [i.slug, industryKeywords(i, industries[n].name)])));

    if (intent.key === "demo" && product.score < 6) return startBooking();
    if (intent.key === "pricing") {
      return startBooking(tx("Solix pricing depends on your data volumes, systems and deployment model, so it isn't published. A solutions architect can put together a quote for you."));
    }

    // Specific questions the site answers directly.
    if (intent.key === "cost" || (hit(text, "archiv") && (hit(text, "cost") || hit(text, "costo") || hit(text, "cout") || hit(text, "kosten")))) {
      lastProduct = products.find((p) => p.slug === "enterprise-archiving");
      return {
        text: `${tx("Archiving moves inactive data out of expensive production systems into a low-cost, compliant archive, while keeping it searchable.")}\n- ${tx("Smaller production databases mean less storage, compute and licensing")}\n- ${tx("Legacy applications can be retired entirely once their data is archived")}\n- ${tx("Faster backups, upgrades and month-end runs")}\n\n${tx("Customers typically see **up to 80% lower infrastructure cost**.")} ${tx("More on [Enterprise Archiving](/products/enterprise-archiving).")}\n\n${tx("Want me to set up a demo for you right here?")}`,
      };
    }
    if (hit(text, "sap") && (product.key === "application-retirement" || hit(text, "ecc") || hit(text, "retire"))) {
      lastProduct = products.find((p) => p.slug === "sap-archiving");
      return {
        text: `${tx("Yes. Solix can retire SAP ECC and keep every record accessible and compliant:")}\n- ${tx("Archive-first: move inactive history out before an S/4HANA move, so you migrate far less")}\n- ${tx("Retire the old system and keep the data searchable, with its business context, for audits and reporting")}\n- ${tx("Retention and legal hold continue to apply after the system is switched off")}\n\n${tx("See [SAP Archiving](/products/sap-archiving) and [Application Retirement](/products/application-retirement).")} ${tx("Want me to set up a demo for you right here?")}`,
      };
    }

    // Product and industry questions.
    if (product.score >= 3 && product.score >= industry.score) {
      const p = products.find((x) => x.slug === product.key);
      lastProduct = p;
      if (intent.key === "demo") return startBooking();
      const features = (p.features || []).slice(0, 3).map((f) => `- **${f.title}:** ${f.desc}`).join("\n");
      return {
        text: `**${p.name}**: ${p.tagline}\n\n${p.description}${features ? `\n\n${features}` : ""}\n\n${tx("Learn more on the [{{name}} page](/products/{{slug}}).", { name: p.name, slug: p.slug })} ${tx("Want me to set up a demo for you right here?")}`,
      };
    }
    if (industry.score >= 3) {
      const i = industries.find((x) => x.slug === industry.key);
      const results = (i.results || []).slice(0, 3).map((r) => `- ${r}`).join("\n");
      return {
        text: `**${i.name}**: ${i.headline}\n\n${i.desc}${results ? `\n\n${tx("What customers achieve:")}\n${results}` : ""}\n\n${tx("More on the [{{name}} page](/industries/{{slug}}).", { name: i.name, slug: i.slug })} ${tx("Want me to set up a demo for you right here?")}`,
      };
    }

    switch (intent.key) {
      case "greeting":
        return { text: tx("Hi! I'm Sol. Ask me about Solix products, industries, the free Solix ECS trial, or I can book a demo for you.") };
      case "thanks":
        return { text: tx("You're welcome! Anything else I can help with?") };
      case "bye":
        return { text: tx("Thanks for stopping by. You can reopen this chat any time.") };
      case "trial":
        return { text: `${tx("You can start a **30-day free trial of Solix ECS**, no credit card required. It turns contracts, invoices, emails and reports into a knowledge base you can ask questions of.")}\n\n${tx("[Start your free trial](/signup) or [sign in](/signin) if you already have an account.")}` };
      case "login":
        return { text: tx("You can [sign in here](/signin). If you've forgotten your password, use **Forgot your password?** on the sign-in page and the Solix team will help you get back in.") };
      case "contact":
        return { text: `${tx("You can reach Solix here:")}\n- **${tx("Phone")}:** 1.888.GO.SOLIX (1-888-467-6549)\n- **${tx("Headquarters")}:** 4701 Patrick Henry Drive, Bldg 20, Santa Clara, CA 95054, USA\n- **${tx("Offices")}:** ${tx("Santa Clara, Hyderabad, London and Singapore")}\n\n${tx("Or send a message through the [contact page](/contact). Want me to book a demo instead?")}` };
      case "careers":
        return { text: tx("Solix is hiring across engineering, AI, product, services and sales. See all open roles on the [careers page](/careers).") };
      case "partners":
        return { text: tx("Solix works with hyperscalers, platform vendors, system integrators and resellers. See the programme and apply on the [partners page](/partners).") };
      case "press":
        return { text: tx("Press releases, coverage and the media kit are in the [newsroom](/newsroom). For media inquiries, email press@solix.com.") };
      case "deployment":
        return { text: `${tx("Solix runs wherever you need it, with the same controls everywhere:")}\n- **SOLIXCloud**: ${tx("fully managed by Solix on AWS, Microsoft Azure, Google Cloud or Oracle Cloud")}\n- ${tx("**Your cloud, on-premises or hybrid**, on the same Common Data Platform")}\n\n${tx("More on the [platform page](/platform).")}` };
      case "security":
        return { text: `${tx("Governance is built into the platform, not bolted on:")}\n- ${tx("Policy-driven access, masking, retention and legal hold")}\n- ${tx("A full audit trail for every access, query and model call")}\n- ${tx("Compliance-ready for SOC 2, HIPAA and GDPR")}\n\n${tx("More on the [platform page](/platform).")}` };
      case "languages":
        return { text: tx("I can chat in English, Spanish, French and German. Switch the language at the top of the page and I'll follow.") };
      case "company":
        return { text: `${tx("Solix Technologies has managed enterprise data since 2002. It's headquartered in Santa Clara, California, with engineering in Hyderabad and teams across EMEA and APAC.")}\n\n${tx("Its Common Data Platform powers archiving, application retirement, privacy, governance and governed Enterprise AI for some of the most regulated organizations in the world.")} ${tx("More on the [company page](/company).")}` };
      case "demo":
        return startBooking();
      default:
        break;
    }

    if (intent.key === "help" || text.split(" ").length <= 2) {
      return { text: `${tx("Here's what I can help with:")}\n- ${tx("Products such as Enterprise Archiving, Application Retirement and Enterprise AI")}\n- ${tx("How Solix works in your industry")}\n- ${tx("The free Solix ECS trial")}\n- ${tx("Booking a demo with a Solix expert")}\n\n${tx("What would you like to know?")}` };
    }
    return {
      text: `${tx("I don't have a specific answer to that. Browse [all products](/products) or [solutions](/solutions), or a Solix expert can answer it directly.")}\n\n${tx("Want me to set up a demo for you right here?")}`,
    };
  };

  return { reply, reset: () => { booking = null; lastProduct = null; } };
};

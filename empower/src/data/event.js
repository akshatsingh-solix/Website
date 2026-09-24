// SOLIXEmpower 2026: everything the site says about the event.
// To run a future edition, copy this file's values (and program.js) and
// point EVENT.slug at the new backend event; the pages are data-driven.

const IMG = "https://empower.solix.com/wp-content/themes/vantage/images";

export const EVENT = {
  slug: "empower-2026",
  name: "SOLIXEmpower 2026",
  edition: "San Diego",
  theme: "The Agentic Enterprise",
  subtitle: "Reimagining Enterprise Applications with Enterprise AI",
  presenter: "Solix Technologies, Inc. presents",
  collaboration: "In collaboration with the Halıcıoğlu School of Data Science and Computing",
  hosts: "Hosted in partnership with the UC San Diego School of Computing, Information and Data Science, the SPARK AI Consortium and the Halıcıoğlu Data Science Institute.",
  dates: "October 28-30, 2026",
  shortDates: "Oct 28-30, 2026",
  start: "2026-10-28T07:30:00-07:00",
  end: "2026-10-30T13:30:00-07:00",
  timezone: "America/Los_Angeles",
  venue: "The Qualcomm Institute",
  venueLong: "The Qualcomm Institute, Atkinson Hall, University of California San Diego",
  address: "3195 Voigt Drive, La Jolla, CA 92093",
  city: "San Diego, California",
  heroImage: `${IMG}/banner-inner-event-san-diego-new.jpg`,
  // Keynote-stage visual generated with OpenArt in the Solix palette. Served
  // by the main site (frontend/scripts/vendor-media.js), then the OpenArt
  // CDN, then the original venue banner.
  heroImages: [
    `${import.meta.env.VITE_MAIN_SITE_URL || "/Website/"}media/openart/empower-stage.webp`,
    "https://cdn.openart.ai/watermarked_images/J38Yrkmv56lc0MkH6wrJ/thumbnail_09cbb65b_1790235816962.webp",
    `${IMG}/banner-inner-event-san-diego-new.jpg`,
  ],
  shareImage: "https://empower.solix.com/wp-content/uploads/2026/04/solixempower-2026-popup-new2.jpg",
  email: "info@solixempower.com",
  phone: "+1.888-GO-SOLIX (+1.888.467.6549)",
  hashtag: "#solixempower",
};

// The pass as sold on the live site. The backend (Admin > Events) is the source
// of truth; this is only the fallback while the API wakes up.
export const PASS = {
  id: "full-pass",
  name: "Full Event Pass",
  price: 29900, // cents
  currency: "USD",
  provider: "eventbrite",
  eventbriteEventId: "1994300379119",
  salesEnd: "2026-10-28T23:59:00-07:00",
  salesEndLabel: "Oct 28, 2026",
  refundPolicy: "Refunds up to 7 days before the event. Eventbrite's fee is non-refundable.",
};

export const LINKS = {
  mainSite: import.meta.env.VITE_MAIN_SITE_URL || "/Website/",
  justificationLetter: "https://empower.solix.com/documents/SOLIXEmpower2026-Trip-Justification-Letter.docx",
  maps: "https://maps.app.goo.gl/iEb7R8S2xUwdmSKi6",
  mapEmbed: "https://www.google.com/maps?q=Qualcomm+Institute,+3195+Voigt+Dr,+La+Jolla,+CA+92093&output=embed",
  parking: "https://transportation.ucsd.edu/visit/parking.html",
  playlist: "https://www.youtube.com/playlist?list=PLdWXnBGhzmf41k03I6GJH3VjrOpIKqlZb",
  hackathon: "https://empower.solix.com/hackathon/",
  recorded2025: "https://empower.solix.com/2025-san-diego/live/#main-conference",
  facebook: "https://www.facebook.com/SolixEMPOWER/",
  linkedin: "https://www.linkedin.com/groups/13510374",
  twitter: "https://twitter.com/solixempower",
  youtube: "https://www.youtube.com/playlist?list=PLdWXnBGhzmf41k03I6GJH3VjrOpIKqlZb",
  salesContact: "https://www.solix.com/company/contact-us/sales-contact/",
};

// Why attend: the page's own takeaways, grouped.
export const WHY = [
  { icon: "Sparkles", title: "Enterprise AI, hands-on", text: "Keynotes and workshops on putting AI in the hands of your business: Data Sense, Data Ask and agents built on trusted enterprise data." },
  { icon: "ShieldCheck", title: "Enterprise Data Governance", text: "How to meet data and AI governance objectives as agents move into production, from secure semantic layers to agent regulation." },
  { icon: "Network", title: "Application Knowledge Graph", text: "Automate data access with the AKG, and build your first one live in a guided workshop." },
  { icon: "Users", title: "Leaders, academics and users", text: "Network with CIOs, CDOs, researchers from UC San Diego and fellow Solix users across three days and two evening receptions." },
  { icon: "Megaphone", title: "Product announcements", text: "Be first to hear what's new across the Solix Common Data Platform, Enterprise AI and EAI Pharma, and meet Solix Academy." },
  { icon: "Sun", title: "San Diego in October", text: "Three days on the UC San Diego campus in La Jolla, with a tour of the San Diego Supercomputer Center." },
];

export const INCLUDED = [
  "All three days, October 28-30",
  "Keynotes, panels and hands-on workshops",
  "Hackathon finals and winner announcements",
  "Networking breakfasts, lunches and breaks",
  "Solix User Group cocktails & dinner (Oct 28)",
  "Dinner & Supercomputer Center tour (Oct 29)",
];

// Past editions, newest first.
export const HISTORY = [
  {
    year: 2025, when: "October 22-24, 2025", where: "Qualcomm Institute, UC San Diego",
    theme: "Your Data. Your AI. Your Insights: Empowering Your Data With AI",
    topics: ["Agentic AI Ops", "Fourth-generation data platforms", "AI in healthcare & life sciences", "AI-driven enterprise archiving", "AI governance", "Autonomous AI finance"],
    speakers: ["Prof. Frank Wuerthwein, San Diego Supercomputer Center", "James Massa, JPMorganChase", "Dr. James Short, SPARK AI Consortium", "Divya Joshi, Thoughtworks", "Merv Lally, CIO, HealthEquity", "Prof. David Danks, UC San Diego"],
    quote: { text: "By becoming an AI-ready enterprise, organizations are positioned to power through the inflection and achieve new levels of competitiveness with enterprise AI.", by: "Dr. James Short", role: "Lead Scientist and Director, SPARK AI Consortium, UC San Diego", image: `${IMG}/james-short.jpg` },
    recording: LINKS.recorded2025,
  },
  {
    year: 2024, when: "November 13-14, 2024", where: "Qualcomm Auditorium, UC San Diego",
    topics: ["The data science foundation", "Enterprise intelligence", "Data strategy for AI", "AI-powered healthcare", "AI governance", "AI safety & security"],
    speakers: ["Dr. Frank Wuerthwein, SDSC", "Dr. Rajesh Gupta, UC San Diego", "Dr. James Short, SPARK AI Consortium", "James Massa, JPMorganChase", "Michelle Hardwick, CDO, UC Riverside", "Vinay Vijay Singh, CFO & Chief AI Officer, HUD"],
    quote: { text: "Collaboration between academia and industry leads to more robust, practical, and ethically sound advancements in data management and AI.", by: "Dr. Rajesh Gupta", role: "Dean, UC San Diego School of Computing, Information and Data Science", image: `${IMG}/rajesh-gupta.jpg` },
  },
  {
    year: 2023, when: "October 12-14, 2023", where: "Denver, Colorado",
    topics: ["Enterprise AI", "AI-driven finance transformation", "Data fabric", "Enterprise archiving", "Data minimization"],
    speakers: ["Manuel Serapio, CU Denver", "Julie Tracy Lockwood, IBM", "Nadia Rosseels, CIO, DPI Specialty Foods", "Colin Cecil, Merck", "Phil Neff, JB Hunt", "Vivek Kumar, Alberta Health Services"],
    quote: { text: "The meeting's timely and important theme of Information Architecture for AI aligns well with our institute's focus on digital globalization.", by: "Manuel G. Serapio", role: "Faculty Director, Institute for International Business, CU Denver", image: `${IMG}/manuel-serapio.jpg` },
  },
  {
    year: 2019, when: "May 6, 2019", where: "Orlando, Florida",
    topics: ["Information architecture for the data-driven enterprise", "AI-powered digital assistants for SAP finance", "Enterprise data management for SAP"],
    speakers: ["Jeff Spar, former CIO, The Met", "Marc Parmet, Scientific Games", "Mike McGibbney, SAP SuccessFactors", "Sebastian Gueler, NTT Data", "Lakisha Hall, IBM", "Rasesh Shah, JPMorgan Chase"],
    quote: { text: "As a Solix customer I have participated in every Solix EMPOWER event so far, and it has been a wonderful program to educate, network and inspire others.", by: "Marc Parmet", role: "Senior Director, ERP & PMO, Scientific Games", image: `${IMG}/marc-parmet.jpeg` },
  },
  {
    year: 2018, when: "November 1, 2018", where: "Metropolitan Pavilion, New York",
    topics: ["Enterprise data architecture", "Data-driven banking & financial services", "Data-driven healthcare", "Cloud for next-gen data infrastructure", "AI/ML/DL for enterprises"],
    speakers: ["Judy Sarles, Kaiser Permanente", "Janine Grasso, IBM", "Mark Harding, Minds", "Garth Landers, Mimecast", "Paul Maher, Microsoft", "John Zhong, Citigroup"],
    quote: { text: "If you work with data, I highly recommend attending Solix EMPOWER both as a networking and educational experience.", by: "Neeraj Chawla", role: "Associate Managing Director, Accenture" },
  },
  {
    year: 2017, when: "April 28, 2017", where: "Park Plaza, Bangalore",
    topics: ["Data archiving and management", "Cloud data management", "GDPR & data privacy", "Application retirement", "Machine learning and AI"],
    speakers: ["Solomon Darwin, UC Berkeley-Haas", "Giri Chodavarapu, Finisar", "Kamal Brar, Hortonworks", "Krishnadas Unni, IBM", "T.G. Dhandapani, former CIO, TVS Motor"],
    quote: { text: "Solix EMPOWER Bangalore 2017 was a great event, bringing together many experts in big data to discuss the latest developments and industry innovations.", by: "Kamal Brar", role: "VP & GM APAC, Hortonworks", image: `${IMG}/Kamal-Brar.jpg` },
  },
  {
    year: 2016, where: "New York",
    topics: ["Empowering the data-driven enterprise", "Data-driven banking", "Taming data growth", "Data lakes", "Data-driven healthcare"],
    speakers: ["Eli Collins, Cloudera", "Tony Vaden, CIO, ABC Supply", "Michael Simone, Citigroup", "Sadagopan S, HCL", "P.K. Agarwal, Northeastern University", "Anuradha Basu, San Jose State University"],
    quote: { text: "Our goal with Solix EMPOWER is to provide valuable insight on the latest technologies, while giving attendees an opportunity to network with fellow industry leaders and experts.", by: "Sai Gundavelli", role: "Founder & CEO, Solix Technologies", image: `${IMG}/sai-gundavelli.jpg` },
  },
];

const LOGO = `${IMG}/customer-logos`;
export const PARTICIPANTS = [
  ["AIG", "aig.jpg"], ["American Financing", "american-financing.jpg"], ["CDW", "cdw.jpg"], ["Carnegie Mellon", "cmu.jpg"], ["eMed", "emed.jpg"],
  ["FIS", "fis-global.jpg"], ["Great American Insurance Group", "great-american-insurance-group.jpg"], ["J.B. Hunt", "jb-hunt.jpg"], ["Minds", "minds.jpg"],
  ["Sanofi", "sanofi.jpg"], ["Schneider", "schneider.jpg"], ["Spectrum", "spectrum.jpg"], ["Sunrun", "sunrun.jpg"], ["Emagia", "emagia.jpg"],
  ["Alberta Health Services", "albertahealthservices.jpg"],
].map(([name, file]) => ({ name, src: `${LOGO}/${file}` }));

export const PARTNERS = [
  ["UC San Diego", "uc-san-diego.jpg"], ["IBM", "ibm.jpg"], ["Microsoft", "microsoft.jpg"], ["Wipro", "wipro.jpg"], ["NTT Data", "nttdata.jpg"],
  ["Tech Mahindra", "tech-mahindra-new.jpg"], ["Cognizant", "cognizant.jpg"], ["LTI", "lti-logo.jpg"], ["InnoMinds", "innominds.jpg"], ["UC Davis", "ucdavis.jpg"],
  ["Berkeley Haas", "bhaas.jpg"], ["Northeastern University SV", "nusv.jpg"], ["CU Denver IIB", "iib-ucd.jpg"], ["TiE Bangalore", "tie-bangalore.jpg"],
  ["TiE Colorado", "tie-colorado.jpg"], ["insideBIGDATA", "insidebigdata.jpg"], ["KDnuggets", "kdnuggets.jpg"], ["Datafloq", "datafloq.jpg"],
  ["DAA", "daa.jpg"], ["BUOC", "buoc.jpg"], ["RePodcast", "repodcast.jpg"],
].map(([name, file]) => ({ name, src: `${LOGO}/${file}` }));

export const CUSTOMERS = [
  ["Santander", "santander.png"], ["BAE Systems", "bae-systems.png"], ["Molson Coors", "molson-coors.png"], ["SONIFI", "sonifi.png"], ["Unilever", "unilever.png"],
  ["SABIC", "sabic.png"], ["AIG", "aig.png"], ["HCSC", "hcsc.png"], ["Citigroup", "citigroup.png"], ["Alberta Health Services", "alberta-health-services.png"],
  ["Optum", "optum.png"], ["GE Appliances", "ge-appliances.png"], ["Juniper Networks", "juniper-networks.png"],
].map(([name, file]) => ({ name, src: `${LOGO}/${file}` }));

export const FAQ = [
  { q: "How much is a pass?", a: "The Full Event Pass is $299 and covers all three days. Payment is taken securely by Eventbrite, which accepts major cards. Pass sales end October 28, 2026, and seats are limited." },
  { q: "What does the pass include?", a: "All three days (October 28-30): keynotes, panel discussions, hands-on workshops, the hackathon finals, networking breakfasts and lunches, and the evening receptions on October 28 and 29." },
  { q: "What is the refund policy?", a: "Refunds are available up to 7 days before the event. Eventbrite's fee is non-refundable." },
  { q: "Can I register colleagues?", a: "Yes. Each attendee needs their own pass, so each person registers with their own details. Share the event with your team from your confirmation page." },
  { q: "Do you have promo codes?", a: "If you've received a promo code from Solix, enter it when you register. It is applied in the Eventbrite checkout." },
  { q: "Where is the event, and where do I park?", a: "The Qualcomm Institute, Atkinson Hall, on the UC San Diego campus at the corner of Voigt Drive and Equality Lane (3195 Voigt Drive, La Jolla, CA 92093). Visitor parking is in UC San Diego's Hopkins Parking Structure." },
  { q: "How do I convince my manager?", a: "Download the trip justification letter, fill in your details and share it with your supervisor. It outlines what you'll bring back to your team." },
  { q: "Can I attend only one day?", a: "Yes. Choose the days you plan to attend when you register so we can plan seating and meals." },
  { q: "Will sessions be recorded?", a: "Past editions have been recorded and published on the SOLIXEmpower YouTube playlist. The agenda is subject to change." },
  { q: "Who do I contact with questions?", a: "Email info@solixempower.com or call +1.888-GO-SOLIX." },
];

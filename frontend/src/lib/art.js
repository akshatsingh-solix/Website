/**
 * The site's vector illustrations (public/images/art, drawn by
 * scripts/build-art.js). Resource cards and press releases pick one by type
 * when the content itself has no cover image.
 */
export const ART = "/Website/images/art/";

const RESOURCE_COVERS = ["datasheet", "whitepaper", "webinar", "podcast", "ebook", "casestudy", "leadership", "blog", "event", "brief", "collateral"];

/** Cover illustration for a resource type; unknown types get the white-paper stack. */
export const resourceCover = (type) => `${ART}cover-${RESOURCE_COVERS.includes(type) ? type : "whitepaper"}.svg`;

const PRESS_ART = { Product: "news-product", Customer: "news-customer", Partner: "news-partner", Event: "news-event", Company: "news-company" };

/** Illustration for a press-release category; used when a release has no image of its own. */
export const pressArt = (category) => `${ART}${PRESS_ART[category] || "news-company"}.svg`;

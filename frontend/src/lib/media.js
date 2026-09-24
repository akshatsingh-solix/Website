import MEDIA from "@/data/openart-media.json";

const LOCAL = `${process.env.PUBLIC_URL || "/Website"}/media/openart/`;

// The site's own photos each have a smaller WebP copy beside the JPEG.
const webpOf = (src) => (src && /\/images\/[^/]+\.jpg$/.test(src) ? src.replace(/\.jpg$/, ".webp") : null);

/**
 * Where to load an OpenArt visual from, best first: the copy vendored into
 * this site (scripts/vendor-media.js), the OpenArt CDN, then the photo it
 * replaced. <MediaImage> walks the list on load errors.
 */
export const mediaSources = (key) => {
  const a = MEDIA.assets[key];
  if (!a) return [];
  // Watermarked free-plan previews are never shown; the older photo stands in.
  if (a.watermarked) return [webpOf(a.fallback), a.fallback].filter(Boolean);
  return [LOCAL + a.file, a.url, webpOf(a.fallback), a.fallback].filter(Boolean);
};

/** Optional looping clip for a visual (null until one is added to the manifest). */
export const mediaVideo = (key) => {
  const v = MEDIA.assets[key]?.video;
  if (!v) return null;
  return /^https?:/.test(v) ? v : LOCAL + v;
};

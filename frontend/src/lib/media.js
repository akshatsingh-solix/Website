import MEDIA from "@/data/openart-media.json";

const LOCAL = `${process.env.PUBLIC_URL || "/Website"}/media/openart/`;

/**
 * Where to load an OpenArt visual from, best first: the copy vendored into
 * this site (scripts/vendor-media.js), the OpenArt CDN, then the photo it
 * replaced. <MediaImage> walks the list on load errors.
 */
export const mediaSources = (key) => {
  const a = MEDIA.assets[key];
  if (!a) return [];
  // Watermarked free-plan previews are never shown; the older photo stands in.
  if (a.watermarked) return [a.fallback].filter(Boolean);
  return [LOCAL + a.file, a.url, a.fallback].filter(Boolean);
};

/** Optional looping clip for a visual (null until one is added to the manifest). */
export const mediaVideo = (key) => {
  const v = MEDIA.assets[key]?.video;
  if (!v) return null;
  return /^https?:/.test(v) ? v : LOCAL + v;
};

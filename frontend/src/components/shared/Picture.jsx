/**
 * <img> for the site's own photos (/Website/images/*.jpg). Browsers that
 * support WebP get a WebP copy (about 40% smaller), and phones get a 720px
 * one. Anything else (uploads, external URLs) renders as a plain <img>.
 * Every image in public/images has <name>.webp and <name>-720.webp siblings.
 */
const LOCAL = /^(.*\/images\/[^/]+)\.jpg$/;

// Rendered key visuals (scripts/art) also ship a full-size WebP.
const FULL_WIDTH = { "key-core": 2560, "key-slabs": 1600, "key-bolt": 2000, "key-lattice": 2000 };

export const webpSrcSet = (src) => {
  const m = typeof src === "string" && src.match(LOCAL);
  if (!m) return null;
  const full = FULL_WIDTH[m[1].split("/").pop()];
  return `${m[1]}-720.webp 720w, ${m[1]}.webp 1264w${full ? `, ${m[1]}-full.webp ${full}w` : ""}`;
};

export const Picture = ({ src, alt = "", sizes = "100vw", loading = "lazy", ...rest }) => {
  const srcSet = webpSrcSet(src);
  const img = <img src={src} alt={alt} loading={loading} decoding="async" {...rest} />;
  if (!srcSet) return img;
  return (
    <picture style={{ display: "contents" }}>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      {img}
    </picture>
  );
};

export default Picture;

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * An <img> with ordered fallbacks: on a load error it moves to the next
 * source, and after the last one shows a branded navy gradient rather than
 * a broken-image icon. Give it a `key` that changes with the sources.
 */
export const MediaImage = ({ sources, alt = "", className, ...rest }) => {
  const [i, setI] = useState(0);
  if (i >= sources.length) return <div aria-hidden className={cn("bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950", className)} />;
  return <img src={sources[i]} alt={alt} decoding="async" onError={() => setI((n) => n + 1)} className={className} {...rest} />;
};

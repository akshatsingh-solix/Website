import { Suspense, lazy, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";

const CommandPalette = lazy(() => import("./CommandPalette"));
const OPEN_EVENT = "solix:open-search";

export const openSearch = () => window.dispatchEvent(new Event(OPEN_EVENT));

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * Owns the command palette: Cmd/Ctrl + K toggles it anywhere, "/" opens it
 * when you are not typing, and openSearch() opens it from a button. The
 * palette's code loads on first use (or once the page is idle).
 */
export const SearchHost = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const show = () => { setMounted(true); setOpen(true); };
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMounted(true);
        setOpen((o) => !o);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_EVENT, show);
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(() => import("./CommandPalette"), { timeout: 8000 }) : null;
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_EVENT, show);
      if (idle && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
    };
  }, []);

  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </Suspense>
  );
};

/** The navbar's search trigger: a pill with the shortcut on wide screens, an icon on small ones. */
export const SearchButton = ({ className }) => {
  const tx = useTx();
  const [mac, setMac] = useState(true);
  useEffect(() => setMac(isMac()), []);
  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn("group inline-flex h-9 items-center gap-2 rounded-full border border-line/15 bg-background/40 px-2.5 text-sm text-muted-foreground backdrop-blur transition-[border-color,color,background-color] duration-200 hover:border-line/35 hover:text-foreground 2xl:px-3", className)}
      aria-label={tx("Search")}
      data-testid="nav-search"
    >
      <Search className="h-4 w-4" />
      <span className="hidden min-[1680px]:inline">{tx("Search")}</span>
      <kbd className="hidden whitespace-nowrap rounded border border-line/15 px-1.5 font-mono text-[10px] leading-5 text-muted-foreground group-hover:text-foreground 2xl:inline">{mac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
};

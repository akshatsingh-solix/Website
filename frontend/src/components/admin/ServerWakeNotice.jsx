import { Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useSlowNetwork } from "@/lib/net";

/**
 * A small status pill shown while an admin request is taking a while: the
 * server may be waking from sleep (up to a minute) or the connection may be
 * slow. Requests retry on their own, so there is nothing to click.
 */
export const ServerWakeNotice = () => {
  const slow = useSlowNetwork();
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine !== false);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online && !slow) return null;
  return (
    <div role="status" aria-live="polite" className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-line/15 bg-background/95 px-4 py-2 text-sm shadow-lg backdrop-blur" data-testid="server-wake-notice">
      {online ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" /> : <WifiOff className="h-4 w-4 shrink-0 text-primary" />}
      <span>{online ? "Connecting to the server. It can take up to a minute after a quiet period…" : "You're offline. We'll carry on when the connection is back."}</span>
    </div>
  );
};

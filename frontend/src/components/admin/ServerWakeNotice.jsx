import { Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useSlowNetwork } from "@/lib/net";

/**
 * A small status pill shown while an admin request is taking a while or waiting to retry: the server may be
 * waking from sleep or restarting (a deploy), or the connection may be slow. Requests, including sign-in and
 * changes, retry on their own for about 90 seconds without ever repeating an action, so there is nothing to click.
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
      <span>{online ? "Reconnecting to the MarkHub server (it may be waking up or restarting). This can take up to a minute; your action will go through…" : "You're offline. We'll carry on when the connection is back."}</span>
    </div>
  );
};

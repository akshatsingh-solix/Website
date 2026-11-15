import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";

/**
 * AnimatePresence for page swaps that can never strand a page mid-exit.
 *
 * In `mode="wait"` the next page only mounts once the leaving one reports its
 * exit finished. If that report never arrives (framer-motion 11 lost it when
 * a `layout`/`layoutId` element unmounted inside the leaving page, which left
 * the site frozen half-faded and the admin blank until a reload), the swap
 * would wait forever. Here, if the exit hasn't finished `timeout` ms after
 * the key changed, the presence is remounted: the current page renders at
 * once, fully visible, and `onExitComplete` still fires (the scroll reset
 * listens for it).
 *
 *   <SafePresence swapKey={pathname} mode="wait" initial={false}>
 *     <motion.div key={pathname} … />
 *   </SafePresence>
 */
export const SafePresence = ({ swapKey, timeout = 1600, onExitComplete, children, ...props }) => {
  const [epoch, setEpoch] = useState(0);
  const lastKey = useRef(swapKey);
  const pending = useRef(false);
  const notify = useRef(onExitComplete);
  notify.current = onExitComplete;

  useEffect(() => {
    if (lastKey.current === swapKey) return undefined;
    lastKey.current = swapKey;
    pending.current = true;
    const t = setTimeout(() => {
      if (!pending.current) return;
      pending.current = false;
      setEpoch((n) => n + 1);
      notify.current?.();
    }, timeout);
    return () => clearTimeout(t);
  }, [swapKey, timeout]);

  const done = () => {
    pending.current = false;
    notify.current?.();
  };

  return (
    <AnimatePresence key={epoch} {...props} onExitComplete={done}>
      {children}
    </AnimatePresence>
  );
};

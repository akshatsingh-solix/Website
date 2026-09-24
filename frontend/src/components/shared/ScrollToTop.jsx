import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // The target may render a moment later (page transition, lazy sections).
      let tries = 0;
      const find = () => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else if (tries++ < 20) timer = setTimeout(find, 100);
      };
      let timer = setTimeout(find, 80);
      if (!document.getElementById(decodeURIComponent(hash.slice(1)))) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
};

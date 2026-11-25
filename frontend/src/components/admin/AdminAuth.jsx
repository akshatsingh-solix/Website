import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { TOKEN_KEY, adminLogin, adminMe, markThisBrowser } from "@/lib/adminApi";

const AdminContext = createContext(null);
const USER_KEY = "solix_admin_user";

// The signed-in person's profile (name, role, access levels; no secrets) is kept next to the token, so the admin
// opens instantly from it and confirms with the server in the background, instead of a full-screen spinner that
// waits on the server (and, while it restarts, sent a validly signed-in person back to the sign-in page).
const readCached = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
};
const writeCached = (u) => {
  try { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY); } catch { /* private mode */ }
};

// Whoever signs in to MarkHub is staff: their browser's visits to the site are internal traffic from now on
// (Settings > Internal traffic can turn this off). Once per browser session; never in the way of signing in.
const MARKED_KEY = "markhub_browser_marked";
const markBrowserOnce = () => {
  try {
    if (sessionStorage.getItem(MARKED_KEY)) return;
    sessionStorage.setItem(MARKED_KEY, "1");
  } catch { /* private mode: mark anyway */ }
  markThisBrowser().catch(() => {
    try { sessionStorage.removeItem(MARKED_KEY); } catch { /* ignore */ }
  });
};

export const AdminAuthProvider = ({ children }) => {
  const [user, setUserState] = useState(() => (localStorage.getItem(TOKEN_KEY) ? readCached() : false));
  const setUser = useCallback((u) => { writeCached(u || null); setUserState(u); }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(false);
      return;
    }
    adminMe().then((u) => { setUser(u); markBrowserOnce(); }).catch((err) => {
      // Signed out only when the server says the session is over (401/403). If it is restarting or unreachable,
      // keep the person signed in: pages show the reconnecting notice and load once the server answers.
      const status = err?.response?.status;
      if (status === 401 || status === 403) setUser(false);
      else setUserState((cur) => cur ?? readCached() ?? false);
    });
  }, [setUser]);

  useEffect(() => {
    const onLogout = () => setUser(false);  // also clears the saved profile
    window.addEventListener("solix:admin-logout", onLogout);
    return () => window.removeEventListener("solix:admin-logout", onLogout);
  }, [setUser]);

  const login = useCallback(async (email, password) => {
    const data = await adminLogin(email, password);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
    markBrowserOnce();
    return data.user;
  }, [setUser]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(false);
  }, [setUser]);

  return <AdminContext.Provider value={{ user, login, logout }}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => useContext(AdminContext);

export const RequireAdmin = ({ children }) => {
  const { user } = useAdmin();
  const location = useLocation();
  if (user === null) {
    return (
      <div className="grid min-h-screen place-items-center" data-testid="admin-loading">
        <Loader2 className="h-6 w-6 animate-spin text-primary-ink" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
};

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { TOKEN_KEY, adminLogin, adminMe } from "@/lib/adminApi";

const AdminContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(false);
      return;
    }
    adminMe().then(setUser).catch(() => setUser(false));
  }, []);

  useEffect(() => {
    const onLogout = () => setUser(false);
    window.addEventListener("solix:admin-logout", onLogout);
    return () => window.removeEventListener("solix:admin-logout", onLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await adminLogin(email, password);
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(false);
  }, []);

  return <AdminContext.Provider value={{ user, login, logout }}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => useContext(AdminContext);

export const RequireAdmin = ({ children }) => {
  const { user } = useAdmin();
  const location = useLocation();
  if (user === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background" data-testid="admin-loading">
        <Loader2 className="h-6 w-6 animate-spin text-primary-ink" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
};

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ACCOUNT_TOKEN_KEY, accountMe, accountSignin, accountSignup } from "@/lib/accountApi";

const AccountContext = createContext(null);

/**
 * Solix ECS trial account session. `account` is null while the stored
 * session is being checked, false when signed out, or the profile.
 */
export const AccountAuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem(ACCOUNT_TOKEN_KEY)) {
      setAccount(false);
      return;
    }
    accountMe()
      .then(setAccount)
      .catch(() => {
        localStorage.removeItem(ACCOUNT_TOKEN_KEY);
        setAccount(false);
      });
  }, []);

  const start = useCallback((data) => {
    localStorage.setItem(ACCOUNT_TOKEN_KEY, data.access_token);
    setAccount(data.account);
    return data.account;
  }, []);

  const signin = useCallback(async (email, password) => start(await accountSignin(email, password)), [start]);
  const signup = useCallback(async (body) => start(await accountSignup(body)), [start]);
  const signout = useCallback(() => {
    localStorage.removeItem(ACCOUNT_TOKEN_KEY);
    setAccount(false);
  }, []);

  return <AccountContext.Provider value={{ account, signin, signup, signout }}>{children}</AccountContext.Provider>;
};

export const useAccount = () => useContext(AccountContext);

export const RequireAccount = ({ children }) => {
  const { account } = useAccount();
  const location = useLocation();
  if (account === null) {
    return (
      <div className="grid min-h-[60vh] place-items-center" data-testid="account-loading">
        <Loader2 className="h-6 w-6 animate-spin text-primary-ink" />
      </div>
    );
  }
  if (!account) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  return children;
};

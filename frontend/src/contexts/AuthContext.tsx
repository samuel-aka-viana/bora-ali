import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/auth.service";
import { ACCESS_KEY } from "../utils/constants";
import type { User } from "../types/user";
import { AuthCtx } from "./auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(ACCESS_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(ACCESS_KEY)) return;

    authService
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (u: string, p: string) => {
    await authService.login(u, p);
    setUser(await authService.me());
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const nextUser = await authService.me();
    setUser(nextUser);
    return nextUser;
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, refreshUser, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

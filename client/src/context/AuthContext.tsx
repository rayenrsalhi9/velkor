import { useEffect, useState, type ReactNode } from "react";
import * as api from "../lib/api";
import { AuthContext } from "./auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (await api.refresh()) {
          const profile = await api.getMe();
          if (!cancelled) setUser(profile);
        }
      } catch {
        // not authenticated
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    setUser(await api.getMe());
  };

  const logout = () => {
    api.logout().catch(() => undefined);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

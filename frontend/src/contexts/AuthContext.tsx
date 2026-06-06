import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const res = await api.get("/api/users/me");
          if (res.success) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (e) {
          logout();
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    const res = await api.post("/api/auth/login", { email, password: password || "password123" });
    if (res.success) {
      localStorage.setItem("accessToken", res.accessToken);
      setUser(res.user);
    } else {
      console.error(res.error);
    }
    setIsLoading(false);
  };

  const register = async (name: string, email: string, password?: string) => {
    setIsLoading(true);
    const res = await api.post("/api/auth/register", { name, email, password: password || "password123" });
    if (res.success) {
      localStorage.setItem("accessToken", res.accessToken);
      setUser(res.user);
    } else {
      console.error(res.error);
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

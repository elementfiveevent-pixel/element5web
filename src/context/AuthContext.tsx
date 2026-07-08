"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "EVENT_MANAGER" | "ARTIST" | "JUDGE" | "MODERATOR" | "ATTENDEE";
  profilePhotoUrl?: string;
  reputationXp: number;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("e5_auth_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.get("/auth/me");
      setUser(data);
    } catch {
      // Clear token on validation failure
      localStorage.removeItem("e5_auth_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const setTokens = (accessToken: string) => {
    localStorage.setItem("e5_auth_token", accessToken);
    // Also set cookie so middleware can check auth server-side
    document.cookie = `e5_auth_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  };

  const clearTokens = () => {
    localStorage.removeItem("e5_auth_token");
    document.cookie = "e5_auth_token=; path=/; max-age=0";
  };

  const login = async (email: string, password: string) => {
    const data = await api.post("/auth/login", { email, password });
    if (data.accessToken) {
      setTokens(data.accessToken);
      await refreshUser();
    }
  };

  const register = async (fullName: string, email: string, password: string, role: string) => {
    const data = await api.post("/auth/register", { fullName, email, password, role });
    if (data.accessToken) {
      setTokens(data.accessToken);
      await refreshUser();
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

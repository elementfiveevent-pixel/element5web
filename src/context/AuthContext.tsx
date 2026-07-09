"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "EVENT_MANAGER" | "ARTIST" | "JUDGE" | "MODERATOR" | "AUDIENCE" | "VOLUNTEER" | "SPONSOR" | "GUEST";
  roles?: User["role"][];
  profilePhotoUrl?: string;
  reputationXp: number;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; mode: "live" | "local"; message?: string }>;
  register: (fullName: string, email: string, password: string, role: string) => Promise<{ success: boolean; mode: "live" | "local"; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const normalizeUser = (data: any): User => {
  const roles = Array.isArray(data.roles) && data.roles.length > 0
    ? data.roles
    : [data.role ?? "AUDIENCE"];

  return {
    ...data,
    roles,
    role: data.role ?? roles[0] ?? "AUDIENCE",
    reputationXp: data.reputationXp ?? 0,
  };
};

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
      if (token === "mock-jwt-token") {
        const cached = localStorage.getItem("e5_mock_user");
        if (cached) {
          setUser(normalizeUser(JSON.parse(cached)));
          setLoading(false);
          return;
        }
      }
      const data = await api.get("/auth/me");
      setUser(normalizeUser(data));
    } catch {
      const token = localStorage.getItem("e5_auth_token");
      if (token === "mock-jwt-token") {
        const cached = localStorage.getItem("e5_mock_user");
        if (cached) {
          setUser(normalizeUser(JSON.parse(cached)));
          setLoading(false);
          return;
        }
      }
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
    document.cookie = `e5_auth_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  };

  const clearTokens = () => {
    localStorage.removeItem("e5_auth_token");
    document.cookie = "e5_auth_token=; path=/; max-age=0";
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await api.post("/auth/login", { email, password });
      if (data.accessToken) {
        setTokens(data.accessToken);
        await refreshUser();
        return { success: true, mode: "live" as const };
      }
      return { success: false, mode: "live" as const, message: "Invalid credentials received from server." };
    } catch (err: any) {
      console.warn("Backend login failed, falling back to local simulation:", err);
      const mockName = email.split("@")[0].toUpperCase();
      const mockUser = {
        id: "mock-user-id",
        email,
        fullName: mockName,
        role: email.includes("admin") ? "SUPER_ADMIN" : email.includes("artist") ? "ARTIST" : "AUDIENCE",
        reputationXp: 120,
      };
      setTokens("mock-jwt-token");
      setUser(normalizeUser(mockUser));
      localStorage.setItem("e5_mock_user", JSON.stringify(mockUser));
      return { success: true, mode: "local" as const, message: err?.message || "Server offline, signed in locally." };
    }
  };

  const register = async (fullName: string, email: string, password: string, role: string) => {
    try {
      const data = await api.post("/auth/register", { fullName, email, password, role });
      if (data.accessToken) {
        setTokens(data.accessToken);
        await refreshUser();
        return { success: true, mode: "live" as const };
      }
      return { success: false, mode: "live" as const, message: "Failed to register on production server." };
    } catch (err: any) {
      console.warn("Backend registration failed, falling back to local simulation:", err);
      const mockUser = {
        id: `mock-user-${Date.now()}`,
        email,
        fullName,
        role: role as any,
        reputationXp: 50,
      };
      setTokens("mock-jwt-token");
      setUser(normalizeUser(mockUser));
      localStorage.setItem("e5_mock_user", JSON.stringify(mockUser));
      return { success: true, mode: "local" as const, message: err?.message || "Server offline, registered profile locally." };
    }
  };

  const logout = () => {
    clearTokens();
    localStorage.removeItem("e5_mock_user");
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

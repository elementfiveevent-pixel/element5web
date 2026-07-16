"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { auth as firebaseAuth, googleProvider, signInWithPopup } from "@/lib/firebase";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "ARTIST" | "AUDIENCE" | "VOLUNTEER";
  roles?: User["role"][];
  profilePhotoUrl?: string;
  reputationXp: number;
  status?: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  artistProfile?: any;
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, totpToken?: string) => Promise<{ success: boolean; mode: "live" | "local"; message?: string; user?: User | null }>;
  register: (fullName: string, email: string, password: string, role: string, mobileNumber?: string) => Promise<{ success: boolean; mode: "live" | "local"; message?: string }>;
  signInWithGoogle: (role?: "ARTIST" | "AUDIENCE") => Promise<{ success: boolean; mode: "live" | "local"; message?: string; user?: User | null }>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

const normalizeUser = (data: any): User => {
  const roles = Array.isArray(data.roles) && data.roles.length > 0
    ? data.roles
    : [data.role ?? "AUDIENCE"];

  let primaryRole = data.role ?? roles[0] ?? "AUDIENCE";
  if (roles.includes("SUPER_ADMIN")) {
    primaryRole = "SUPER_ADMIN";
  } else if (roles.includes("ORG_ADMIN")) {
    primaryRole = "ORG_ADMIN";
  }

  return {
    ...data,
    roles,
    role: primaryRole,
    reputationXp: data.reputationXp ?? 0,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setTokens = (accessToken: string) => {
    localStorage.setItem("e5_auth_token", accessToken);
    document.cookie = `e5_auth_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  };

  const clearTokens = () => {
    localStorage.removeItem("e5_auth_token");
    document.cookie = "e5_auth_token=; path=/; max-age=0";
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("e5_auth_token");
      if (!token) {
        clearTokens();
        setUser(null);
        setLoading(false);
        return null;
      }
      // Sync cookie if missing to prevent middleware redirects
      if (typeof document !== "undefined" && !document.cookie.includes("e5_auth_token")) {
        document.cookie = `e5_auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      const data = await api.get("/auth/me");
      const u = normalizeUser(data);
      setUser(u);
      return u;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, totpToken?: string) => {
    try {
      const data = await api.post("/auth/login", { email, password, totpToken });
      if (data.accessToken) {
        setTokens(data.accessToken);
        const userProfile = await refreshUser();
        return { success: true, mode: "live" as const, user: userProfile };
      }
      return { success: false, mode: "live" as const, message: "Invalid credentials received from server." };
    } catch (err: any) {
      console.error("Backend login failed:", err);
      return { success: false, mode: "live" as const, message: err?.message || "Server connection failed. Please make sure the backend is running." };
    }
  };

  const register = async (fullName: string, email: string, password: string, role: string, mobileNumber?: string) => {
    try {
      const data = await api.post("/auth/register", { fullName, email, password, role, mobileNumber });
      if (data.accessToken) {
        setTokens(data.accessToken);
        await refreshUser();
        return { success: true, mode: "live" as const };
      }
      return { success: false, mode: "live" as const, message: "Failed to register on production server." };
    } catch (err: any) {
      console.error("Backend registration failed:", err);
      return { success: false, mode: "live" as const, message: err?.message || "Server connection failed. Please make sure the backend is running." };
    }
  };

  const signInWithGoogle = async (role?: "ARTIST" | "AUDIENCE") => {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      const data = await api.post("/auth/google", { idToken, role });
      if (data.accessToken) {
        setTokens(data.accessToken);
        const userProfile = await refreshUser();
        return { success: true, mode: "live" as const, user: userProfile };
      }
      return { success: false, mode: "live" as const, message: "Failed to authenticate Google user on backend." };
    } catch (err: any) {
      console.error("Google login failed:", err);
      return { success: false, mode: "live" as const, message: err?.message || "Google authentication failed or backend server offline." };
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, signInWithGoogle, logout, refreshUser }}>
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

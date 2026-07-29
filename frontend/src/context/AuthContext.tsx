"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabaseClient";
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
  pendingGoogleToken: string | null;
  setPendingGoogleToken: (token: string | null) => void;
  login: (email: string, password: string, totpToken?: string) => Promise<{ success: boolean; mode: "live" | "local"; message?: string; user?: User | null }>;
  register: (fullName: string, email: string, password: string, role: string, mobileNumber?: string) => Promise<{ success: boolean; mode: "live" | "local"; message?: string }>;
  signInWithGoogle: (role?: "ARTIST" | "AUDIENCE", customToken?: string) => Promise<{ success: boolean; mode: "live" | "local"; message?: string; user?: User | null }>;
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
  };
};

const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    if (payload && payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);

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
      const token = typeof window !== "undefined" ? localStorage.getItem("e5_auth_token") : null;
      if (!token || isTokenExpired(token)) {
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
    const handleSupabaseRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.access_token) {
          const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
          const urlRole = urlParams ? urlParams.get("google_role") : undefined;
          const role = (urlRole === "ARTIST" || urlRole === "AUDIENCE") ? urlRole : undefined;
          
          try {
            const data = await api.post("/auth/google", { idToken: session.access_token, role });
            if (data.accessToken) {
              setTokens(data.accessToken);
              setPendingGoogleToken(null);
              await refreshUser();
              if (typeof window !== "undefined") {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
          } catch (postErr: any) {
            const msg = postErr?.response?.data?.message || postErr?.message || "";
            if (String(msg).includes("NEW_USER_ROLE_REQUIRED")) {
              setPendingGoogleToken(session.access_token);
            }
          }
        }
      } catch {}
    };
    handleSupabaseRedirect();
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
      const msg = err?.message || "Server connection failed. Please make sure the backend is running.";
      showToast(msg, "error");
      return { success: false, mode: "live" as const, message: msg };
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
      const msg = err?.message || "Server connection failed. Please make sure the backend is running.";
      showToast(msg, "error");
      return { success: false, mode: "live" as const, message: msg };
    }
  };

  const signInWithGoogle = async (role?: "ARTIST" | "AUDIENCE", customToken?: string) => {
    try {
      let idToken: string | null = customToken || pendingGoogleToken || null;
      if (!idToken) {
        try {
          const result = await signInWithPopup(firebaseAuth, googleProvider);
          idToken = await result.user.getIdToken();
        } catch (fbErr: any) {
          const errMsg = String(fbErr?.message || fbErr);
          if (
            fbErr?.code === "auth/api-key-not-valid" ||
            fbErr?.code === "auth/popup-blocked" ||
            errMsg.includes("api-key-not-valid") ||
            errMsg.includes("auth/invalid-api-key") ||
            errMsg.includes("popup-blocked")
          ) {
            // Fallback to Supabase Google OAuth Provider
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: typeof window !== "undefined" ? `${window.location.origin}${role ? `?google_role=${role}` : ""}` : undefined,
              },
            });
            if (error) throw error;
            return { success: true, mode: "live" as const, message: "Redirecting to Supabase Google Sign-In..." };
          }
          throw fbErr;
        }
      }

      if (idToken) {
        const data = await api.post("/auth/google", { idToken, role });
        if (data.accessToken) {
          setTokens(data.accessToken);
          setPendingGoogleToken(null);
          const userProfile = await refreshUser();
          return { success: true, mode: "live" as const, user: userProfile };
        }
      }
      return { success: false, mode: "live" as const, message: "Failed to authenticate Google user on backend." };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Google authentication failed";
      const msgStr = typeof msg === "string" ? msg : JSON.stringify(msg);
      if (msgStr.includes("NEW_USER_ROLE_REQUIRED")) {
        return { success: false, mode: "live" as const, message: "NEW_USER_ROLE_REQUIRED" };
      }
      showToast(msgStr, "error");
      return { success: false, mode: "live" as const, message: msgStr };
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, pendingGoogleToken, setPendingGoogleToken, login, register, signInWithGoogle, logout, refreshUser }}>
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

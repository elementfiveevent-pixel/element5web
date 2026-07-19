"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const { login, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password, show2FA ? totpCode : undefined);
      if (res.success) {
        if (res.mode === "local") {
          showToast("Signed in locally using fallback simulation: " + res.message, "warning");
        }
        const loggedUser = res.user;
        if (loggedUser?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else if (loggedUser?.role === "ORG_ADMIN") {
          router.push("/events/organizer");
        } else if (
          loggedUser?.role === "ARTIST" &&
          (!loggedUser?.artistProfile ||
            !loggedUser.artistProfile.genres ||
            loggedUser.artistProfile.genres.length === 0)
        ) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } else {
        if (res.message === "2FA_REQUIRED") {
          setShow2FA(true);
        } else {
          setError(res.message || "Invalid credentials or server offline");
        }
      }
    } catch (err: any) {
      if (err?.message === "2FA_REQUIRED") {
        setShow2FA(true);
      } else {
        setError(err?.message || "Invalid credentials or server offline");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setShowRoleModal(true);
  };

  const completeGoogleSignIn = async (role: "ARTIST" | "AUDIENCE") => {
    setShowRoleModal(false);
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res.success) {
        if (res.mode === "local") {
          showToast("Signed in locally via Google fallback simulation: " + res.message, "warning");
        }
        const loggedUser = res.user;
        if (loggedUser?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else if (loggedUser?.role === "ORG_ADMIN") {
          router.push("/events/organizer");
        } else if (
          loggedUser?.role === "ARTIST" &&
          (!loggedUser?.artistProfile ||
            !loggedUser.artistProfile.genres ||
            loggedUser.artistProfile.genres.length === 0)
        ) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } else {
        setError(res.message || "Failed to authenticate Google user");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate Google user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#FFF5E4] text-[#121212] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md bg-[#FAF8F5] border-3 border-[#121212] p-8 rounded shadow-brutal space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="brutal-tape text-xs uppercase select-none">CREATOR ACCESS</span>
          <h2 className="font-display font-extrabold text-4xl uppercase tracking-tighter mt-2">
            WELCOME BACK
          </h2>
          <p className="font-space text-xs text-gray-500 font-bold">
            Sign in to access StageVerse voting, network and profile features.
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-red-500 text-[#FAF8F5] border-2 border-[#121212] p-3 rounded text-xs font-bold font-space flex items-center gap-2 shadow-brutal-red/20 shadow-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-space">
          {!show2FA ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-500 block">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. artist@element5.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-500 block">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
                  required
                />
              </div>
            </>
          ) : (
            <div className="space-y-2 text-center bg-[#121212]/5 p-4 rounded border-2 border-dashed border-[#121212]/20">
              <p className="text-xs font-black uppercase text-gray-500">Signing in as</p>
              <p className="font-bold text-sm">{email}</p>
            </div>
          )}

          {show2FA && (
            <div className="space-y-2">
              <label htmlFor="totpCode" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Google Authenticator / 2FA Code
              </label>
              <input
                id="totpCode"
                type="text"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                required
                className="w-full bg-white border-2 border-[#121212] p-3 rounded font-bold placeholder-gray-400 focus:outline-none focus:border-red-500 text-center tracking-widest text-lg"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-festival text-[#121212] border-3 border-[#121212] font-black uppercase text-sm tracking-wider py-4 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : (
              show2FA ? (
                <>
                  VERIFY & SIGN IN <LogIn size={16} />
                </>
              ) : (
                <>
                  SIGN IN <LogIn size={16} />
                </>
              )
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#121212]/10"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-[#121212]/10"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-[#121212] border-3 border-[#121212] font-black uppercase text-sm tracking-wider py-4 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="w-5 h-5 flex items-center justify-center border-2 border-[#121212] bg-[#FAF8F5] rounded-full text-[10px] font-black font-serif">G</span>
            SIGN IN WITH GOOGLE
          </button>
        </form>

        <div className="border-t border-[#121212]/10 pt-4 text-center">
          <p className="font-space text-xs font-bold text-gray-500">
            Don't have a profile?{" "}
            <Link href="/register" className="text-red-stage hover:underline">
              REGISTER AS CREATOR
            </Link>
          </p>
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 z-[9999] bg-[#121212]/80 flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border-4 border-[#121212] p-8 max-w-sm w-full rounded shadow-brutal space-y-6 text-[#121212] font-space relative">
            <button 
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 w-8 h-8 border-2 border-[#121212] bg-white rounded flex items-center justify-center hover:bg-gray-100 font-black shadow-brutal-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <span className="bg-red-stage text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">Setup Profile</span>
              <h3 className="font-display font-black text-2xl uppercase tracking-tight mt-1">CHOOSE YOUR ROLE</h3>
              <p className="text-xs text-gray-500 font-bold">First-time Google signups require choosing a path. Existing accounts will log in normally.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => completeGoogleSignIn("ARTIST")}
                className="w-full bg-[#121212] text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer text-center"
              >
                JOIN AS ARTIST / CREATOR
              </button>
              <button
                onClick={() => completeGoogleSignIn("AUDIENCE")}
                className="w-full bg-yellow-festival text-[#121212] border-3 border-[#121212] font-display font-black text-xs uppercase py-3.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer text-center"
              >
                JOIN AS AUDIENCE / JUDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const { register, signInWithGoogle, pendingGoogleToken } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [role, setRole] = useState("AUDIENCE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    if (pendingGoogleToken) {
      setShowRoleModal(true);
    }
  }, [pendingGoogleToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await register(fullName, email, password, role, mobileNumber);
      if (res.success) {
        if (res.mode === "local") {
          showToast("Registered locally using fallback simulation: " + res.message, "warning");
        }
        if (role === "ARTIST") {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } else {
        setError(res.message || "Failed to create account. Please check parameters.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create account. Please check parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        if (res.mode === "local") {
          showToast("Signed in locally via Google fallback simulation: " + res.message, "warning");
        }
        const loggedUser = res.user;
        if (
          loggedUser?.role === "ARTIST" &&
          (!loggedUser?.artistProfile ||
            !loggedUser.artistProfile.genres ||
            loggedUser.artistProfile.genres.length === 0)
        ) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      } else if (res.message?.includes("NEW_USER_ROLE_REQUIRED") || res.message?.includes("role")) {
        setShowRoleModal(true);
      } else {
        setError(res.message || "Failed to register via Google.");
      }
    } catch (err: any) {
      if (err?.message?.includes("NEW_USER_ROLE_REQUIRED")) {
        setShowRoleModal(true);
      } else {
        setError(err?.message || "Failed to register via Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleSignIn = async (selectedRole: "ARTIST" | "AUDIENCE") => {
    setShowRoleModal(false);
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle(selectedRole);
      if (res.success) {
        if (res.mode === "local") {
          showToast("Signed in locally via Google fallback simulation: " + res.message, "warning");
        }
        const loggedUser = res.user;
        if (
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
        setError(res.message || "Failed to register via Google.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to register via Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-[#FFF5E4] text-[#121212] flex items-center justify-center py-10 px-4 sm:px-6 relative">
      <div className="w-full max-w-md bg-[#FAF8F5] border-3 border-[#121212] p-8 rounded shadow-brutal space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="brutal-tape-red text-xs uppercase select-none">CREATOR REGISTRATION</span>
          <h2 className="font-display font-extrabold text-4xl uppercase tracking-tighter mt-2">
            JOIN ELEMENT 5
          </h2>
          <p className="font-space text-xs text-gray-500 font-bold">
            Create an account to track your StageVerse achievements, XP, and vote.
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
          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-500 block">Full Name / Stage Name</label>
            <input
              type="text"
              placeholder="e.g. MC Kavyo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-500 block">Email Address</label>
            <input
              type="email"
              placeholder="e.g. kavyo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-500 block">Password (Min 6 Characters)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-500 block">Mobile Contact (Optional)</label>
            <input
              type="text"
              placeholder="e.g. +91 9876543210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-500 block">Primary Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold focus:outline-none"
            >
              <option value="AUDIENCE">Audience / Judge</option>
              <option value="ARTIST">Artist / Creator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-festival text-[#121212] border-3 border-[#121212] font-black uppercase text-sm tracking-wider py-4 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "CREATING ACCOUNT..." : (
              <>
                REGISTER ACCOUNT <UserPlus size={16} />
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#121212]/10"></div>
            <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-[#121212]/10"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full bg-white text-[#121212] border-3 border-[#121212] font-black uppercase text-sm tracking-wider py-4 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="w-5 h-5 flex items-center justify-center border-2 border-[#121212] bg-[#FAF8F5] rounded-full text-[10px] font-black font-serif">G</span>
            CONTINUE WITH GOOGLE
          </button>
        </form>

        <div className="border-t border-[#121212]/10 pt-4 text-center">
          <p className="font-space text-xs font-bold text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-red-stage hover:underline">
              SIGN IN
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

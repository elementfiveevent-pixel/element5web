"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password, show2FA ? totpCode : undefined);
      if (res.success) {
        const loggedUser = res.user;
        if (loggedUser?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/events/organizer");
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

  return (
    <div className="min-h-[80vh] bg-[#FFF5E4] text-[#121212] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md bg-[#FAF8F5] border-3 border-[#121212] p-8 rounded shadow-brutal space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="brutal-tape-red text-xs uppercase select-none">ADMIN SECURE ACCESS</span>
          <h2 className="font-display font-extrabold text-4xl uppercase tracking-tighter mt-2">
            ADMIN PORTAL
          </h2>
          <p className="font-space text-xs text-gray-500 font-bold">
            Enter your system administrator credentials to sign in.
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
                <label className="text-xs font-black uppercase text-gray-500 block">Admin Email</label>
                <input
                  type="email"
                  placeholder="e.g. admin@element5.com"
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
            className="w-full bg-[#D80032] text-white border-3 border-[#121212] font-black uppercase text-sm tracking-wider py-4 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING SECURELY..." : (
              show2FA ? (
                <>
                  VERIFY & SIGN IN <LogIn size={16} />
                </>
              ) : (
                <>
                  SECURE SIGN IN <LogIn size={16} />
                </>
              )
            )}
          </button>
        </form>

        <div className="border-t border-[#121212]/10 pt-4 text-center space-y-2">
          <p className="font-space text-xs font-bold text-gray-400">
            For security reasons, system administrators cannot be created online.
          </p>
          <p className="font-space text-xs font-bold text-gray-400">
            Not an admin?{" "}
            <Link href="/login" className="text-[#121212] hover:underline font-black">
              CREATOR SIGN IN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

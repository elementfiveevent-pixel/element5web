"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials or server offline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#FFF5E4] text-[#121212] flex items-center justify-center py-16 px-6">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-festival text-[#121212] border-3 border-[#121212] font-black uppercase text-sm tracking-wider py-4 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "AUTHENTICATING..." : (
              <>
                SIGN IN <LogIn size={16} />
              </>
            )}
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
    </div>
  );
}

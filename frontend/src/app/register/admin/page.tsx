"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

export default function AdminRegisterPage() {
  return (
    <div className="min-h-[90vh] bg-[#FFF5E4] text-[#121212] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md bg-[#FAF8F5] border-3 border-[#121212] p-8 rounded shadow-brutal space-y-6 text-center">
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 bg-red-stage/10 border-2 border-[#121212] rounded flex items-center justify-center text-red-stage shadow-brutal-sm">
          <Lock size={32} />
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <span className="bg-red-stage text-white text-[10px] font-black uppercase px-2.5 py-1 rounded inline-flex items-center gap-1 select-none font-space">
            <ShieldAlert size={12} /> SECURE GATEWAY
          </span>
          <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter mt-2">
            REGISTRATION DISABLED
          </h2>
          <p className="font-space text-xs text-gray-500 font-bold">
            System administrator accounts cannot be registered publicly.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-festival/10 border-2 border-[#121212] p-4 rounded text-left">
          <p className="font-space text-xs font-bold text-[#121212] leading-relaxed">
            For security, new administrative roles must be assigned directly from the database or the existing systems panel. Public registrations for administrators are strictly blocked.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-2 space-y-3 font-space">
          <Link
            href="/admin/login"
            className="w-full bg-[#121212] text-white border-3 border-[#121212] font-black uppercase text-xs tracking-wider py-3.5 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer"
          >
            GO TO SECURE LOGIN
          </Link>
          <Link
            href="/"
            className="w-full bg-white text-[#121212] border-3 border-[#121212] font-black uppercase text-xs tracking-wider py-3.5 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b-3 border-[#121212] bg-[#121212]/95 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-display font-extrabold text-2xl tracking-tighter hover:text-yellow-festival transition-colors flex items-center gap-2">
          ELEMENT 5
          <span className="text-[10px] bg-red-stage text-white font-bold px-2 py-0.5 border border-white rounded rotate-[4deg] select-none">
            STAGES
          </span>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-8 font-bold text-sm tracking-widest">
        <Link href="/events" className="hover:text-red-stage transition-colors">
          EVENTS
        </Link>
        <Link href="/stageverse" className="hover:text-yellow-festival transition-colors">
          STAGEVERSE
        </Link>
        <Link href="/leaderboard" className="hover:text-[#FFDE4D] transition-colors">
          LEADERBOARD
        </Link>
        <Link href="/artists" className="hover:text-yellow-festival transition-colors">
          DISCOVER ARTISTS
        </Link>
        <Link href="/network" className="hover:text-orange-burnt transition-colors">
          NETWORK
        </Link>
        {user && (
          <Link href="/admin" className="hover:text-[#FAF8F5]/60 transition-colors flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            DASHBOARD
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase text-yellow-festival">
              {user.fullName.split(" ")[0]} ({user.role})
            </span>
            <button
              onClick={logout}
              className="bg-[#D80032] text-white font-bold border-2 border-[#121212] px-4 py-1.5 text-xs tracking-wider shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded cursor-pointer"
            >
              LOGOUT
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="border-2 border-[#FAF8F5] text-[#FAF8F5] font-bold px-4 py-1.5 text-xs tracking-wider hover:bg-[#FAF8F5]/10 transition-all rounded"
            >
              LOGIN
            </Link>
            <Link
              href="/register"
              className="bg-yellow-festival text-[#121212] font-black border-2 border-[#121212] px-4 py-1.5 text-xs tracking-wider shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded"
            >
              REGISTER
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
export default Header;

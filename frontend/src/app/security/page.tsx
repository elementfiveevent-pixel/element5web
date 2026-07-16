"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Key, EyeOff, Lock } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-sm hover:underline text-[#121212]/60">
          <ArrowLeft size={15} /> BACK TO VENUE
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <span className="brutal-tape text-xs uppercase select-none">TRUST & STANDARDS</span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl uppercase tracking-tighter mt-2">
            SECURITY <span className="text-red-stage">CORE</span>
          </h1>
          <p className="font-space font-bold text-sm text-[#121212]/60">
            How Element 5 safeguards your transactions, voting integrity, and ticketing keys.
          </p>
        </div>

        {/* Content grid */}
        <div className="space-y-6">
          
          {/* Card 1: Ticket Security */}
          <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#FFDE4D] border-2 border-[#121212] flex items-center justify-center shadow-brutal-sm">
                <Key size={18} />
              </div>
              <h2 className="font-display font-extrabold text-lg uppercase tracking-tight">Cryptographic Ticket Issuance</h2>
            </div>
            <p className="font-space text-xs sm:text-sm text-[#121212]/70 leading-relaxed font-bold">
              Every admission ticket issued by Element 5 contains a unique, cryptographically signed payload generated using a secure SHA-256 HMAC hash. This prevents ticket alteration and guarantees each ticket corresponds to a single authentic registration.
            </p>
          </div>

          {/* Card 2: Anti-Fraud Check-In */}
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-red-stage text-white border-2 border-[#121212] flex items-center justify-center shadow-brutal-sm">
                <Lock size={18} />
              </div>
              <h2 className="font-display font-extrabold text-lg uppercase tracking-tight text-[#121212]">Anti-Fraud Ticket Gateways</h2>
            </div>
            <p className="font-space text-xs sm:text-sm text-[#121212]/70 leading-relaxed font-bold">
              Our ticket verification gateways run strict atomic transaction checks. Once a ticket is scanned at the venue entrance, its state is finalized, and it cannot be reused, shared, or spoofed, protecting event organizers and artists against duplicate entries.
            </p>
          </div>

          {/* Card 3: Voting Integrity */}
          <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-orange-burnt text-white border-2 border-[#121212] flex items-center justify-center shadow-brutal-sm">
                <Shield size={18} />
              </div>
              <h2 className="font-display font-extrabold text-lg uppercase tracking-tight">Real-Time Voting Verification</h2>
            </div>
            <p className="font-space text-xs sm:text-sm text-[#121212]/70 leading-relaxed font-bold">
              StageVerse leaderboard votes utilize a token-based verification system linked directly to verified attendee profile IDs. This ensures one-vote-per-seat rules, preventing ballot-stuffing, automation, or sybil attacks on leaderboard placements.
            </p>
          </div>

          {/* Card 4: Data Protection */}
          <div className="border-3 border-[#121212] bg-[#FFDE4D]/10 p-6 rounded shadow-brutal space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-white border-2 border-[#121212] flex items-center justify-center shadow-brutal-sm">
                <EyeOff size={18} />
              </div>
              <h2 className="font-display font-extrabold text-lg uppercase tracking-tight text-yellow-800">Privacy &amp; Data Safeguards</h2>
            </div>
            <p className="font-space text-xs sm:text-sm text-[#121212]/70 leading-relaxed font-bold">
              We encrypt sensitive creator and organizer metadata both in-transit and at rest. Payment screenshots uploaded for admission tickets are kept under strict access controls, accessible only to the verifying event organizer and automatically pruned when events terminate.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

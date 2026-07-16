"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send, Check } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-2 font-display font-bold text-sm hover:underline text-[#121212]/60">
          <ArrowLeft size={15} /> BACK TO VENUE
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <span className="brutal-tape text-xs uppercase select-none">GET IN TOUCH</span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl uppercase tracking-tighter mt-2">
            CONTACT <span className="text-red-stage">ELEMENT 5</span>
          </h1>
          <p className="font-space font-bold text-sm text-[#121212]/60">
            Have questions about events, artist slots, sponsorships, or general inquiries? Drop us a line.
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form */}
          <div className="md:col-span-7 border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
            <h2 className="font-display font-extrabold text-xl uppercase tracking-tight pb-2 border-b-2 border-[#121212]/10">Send a Message</h2>
            
            {submitted ? (
              <div className="p-8 text-center space-y-4 bg-green-50 border-2 border-green-500 rounded">
                <div className="w-12 h-12 bg-green-500 border-2 border-[#121212] rounded-full flex items-center justify-center mx-auto shadow-brutal-sm">
                  <Check className="text-white" size={20} />
                </div>
                <h3 className="font-display font-black text-lg text-green-800">MESSAGE SENT</h3>
                <p className="font-space text-xs text-green-700 font-bold">
                  Thank you for reaching out! We usually reply to inquiries within 24 hours.
                </p>
                <button 
                  onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); }}
                  className="font-space font-bold text-xs uppercase underline text-green-800 hover:text-black"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-display font-black text-[10px] uppercase text-[#121212]/60 block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Mehta"
                    className="w-full px-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold text-sm focus:outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-display font-black text-[10px] uppercase text-[#121212]/60 block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. aarav@example.com"
                    className="w-full px-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold text-sm focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-display font-black text-[10px] uppercase text-[#121212]/60 block">Message Details</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you'd like to discuss..."
                    className="w-full px-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold text-sm focus:outline-none resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-festival text-[#121212] font-black py-3.5 border-3 border-[#121212] rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={14} /> Send Inquiry
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Direct Info */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Direct contact card */}
            <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
              <h2 className="font-display font-extrabold text-lg uppercase tracking-tight">Direct Access</h2>
              <div className="space-y-3 font-space text-xs font-bold text-[#121212]/80">
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-red-stage flex-shrink-0" />
                  <a href="mailto:elementfive.event@gmail.com" className="hover:underline">elementfive.event@gmail.com</a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-yellow-festival flex-shrink-0" />
                  <span>+91 98765 43210 (General Support)</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={14} className="text-orange-burnt flex-shrink-0" />
                  <span>Mishty Studio Cafe, SBR, Ahmedabad, India</span>
                </div>
              </div>
            </div>

            {/* Social channels */}
            <div className="border-3 border-[#121212] bg-yellow-festival/10 p-6 rounded shadow-brutal space-y-3">
              <h3 className="font-display font-extrabold text-sm uppercase text-yellow-800">Our Channels</h3>
              <p className="font-space text-[10px] text-gray-500 font-bold leading-tight">
                Follow our official channels for slot announcements, event flyers, and show reels.
              </p>
              <div className="flex flex-col gap-2 pt-1 text-xs font-bold font-space">
                <a href="https://www.instagram.com/elementfive.event" target="_blank" rel="noopener noreferrer" className="hover:underline text-red-stage flex items-center gap-1.5">
                  📷 Instagram: @elementfive.event
                </a>
                <a href="https://www.youtube.com/@Element5_ah" target="_blank" rel="noopener noreferrer" className="hover:underline text-red-stage flex items-center gap-1.5">
                  🎥 YouTube: @Element5_ah
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

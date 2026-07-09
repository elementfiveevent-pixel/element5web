"use client";

import React, { useEffect, useState } from "react";

export default function HeroBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="absolute inset-0 bg-[#121212]" />;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#121212] select-none pointer-events-none z-0">
      {/* Repeating Brutalist Dotted Grid */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: "radial-gradient(rgba(250, 248, 245, 0.4) 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Moving Stage Spotlight 1 - Red */}
      <div 
        className="absolute w-[60vw] h-[60vw] rounded-full opacity-30 mix-blend-screen blur-[120px] animate-[pulseRed_10s_infinite_alternate]"
        style={{
          background: "radial-gradient(circle, #D80032 0%, transparent 70%)",
          top: "-10%",
          left: "10%"
        }}
      />

      {/* Moving Stage Spotlight 2 - Yellow */}
      <div 
        className="absolute w-[50vw] h-[50vw] rounded-full opacity-25 mix-blend-screen blur-[100px] animate-[pulseYellow_8s_infinite_alternate]"
        style={{
          background: "radial-gradient(circle, #FFDE4D 0%, transparent 70%)",
          bottom: "10%",
          right: "5%"
        }}
      />

      {/* Modern Brutalist Floating Shapes */}
      <div className="absolute top-[20%] left-[8%] animate-[floatSlow_12s_infinite_ease-in-out] opacity-10">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0V40M0 20H40" stroke="#FAF8F5" strokeWidth="6" />
        </svg>
      </div>

      <div className="absolute bottom-[25%] left-[15%] animate-[floatFast_9s_infinite_ease-in-out] opacity-15">
        <div className="w-6 h-6 border-4 border-yellow-festival rotate-45" />
      </div>

      <div className="absolute top-[15%] right-[12%] animate-[floatSlow_15s_infinite_ease-in-out] opacity-10">
        <div className="w-10 h-10 border-4 border-red-stage rounded-full" />
      </div>

      <div className="absolute bottom-[20%] right-[18%] animate-[floatFast_11s_infinite_ease-in-out] opacity-20">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="26" height="26" stroke="#FFDE4D" strokeWidth="4" fill="none" />
        </svg>
      </div>

      {/* Subtle Halftone Wave or Laser Lines */}
      <div className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-[#FFDE4D]/15 to-transparent rotate-[-12deg] top-[35%] left-[-50%] animate-[pulseLine_4s_infinite_ease-in-out]" />
      <div className="absolute w-[200%] h-0.5 bg-gradient-to-r from-transparent via-[#D80032]/15 to-transparent rotate-[25deg] top-[60%] left-[-50%] animate-[pulseLine_6s_infinite_ease-in-out]" />

      <style jsx global>{`
        @keyframes pulseRed {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5vw, 5vh) scale(1.15); }
          100% { transform: translate(-3vw, 8vh) scale(0.9); }
        }
        @keyframes pulseYellow {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-8vw, -5vh) scale(0.9); }
          100% { transform: translate(2vw, -10vh) scale(1.1); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes floatFast {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-90deg); }
        }
        @keyframes pulseLine {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

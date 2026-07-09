"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import dynamic from "next/dynamic";
import HeroBackground from "@/components/ui/HeroBackground";

const PodiumScene = dynamic(() => import("@/components/3d/PodiumScene"), { ssr: false });
import { Play, Flame, Star, Trophy, Users, Award, Calendar, MapPin, Clock, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function Home() {
  const { artists, events, userVotes, registeredEvents, voteForArtist, registerForEvent } = useApp();
  const [curtainsOpened, setCurtainsOpened] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [audioPulse, setAudioPulse] = useState(false);
  
  // Timer for StageVerse 3.0 Countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Cinematic entrance sequence
    const curtainTimer = setTimeout(() => {
      setCurtainsOpened(true);
    }, 1200);

    const lightsTimer = setTimeout(() => {
      setLightsOn(true);
    }, 2200);

    const audioTimer = setInterval(() => {
      setAudioPulse((prev) => !prev);
    }, 800);

    // Calculate countdown
    const targetDate = new Date("2026-07-26T19:00:00+05:30").getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate - now;

      if (diff <= 0) {
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => {
      clearTimeout(curtainTimer);
      clearTimeout(lightsTimer);
      clearInterval(audioTimer);
      clearInterval(interval);
    };
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFDE4D", "#D80032", "#FAF8F5", "#E36414"]
    });
  };

  const handleVote = (artistId: string) => {
    voteForArtist(artistId, "stageverse-3.0");
    triggerConfetti();
  };

  const handleRegister = (eventId: string) => {
    registerForEvent(eventId);
    triggerConfetti();
  };

  // Sort artists for leaderboard
  const sortedArtists = [...artists].sort((a, b) => b.votes - a.votes);

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#121212]">
      {/* 1. CINEMATIC CURTAIN INTRO */}
      <div
        className={`fixed inset-0 z-50 flex pointer-events-none transition-transform duration-1000 ease-in-out ${
          curtainsOpened ? "translate-y-[-100%]" : "translate-y-0"
        }`}
      >
        <div className="w-1/2 h-full bg-[#0F0E0E] border-r-2 border-yellow-festival flex items-center justify-end pr-4 sm:pr-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-yellow-festival uppercase tracking-tighter select-none">
            ELEMENT
          </h1>
        </div>
        <div className="w-1/2 h-full bg-[#0F0E0E] border-l-2 border-yellow-festival flex items-center justify-start pl-4 sm:pl-8">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-[#FAF8F5] uppercase tracking-tighter select-none">
            5
          </h1>
        </div>
        {/* Entrance trigger block (clickable if user wants to skip) */}
        <button
          onClick={() => setCurtainsOpened(true)}
          className="absolute inset-0 m-auto w-28 h-28 sm:w-36 sm:h-36 rounded-full border-3 border-yellow-festival bg-[#121212] text-yellow-festival font-black uppercase text-xs tracking-widest flex flex-col items-center justify-center gap-1 shadow-brutal animate-bounce pointer-events-auto"
        >
          <span>ENTER</span>
          <span className="text-[9px] text-[#FAF8F5]/60">THE VENUE</span>
        </button>
      </div>

      {/* 2. HERO EXPERIENCE */}
      <section className="relative h-[92vh] flex items-center justify-center px-4 sm:px-6 border-b-3 border-[#121212]">
        <HeroBackground />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent z-1" />

        <div className="relative z-10 w-full max-w-5xl text-center space-y-5 sm:space-y-8 select-none px-2">
          <div className="inline-flex items-center gap-3">
            <span className="brutal-sticker text-[10px] sm:text-sm uppercase tracking-wider rotate-[3deg]">
              🔥 GUJARAT'S CREATIVE MOVEMENT
            </span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-8xl tracking-tight leading-none uppercase text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            WE BUILD <br />
            <span className="text-yellow-festival">OPPORTUNITIES</span>
          </h1>

          <p className="font-space text-sm sm:text-lg md:text-xl max-w-2xl mx-auto text-[#FAF8F5]/90 font-bold bg-[#121212]/70 p-3 sm:p-4 border-2 border-[#121212] shadow-brutal rounded">
            StageVerse is Ahmedabad's biggest community-driven Open Mic platform. 
            We showcase the rawest poetry, hip-hop, beatboxing, and storytelling.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6 pt-2 sm:pt-4 px-4 sm:px-0">
            <Link href="#register" className="text-center bg-red-stage text-[#FAF8F5] border-3 border-[#121212] px-6 py-3 sm:px-8 sm:py-4 font-black uppercase tracking-wider text-sm sm:text-base shadow-brutal-white shadow-brutal-white-hover rounded">
              BOOK TICKETS
            </Link>
            <Link href="/artists" className="text-center bg-yellow-festival text-[#121212] border-3 border-[#121212] px-6 py-3 sm:px-8 sm:py-4 font-black uppercase tracking-wider text-sm sm:text-base shadow-brutal shadow-brutal-hover rounded">
              DISCOVER CREATORS
            </Link>
          </div>
        </div>

        <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 hidden sm:flex items-end gap-1.5 z-10 opacity-70">
          <div className={`w-1.5 bg-yellow-festival transition-all duration-300 ${audioPulse ? "h-8" : "h-3"}`} />
          <div className={`w-1.5 bg-red-stage transition-all duration-300 ${audioPulse ? "h-4" : "h-10"}`} />
          <div className={`w-1.5 bg-[#FAF8F5] transition-all duration-300 ${audioPulse ? "h-12" : "h-4"}`} />
          <div className={`w-1.5 bg-orange-burnt transition-all duration-300 ${audioPulse ? "h-6" : "h-12"}`} />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FAF8F5]/50 pl-2">LIVE FREQUENCY</span>
        </div>
      </section>

      {/* 3. WHO WE ARE */}
      <section className="py-24 px-6 border-b-3 border-[#121212] bg-[#FAF8F5] text-[#121212] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <span className="brutal-tape text-sm">THE VISION</span>
            <h2 className="font-display font-extrabold text-5xl md:text-7xl uppercase tracking-tighter leading-none">
              THIS IS NOT A TEMPLATE. <br />
              <span className="text-red-stage">THIS IS A MOVEMENT.</span>
            </h2>
            <p className="font-space text-lg font-bold leading-relaxed text-[#121212]/80">
              Element 5 is Gujarat's youth-first creative network. We believe that every artist, whether a street rapper in Surat, a poet in Rajkot, or an experimental composer in Ahmedabad, deserves a premium stage. We build the physical and digital infrastructure that turns unknown creators into recognized culture-makers.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
              <div className="border-3 border-[#121212] p-2.5 sm:p-4 bg-yellow-festival shadow-brutal rounded min-w-0">
                <h4 className="font-display font-black text-xl sm:text-2xl truncate">100K+</h4>
                <p className="font-bold text-[9px] sm:text-xs uppercase tracking-wide truncate">Combined Reach</p>
              </div>
              <div className="border-3 border-[#121212] p-2.5 sm:p-4 bg-[#FAF8F5] shadow-brutal rounded min-w-0">
                <h4 className="font-display font-black text-xl sm:text-2xl truncate">15+</h4>
                <p className="font-bold text-[9px] sm:text-xs uppercase tracking-wide truncate">Selected Artists</p>
              </div>
              <div className="border-3 border-[#121212] p-2.5 sm:p-4 bg-[#121212] text-[#FAF8F5] shadow-brutal rounded min-w-0">
                <h4 className="font-display font-black text-xl sm:text-2xl truncate">₹2,500</h4>
                <p className="font-bold text-[9px] sm:text-xs uppercase tracking-wide truncate">Cash Prize</p>
              </div>
            </div>
          </div>
          <div className="relative border-4 border-[#121212] bg-[#121212] p-2 rounded shadow-brutal-red h-[400px]">
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop"
              alt="Live open mic audience"
              className="w-full h-full object-cover border-2 border-[#FAF8F5] rounded"
            />
            <div className="absolute top-4 left-4 brutal-tape-red text-xs">STAGEVERSE 2.0 SURAT</div>
          </div>
        </div>
      </section>

      {/* 4. PRODUCT / STAGEVERSE SECTION WITH TIMELINE */}
      <section id="stageverse" className="py-24 px-6 border-b-3 border-[#121212] bg-[#121212] relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="brutal-sticker rotate-[-3deg] text-sm bg-yellow-festival">OUR FIRST IP</span>
            <h2 className="font-display font-extrabold text-5xl md:text-7xl uppercase tracking-tighter text-white">
              STAGEVERSE EVOLUTION
            </h2>
            <p className="font-space text-lg text-[#FAF8F5]/60 max-w-xl mx-auto">
              From secret underground rooms to packing major cultural hubs. Look how far StageVerse has evolved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
            {/* Phase 1 */}
            <div className="border-3 border-white bg-[#0F0E0E] p-6 shadow-brutal-light rounded space-y-4">
              <span className="font-display text-4xl font-extrabold text-[#FAF8F5]/30">01</span>
              <h3 className="font-display text-2xl font-bold text-yellow-festival">StageVerse 1.0</h3>
              <p className="text-sm text-[#FAF8F5]/70 font-space">
                The pilot run in Surat. Structured for 15 artists, bringing in a highly energetic crowd and crowning Aarav Mehta as the inaugural spoken word champion.
              </p>
              <div className="text-xs bg-[#FAF8F5]/10 p-2 rounded font-bold">
                📍 Art Loft, Surat • Completed
              </div>
            </div>

            {/* Phase 2 */}
            <div className="border-3 border-yellow-festival bg-[#0F0E0E] p-6 shadow-brutal-yellow rounded space-y-4">
              <span className="font-display text-4xl font-extrabold text-yellow-festival">02</span>
              <h3 className="font-display text-2xl font-bold text-[#FAF8F5]">StageVerse 2.0</h3>
              <p className="text-sm text-[#FAF8F5]/80 font-space">
                Expanded reach with video reels that amassed 100K+ cumulative social views. Introduced loops, beatbox sets, and Gujarati rap battles to the audience.
              </p>
              <div className="text-xs bg-yellow-festival/20 text-yellow-festival p-2 rounded font-bold">
                📍 Silent Room, Surat • Completed
              </div>
            </div>

            {/* Phase 3 */}
            <div className="border-3 border-red-stage bg-[#0F0E0E] p-6 shadow-brutal-red rounded space-y-4 relative overflow-hidden">
              <div className="absolute top-2 right-2 brutal-tape-red text-[8px] tracking-widest uppercase">UPCOMING</div>
              <span className="font-display text-4xl font-extrabold text-red-stage">03</span>
              <h3 className="font-display text-2xl font-bold text-red-stage">StageVerse 3.0</h3>
              <p className="text-sm text-[#FAF8F5]/90 font-space">
                Ahmedabad edition. Integrating full digital voting, premium studio recording outputs, and custom branding panels with Red Bull Culture as the main sponsor.
              </p>
              <div className="text-xs bg-red-stage/20 text-red-stage p-2 rounded font-bold">
                📍 Sindhu Bhavan Road • Booking Open
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ARTIST LEADERBOARD (LIVE VOTE) */}
      <section className="py-24 px-6 border-b-3 border-[#121212] bg-[#FFF5E4] text-[#121212]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          <div className="lg:col-span-5 space-y-8">
            <span className="brutal-tape">REAL-TIME RANKINGS</span>
            <h2 className="font-display font-extrabold text-5xl md:text-6xl uppercase tracking-tighter">
              STAGEVERSE <br />
              <span className="text-red-stage">LEADERBOARD</span>
            </h2>
            <p className="font-space font-bold text-base text-[#121212]/80">
              Each StageVerse event connects live to this dashboard. Audience members vote directly from their phones. Cast your vote below to support your favorite regional talent!
            </p>

            {/* 3D Podium Block Container */}
            <div className="h-[280px] w-full border-3 border-[#121212] bg-[#121212] rounded shadow-brutal relative">
              <div className="absolute top-3 left-3 bg-yellow-festival border-2 border-[#121212] text-[10px] font-black px-2 py-0.5 rounded select-none z-10 shadow-brutal">
                3D PODIUM VIEW
              </div>
              <PodiumScene />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#121212] text-[#FAF8F5] border-3 border-[#121212] p-4 font-display font-black text-sm uppercase tracking-wider flex justify-between rounded shadow-brutal select-none">
              <span>ARTIST RANKINGS</span>
              <span className="text-yellow-festival">STAGEVERSE 3.0 VOTE</span>
            </div>

            <div className="space-y-3">
              {sortedArtists.map((artist, idx) => {
                const isVoted = userVotes[artist.id];
                return (
                  <div
                    key={artist.id}
                    className="bg-white border-3 border-[#121212] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-yellow transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <span className={`absolute -top-2 -left-2 w-6 h-6 border-2 border-[#121212] rounded-full flex items-center justify-center font-display font-black text-xs ${
                          idx === 0 ? "bg-yellow-festival" : idx === 1 ? "bg-slate-300" : idx === 2 ? "bg-orange-300" : "bg-[#FAF8F5]"
                        }`}>
                          {idx + 1}
                        </span>
                        <img
                          src={artist.avatar}
                          alt={artist.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#121212]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display font-bold text-lg leading-tight hover:underline">
                            <Link href={`/artists/${artist.id}`}>{artist.name}</Link>
                          </h4>
                          <span className="text-xs bg-[#121212]/10 px-2 py-0.5 rounded font-black uppercase text-[#121212]/60">
                            {artist.location.split(",")[0]}
                          </span>
                        </div>
                        <p className="text-xs font-space font-medium text-gray-600">{artist.genre}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-none pt-3 sm:pt-0">
                      <div className="text-right">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 block">VOTES</span>
                        <span className="font-display font-black text-xl text-red-stage animate-pulse">
                          {artist.votes}
                        </span>
                      </div>

                      <button
                        onClick={() => handleVote(artist.id)}
                        disabled={!!isVoted}
                        data-cursor="vote"
                        className={`flex items-center gap-2 border-2 border-[#121212] font-black uppercase text-xs tracking-wider px-4 py-2.5 rounded shadow-brutal transition-all ${
                          isVoted
                            ? "bg-green-500 text-white shadow-none translate-x-[2px] translate-y-[2px] cursor-not-allowed"
                            : "bg-yellow-festival text-[#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                        }`}
                      >
                        {isVoted ? (
                          <>
                            <Check size={14} /> VOTED
                          </>
                        ) : (
                          <>
                            <Flame size={14} /> VOTE NOW
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEXT EVENT TICKETS COUNTDOWN */}
      <section id="register" className="py-24 px-6 border-b-3 border-[#121212] bg-[#FAF8F5] text-[#121212] relative overflow-hidden">
        <div className="absolute left-0 top-0 w-2/3 h-full bg-[#FFDE4D]/25 rotate-[-2deg] origin-top-left -z-0 pointer-events-none" />

        <div className="max-w-4xl mx-auto border-4 border-[#121212] bg-white p-8 md:p-12 rounded shadow-brutal relative z-10">
          <div className="absolute -top-5 right-8 brutal-tape-red uppercase font-black tracking-widest text-xs">
            NEXT EVENT TICKETS
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1">
                <Calendar size={14} /> JULY 26, 2026 • 07:00 PM
              </span>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl uppercase tracking-tighter">
                {events[0].title}
              </h2>
              <div className="flex flex-wrap gap-4 text-xs font-black uppercase text-gray-600">
                <span className="flex items-center gap-1 bg-[#121212]/10 px-3 py-1 rounded">
                  <MapPin size={12} /> {events[0].venue.split(",")[0]}
                </span>
                <span className="flex items-center gap-1 bg-[#121212]/10 px-3 py-1 rounded">
                  <Clock size={12} /> Live Audience Voting
                </span>
              </div>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-4 text-center border-y-3 border-[#121212] py-6 my-6 bg-[#FAF8F5]">
              <div className="space-y-1">
                <span className="font-display font-black text-3xl md:text-5xl text-[#121212] block">
                  {String(timeLeft.days).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">DAYS</span>
              </div>
              <div className="space-y-1">
                <span className="font-display font-black text-3xl md:text-5xl text-[#121212] block">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">HOURS</span>
              </div>
              <div className="space-y-1">
                <span className="font-display font-black text-3xl md:text-5xl text-[#121212] block">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">MINS</span>
              </div>
              <div className="space-y-1">
                <span className="font-display font-black text-3xl md:text-5xl text-[#121212] block">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">SECS</span>
              </div>
            </div>

            {/* Registration Progress */}
            <div className="space-y-2">
              <div className="flex justify-between font-black uppercase text-xs">
                <span>Registration Cap Progress</span>
                <span className="text-red-stage">
                  {events[0].audienceCount} / {events[0].registrationLimit} Seats Filled
                </span>
              </div>
              <div className="w-full h-6 border-3 border-[#121212] bg-[#FAF8F5] rounded overflow-hidden p-0.5">
                <div
                  className="h-full bg-red-stage border-r-2 border-[#121212] transition-all duration-500"
                  style={{ width: `${(events[0].audienceCount / events[0].registrationLimit) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 justify-between border-t-2 border-[#121212]/10">
              <p className="text-sm font-space text-gray-600 font-bold max-w-sm">
                Each ticket enters you as a verified judge inside the arena. Vote on-stage live using your ticket code.
              </p>
              
              {registeredEvents.includes("stageverse-3.0") ? (
                <div className="w-full sm:w-auto bg-green-500 text-white font-black px-8 py-4 border-3 border-[#121212] shadow-brutal flex items-center justify-center gap-2 rounded select-none">
                  <Check size={18} /> REGISTERED SUCCESSFULLY
                </div>
              ) : (
                <button
                  onClick={() => handleRegister("stageverse-3.0")}
                  className="w-full sm:w-auto bg-yellow-festival text-[#121212] font-black px-8 py-4 border-3 border-[#121212] shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded uppercase tracking-wider text-base"
                >
                  CLAIM FREE SPOT
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. HIGHLIGHTS GALLERY MASONRY */}
      <section className="py-24 px-6 border-b-3 border-[#121212] bg-[#121212] text-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <span className="brutal-tape-red">THE FEED</span>
              <h2 className="font-display font-extrabold text-5xl tracking-tighter">
                CULTURAL HIGHLIGHTS
              </h2>
            </div>
            <p className="font-space text-sm text-[#FAF8F5]/60 max-w-xs">
              Moments from the open mics, stage rehearsals, and underground circles.
            </p>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            <div className="break-inside-avoid border-3 border-white p-2 bg-[#0F0E0E] rounded shadow-brutal-light hover:rotate-[1deg] transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop"
                alt="Singing on stage"
                className="w-full h-auto object-cover rounded border border-white"
              />
              <div className="p-3 font-display font-bold text-sm text-yellow-festival">Sufi Acoustic Jam Session</div>
            </div>

            <div className="break-inside-avoid border-3 border-white p-2 bg-[#0F0E0E] rounded shadow-brutal-light hover:rotate-[-1deg] transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=600&h=800&fit=crop"
                alt="Standup comedy open mic"
                className="w-full h-auto object-cover rounded border border-white"
              />
              <div className="p-3 font-display font-bold text-sm text-[#FAF8F5]">Rajkot Stand-up Special Round</div>
            </div>

            <div className="break-inside-avoid border-3 border-white p-2 bg-[#0F0E0E] rounded shadow-brutal-light hover:rotate-[2deg] transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=350&fit=crop"
                alt="Rapper with crowd"
                className="w-full h-auto object-cover rounded border border-white"
              />
              <div className="p-3 font-display font-bold text-sm text-red-stage">D-Vibe Headlining Surat 2.0</div>
            </div>

            <div className="break-inside-avoid border-3 border-white p-2 bg-[#0F0E0E] rounded shadow-brutal-light hover:rotate-[-2deg] transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=600&fit=crop"
                alt="Festival lights"
                className="w-full h-auto object-cover rounded border border-white"
              />
              <div className="p-3 font-display font-bold text-sm text-yellow-festival">Element Talks Rehearsals</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. JOIN THE MOVEMENT CTA */}
      <section className="py-24 px-6 bg-yellow-festival text-[#121212] relative overflow-hidden">
        <div className="absolute right-[5%] top-[-10%] rotate-12 text-[15vw] font-display font-black text-white/10 select-none pointer-events-none">
          CREATOR
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="font-display font-extrabold text-5xl md:text-7xl uppercase tracking-tighter">
            DON'T JUST WATCH. <br />
            <span className="text-red-stage">TAKE THE STAGE.</span>
          </h2>
          <p className="font-space text-lg md:text-xl font-bold max-w-xl mx-auto text-[#121212]/80">
            Submit your profile to join Element 5. Be discovered by brands, discover collaborators, and get shortlisted for upcoming StageVerse open mics.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            <Link
              href="/artists"
              className="bg-[#121212] text-[#FAF8F5] border-3 border-[#121212] px-8 py-4 font-black uppercase tracking-wider text-base shadow-brutal-white shadow-brutal-white-hover rounded"
            >
              CREATE CREATOR PROFILE
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

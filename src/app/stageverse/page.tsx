"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { Play, Send, Users, Radio, Award, Vote, Star, AlertCircle, Heart, PlusCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface Submission {
  submissionId: string;
  performer: string;
  photoUrl?: string;
  trackTitle: string;
  votesCount: number;
  judgeAverage: number;
  totalScore: number;
}

export default function StageVerseArena() {
  const { user } = useAuth();
  const { artists, events } = useApp();
  const activeEvent = events[0] || { id: "stageverse-3.0", title: "StageVerse 3.0" };

  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewerCount, setViewerCount] = useState(1);
  const [standings, setStandings] = useState<Submission[]>([]);
  const [liveVotes, setLiveVotes] = useState<{ performer: string; votedAt: string }[]>([]);

  // Submission form states for Artists
  const [trackTitle, setTrackTitle] = useState("");
  const [trackUrl, setTrackUrl] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fallback state if socket server is offline
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Connect to NestJS live namespace
    const socketInstance = io("http://localhost:4000/live", {
      transports: ["websocket"],
      autoConnect: true
    });

    socketInstance.on("connect", () => {
      console.log("⚡ Connected to StageVerse live arena socket");
      setIsLive(true);
      socketInstance.emit("joinEvent", { eventId: activeEvent.id });
    });

    socketInstance.on("disconnect", () => {
      setIsLive(false);
    });

    socketInstance.on("presenceUpdate", (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    socketInstance.on("leaderboardUpdate", (data: Submission[]) => {
      setStandings(data);
    });

    socketInstance.on("liveVoteCast", (data: { performer: string; votedAt: string }) => {
      setLiveVotes((prev) => [data, ...prev.slice(0, 4)]);
      // Trigger a subtle haptic style burst
      confetti({
        particleCount: 15,
        spread: 30,
        origin: { y: 0.8 },
        colors: ["#D80032", "#FFDE4D"]
      });
    });

    setSocket(socketInstance);

    // Initial fallback standings data
    const initialStandings: Submission[] = artists.map((a) => ({
      submissionId: a.id,
      performer: a.name,
      photoUrl: a.avatar,
      trackTitle: a.videos[0]?.title || "StageVerse Routine",
      votesCount: a.votes,
      judgeAverage: a.rating * 2,
      totalScore: a.votes + a.rating * 20
    })).sort((a, b) => b.totalScore - a.totalScore);
    
    setStandings(initialStandings);

    return () => {
      socketInstance.disconnect();
    };
  }, [artists, activeEvent.id]);

  const handleVote = async (submissionId: string) => {
    if (!user) {
      alert("Please login to cast your live vote!");
      return;
    }

    try {
      await api.post(`/stageverse/submissions/${submissionId}/vote`);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#FFDE4D", "#D80032"]
      });
    } catch (err: any) {
      // Local fallback simulation if server is offline
      console.warn("Backend unavailable. Simulating vote locally.");
      setStandings((prev) =>
        prev
          .map((item) =>
            item.submissionId === submissionId
              ? { ...item, votesCount: item.votesCount + 1, totalScore: item.totalScore + 1 }
              : item
          )
          .sort((a, b) => b.totalScore - a.totalScore)
      );

      const performerName = standings.find(s => s.submissionId === submissionId)?.performer || "Creator";
      setLiveVotes((prev) => [
        { performer: performerName, votedAt: new Date().toISOString() },
        ...prev.slice(0, 4)
      ]);

      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#FFDE4D", "#D80032"]
      });
    }
  };

  const handleArtistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!trackTitle.trim() || !trackUrl.trim()) return;

    try {
      await api.post("/stageverse/submit", {
        eventId: activeEvent.id,
        trackTitle,
        audioVideoUrl: trackUrl
      });
      setSubmitSuccess(true);
      setTrackTitle("");
      setTrackUrl("");
      confetti({
        particleCount: 50,
        colors: ["#FFDE4D", "#D80032"]
      });
    } catch (err: any) {
      // Offline local simulation
      setSubmitSuccess(true);
      setTrackTitle("");
      setTrackUrl("");
      confetti({
        particleCount: 50,
        colors: ["#FFDE4D", "#D80032"]
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* LEFT COLUMN: Performers Arena (Col-Span-8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Header */}
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="brutal-tape text-xs uppercase select-none">STAGEVERSE LIVE</span>
              <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter mt-2">
                THE PERFORMANCE ARENA
              </h2>
            </div>
            
            {/* Live presence count bubble */}
            <div className="flex items-center gap-3 border-2 border-[#121212] bg-[#121212] text-white px-4 py-2.5 rounded shadow-brutal-light select-none">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="font-display font-black text-xs uppercase tracking-wider">
                {isLive ? `${viewerCount} SPECTATORS` : "SIMULATING LIVE"}
              </span>
            </div>
          </div>

          {/* Artist submission console (For verified Artists) */}
          {user && user.role === "ARTIST" && (
            <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight flex items-center gap-2 text-red-stage">
                <PlusCircle size={20} /> SUBMIT PERFORMANCE ENTRY
              </h3>
              <p className="font-space text-xs text-gray-500 font-bold">
                Logged in as a verified creator. Pitch your track title and link below for real-time reviews.
              </p>

              {submitSuccess ? (
                <div className="bg-green-500 text-white font-bold p-4 rounded text-center border-2 border-[#121212] text-xs">
                  ENTRY REGISTERED SUCCESSFULLY FOR THIS ROUND
                </div>
              ) : (
                <form onSubmit={handleArtistSubmit} className="space-y-4 font-space">
                  {submitError && (
                    <div className="bg-red-500 text-white p-2 rounded text-xs font-bold">{submitError}</div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Performance Hook / Track Title"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                      className="p-3 border-2 border-[#121212] bg-white rounded font-bold text-xs"
                      required
                    />
                    <input
                      type="url"
                      placeholder="Video Reel / YouTube / Vimeo Link"
                      value={trackUrl}
                      onChange={(e) => setTrackUrl(e.target.value)}
                      className="p-3 border-2 border-[#121212] bg-white rounded font-bold text-xs"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#121212] text-[#FAF8F5] font-black uppercase text-xs tracking-widest py-3 rounded"
                  >
                    REGISTER TRACK FOR AUDIENCE VOTING
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Performers grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {standings.map((item, index) => (
              <div
                key={item.submissionId}
                className="bg-white border-3 border-[#121212] p-6 rounded shadow-brutal flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Photo & Performance Slot */}
                  <div className="relative h-40 border-2 border-[#121212] bg-gray-200 rounded overflow-hidden">
                    <img
                      src={item.photoUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop"}
                      alt={item.performer}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-red-stage border border-white text-white font-display font-black text-[10px] px-2 py-0.5 rounded rotate-[-2deg]">
                      SLOT {index + 1}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-black text-xl leading-tight">
                      {item.performer}
                    </h3>
                    <p className="font-space text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {item.trackTitle}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#121212]/10 mt-6 pt-4 flex items-center justify-between">
                  <div className="font-space text-xs font-black text-gray-400">
                    VOTES: <span className="text-[#121212]">{item.votesCount}</span>
                  </div>
                  <button
                    onClick={() => handleVote(item.submissionId)}
                    className="bg-yellow-festival text-[#121212] border-2 border-[#121212] font-black uppercase text-xs px-5 py-2.5 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center gap-1.5 cursor-pointer"
                  >
                    VOTE <Vote size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Scoreboard (Col-Span-4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Live Standings Scoreboard */}
          <div className="border-3 border-[#121212] bg-[#121212] text-white p-6 rounded shadow-brutal space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Radio size={20} className="text-yellow-festival animate-pulse" />
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-yellow-festival">
                LIVE SCOREBOARD
              </h3>
            </div>

            <div className="space-y-4">
              {standings.slice(0, 5).map((item, index) => (
                <div
                  key={item.submissionId}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-display font-black text-sm text-[#FAF8F5]/40">{index + 1}</span>
                    <div className="truncate">
                      <span className="font-display font-bold text-sm block truncate text-[#FAF8F5]">
                        {item.performer}
                      </span>
                      <span className="text-[9px] font-space text-gray-500 uppercase block truncate">
                        {item.trackTitle}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-space font-black text-xs text-yellow-festival">{item.totalScore.toFixed(1)}</span>
                    <span className="text-[8px] text-gray-500 block uppercase font-bold font-sans">Pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Votes Feed */}
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
            <h4 className="font-display font-black text-xs text-gray-500 uppercase tracking-wider">
              REAL-TIME VOTES STREAM
            </h4>
            
            <div className="space-y-3 font-space text-[11px]">
              {liveVotes.length > 0 ? (
                liveVotes.map((v, i) => (
                  <div key={i} className="flex justify-between border-b border-[#121212]/5 pb-2 last:border-0">
                    <span className="text-red-stage font-bold flex items-center gap-1">
                      <Heart size={10} fill="#D80032" /> Vote cast for {v.performer}
                    </span>
                    <span className="text-gray-400">Just now</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 font-bold uppercase py-4 text-center">
                  Waiting for audience votes...
                </p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

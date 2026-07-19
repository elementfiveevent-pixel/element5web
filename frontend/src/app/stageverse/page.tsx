"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { Play, Send, Users, Radio, Award, Vote, Star, AlertCircle, Heart, PlusCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useToast } from "@/components/ui/Toast";

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
  const { showToast } = useToast();
  const { artists, events } = useApp();
  const activeEvent = events[0] || { id: "stageverse-3.0", title: "StageVerse 3.0" };

  const [socket, setSocket] = useState<Socket | null>(null);
  const [viewerCount, setViewerCount] = useState(1);
  const [standings, setStandings] = useState<Submission[]>([]);
  const [liveVotes, setLiveVotes] = useState<{ performer: string; votedAt: string }[]>([]);
  const [isVotingOpen, setIsVotingOpen] = useState(false);



  // Fallback state if socket server is offline
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Fetch initial voting status
    if (activeEvent.id) {
      api.get(`/stageverse/${activeEvent.id}/voting/status`)
        .then((res: any) => {
          setIsVotingOpen(res.open);
        })
        .catch(() => {});
    }

    // Connect to NestJS live namespace
    const socketUrl = api.baseUrl.replace(/\/$/, "");
    const socketInstance = io(`${socketUrl}/live`, {
      transports: ["websocket"],
      autoConnect: true
    });

    socketInstance.on("connect", () => {
      showToast("Connected to StageVerse live arena!", "success");
      setIsLive(true);
      socketInstance.emit("joinEvent", { eventId: activeEvent.id });
    });

    socketInstance.on("disconnect", () => {
      setIsLive(false);
    });

    socketInstance.on("presenceUpdate", (data: { viewerCount: number }) => {
      setViewerCount(data.viewerCount);
    });

    socketInstance.on("votingStatusUpdate", (data: { open: boolean }) => {
      setIsVotingOpen(data.open);
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





  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="brutal-tape text-xs uppercase select-none">STAGEVERSE LIVE</span>
            <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter mt-2">
              THE PERFORMANCE ARENA
            </h2>
          </div>
          
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

        {isVotingOpen && (
          <div className="border-3 border-[#121212] bg-[#FFDE4D] p-5 rounded shadow-brutal flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-display font-black text-sm uppercase">CAST YOUR VOTE LIVE!</span>
              <p className="font-space text-xs text-gray-700 font-bold">Live voting is open for {activeEvent.title}! Support your favorite performers in the arena.</p>
            </div>
            <Link
              href={`/events/${activeEvent.id}`}
              className="bg-[#121212] text-[#FAF8F5] font-display font-black text-xs uppercase px-5 py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex-shrink-0 cursor-pointer"
            >
              VOTE IN ARENA
            </Link>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-8 rounded shadow-brutal space-y-6">
          <div>
            <h3 className="font-display font-black text-2xl uppercase tracking-tighter">STAGEVERSE EVENT ARCHIVE & SCHEDULE</h3>
            <p className="font-space text-xs text-gray-500 font-bold mt-1">Explore upcoming arenas and past live events.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upcoming Events Column */}
            <div className="space-y-4">
              <span className="brutal-tape text-xs uppercase bg-[#FFDE4D] text-[#121212] select-none inline-block">UPCOMING ARENAS</span>
              <div className="space-y-4">
                {events.filter(e => e.type === "StageVerse" && !e.isCompleted).length > 0 ? (
                  events.filter(e => e.type === "StageVerse" && !e.isCompleted).map(evt => (
                    <Link key={evt.id} href={`/events/${evt.id}`} className="border-2 border-[#121212] bg-white p-4 rounded shadow-brutal-light flex items-start gap-4 hover:bg-gray-50 transition-colors block">
                      <div className="w-16 h-16 border border-[#121212] rounded overflow-hidden flex-shrink-0">
                        <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h4 className="font-display font-black text-sm uppercase truncate">{evt.title}</h4>
                        <p className="font-space text-[10px] text-gray-500 font-bold uppercase mt-0.5">{evt.date} @ {evt.time}</p>
                        <p className="font-space text-[11px] text-gray-700 truncate mt-1">{evt.description}</p>
                      </div>
                      <span className="self-center bg-yellow-festival text-[#121212] border-2 border-[#121212] text-[9px] font-black uppercase px-2.5 py-1.5 rounded shadow-sm">REGISTER</span>
                    </Link>
                  ))
                ) : (
                  <div className="border-2 border-dashed border-[#121212]/20 bg-white p-6 rounded text-center">
                    <p className="font-space text-xs text-gray-400 font-bold">No upcoming StageVerse events scheduled.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Past Events Column */}
            <div className="space-y-4">
              <span className="brutal-tape text-xs uppercase bg-[#121212] text-white select-none inline-block">PAST ARENAS</span>
              <div className="space-y-4">
                {events.filter(e => e.type === "StageVerse" && e.isCompleted).length > 0 ? (
                  events.filter(e => e.type === "StageVerse" && e.isCompleted).map(evt => (
                    <Link key={evt.id} href={`/events/${evt.id}`} className="border-2 border-[#121212]/10 bg-white/70 p-4 rounded flex items-start gap-4 opacity-80 hover:opacity-100 transition-all block">
                      <div className="w-16 h-16 border border-[#121212]/10 rounded overflow-hidden flex-shrink-0 grayscale">
                        <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h4 className="font-display font-bold text-sm uppercase truncate text-gray-700">{evt.title}</h4>
                        <p className="font-space text-[10px] text-gray-400 font-bold uppercase mt-0.5">{evt.date}</p>
                        <span className="inline-block bg-[#121212]/10 text-[#121212] text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-1.5">COMPLETED</span>
                      </div>
                      <span className="self-center bg-gray-200 text-gray-700 text-[9px] font-black uppercase px-2.5 py-1.5 rounded">VIEW</span>
                    </Link>
                  ))
                ) : (
                  <div className="border-2 border-dashed border-[#121212]/20 bg-white p-6 rounded text-center">
                    <p className="font-space text-xs text-gray-400 font-bold">No past StageVerse events found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

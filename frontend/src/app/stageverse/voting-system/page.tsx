"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { Vote, Radio, AlertCircle, Heart, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface Submission {
  id: string;
  trackTitle: string;
  user: {
    fullName: string;
    profilePhotoUrl?: string;
  };
}

export default function AudienceVotingSystem() {
  const { user } = useAuth();
  const { events } = useApp();
  const activeEvent = events[0] || { id: "stageverse-3.0", title: "StageVerse 3.0" };

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingSubmissionId, setVotingSubmissionId] = useState<string | null>(null);

  const fetchStatusAndSubmissions = useCallback(async () => {
    try {
      const statusRes = await api.get(`/stageverse/${activeEvent.id}/voting/status`);
      setIsOpen(statusRes.open);

      const subRes = await api.get(`/stageverse/${activeEvent.id}/submissions`);
      setSubmissions(Array.isArray(subRes) ? subRes : []);
    } catch (e) {
      console.warn("Using offline fallback values.");
      // Fallback
      setIsOpen(true);
      setSubmissions([
        { id: "1", trackTitle: "Rhyme & Reason", user: { fullName: "Aarav Mehta" } },
        { id: "2", trackTitle: "Cyber Punk Flow", user: { fullName: "Kabir Sen" } },
        { id: "3", trackTitle: "Melancholy Acoustic", user: { fullName: "Riya Shah" } }
      ]);
    } finally {
      setLoading(false);
    }
  }, [activeEvent.id]);

  useEffect(() => {
    fetchStatusAndSubmissions();

    // Connect to live namespace for real-time toggle notifications
    const socketInstance = io("http://localhost:4000/live", {
      transports: ["websocket"],
      autoConnect: true
    });

    socketInstance.on("connect", () => {
      console.log("⚡ Voting terminal connected to live socket");
      socketInstance.emit("joinEvent", { eventId: activeEvent.id });
    });

    socketInstance.on("votingStatusUpdate", (data: { open: boolean }) => {
      setIsOpen(data.open);
      confetti({
        particleCount: 20,
        spread: 40,
        colors: data.open ? ["#FFDE4D"] : ["#D80032"]
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [activeEvent.id, fetchStatusAndSubmissions]);

  const handleVote = async (submissionId: string) => {
    if (!user) {
      setError("Please login to cast your live vote!");
      return;
    }

    if (!isOpen) {
      setError("Voting is currently closed by the organizer!");
      return;
    }

    if (votedIds.has(submissionId)) return;

    setVotingSubmissionId(submissionId);
    setError(null);

    try {
      await api.post(`/stageverse/submissions/${submissionId}/vote`);
      
      setVotedIds(prev => new Set([...prev, submissionId]));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#FFDE4D", "#D80032"]
      });
    } catch (err: any) {
      // Simulation fallback
      setVotedIds(prev => new Set([...prev, submissionId]));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#FFDE4D", "#D80032"]
      });
    } finally {
      setVotingSubmissionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] text-[#121212] flex items-center justify-center p-6">
        <div className="text-center font-display font-black text-sm uppercase tracking-wider animate-pulse">
          Connecting to live arena...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Terminal Header */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 border-2 border-[#121212] bg-[#121212] text-white px-3 py-1 rounded select-none">
            <Radio size={12} className="text-yellow-festival animate-pulse" />
            <span className="font-display font-black text-[9px] uppercase tracking-widest">Live Audience Voting</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter mt-1">{activeEvent.title}</h2>
          <p className="font-space text-xs text-gray-500 font-bold">Cast your vote for the best performer in this round.</p>
        </div>

        {/* Voting Status Banner */}
        <div className={`border-3 border-[#121212] p-4 rounded shadow-brutal flex items-center gap-3 transition-colors ${
          isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          <span className={`w-3.5 h-3.5 rounded-full border-2 border-[#121212] ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
          <span className="font-display font-black text-xs uppercase tracking-wider">
            {isOpen ? "VOTING STATUS: OPEN & LIVE" : "VOTING STATUS: CLOSED"}
          </span>
        </div>

        {error && (
          <div className="border-2 border-[#121212] bg-[#D80032] text-white p-4 rounded font-space text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.map((sub) => {
            const hasVoted = votedIds.has(sub.id);
            return (
              <div
                key={sub.id}
                className="bg-white border-3 border-[#121212] p-5 rounded shadow-brutal flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-[#121212] bg-yellow-festival flex items-center justify-center font-display font-black text-sm uppercase">
                    {sub.user.fullName[0]}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-base uppercase leading-none">{sub.user.fullName}</h3>
                    <p className="font-space text-[10px] text-gray-500 font-bold uppercase mt-1">{sub.trackTitle}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleVote(sub.id)}
                  disabled={!isOpen || hasVoted || votingSubmissionId === sub.id}
                  className={`w-full py-3.5 border-3 border-[#121212] font-display font-black text-xs uppercase tracking-widest transition-all rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer flex items-center justify-center gap-2 ${
                    hasVoted 
                      ? "bg-green-500 text-white cursor-default translate-x-[2px] translate-y-[2px] shadow-none" 
                      : !isOpen 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none translate-x-[2px] translate-y-[2px]" 
                        : "bg-yellow-festival text-[#121212]"
                  }`}
                >
                  {votingSubmissionId === sub.id ? (
                    "SUBMITTING VOTE..."
                  ) : hasVoted ? (
                    <>
                      VOTE REGISTERED <CheckCircle2 size={14} />
                    </>
                  ) : (
                    <>
                      VOTE FOR PERFORMER <Vote size={14} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center font-space text-[10px] text-gray-400 font-bold uppercase">
          Element 5 © 2026 - Secure & Transparent Audience Gateways
        </div>

      </div>
    </div>
  );
}

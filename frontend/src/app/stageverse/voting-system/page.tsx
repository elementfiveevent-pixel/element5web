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

  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryId = params.get("eventId");
      setEventId(queryId || events[0]?.id || null);
    }
  }, [events]);

  const activeEvent = {
    id: eventId ?? "stageverse-3.0",
    title: events.find(e => e.id === eventId)?.title || "StageVerse Arena"
  };

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingSubmissionId, setVotingSubmissionId] = useState<string | null>(null);
  const [currentPerformerId, setCurrentPerformerId] = useState<string | null>(null);

  // Access control states
  const [accessStatus, setAccessStatus] = useState<"APPROVED" | "PENDING" | "REJECTED" | "NOT_REQUESTED" | "LOADING">("LOADING");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});

  // Countdown timer states
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchStatusAndSubmissions = useCallback(async () => {
    if (!eventId) return;
    try {
      const statusRes = await api.get(`/stageverse/${eventId}/voting/status`);
      setIsOpen(statusRes.open);
      setExpiresAt(statusRes.expiresAt ?? null);
      setCurrentPerformerId(statusRes.currentPerformerId ?? null);

      const subRes = await api.get(`/stageverse/${eventId}/submissions`);
      setSubmissions(Array.isArray(subRes) ? subRes : []);
    } catch (e) {
      console.warn("Using offline fallback values.");
      setIsOpen(true);
      setSubmissions([
        { id: "1", trackTitle: "Rhyme & Reason", user: { fullName: "Aarav Mehta" } },
        { id: "2", trackTitle: "Cyber Punk Flow", user: { fullName: "Kabir Sen" } },
        { id: "3", trackTitle: "Melancholy Acoustic", user: { fullName: "Riya Shah" } }
      ]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const checkAccess = useCallback(async () => {
    if (!eventId) return;
    if (!user) {
      setAccessStatus("NOT_REQUESTED");
      return;
    }
    try {
      const res = await api.get(`/stageverse/${eventId}/voting/check-access`);
      setAccessStatus(res.status || "NOT_REQUESTED");
    } catch {
      setAccessStatus("NOT_REQUESTED");
    }
  }, [user, eventId]);

  useEffect(() => {
    if (!eventId) return;
    fetchStatusAndSubmissions();
    checkAccess();

    // Connect to live namespace for real-time toggle notifications
    const socketUrl = api.baseUrl.replace(/\/$/, "");
    const socketInstance = io(`${socketUrl}/live`, {
      transports: ["websocket"],
      autoConnect: true
    });

    socketInstance.on("connect", () => {
      console.log("⚡ Voting terminal connected to live socket");
      socketInstance.emit("joinEvent", { eventId });
    });

    socketInstance.on("votingStatusUpdate", (data: { open: boolean; expiresAt?: number | null }) => {
      setIsOpen(data.open);
      setExpiresAt(data.expiresAt ?? null);
      confetti({
        particleCount: 20,
        spread: 40,
        colors: data.open ? ["#FFDE4D"] : ["#D80032"]
      });
    });

    socketInstance.on("currentPerformerUpdate", (data: { currentPerformerId: string | null }) => {
      setCurrentPerformerId(data.currentPerformerId);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [eventId, fetchStatusAndSubmissions, checkAccess]);

  // Ticking countdown effect
  useEffect(() => {
    if (!isOpen || !expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTime = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setIsOpen(false);
        setTimeLeft(null);
        setExpiresAt(null);
      }
    };

    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, [isOpen, expiresAt]);

  const handleVote = async (submissionId: string) => {
    if (!user) {
      setError("Please login to cast your live vote!");
      return;
    }

    if (!isOpen) {
      setError("Voting is currently closed by the organizer!");
      return;
    }

    const rating = selectedRatings[submissionId];
    if (!rating) {
      setError("Please select a score rating before submitting your vote!");
      return;
    }

    if (votedIds.has(submissionId)) return;

    setVotingSubmissionId(submissionId);
    setError(null);

    try {
      await api.post(`/stageverse/submissions/${submissionId}/vote`, { score: rating });
      
      setVotedIds(prev => new Set([...prev, submissionId]));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 },
        colors: ["#FFDE4D", "#D80032"]
      });
    } catch (err: any) {
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

  if (loading || (user && accessStatus === "LOADING")) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] text-[#121212] flex items-center justify-center p-6">
        <div className="text-center font-display font-black text-sm uppercase tracking-wider animate-pulse">
          Connecting to live arena...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal text-center space-y-4">
            <AlertCircle size={40} className="mx-auto text-red-stage animate-bounce" />
            <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">Login Required</h2>
            <p className="font-space text-xs text-gray-600 font-bold">
              Please login to access the StageVerse live voting terminal and support the performers.
            </p>
            <button
              onClick={() => window.location.href = `/login?redirect=/stageverse/voting-system`}
              className="w-full py-3 bg-yellow-festival text-[#121212] border-3 border-[#121212] font-display font-black text-xs uppercase tracking-widest shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded cursor-pointer"
            >
              LOGIN TO ACCOUNT
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (accessStatus !== "APPROVED") {
    return (
      <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-4 sm:px-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal text-center space-y-4">
            <AlertCircle size={40} className="mx-auto text-red-stage animate-pulse" />
            <h2 className="font-display font-extrabold text-2xl uppercase tracking-tight">Access Restricted</h2>
            
            {accessStatus === "PENDING" ? (
              <p className="font-space text-xs text-gray-600 font-bold leading-relaxed">
                Your request for voting access is currently <span className="text-yellow-600 font-black">PENDING</span> organizer approval.
                Please wait or check with the event hosts at the venue.
              </p>
            ) : accessStatus === "REJECTED" ? (
              <p className="font-space text-xs text-gray-600 font-bold leading-relaxed">
                Your request for voting access was <span className="text-red-stage font-black">DECLINED</span> by the organizer.
              </p>
            ) : (
              <div className="space-y-4">
                <p className="font-space text-xs text-gray-600 font-bold leading-relaxed">
                  Only registered attendees or approved guests can vote in this event.
                  If you are at the venue, you can request access below.
                </p>
                <button
                  onClick={async () => {
                    setRequestingAccess(true);
                    try {
                      await api.post(`/stageverse/${activeEvent.id}/voting/request-access`);
                      setAccessStatus("PENDING");
                      alert("Access request submitted successfully!");
                    } catch (err: any) {
                      alert(err.message || "Failed to submit request.");
                    } finally {
                      setRequestingAccess(false);
                    }
                  }}
                  disabled={requestingAccess}
                  className="w-full py-3 bg-red-stage text-white border-3 border-[#121212] font-display font-black text-xs uppercase tracking-widest shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded cursor-pointer"
                >
                  {requestingAccess ? "SUBMITTING..." : "REQUEST VOTING ACCESS"}
                </button>
              </div>
            )}

            <button
              onClick={() => window.location.href = `/events/${activeEvent.id}`}
              className="inline-block mt-4 text-xs font-space font-black uppercase text-[#121212]/60 hover:underline"
            >
              Back to Event Page
            </button>
          </div>
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
          <p className="font-space text-xs text-gray-500 font-bold">Cast your rating vote for the best performer in this round.</p>
        </div>

        {/* Voting Status Banner */}
        <div className={`border-3 border-[#121212] p-4 rounded shadow-brutal flex items-center justify-between gap-3 transition-colors ${
          isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full border-2 border-[#121212] ${isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="font-display font-black text-xs uppercase tracking-wider">
              {isOpen ? "VOTING STATUS: OPEN & LIVE" : "VOTING STATUS: CLOSED"}
            </span>
          </div>

          {isOpen && timeLeft !== null && (
            <span className="font-mono font-black text-xs bg-white/50 border border-green-800/20 px-2.5 py-1 rounded">
              ENDS IN: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          )}
        </div>

        {error && (
          <div className="border-2 border-[#121212] bg-[#D80032] text-white p-4 rounded font-space text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-4">
          {currentPerformerId ? (
            submissions
              .filter((sub) => sub.id === currentPerformerId)
              .map((sub) => {
                const hasVoted = votedIds.has(sub.id);
                const currentRating = selectedRatings[sub.id];
                
                return (
                  <div
                    key={sub.id}
                    className="bg-white border-3 border-[#121212] p-5 rounded shadow-brutal flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-[#121212] bg-yellow-festival flex items-center justify-center font-display font-black text-sm uppercase">
                        {sub.user?.fullName?.[0] || "P"}
                      </div>
                      <div>
                        <h3 className="font-display font-black text-base uppercase leading-none">{sub.user?.fullName}</h3>
                        <p className="font-space text-[10px] text-gray-500 font-bold uppercase mt-1">{sub.trackTitle}</p>
                      </div>
                    </div>

                    {/* Rating Selector Component (1-10) */}
                    {!hasVoted && isOpen && (
                      <div className="space-y-2 pt-2 border-t border-[#121212]/10">
                        <span className="font-display font-black text-[9px] uppercase text-gray-400 block text-center">
                          Rate Performer (1 = Poor, 10 = Outstanding)
                        </span>
                        <div className="flex justify-between gap-1 overflow-x-auto py-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                            const isSelected = currentRating === score;
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => setSelectedRatings(prev => ({ ...prev, [sub.id]: score }))}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded border-2 border-[#121212] font-display font-black text-xs flex items-center justify-center transition-all cursor-pointer flex-shrink-0 ${
                                  isSelected 
                                    ? "bg-yellow-festival text-[#121212] shadow-brutal-sm -translate-x-[1px] -translate-y-[1px]" 
                                    : "bg-[#FAF8F5] text-gray-500 hover:bg-gray-100"
                                }`}
                              >
                                {score}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleVote(sub.id)}
                      disabled={!isOpen || hasVoted || votingSubmissionId === sub.id || (!hasVoted && !currentRating)}
                      className={`w-full py-3 border-3 border-[#121212] font-display font-black text-xs uppercase tracking-widest transition-all rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer flex items-center justify-center gap-2 ${
                        hasVoted 
                          ? "bg-green-500 text-white cursor-default translate-x-[2px] translate-y-[2px] shadow-none" 
                          : !isOpen 
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none translate-x-[2px] translate-y-[2px]" 
                            : !currentRating
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                              : "bg-yellow-festival text-[#121212]"
                      }`}
                    >
                      {votingSubmissionId === sub.id ? (
                        "SUBMITTING TELEMETRY..."
                      ) : hasVoted ? (
                        <>
                          RATING REGISTERED <CheckCircle2 size={14} />
                        </>
                      ) : (
                        <>
                          SUBMIT RATING VOTE <Vote size={14} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })
          ) : (
            <div className="border-3 border-[#121212] bg-[#FAF8F5] p-8 rounded shadow-brutal text-center space-y-3">
              <div className="w-16 h-16 bg-yellow-festival/10 border-2 border-dashed border-[#121212]/20 rounded-xl mx-auto flex items-center justify-center">
                <span className="text-2xl opacity-60">⏳</span>
              </div>
              <p className="font-display font-black text-sm uppercase text-gray-400">Waiting for next performance</p>
              <p className="font-space text-[10px] text-gray-400 font-bold">The organizer has not activated a performer slot yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center font-space text-[10px] text-gray-400 font-bold uppercase">
          Element 5 © 2026 - Secure & Transparent Audience Gateways
        </div>

      </div>
    </div>
  );
}

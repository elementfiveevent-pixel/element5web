"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { io, Socket } from "socket.io-client";
import { Radio, Volume2, Trophy, Flame, Music, Sparkles } from "lucide-react";
import { api } from "@/lib/api";

const InstagramIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface Performer {
  id: string;
  trackTitle: string;
  performerName?: string;
  status?: string;
  performanceOrder?: number;
  user?: {
    fullName?: string;
    avatarUrl?: string;
    instagram?: string;
  };
}

interface Standing {
  id: string;
  trackTitle: string;
  user?: {
    fullName?: string;
    avatarUrl?: string;
  };
  totalVotes: number;
  averageScore: number;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number;
}

function StageScreenContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") || "stageverse-3.0";

  // Real-time Event States
  const [socket, setSocket] = useState<Socket | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("StageVerse Live Arena");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPerformerId, setCurrentPerformerId] = useState<string | null>(null);
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Timer States
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [performanceLive, setPerformanceLive] = useState(false);
  const [performanceExpiresAt, setPerformanceExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Interaction & Audio States
  const [hasInteracted, setHasInteracted] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [hypeLevel, setHypeLevel] = useState(0);

  // Active Timer Calculation (Voting timer takes priority if active, else Performance timer)
  const isPerfLive = performanceLive || (isPanelOpen && !isOpen);
  const activeExpiresAt = isOpen ? expiresAt : performanceExpiresAt ? performanceExpiresAt : isPerfLive ? (performanceExpiresAt || expiresAt) : null;

  const playedChimesRef = useRef<Set<string>>(new Set());

  // Synthesize Web Audio API Chimes (warning & end timers)
  const playChime = useCallback((type: "warning" | "end", key: string) => {
    if (playedChimesRef.current.has(key)) return;
    playedChimesRef.current.add(key);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      if (type === "warning") {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.08);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.4);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(554.37, ctx.currentTime);
          gain2.gain.setValueAtTime(0, ctx.currentTime);
          gain2.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.4);
        }, 250);
      } else if (type === "end") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
      }
    } catch {
      /* Audio context error fallback */
    }
  }, []);

  // Hype Meter Decay Loop
  useEffect(() => {
    if (!isOpen && !isPanelOpen && !performanceLive) {
      setHypeLevel(0);
      return;
    }
    const interval = setInterval(() => {
      setHypeLevel((prev) => Math.max(0, prev - 1.5));
    }, 150);
    return () => clearInterval(interval);
  }, [isOpen, isPanelOpen, performanceLive]);

  // Timer Tick & Warning Chime Loop
  useEffect(() => {
    if (!activeExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const calcTime = () => {
      const remaining = Math.max(0, Math.floor((activeExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 10) {
        playChime("warning", `${activeExpiresAt}_10`);
      } else if (remaining === 0) {
        playChime("end", `${activeExpiresAt}_0`);
      }
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [activeExpiresAt, playChime]);

  // Initial Data Fetch
  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      const statusRes = await api.get(`/stageverse/${eventId}/voting/status`);
      setIsOpen(statusRes.open);
      setIsPanelOpen(statusRes.panelOpen ?? false);
      setExpiresAt(statusRes.expiresAt ?? null);
      setPerformanceLive(statusRes.performanceLive ?? false);
      setPerformanceExpiresAt(statusRes.performanceExpiresAt ?? null);
      setCurrentPerformerId(statusRes.currentPerformerId ?? null);

      const subRes = await api.get(`/stageverse/${eventId}/submissions`);
      setPerformers(Array.isArray(subRes) ? subRes : []);

      const standingsRes = await api.get(`/stageverse/${eventId}/standings`);
      setStandings(Array.isArray(standingsRes) ? standingsRes : []);

      try {
        const eventRes = await api.get(`/events/${eventId}`);
        setEventTitle(eventRes.title || "StageVerse Live Arena");
        setShowLeaderboard(eventRes.showLeaderboard ?? false);
      } catch {}
    } catch {
      /* Fallback for offline testing */
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // WebSocket Listeners
  useEffect(() => {
    if (!eventId) return;
    const socketUrl = api.baseUrl.replace(/\/$/, "");
    const socketInstance = io(`${socketUrl}/live`, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      socketInstance.emit("joinEvent", { eventId });
      // Also join by slug if eventId is a UUID or vice versa
      api.get(`/events/${eventId}`).then((ev) => {
        if (ev?.id && ev.id !== eventId) socketInstance.emit("joinEvent", { eventId: ev.id });
        if (ev?.slug && ev.slug !== eventId) socketInstance.emit("joinEvent", { eventId: ev.slug });
      }).catch(() => {});
    });

    socketInstance.on("panelStatusUpdate", (data: { panelOpen: boolean }) => {
      setIsPanelOpen(data.panelOpen);
    });

    socketInstance.on("performanceStatusUpdate", (data: { performanceLive: boolean; expiresAt?: number | null }) => {
      setPerformanceLive(data.performanceLive);
      setPerformanceExpiresAt(data.expiresAt ?? null);
    });

    socketInstance.on("votingStatusUpdate", (data: { open: boolean; expiresAt?: number | null }) => {
      setIsOpen(data.open);
      setExpiresAt(data.expiresAt ?? null);
      if (data.open) {
        confetti({ particleCount: 35, spread: 70, colors: ["#FFDE4D", "#D80032"] });
      }
    });

    socketInstance.on("currentPerformerUpdate", (data: { currentPerformerId: string | null }) => {
      setCurrentPerformerId(data.currentPerformerId);
      api.get(`/stageverse/${eventId}/submissions`).then((res) => {
        if (Array.isArray(res)) setPerformers(res);
      }).catch(() => {});
    });

    socketInstance.on("liveVoteCast", () => {
      api.get(`/stageverse/${eventId}/standings`).then((res) => {
        if (Array.isArray(res)) setStandings(res);
      }).catch(() => {});
    });

    socketInstance.on("leaderboardUpdate", (data: Standing[]) => {
      setStandings(Array.isArray(data) ? data : []);
    });

    socketInstance.on("leaderboardVisibilityUpdate", (data: { show: boolean }) => {
      setShowLeaderboard(data.show);
      if (data.show) {
        confetti({ particleCount: 90, spread: 110, origin: { y: 0.5 } });
      }
    });

    socketInstance.on("stage_reaction", (data: { emoji: string; id: string }) => {
      const xPos = Math.random() * 80 + 10;
      setReactions((prev) => [...prev.slice(-25), { id: data.id || String(Math.random()), emoji: data.emoji || "🔥", x: xPos }]);
      setHypeLevel((prev) => Math.min(100, prev + 8));

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== data.id));
      }, 3000);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [eventId]);

  // Current Performer & Next Performer Calculations
  const currentPerformer = performers.find((p) => p.id === currentPerformerId);
  const currentPerformerName = currentPerformer?.performerName || currentPerformer?.user?.fullName || "Featured Performer";
  const currentTrackTitle = currentPerformer?.trackTitle || "Live Performance";
  const instagramTag = currentPerformer?.user?.instagram;

  const currentIndex = performers.findIndex((p) => p.id === currentPerformerId);
  let nextPerformer: Performer | null = null;
  if (currentIndex !== -1) {
    for (let i = currentIndex + 1; i < performers.length; i++) {
      if (performers[i].status !== "SKIPPED") {
        nextPerformer = performers[i];
        break;
      }
    }
  }

  const getStatusText = () => {
    if (isOpen) return "VOTING OPEN & LIVE";
    if (isPerfLive) return "PERFORMANCE LIVE";
    return "WAITING FOR NEXT PERFORMER";
  };

  const formattedTimeLeft = timeLeft !== null
    ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
    : null;

  // Render Final Results Leaderboard View
  if (showLeaderboard) {
    const sortedStandings = [...standings].sort((a, b) => b.averageScore - a.averageScore || b.totalVotes - a.totalVotes);
    const topPerformers = sortedStandings.slice(0, 5);

    return (
      <main
        onClick={() => setHasInteracted(true)}
        className="min-h-screen w-full bg-[#0E0E0E] text-white flex flex-col items-center p-8 sm:p-12 overflow-hidden relative select-none font-space"
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[80vw] h-[80vw] bg-[#FFDE4D]/10 rounded-full blur-[140px] mix-blend-screen animate-pulse" />
        </div>

        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="z-10 text-center mb-10 mt-4"
        >
          <div className="inline-flex items-center gap-2 bg-[#FFDE4D] text-[#121212] font-display font-black text-xs uppercase px-4 py-1.5 rounded-full border-2 border-[#121212] shadow-brutal-sm mb-4">
            <Trophy size={16} /> OFFICIAL SCORECARD
          </div>
          <h1 className="text-4xl sm:text-6xl font-display font-black uppercase tracking-tight text-white">
            FINAL RESULTS
          </h1>
          <p className="text-sm sm:text-base text-gray-400 font-bold mt-2">
            {eventTitle} — Top Performers & Score Telemetry
          </p>
        </motion.div>

        {/* Results List */}
        <div className="z-10 w-full max-w-5xl flex flex-col gap-5">
          {topPerformers.map((p: any, idx) => {
            const isWinner = idx === 0;
            const delay = idx * 0.25;
            const votes = p.totalVotes ?? p.votesCount ?? 0;
            const rawScore = p.averageScore ?? p.audienceAverage ?? p.totalScore ?? 0;
            const formattedScore = typeof rawScore === "number" ? rawScore.toFixed(2) : (parseFloat(String(rawScore)) || 0).toFixed(2);
            const avatarUrl = p.photoUrl || p.user?.avatarUrl;
            const artistName = p.performer || p.user?.fullName || "Artist";

            return (
              <motion.div
                key={p.id || p.submissionId || idx}
                initial={{ opacity: 0, x: -80 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay, duration: 0.6, type: "spring" }}
                className={`flex items-center justify-between p-6 sm:p-8 rounded-2xl border-3 border-[#121212] backdrop-blur-md transition-all ${
                  isWinner
                    ? "bg-[#FFDE4D]/15 border-[#FFDE4D] shadow-[0_0_40px_rgba(255,222,77,0.25)]"
                    : "bg-[#181818] border-white/10"
                }`}
              >
                <div className="flex items-center gap-6 sm:gap-8 min-w-0">
                  <div
                    className={`text-4xl sm:text-6xl font-display font-black tabular-nums w-16 text-center shrink-0 ${
                      idx === 0 ? "text-[#FFDE4D]" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-amber-600" : "text-gray-600"
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div
                    className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-3 overflow-hidden bg-gray-800 flex items-center justify-center font-display font-black text-2xl sm:text-4xl text-gray-400 shrink-0 ${
                      isWinner ? "border-[#FFDE4D] scale-105" : "border-white/20"
                    }`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      artistName[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className={`font-display font-black uppercase truncate ${isWinner ? "text-2xl sm:text-4xl text-[#FFDE4D]" : "text-xl sm:text-2xl text-white"}`}>
                      {artistName}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase mt-1 truncate">
                      {p.trackTitle}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-6 sm:gap-10 shrink-0 pl-4">
                  <div className="hidden sm:flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Votes</span>
                    <span className="text-xl sm:text-2xl font-black tabular-nums text-gray-300">{votes}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FFDE4D]">Rating Score</span>
                    <span className={`tabular-nums font-display font-black ${isWinner ? "text-3xl sm:text-5xl text-[#FFDE4D]" : "text-2xl sm:text-3xl text-white"}`}>
                      {formattedScore}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Floating Emoji Reactions Overlay */}
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          <AnimatePresence>
            {reactions.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: "100vh", left: `${r.x}vw`, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], y: "-20vh", left: `${r.x + (Math.random() * 10 - 5)}vw`, scale: [0.5, 1.5, 2, 1.5] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, ease: "easeOut" }}
                className="absolute bottom-0 text-6xl sm:text-7xl drop-shadow-2xl"
              >
                {r.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>
    );
  }

  // Idle Screen (No current performer selected)
  if (!currentPerformerId && !isPanelOpen && !isOpen) {
    return (
      <main
        onClick={() => setHasInteracted(true)}
        className="min-h-screen w-full bg-[#0E0E0E] text-white flex flex-col items-center justify-center p-8 text-center relative select-none overflow-hidden font-space"
      >
        <div className="z-10 space-y-6 max-w-3xl">
          <div className="w-20 h-20 bg-[#FFDE4D] text-[#121212] rounded-full border-3 border-[#121212] shadow-brutal mx-auto flex items-center justify-center animate-bounce">
            <Radio size={36} />
          </div>
          <h1 className="text-4xl sm:text-7xl font-display font-black uppercase tracking-tight text-white leading-none">
            {eventTitle}
          </h1>
          <p className="text-lg sm:text-2xl text-gray-400 font-bold tracking-wide animate-pulse">
            STAGE DISPLAY STANDBY — WAITING FOR PERFORMERS
          </p>
        </div>

        {/* Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[70vw] h-[70vw] bg-[#D80032]/10 rounded-full blur-[120px]" />
        </div>
      </main>
    );
  }

  return (
    <main
      onClick={() => setHasInteracted(true)}
      className="min-h-screen w-full bg-[#0E0E0E] text-white flex flex-col items-center justify-between p-6 sm:p-12 overflow-hidden text-center relative select-none font-space"
    >
      {/* Audio Context Unlock Banner */}
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 z-50 bg-[#FFDE4D] text-[#121212] border-3 border-[#121212] shadow-brutal px-8 py-4 rounded-full font-display font-black text-sm uppercase tracking-wider cursor-pointer animate-bounce flex items-center gap-3"
          >
            <Volume2 size={20} /> CLICK ANYWHERE TO START STAGE AUDIO & DISPLAY
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Performer Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPerformerId || "standby"}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="flex flex-col items-center justify-center w-full max-w-6xl my-auto z-10 space-y-10"
        >
          {/* Status Header */}
          <div className="space-y-3">
            <div className={`inline-flex items-center gap-2 bg-[#181818] border-2 border-white/20 px-5 py-2 rounded-full font-display font-black text-xs sm:text-sm uppercase tracking-widest ${
              isOpen ? "text-[#FFDE4D]" : isPerfLive ? "text-cyan-400" : "text-gray-300"
            }`}>
              <span className={`w-3 h-3 rounded-full border border-black ${isOpen ? "bg-green-500 animate-ping" : isPerfLive ? "bg-cyan-400 animate-ping" : "bg-[#FFDE4D] animate-pulse"}`} />
              {getStatusText()}
            </div>
            <h3 className="text-xs sm:text-sm font-black text-gray-500 uppercase tracking-widest">
              {eventTitle}
            </h3>
          </div>

          {/* Performer Card */}
          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 bg-[#181818]/90 border-4 border-[#121212] backdrop-blur-2xl p-8 sm:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-4xl w-full">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
              className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-[#FFDE4D] shadow-2xl shrink-0 bg-[#222] flex items-center justify-center font-display font-black text-6xl text-gray-400"
            >
              {currentPerformer?.user?.avatarUrl ? (
                <img src={currentPerformer.user.avatarUrl} alt={currentPerformerName} className="w-full h-full object-cover" />
              ) : (
                currentPerformerName[0]
              )}
            </motion.div>

            <div className="flex flex-col text-center sm:text-left min-w-0 flex-1">
              <motion.h1
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl sm:text-7xl font-display font-black uppercase tracking-tight text-white leading-none truncate"
              >
                {currentPerformerName}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl sm:text-3xl font-black text-[#FFDE4D] uppercase mt-3 tracking-wide truncate flex items-center justify-center sm:justify-start gap-2"
              >
                <Music size={24} className="text-[#FFDE4D]" /> {currentTrackTitle}
              </motion.p>
              {instagramTag && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 flex justify-center sm:justify-start"
                >
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-black bg-pink-500/10 text-pink-400 border border-pink-500/30 px-4 py-1.5 rounded-full">
                    <InstagramIcon size={14} /> @{instagramTag.replace("@", "")}
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Active Timer Display */}
          <div className="h-32 sm:h-44 flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {activeExpiresAt && (
                <motion.div
                  key={activeExpiresAt}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="font-display font-black leading-none tracking-tighter"
                >
                  {timeLeft === 0 ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1.1 }}
                      className="text-5xl sm:text-8xl text-red-stage uppercase bg-red-500/10 border-3 border-red-stage px-8 py-3 rounded-2xl animate-bounce"
                    >
                      TIME'S UP
                    </motion.div>
                  ) : (
                    <div className={`text-6xl sm:text-9xl drop-shadow-[0_0_30px_rgba(255,222,77,0.4)] tabular-nums ${isOpen ? "text-[#FFDE4D]" : "text-cyan-400"}`}>
                      {formattedTimeLeft}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Up Next Floating Card */}
      <AnimatePresence>
        {nextPerformer && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-10 right-10 bg-[#181818]/90 backdrop-blur-xl border-3 border-[#121212] rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-brutal z-30"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#FFDE4D]">Up Next</span>
              <span className="text-base font-display font-black uppercase text-white truncate max-w-[180px]">
                {nextPerformer.performerName || nextPerformer.user?.fullName || "Guest Artist"}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[180px]">
                {nextPerformer.trackTitle}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFDE4D] bg-[#222] shrink-0 flex items-center justify-center font-display font-black text-lg text-gray-400">
              {nextPerformer.user?.avatarUrl ? (
                <img src={nextPerformer.user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                (nextPerformer.performerName || nextPerformer.user?.fullName || "P")[0]
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Emoji Reactions */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: "100vh", left: `${r.x}vw`, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: "-20vh", left: `${r.x + (Math.random() * 10 - 5)}vw`, scale: [0.5, 1.5, 2, 1.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="absolute bottom-0 text-6xl sm:text-7xl drop-shadow-2xl"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Live Hype Meter */}
      <AnimatePresence>
        {(isOpen || isPanelOpen) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 inset-x-0 h-3 bg-black/60 backdrop-blur-md border-t border-white/10 z-[110]"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 via-pink-500 to-[#FFDE4D] shadow-[0_0_20px_rgba(255,222,77,0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: `${hypeLevel}%` }}
              transition={{ type: "tween", ease: "linear", duration: 0.15 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function StageScreenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center font-display font-black text-xl uppercase">
        Loading Stage Display...
      </div>
    }>
      <StageScreenContent />
    </Suspense>
  );
}

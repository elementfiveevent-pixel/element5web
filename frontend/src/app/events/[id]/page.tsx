"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft, Calendar, MapPin, Users, Check, Vote, Flame,
  AlertCircle, Tag, Shield, ExternalLink, LayoutDashboard,
  Clock, Ticket, BarChart2, PlusCircle, X, Radio, CheckCircle2, Eye
} from "lucide-react";
import QRTicket from "@/components/ui/QRTicket";
import SupabaseUpload from "@/components/ui/SupabaseUpload";

// ── Types ──────────────────────────────────────────────────────────────────────
interface EventLocation { venueName: string; venueAddress: string; city: string; state: string; mapsLink?: string }
interface TicketCategory { id: string; name: string; price: string; maxCapacity: number; soldCount: number }
interface BackendEvent {
  id: string; title: string; slug: string; description?: string; category: string;
  status: string; startDate: string; endDate?: string; flyerUrl?: string;
  isPaid: boolean; price: string; maxCapacity?: number; registrationsCount: number;
  termsConditions?: string; viewsCount?: number;
  audiencePrice?: number; artistPrice?: number;
  upiVpa?: string; upiId?: string; upiQrUrl?: string; artistQrUrl?: string; audienceQrUrl?: string;
  organizer?: { id: string; fullName: string; email: string };
  location?: EventLocation;
  ticketCategories: TicketCategory[];
  sponsors?: { name: string; logo: string }[];
  showLeaderboard?: boolean;
  votingActive?: boolean;
}
interface MyTicket { id: string; qrCode: string | null; isUsed: boolean; usedAt?: string; paymentStatus: string; totalAmount?: string | number; customData?: Record<string, any> }

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-12 px-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="border-4 border-[#121212] bg-gray-200 rounded h-72" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-4">
            {[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}
          </div>
          <div className="lg:col-span-5 h-64 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// ── Countdown ──────────────────────────────────────────────────────────────────
function Countdown({ target }: { target: string }) {
  const [tl, setTl] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const iv = setInterval(() => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return clearInterval(iv);
      setTl({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) });
    }, 1000);
    return () => clearInterval(iv);
  }, [target]);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex flex-wrap items-center gap-2">
      {[["d","DAYS"],["h","HRS"],["m","MIN"],["s","SEC"]].map(([k,l]) => (
        <div key={k} className="border-2 border-[#121212] bg-[#121212] text-[#FAF8F5] px-2 sm:px-3 py-2 rounded text-center min-w-[44px] sm:min-w-[52px]">
          <span className="font-display font-black text-xl sm:text-2xl block">{pad(tl[k as keyof typeof tl])}</span>
          <span className="font-space font-black text-[7px] sm:text-[8px] uppercase tracking-widest text-[#FAF8F5]/40">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { events: localEvents, artists, userVotes, voteForArtist, addUserXP } = useApp();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [registering, setRegistering] = useState(false);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [regError, setRegError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registrationType, setRegistrationType] = useState<"AUDIENCE" | "ARTIST">("AUDIENCE");
  const [registrationStep, setRegistrationStep] = useState<"SELECT" | "PAYMENT">("SELECT");
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState("");

  const [votingAccessStatus, setVotingAccessStatus] = useState<"APPROVED" | "PENDING" | "NOT_REQUESTED" | "LOADING">("LOADING");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  // Live voting terminal embedded states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votingSubmissionId, setVotingSubmissionId] = useState<string | null>(null);
  const [currentPerformerId, setCurrentPerformerId] = useState<string | null>(null);

  const isOrganizer = user && event && (event.organizer?.id === user.id || ["SUPER_ADMIN","ORG_ADMIN"].includes(user.role));
  const isCompleted = event ? ["COMPLETED","ARCHIVED","CANCELLED"].includes(event.status) : false;
  const hasTickets = myTickets.length > 0;
  const hasPendingTicket = myTickets.some((ticket) => ticket.paymentStatus === "PENDING");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get(`/events/${id}`);
        setEvent(data);
        if (data.ticketCategories?.length > 0) setSelectedCategory(data.ticketCategories[0].id);
      } catch {
        const local = localEvents.find((e) => e.id === id);
        if (local) {
          setEvent({
            id: local.id, title: local.title, slug: local.id, description: local.description,
            category: local.type.toUpperCase(), status: local.isCompleted ? "COMPLETED" : "PUBLISHED",
            startDate: local.date, flyerUrl: local.image, isPaid: false, price: "0",
            maxCapacity: local.registrationLimit, registrationsCount: local.audienceCount,
            ticketCategories: [], location: { venueName: local.venue.split(",")[0], venueAddress: local.venue, city: local.venue.split(",")[1]?.trim() ?? "Gujarat", state: "Gujarat" },
          });
        } else { setNotFound(true); }
      } finally { setLoading(false); }
    })();
  }, [id, localEvents]);

  const refreshMyTickets = useCallback(async () => {
    if (!user || !event) return;
    try {
      const tickets: any[] = await api.get("/events/attendee/my-tickets");
      const mine = tickets.filter((ticket) => ticket.event.id === event.id || ticket.event.slug === event.slug);
      setMyTickets(mine.map((ticket) => ({ id: ticket.ticketId, qrCode: ticket.qrCode, isUsed: ticket.isUsed, usedAt: ticket.usedAt, paymentStatus: ticket.paymentStatus, totalAmount: ticket.totalAmount, customData: ticket.customData })));
    } catch {
      // Keep the last successfully loaded ticket state visible.
    }
  }, [user, event]);

  // Load tickets on arrival, then only poll while an organizer review is pending.
  useEffect(() => {
    void refreshMyTickets();
  }, [refreshMyTickets]);

  useEffect(() => {
    if (!hasPendingTicket) return;
    const interval = window.setInterval(() => void refreshMyTickets(), 30000);
    return () => window.clearInterval(interval);
  }, [hasPendingTicket, refreshMyTickets]);

  // Check voting access request status
  useEffect(() => {
    if (!user || !event) {
      setVotingAccessStatus("NOT_REQUESTED");
      return;
    }
    setVotingAccessStatus("LOADING");
    api.get(`/stageverse/${event.id}/voting/check-access`)
      .then((res: any) => {
        setVotingAccessStatus(res.status || "NOT_REQUESTED");
      })
      .catch(() => {
        setVotingAccessStatus("NOT_REQUESTED");
      });
  }, [user, event]);

  // Fetch standings if leaderboard is toggled on by organizer
  useEffect(() => {
    if (!event || !event.showLeaderboard) return;
    setStandingsLoading(true);
    api.get(`/stageverse/${event.id}/standings`)
      .then((res: any) => {
        setStandings(Array.isArray(res) ? res : []);
      })
      .catch(() => {})
      .finally(() => setStandingsLoading(false));
  }, [event]);

  // Fetch embedded submissions list and set up socket updates
  const fetchEmbeddedStatusAndSubmissions = useCallback(async () => {
    if (!event) return;
    try {
      const statusRes = await api.get(`/stageverse/${event.id}/voting/status`);
      setIsVotingOpen(statusRes.open);
      setIsPanelOpen(statusRes.panelOpen ?? statusRes.open ?? false);
      setExpiresAt(statusRes.expiresAt ?? null);
      setCurrentPerformerId(statusRes.currentPerformerId ?? null);

      const subRes = await api.get(`/stageverse/${event.id}/submissions`);
      setSubmissions(Array.isArray(subRes) ? subRes : []);
    } catch { /* non-critical — voting/submission data is optional UI state */ }
  }, [event]);

  useEffect(() => {
    if (!event) return;
    fetchEmbeddedStatusAndSubmissions();

    const socketUrl = api.baseUrl.replace(/\/$/, "");
    const socketInstance = io(`${socketUrl}/live`, {
      transports: ["websocket"],
      autoConnect: true
    });

    socketInstance.on("connect", () => {
      if (event.id) socketInstance.emit("joinEvent", { eventId: event.id });
      if (event.slug && event.slug !== event.id) socketInstance.emit("joinEvent", { eventId: event.slug });
      if (id && id !== event.id && id !== event.slug) socketInstance.emit("joinEvent", { eventId: id });
    });

    socketInstance.on("panelStatusUpdate", (data: { panelOpen: boolean }) => {
      setIsPanelOpen(data.panelOpen);
    });

    socketInstance.on("votingStatusUpdate", (data: { open: boolean; expiresAt?: number | null }) => {
      setIsVotingOpen(data.open);
      setExpiresAt(data.expiresAt ?? null);
      if (data.open) {
        triggerConfetti();
      }
    });

    socketInstance.on("currentPerformerUpdate", (data: { currentPerformerId: string | null }) => {
      setCurrentPerformerId(data.currentPerformerId);
    });

    socketInstance.on("votingAccessUpdate", (data: { userId: string; status: string }) => {
      if (user && data.userId === user.id) {
        setVotingAccessStatus(data.status as any);
      }
    });

    socketInstance.on("liveVoteCast", () => {
      fetchEmbeddedStatusAndSubmissions();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [event, user, fetchEmbeddedStatusAndSubmissions]);

  // Ticking countdown effect for embedded voting
  useEffect(() => {
    if (!isVotingOpen || !expiresAt) {
      setTimeLeft(null);
      return;
    }
    const updateTime = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        setIsVotingOpen(false);
        setTimeLeft(null);
        setExpiresAt(null);
      }
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, [isVotingOpen, expiresAt]);

  const handleVote = async (submissionId: string) => {
    if (!user) {
      alert("Please login to cast your live vote!");
      return;
    }

    if (!isVotingOpen) {
      alert("Voting is currently closed by the organizer!");
      return;
    }

    const rating = selectedRatings[submissionId];
    if (!rating) {
      alert("Please select a score rating before submitting your vote!");
      return;
    }

    if (votedIds.has(submissionId)) return;

    setVotingSubmissionId(submissionId);

    try {
      await api.post(`/stageverse/submissions/${submissionId}/vote`, { score: rating });
      setVotedIds(prev => new Set([...prev, submissionId]));
      triggerConfetti();
      alert("Vote cast successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to submit vote.");
    } finally {
      setVotingSubmissionId(null);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const triggerConfetti = async () => {
    const { default: confetti } = await import("canvas-confetti");
    confetti({ particleCount: 120, spread: 75, colors: ["#FFDE4D","#D80032","#FAF8F5"] });
  };

  const handleRegister = async () => {
    if (!user) { window.location.href = `/login?redirect=/events/${id}`; return; }
    setRegistrationStep("SELECT");
    setPaymentScreenshotUrl("");
    setRegError(null);
    setShowRegisterModal(true);
  };

  const confirmRegistration = async () => {
    const currentEvent = event;
    if (!currentEvent) return;
    setRegistering(true); 
    setRegError(null);
    try {
      const isEventPaid = currentEvent.isPaid ?? false;
      const audiencePrice = currentEvent.audiencePrice !== undefined ? Number(currentEvent.audiencePrice) : (isEventPaid ? Number(currentEvent.price || 0) : 0);
      const artistPrice = currentEvent.artistPrice !== undefined ? Number(currentEvent.artistPrice) : (isEventPaid ? Number(currentEvent.price || 0) + 150 : 99);
      const selectedPrice = registrationType === "AUDIENCE" ? audiencePrice : artistPrice;

      const payload: Record<string,any> = {
        amount: selectedPrice,
        customData: {
          participationType: registrationType
        },
        ...(paymentScreenshotUrl && { paymentScreenshotUrl })
      };
      if (selectedCategory) payload.ticketCategoryId = selectedCategory;
      
      const result = await api.post(`/events/${currentEvent.id}/register`, payload);
      const ticket = result.ticket ?? result.tickets?.[0];
      if (ticket) {
        setMyTickets([{ id: ticket.id, qrCode: ticket.qrCode, isUsed: ticket.isUsed ?? false, usedAt: ticket.usedAt, paymentStatus: result.registration?.paymentStatus ?? "APPROVED", customData: result.registration?.customData ?? { participationType: registrationType } }]);
      }
      triggerConfetti(); 
      addUserXP(50);
      setEvent({ ...currentEvent, registrationsCount: currentEvent.registrationsCount + 1 });
      setShowRegisterModal(false);
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.toLowerCase().includes("already")) { setRegError("You are already registered for this event."); }
      else if (msg.toLowerCase().includes("capacity") || msg.toLowerCase().includes("sold out")) { setRegError("This event is fully booked."); }
      else setRegError(msg || "Registration failed. Please try again.");
    } finally { setRegistering(false); }
  };

  if (loading) return <Skeleton />;
  if (notFound || !event) return (
    <div className="min-h-screen bg-[#FFF5E4] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="font-display font-extrabold text-3xl uppercase text-red-stage">Event Not Found</h2>
      <p className="font-space mt-2 text-sm font-bold text-[#121212]/60">This event doesn't exist in our system.</p>
      <Link href="/events" className="mt-6 brutal-tape text-sm">BACK TO EVENTS</Link>
    </div>
  );

  const formattedStart = (() => { try { return new Date(event.startDate).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" }); } catch { return event.startDate; } })();
  const capacityPct = event.maxCapacity ? Math.min(100, Math.round((event.registrationsCount / event.maxCapacity)*100)) : 0;

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 text-sm">
          <Link href="/events" className="inline-flex items-center gap-1.5 font-display font-bold hover:underline text-[#121212]/60">
            <ArrowLeft size={14} /> EVENTS
          </Link>
          <span className="text-[#121212]/20">/</span>
          <span className="font-display font-bold text-[#121212]/40 truncate">{event.title}</span>
        </div>

        {/* Organizer toolbar */}
        {isOrganizer && (
          <div className="border-2 border-yellow-festival bg-yellow-festival/10 rounded p-3 flex flex-wrap items-center gap-3">
            <span className="font-display font-black text-xs uppercase text-yellow-700 flex items-center gap-1.5">
              <Shield size={13} /> ORGANIZER VIEW
            </span>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Link href={`/events/organizer?tab=registrations`}
                className="flex items-center gap-1.5 border-2 border-[#121212] bg-white font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-yellow-festival/20 transition-colors">
                <Users size={11} /> REGISTRATIONS
              </Link>
              <Link href={`/events/organizer?tab=gate`}
                className="flex items-center gap-1.5 border-2 border-[#121212] bg-white font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-yellow-festival/20 transition-colors">
                <Ticket size={11} /> TICKET GATE
              </Link>
              <Link href={`/events/organizer?tab=voting`}
                className="flex items-center gap-1.5 border-2 border-[#121212] bg-white font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-yellow-festival/20 transition-colors">
                <Vote size={11} /> MANAGE VOTING
              </Link>
              <Link href={`/events/organizer?tab=analytics`}
                className="flex items-center gap-1.5 border-2 border-[#121212] bg-white font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-yellow-festival/20 transition-colors">
                <BarChart2 size={11} /> ANALYTICS
              </Link>
            </div>
          </div>
        )}


        {/* StageVerse Live Voting Banner (Yellow, prominent at top) */}
        {isPanelOpen && (
          <div className="border-4 border-[#121212] bg-[#FFDE4D] p-5 rounded shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none mb-6">
            <div className="space-y-1">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#121212] flex items-center gap-2">
                <Radio size={18} className="text-red-stage animate-pulse" /> CAST YOUR VOTE LIVE!
              </h3>
              <p className="font-space text-xs text-[#121212] font-bold">
                Open the secure Voting Terminal to support your favorite performers during this round.
              </p>
            </div>

            <div className="flex-shrink-0">
              {votingAccessStatus === "APPROVED" ? (
                <Link
                  href={`/stageverse/voting-system?eventId=${event.id}`}
                  className="inline-block bg-[#121212] text-white font-display font-black text-xs uppercase px-5 py-3 rounded shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-center cursor-pointer whitespace-nowrap"
                >
                  VOTING TERMINAL
                </Link>
              ) : votingAccessStatus === "PENDING" ? (
                <span className="inline-block bg-gray-700 text-gray-400 font-display font-black text-xs uppercase px-5 py-3 rounded text-center select-none whitespace-nowrap">
                  REQUEST PENDING...
                </span>
              ) : (
                <button
                  onClick={async () => {
                    if (!user) { window.location.href = `/login?redirect=/events/${id}`; return; }
                    setRequestingAccess(true);
                    try {
                      await api.post(`/stageverse/${event.id}/voting/request-access`);
                      setVotingAccessStatus("PENDING");
                      alert("Access request sent to organizers successfully!");
                    } catch (err: any) {
                      alert(err.message || "Failed to send request.");
                    } finally {
                      setRequestingAccess(false);
                    }
                  }}
                  disabled={requestingAccess}
                  className="inline-block bg-red-stage text-white font-display font-black text-xs uppercase px-5 py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-center cursor-pointer whitespace-nowrap"
                >
                  {requestingAccess ? "SENDING..." : "REQUEST VOTING ACCESS"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="border-4 border-[#121212] bg-[#121212] text-[#FAF8F5] rounded shadow-brutal overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-0">
            {/* Flyer (Left Side) */}
            <div className="w-full lg:w-2/5 aspect-[4/5] border-b-4 lg:border-b-0 lg:border-r-4 border-[#121212] overflow-hidden flex-shrink-0 bg-[#121212] relative">
              {event.flyerUrl ? (
                <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-[#1a1a1a] to-[#333] flex items-center justify-center">
                  <span className="font-display font-black text-9xl text-white/[0.04]">E5</span>
                </div>
              )}
            </div>

            {/* Info (Right Side) */}
            <div className="flex-1 p-5 sm:p-8 space-y-5 min-w-0">
              <div className="flex items-start gap-3 flex-wrap">
                <span className="font-black text-[9px] uppercase bg-red-stage text-white px-2.5 py-1 rounded">
                  {event.category}
                </span>
                {isCompleted && (
                  <span className="font-black text-[9px] uppercase bg-gray-600 text-white px-2.5 py-1 rounded">
                    {event.status}
                  </span>
                )}
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tighter leading-none text-yellow-festival break-words">
                {event.title}
              </h1>

              {event.description && (
                <p className="font-space text-sm text-[#FAF8F5]/70 font-bold leading-relaxed max-w-lg">
                  {event.description}
                </p>
              )}

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 text-[10px] sm:text-[11px] font-black uppercase">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded min-w-0">
                  <Calendar size={11} /> {formattedStart}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded">
                    <MapPin size={11} /> {event.location.city}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded">
                  <Users size={11} /> {event.registrationsCount} Registered
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded">
                  <Tag size={11} /> {event.isPaid ? `₹${event.price}` : "FREE ENTRY"}
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded">
                  <Eye size={11} /> {event.viewsCount ?? 0} Views
                </span>
              </div>

              {/* Countdown */}
              {!isCompleted && (
                <div className="space-y-2">
                  <p className="font-space font-black text-[10px] uppercase text-[#FAF8F5]/40 tracking-wider">
                    Event starts in
                  </p>
                  <Countdown target={event.startDate} />
                </div>
              )}

              {/* CTA row */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {hasTickets ? (
                  <div className="flex items-center gap-2 bg-green-500 text-white font-black px-5 py-3 border-2 border-white/30 rounded text-sm">
                    <Check size={16} /> REGISTERED — TICKETS BELOW
                  </div>
                ) : isCompleted ? (
                  <div className="bg-gray-700 text-white font-black px-5 py-3 border-2 border-white/10 rounded text-sm">
                    EVENT ENDED
                  </div>
                ) : (
                  <button onClick={handleRegister} disabled={registering}
                    className="bg-yellow-festival text-[#121212] font-black px-6 py-3 border-2 border-white/30 rounded text-sm uppercase tracking-wider hover:bg-yellow-festival/80 disabled:opacity-60 transition-colors">
                    {registering ? "PROCESSING…" : user ? "REGISTER EVENT" : "LOGIN TO REGISTER"}
                  </button>
                )}
              </div>

              {regError && (
                <div className="flex items-center gap-2 bg-red-500/20 border border-red-500 text-red-300 p-3 rounded text-xs font-bold">
                  <AlertCircle size={14} /> {regError}
                </div>
              )}
            </div>
          </div>

          {/* Capacity bar */}
          {event.maxCapacity && event.maxCapacity > 0 && (
            <div className="border-t-3 border-[#FAF8F5]/10 px-6 py-3 flex items-center gap-4">
              <span className="font-space font-black text-[10px] uppercase text-[#FAF8F5]/40 flex-shrink-0">
                {event.registrationsCount} / {event.maxCapacity} spots
              </span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${capacityPct >= 80 ? "bg-red-stage" : "bg-yellow-festival"}`}
                  style={{ width: `${capacityPct}%` }} />
              </div>
              <span className="font-space font-black text-[10px] text-[#FAF8F5]/40 flex-shrink-0">{capacityPct}%</span>
            </div>
          )}
        </div>

        {/* ── Event Sponsors Ticker ─────────────────────────────────────── */}
        {event.sponsors && event.sponsors.length > 0 && (
          <div className="border-3 border-[#121212] bg-yellow-festival p-4 rounded shadow-brutal overflow-hidden relative select-none">
            <span className="font-display font-black text-[9px] uppercase tracking-widest text-[#121212]/60 block text-center mb-3">
              ★ Proudly Sponsored By ★
            </span>
            <div className="w-full overflow-hidden relative whitespace-nowrap">
              <div className="inline-flex gap-16 items-center animate-marquee">
                {/* First Copy */}
                {Array(Math.ceil(12 / event.sponsors.length)).fill(event.sponsors).flat().map((sp, idx) => (
                  <div key={`sp-a-${idx}`} className="inline-flex items-center gap-3">
                    <div className="h-8 w-8 flex items-center justify-center bg-white/20 rounded p-1 border border-black/10">
                      <img src={sp.logo} alt={sp.name} className="max-h-full max-w-full object-contain filter brightness-90 hover:brightness-100 transition-all duration-300" />
                    </div>
                    <span className="font-display font-extrabold text-sm uppercase tracking-tight text-[#121212]">
                      {sp.name}
                    </span>
                  </div>
                ))}
                {/* Second Copy */}
                {Array(Math.ceil(12 / event.sponsors.length)).fill(event.sponsors).flat().map((sp, idx) => (
                  <div key={`sp-b-${idx}`} className="inline-flex items-center gap-3">
                    <div className="h-8 w-8 flex items-center justify-center bg-white/20 rounded p-1 border border-black/10">
                      <img src={sp.logo} alt={sp.name} className="max-h-full max-w-full object-contain filter brightness-90 hover:brightness-100 transition-all duration-300" />
                    </div>
                    <span className="font-display font-extrabold text-sm uppercase tracking-tight text-[#121212]">
                      {sp.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                display: inline-flex;
                animation: marquee 30s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
            `}} />
          </div>
        )}

        {/* ── Ticket type selector ────────────────────────────────────────── */}
        {!hasTickets && !isCompleted && event.ticketCategories.length > 1 && (
          <div className="border-3 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal p-6 space-y-4">
            <h3 className="font-display font-black text-base uppercase">Select Ticket Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {event.ticketCategories.map((cat) => {
                const avail = cat.maxCapacity - cat.soldCount;
                return (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} disabled={avail <= 0}
                    className={`border-3 p-4 rounded text-left transition-all ${selectedCategory === cat.id ? "border-[#121212] bg-yellow-festival shadow-brutal" : "border-[#121212] bg-white hover:shadow-brutal"} disabled:opacity-40 disabled:cursor-not-allowed`}>
                    <span className="font-display font-black text-sm block">{cat.name}</span>
                    <span className="font-space font-bold text-xs text-[#121212]/60">{parseFloat(cat.price) === 0 ? "FREE" : `₹${cat.price}`}</span>
                    <span className="font-space text-[9px] text-[#121212]/40 block mt-0.5">{avail > 0 ? `${avail} left` : "SOLD OUT"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── My Tickets ──────────────────────────────────────────────────── */}
        {hasTickets && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b-3 border-[#121212] pb-4">
              <Shield size={22} className="text-green-600" />
              <h2 className="font-display font-black text-2xl uppercase tracking-tight">Your Admission Tickets</h2>
              <span className="ml-auto font-space font-black text-xs text-[#121212]/40 uppercase">
                {myTickets.length} ticket{myTickets.length !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="font-space text-sm text-[#121212]/60 font-bold">
              {hasPendingTicket
                ? "Payment review is pending. Your QR will reveal automatically after the organizer approves it."
                : "Present these QR codes at the venue entrance for scanning."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {myTickets.map((t) => (
                <QRTicket key={t.id} ticketId={t.id} qrCode={t.qrCode} isUsed={t.isUsed} usedAt={t.usedAt}
                  eventTitle={event.title} eventDate={formattedStart}
                  venueName={event.location?.venueName} venueCity={event.location?.city}
                  category={event.category} participationType={t.customData?.participationType || registrationType}
                  paymentStatus={t.paymentStatus} totalAmount={t.totalAmount} />
              ))}
            </div>
          </div>
        )}

        {/* ── Venue & Details ──────────────────────────────────────────────── */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-4 sm:p-6 rounded shadow-brutal space-y-4">
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight border-b-3 border-[#121212] pb-3">
            Venue &amp; Location
          </h2>

          {(() => {
            const loc = event.location || ((event as any).venueName || (event as any).venueAddress ? {
              venueName: (event as any).venueName,
              venueAddress: (event as any).venueAddress,
              city: (event as any).city,
              state: (event as any).state,
              mapsLink: (event as any).mapsLink,
            } : null);

            if (loc && (loc.venueName || loc.venueAddress || loc.city)) {
              const mapsUrl = loc.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([loc.venueName, loc.venueAddress, loc.city, loc.state].filter(Boolean).join(", "))}`;

              return (
                <div className="space-y-3 pt-1 font-space">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 flex-shrink-0 border-2 border-[#121212] bg-yellow-festival rounded flex items-center justify-center"><MapPin size={16} /></div>
                    <div className="min-w-0">
                      {loc.venueName && <h4 className="font-display font-extrabold text-lg leading-tight">{loc.venueName}</h4>}
                      {(loc.city || loc.state) && <p className="font-space text-xs text-[#121212]/50 font-bold mt-1">{loc.city}{loc.city && loc.state ? ", " : ""}{loc.state}</p>}
                    </div>
                  </div>
                  {loc.venueAddress && (
                    <p className="font-space text-xs sm:text-sm text-[#121212]/70 font-bold leading-relaxed">
                      {loc.venueAddress}
                    </p>
                  )}
                  <div className="pt-1">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-yellow-festival text-[#121212] font-display font-black text-xs uppercase px-5 py-3 rounded border-2 border-[#121212] shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                    >
                      <MapPin size={14} className="text-red-stage" /> OPEN IN GOOGLE MAPS <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            }
            return (
              <div className="border-3 border-dashed border-[#121212]/20 p-8 text-center bg-white rounded font-bold uppercase text-sm text-[#121212]/30">
                Venue details coming soon.
              </div>
            );
          })()}

          {/* End date */}
          {event.endDate && (
            <div className="border-t border-[#121212]/10 pt-3 flex items-center gap-3">
              <Clock size={18} className="text-orange-burnt flex-shrink-0" />
              <div>
                <span className="font-display font-black text-xs uppercase text-[#121212]/50 block">Event ends</span>
                <span className="font-space font-bold text-sm">
                  {(() => { try { return new Date(event.endDate!).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"long", hour:"2-digit", minute:"2-digit" }); } catch { return event.endDate; } })()}
                </span>
              </div>
            </div>
          )}

          {/* Terms */}
          {event.termsConditions && (
            <details className="border-t border-[#121212]/10 pt-3 group">
              <summary className="font-display font-black text-sm uppercase cursor-pointer list-none flex items-center justify-between gap-3">
                Terms &amp; Conditions <span className="text-red-stage transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="font-space text-xs text-[#121212]/60 leading-relaxed font-bold pt-3">{event.termsConditions}</p>
            </details>
          )}
        </div>

        {/* Leaderboard Standing (If Organizer enabled it) */}
        {event.showLeaderboard && (
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-6">
            <div className="flex items-center gap-2 border-b-3 border-[#121212] pb-3">
              <Radio size={20} className="text-red-stage animate-pulse" />
              <h2 className="font-display font-black text-2xl uppercase tracking-tight">StageVerse Live Leaderboard</h2>
            </div>
            
            {standingsLoading ? (
              <p className="font-space text-sm font-bold text-center py-6 text-gray-400 uppercase animate-pulse">Calculating standings...</p>
            ) : standings.length > 0 ? (
              <div className="space-y-3">
                {standings.map((sub, idx) => (
                  <div key={sub.submissionId} className="border-2 border-[#121212] bg-white p-4 rounded shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-black text-sm text-gray-400 w-6 text-center">{idx + 1}</span>
                      {sub.photoUrl && (
                        <img src={sub.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-[#121212] flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-display font-bold text-sm uppercase leading-tight">{sub.performer}</h4>
                        <p className="font-space text-[10px] text-gray-500 font-bold uppercase">{sub.trackTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[8px] font-black uppercase text-gray-400 block">Total Score</span>
                        <span className="font-display font-black text-base text-red-stage">{sub.totalScore.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-space text-sm font-bold text-center py-6 text-gray-400 uppercase">No standings recorded yet.</p>
            )}
          </div>
        )}

        {/* More Events Section */}
        <div className="space-y-6 pt-10 border-t-3 border-[#121212]/10">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-2xl uppercase tracking-tight">Explore More Events</h2>
            <Link href="/events" className="font-space text-xs font-black uppercase text-red-stage hover:underline flex items-center gap-1">
              View All <ArrowLeft className="rotate-180" size={12} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {localEvents.filter(e => e.id !== id).slice(0, 3).map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="border-3 border-[#121212] bg-[#FAF8F5] p-5 rounded shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-yellow transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="aspect-[4/5] border-2 border-[#121212] rounded overflow-hidden bg-[#121212]">
                    <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                  </div>
                  <span className="inline-block bg-[#121212]/5 text-[#121212] text-[8px] font-black uppercase px-2 py-0.5 rounded">
                    {evt.type}
                  </span>
                  <h4 className="font-display font-black text-sm uppercase leading-tight">{evt.title}</h4>
                  <p className="font-space text-[10px] text-gray-500 font-bold">{evt.date}</p>
                </div>
                <div className="border-t border-[#121212]/5 mt-4 pt-3 flex items-center justify-between font-space text-[10px] font-black uppercase text-[#121212]/60">
                  <span>{evt.venue.split(",")[0]}</span>
                  <span className="text-red-stage">DETAILS</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Registration Selection & Payment Modal */}
      {showRegisterModal && event && (
        <div className="fixed inset-0 z-[9999] bg-[#121212]/70 flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
          <div className="bg-white border-4 border-[#121212] max-w-lg w-full h-[100dvh] sm:h-auto sm:max-h-[calc(100dvh-2rem)] rounded-none sm:rounded shadow-brutal text-[#121212] font-space relative flex flex-col overflow-hidden">
            {/* Close button */}
            <button 
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 w-8 h-8 border-2 border-[#121212] bg-white rounded flex items-center justify-center hover:bg-gray-100 font-black shadow-brutal-sm z-20"
            >
              ✕
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 pr-4 sm:pr-5 space-y-6">
            {registrationStep === "SELECT" ? (
              <>
                <div className="space-y-1">
                  <span className="bg-red-stage text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">REGISTRATION GATE</span>
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight">CHOOSE YOUR SLOT</h3>
                  <p className="text-[11px] text-gray-500 font-bold">Please select how you would like to participate in {event.title}.</p>
                </div>

                <div className="space-y-4">
                  {/* Option 1: Audience */}
                  <button
                    type="button"
                    onClick={() => setRegistrationType("AUDIENCE")}
                    className={`w-full text-left p-4 border-3 border-[#121212] rounded transition-all flex items-start gap-3 select-none ${
                      registrationType === "AUDIENCE" ? "bg-yellow-festival shadow-brutal-sm translate-x-[-1px] translate-y-[-1px]" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center flex-shrink-0 mt-0.5 ${registrationType === "AUDIENCE" ? "bg-white" : "bg-transparent"}`}>
                      {registrationType === "AUDIENCE" && <div className="w-2.5 h-2.5 rounded-full bg-[#121212]" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-display font-black text-xs uppercase block">AUDIENCE PASS</span>
                      <span className="text-[10px] text-gray-600 block mt-0.5 leading-tight">Attend the live performances, vote for your favorite performers, and enjoy the vibe.</span>
                      <span className="font-display font-black text-sm block mt-2 text-red-stage">
                        {event.isPaid ? `₹${event.audiencePrice !== undefined ? event.audiencePrice : event.price}` : "FREE"}
                      </span>
                    </div>
                  </button>

                  {/* Option 2: Artist */}
                  <button
                    type="button"
                    onClick={() => setRegistrationType("ARTIST")}
                    className={`w-full text-left p-4 border-3 border-[#121212] rounded transition-all flex items-start gap-3 select-none ${
                      registrationType === "ARTIST" ? "bg-yellow-festival shadow-brutal-sm translate-x-[-1px] translate-y-[-1px]" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 border-[#121212] flex items-center justify-center flex-shrink-0 mt-0.5 ${registrationType === "ARTIST" ? "bg-white" : "bg-transparent"}`}>
                      {registrationType === "ARTIST" && <div className="w-2.5 h-2.5 rounded-full bg-[#121212]" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-display font-black text-xs uppercase block">ARTIST / PERFORMER SLOT</span>
                      <span className="text-[10px] text-gray-600 block mt-0.5 leading-tight">Get allocated a performance slot, display your YouTube reel to organizers, and compete.</span>
                      <span className="font-display font-black text-sm block mt-2 text-red-stage">
                        {event.artistPrice !== undefined ? (Number(event.artistPrice) === 0 ? "FREE" : `₹${event.artistPrice}`) : (event.isPaid ? `₹${Number(event.price || 0) + 150}` : "₹99")}
                      </span>
                    </div>
                  </button>
                </div>

                {regError && (
                  <div className="p-3 border-2 border-red-stage bg-red-50 text-red-stage text-xs font-bold rounded flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {registrationType === "ARTIST" && user?.role === "AUDIENCE" ? (
                  <div className="space-y-4 pt-2 border-t border-[#121212]/10">
                    <div className="p-4 border-2 border-[#121212] bg-yellow-festival/10 rounded space-y-2 text-xs font-bold leading-relaxed">
                      <p className="font-display font-black text-red-stage uppercase text-xs">✨ Creator Profile Required</p>
                      <p>To register as a performing artist for this event, you need to set up your Creator profile first. This enables you to list your genres, links, and display your stage details to the organizers.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/onboarding?upgrade=true`;
                      }}
                      className="w-full bg-red-stage text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer text-center"
                    >
                      UPGRADE TO CREATOR NOW
                    </button>
                  </div>
                ) : (
                  <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 bg-white border-t border-[#121212]/10 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const isEventPaid = event.isPaid;
                        const audiencePrice = event.audiencePrice !== undefined ? Number(event.audiencePrice) : (isEventPaid ? Number(event.price || 0) : 0);
                        const artistPrice = event.artistPrice !== undefined ? Number(event.artistPrice) : (isEventPaid ? Number(event.price || 0) + 150 : 99);
                        const selectedPrice = registrationType === "AUDIENCE" ? audiencePrice : artistPrice;
                        
                        if (selectedPrice > 0) {
                          setRegistrationStep("PAYMENT");
                        } else {
                          confirmRegistration();
                        }
                      }}
                      className="w-full bg-[#121212] text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer text-center"
                    >
                      CONTINUE TO REGISTRATION
                    </button>
                    <p className="text-[9px] text-gray-400 font-bold text-center">Agree to guidelines on confirm.</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="bg-green-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">PAYMENT VERIFICATION</span>
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight">SCAN &amp; UPLOAD</h3>
                  <p className="text-[11px] text-gray-500 font-bold">Please complete the UPI transfer to confirm your booking.</p>
                </div>

                <div className="border-3 border-[#121212] bg-[#FAF8F5] p-4 rounded space-y-4">
                  <div className="flex justify-between items-center border-b border-[#121212]/10 pb-2">
                    <span className="font-display font-black text-xs uppercase">Payable Amount:</span>
                    <span className="font-display font-black text-lg text-red-stage">
                      ₹{registrationType === "AUDIENCE" 
                        ? (event.audiencePrice !== undefined ? event.audiencePrice : event.price) 
                        : (event.artistPrice !== undefined ? event.artistPrice : (Number(event.price || 0) + 150))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-display font-bold">UPI ID:</span>
                    <span className="font-mono font-black select-all bg-white px-2 py-1 border border-gray-300 rounded">{event.upiVpa || event.upiId || "element5@upi"}</span>
                  </div>

                  {/* Payment QR code */}
                  <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-dashed border-[#121212]/10 rounded">
                    <span className="font-display font-black text-[9px] text-gray-400 uppercase mb-2">
                      Scan {registrationType === "ARTIST" ? "Artist Pass QR" : "Audience Pass QR"}
                    </span>
                    {registrationType === "ARTIST" ? (
                      <img 
                        src={event.artistQrUrl || event.upiQrUrl || "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=" + (event.upiVpa || "element5@upi") + "%26pn=Element5%26am=" + (event.artistPrice || 99)} 
                        alt="Artist QR Code" 
                        className="w-40 h-40 object-contain" 
                      />
                    ) : (
                      <img 
                        src={event.upiQrUrl || event.audienceQrUrl || "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=" + (event.upiVpa || "element5@upi") + "%26pn=Element5%26am=" + (event.audiencePrice || 0)} 
                        alt="Audience QR Code" 
                        className="w-40 h-40 object-contain" 
                      />
                    )}
                  </div>
                </div>

                {/* Screenshot Upload Widget */}
                <div className="space-y-2">
                  <span className="font-display font-black text-xs uppercase block">Upload Payment Screenshot</span>
                  <SupabaseUpload
                    folder="element5/payments"
                    accept="image/*"
                    label="UPLOAD TRANSACTION RECEIPT"
                    maxSizeMB={10}
                    onUploadSuccess={(res) => setPaymentScreenshotUrl(res.secure_url)}
                  />
                  {paymentScreenshotUrl ? (
                    <div className="p-2.5 border-2 border-green-500 rounded bg-green-50 flex items-center justify-between">
                      <span className="text-[11px] text-green-700 font-bold">✓ Screenshot Uploaded!</span>
                      <button 
                        onClick={() => setPaymentScreenshotUrl("")} 
                        className="text-xs text-red-stage hover:underline font-black"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-bold">A screenshot of the completed transaction is required to approve your ticket.</p>
                  )}
                </div>

                {regError && (
                  <div className="p-3 border-2 border-red-stage bg-red-50 text-red-stage text-xs font-bold rounded flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 bg-white border-t border-[#121212]/10 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={confirmRegistration}
                    disabled={registering || !paymentScreenshotUrl}
                    className="w-full bg-[#121212] text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
                  >
                    {registering ? "REGISTERING..." : "CONFIRM & SUBMIT SCREENSHOT"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegistrationStep("SELECT")}
                    className="w-full bg-white text-[#121212] border-3 border-[#121212] font-display font-black text-xs uppercase py-2 rounded shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all text-center"
                  >
                    BACK
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

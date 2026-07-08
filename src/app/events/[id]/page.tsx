"use client";

import React, { useState, useEffect, use } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft, Calendar, MapPin, Users, Check, Vote, Flame,
  AlertCircle, Tag, Shield, ExternalLink, LayoutDashboard,
  Clock, Ticket, BarChart2, PlusCircle, X
} from "lucide-react";
import QRTicket from "@/components/ui/QRTicket";

// ── Types ──────────────────────────────────────────────────────────────────────
interface EventLocation { venueName: string; venueAddress: string; city: string; state: string; mapsLink?: string }
interface TicketCategory { id: string; name: string; price: string; maxCapacity: number; soldCount: number }
interface BackendEvent {
  id: string; title: string; slug: string; description?: string; category: string;
  status: string; startDate: string; endDate?: string; flyerUrl?: string;
  isPaid: boolean; price: string; maxCapacity?: number; registrationsCount: number;
  termsConditions?: string; viewsCount?: number;
  organizer?: { id: string; fullName: string; email: string };
  location?: EventLocation;
  ticketCategories: TicketCategory[];
}
interface MyTicket { id: string; qrCode: string; isUsed: boolean; usedAt?: string; paymentStatus: string }

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
    <div className="flex items-center gap-3">
      {[["d","DAYS"],["h","HRS"],["m","MIN"],["s","SEC"]].map(([k,l]) => (
        <div key={k} className="border-2 border-[#121212] bg-[#121212] text-[#FAF8F5] px-3 py-2 rounded text-center min-w-[52px]">
          <span className="font-display font-black text-2xl block">{pad(tl[k as keyof typeof tl])}</span>
          <span className="font-space font-black text-[8px] uppercase tracking-widest text-[#FAF8F5]/40">{l}</span>
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

  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [registering, setRegistering] = useState(false);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [regError, setRegError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [liveCount, setLiveCount] = useState(148);

  const isOrganizer = user && event && (event.organizer?.id === user.id || ["SUPER_ADMIN","ORG_ADMIN"].includes(user.role));
  const isCompleted = event ? ["COMPLETED","ARCHIVED","CANCELLED"].includes(event.status) : false;
  const hasTickets = myTickets.length > 0;

  useEffect(() => { const iv = setInterval(() => setLiveCount((p) => Math.max(10, p + Math.floor(Math.random()*5)-2)), 4000); return () => clearInterval(iv); }, []);

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

  // Check if user already has a ticket for this event
  useEffect(() => {
    if (!user || !event) return;
    api.get("/events/attendee/my-tickets")
      .then((tickets: any[]) => {
        const mine = tickets.filter((t) => t.event.id === event.id || t.event.slug === event.slug);
        if (mine.length > 0) setMyTickets(mine.map((t) => ({ id: t.ticketId, qrCode: t.qrCode, isUsed: t.isUsed, usedAt: t.usedAt, paymentStatus: t.paymentStatus })));
      })
      .catch(() => {});
  }, [user, event]);

  const triggerConfetti = () => confetti({ particleCount: 120, spread: 75, colors: ["#FFDE4D","#D80032","#FAF8F5"] });

  const handleRegister = async () => {
    if (!user) { window.location.href = `/login?redirect=/events/${id}`; return; }
    setRegistering(true); setRegError(null);
    try {
      const payload: Record<string,any> = {};
      if (selectedCategory) payload.ticketCategoryId = selectedCategory;
      const result = await api.post(`/events/${event?.id ?? id}/register`, payload);
      const ticket = result.ticket ?? result.tickets?.[0];
      if (ticket) {
        setMyTickets([{ id: ticket.id, qrCode: ticket.qrCode, isUsed: ticket.isUsed ?? false, usedAt: ticket.usedAt, paymentStatus: result.registration?.paymentStatus ?? "APPROVED" }]);
      }
      triggerConfetti(); addUserXP(50);
      if (event) setEvent({ ...event, registrationsCount: event.registrationsCount + 1 });
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
              <Link href={`/events/organizer?tab=analytics`}
                className="flex items-center gap-1.5 border-2 border-[#121212] bg-white font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-yellow-festival/20 transition-colors">
                <BarChart2 size={11} /> ANALYTICS
              </Link>
              <Link href={`/events/organizer?tab=scanner`}
                className="flex items-center gap-1.5 border-2 border-[#121212] bg-white font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-yellow-festival/20 transition-colors">
                <LayoutDashboard size={11} /> QR SCANNER
              </Link>
            </div>
          </div>
        )}

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div className="border-4 border-[#121212] bg-[#121212] text-[#FAF8F5] rounded shadow-brutal overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-0">
            {/* Flyer */}
            <div className="lg:w-2/5 h-56 lg:h-auto border-b-4 lg:border-b-0 lg:border-r-4 border-[#121212] overflow-hidden flex-shrink-0">
              {event.flyerUrl ? (
                <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full min-h-[220px] bg-gradient-to-br from-[#1a1a1a] to-[#333] flex items-center justify-center">
                  <span className="font-display font-black text-9xl text-white/[0.04]">E5</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-6 sm:p-8 space-y-5">
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

              <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase tracking-tighter leading-none text-yellow-festival">
                {event.title}
              </h1>

              {event.description && (
                <p className="font-space text-sm text-[#FAF8F5]/70 font-bold leading-relaxed max-w-lg">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded">
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
                    {registering ? "PROCESSING…" : user ? "CLAIM YOUR SPOT" : "LOGIN TO REGISTER"}
                  </button>
                )}
                <div className="flex items-center gap-2 text-[11px] bg-red-stage/20 border border-red-stage text-red-400 font-black px-4 py-2 rounded">
                  <span className="w-2 h-2 rounded-full bg-red-stage animate-ping" />
                  {liveCount} VIEWING
                </div>
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
              Present these QR codes at the venue entrance for scanning.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {myTickets.map((t) => (
                <QRTicket key={t.id} ticketId={t.id} qrCode={t.qrCode} isUsed={t.isUsed} usedAt={t.usedAt}
                  eventTitle={event.title} eventDate={formattedStart}
                  venueName={event.location?.venueName} venueCity={event.location?.city}
                  category={event.category} paymentStatus={t.paymentStatus} totalAmount={event.price} />
              ))}
            </div>
          </div>
        )}

        {/* ── Lower grid: Venue + Vote ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left: venue, terms */}
          <div className="lg:col-span-7 space-y-6">

            <h2 className="font-display font-black text-2xl uppercase tracking-tight border-b-3 border-[#121212] pb-3">
              Venue &amp; Location
            </h2>

            {event.location ? (
              <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-6 space-y-4">
                <h4 className="font-display font-extrabold text-xl">{event.location.venueName}</h4>
                <p className="font-space text-sm text-[#121212]/60 font-bold flex items-center gap-1.5">
                  <MapPin size={13} className="text-red-stage flex-shrink-0" /> {event.location.venueAddress}
                </p>
                <p className="font-space text-xs text-[#121212]/40 font-bold">{event.location.city}, {event.location.state}</p>
                {event.location.mapsLink && (
                  <a href={event.location.mapsLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#121212] text-white font-black text-xs uppercase px-4 py-2 rounded hover:bg-black/80 transition-colors">
                    OPEN IN MAPS <ExternalLink size={11} />
                  </a>
                )}
              </div>
            ) : (
              <div className="border-3 border-dashed border-[#121212] p-8 text-center bg-white rounded font-bold uppercase text-sm text-[#121212]/30">
                Venue details coming soon.
              </div>
            )}

            {/* End date */}
            {event.endDate && (
              <div className="border-3 border-[#121212] bg-white rounded p-4 flex items-center gap-3">
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
              <div className="border-3 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal p-6 space-y-3">
                <h3 className="font-display font-black text-base uppercase">Terms &amp; Conditions</h3>
                <p className="font-space text-xs text-[#121212]/60 leading-relaxed font-bold">{event.termsConditions}</p>
              </div>
            )}
          </div>

          {/* Right: vote kiosk */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border-3 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal p-6 space-y-5">
              <div className="border-b border-[#121212]/10 pb-4">
                <span className="brutal-tape text-[9px]">STAGEVERSE CORE</span>
                <h3 className="font-display font-black text-xl uppercase tracking-tight flex items-center gap-2 mt-2">
                  <Vote size={18} className="text-red-stage" /> Audience Vote Kiosk
                </h3>
                <p className="font-space text-xs text-[#121212]/60 font-bold mt-1">
                  One vote per event, per account. Votes are live and tabulated in real time.
                </p>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {artists.map((artist) => {
                  const hasVotedThis = userVotes[artist.id] === id;
                  const hasVotedAny = Object.values(userVotes).includes(id);
                  return (
                    <div key={artist.id}
                      className="bg-white border-2 border-[#121212] p-3 flex items-center justify-between rounded shadow-brutal-light hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal transition-all">
                      <div className="flex items-center gap-2.5">
                        <img src={artist.avatar} alt={artist.name} className="w-9 h-9 rounded-full object-cover border border-[#121212] flex-shrink-0" />
                        <div className="leading-tight">
                          <h4 className="font-display font-bold text-sm">{artist.name}</h4>
                          <span className="text-[9px] bg-red-stage/10 text-red-stage px-1.5 py-0.5 rounded font-black uppercase">
                            {artist.genre.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => { voteForArtist(artist.id, id); triggerConfetti(); }}
                        disabled={hasVotedAny}
                        className={`border border-[#121212] px-3 py-1.5 rounded font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-brutal-light transition-all ${
                          hasVotedThis ? "bg-green-500 text-white"
                          : hasVotedAny ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                          : "bg-yellow-festival text-[#121212] hover:translate-y-0.5 hover:shadow-none"
                        }`}>
                        {hasVotedThis ? <><Check size={9} /> VOTED</> : <><Flame size={9} /> VOTE</>}
                      </button>
                    </div>
                  );
                })}
              </div>

              <Link href="/stageverse"
                className="flex items-center justify-center gap-2 bg-[#121212] text-[#FAF8F5] border-2 border-[#121212] font-black text-[10px] uppercase tracking-widest py-3 rounded hover:bg-black/80 transition-colors">
                OPEN LIVE ARENA
              </Link>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/events/my-tickets"
                className="border-3 border-[#121212] bg-white rounded p-4 flex flex-col items-center gap-2 shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-yellow transition-all text-center">
                <Ticket size={20} className="text-yellow-festival" />
                <span className="font-display font-black text-[10px] uppercase">My Tickets</span>
              </Link>
              <Link href="/events"
                className="border-3 border-[#121212] bg-white rounded p-4 flex flex-col items-center gap-2 shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-yellow transition-all text-center">
                <Calendar size={20} className="text-red-stage" />
                <span className="font-display font-black text-[10px] uppercase">All Events</span>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

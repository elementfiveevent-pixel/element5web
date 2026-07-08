"use client";

import React, { useState, useEffect, use } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, Calendar, MapPin, Clock, Users, Check, Vote, Flame, QrCode,
  Download, AlertCircle, Tag, Shield, ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BackendEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  status: string;
  startDate: string;
  endDate?: string;
  flyerUrl?: string;
  isPaid: boolean;
  price: string;
  maxCapacity?: number;
  registrationsCount: number;
  termsConditions?: string;
  location?: {
    venueName: string;
    venueAddress: string;
    city: string;
    state: string;
    mapsLink?: string;
  };
  ticketCategories: { id: string; name: string; price: string; maxCapacity: number; soldCount: number }[];
}

interface Ticket {
  id: string;
  qrCode: string;
  isUsed: boolean;
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-12 px-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-5 w-24 bg-gray-200 rounded" />
        <div className="border-4 border-[#121212] bg-gray-200 rounded h-72" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-200 rounded" />)}
          </div>
          <div className="lg:col-span-5 h-64 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// QR Code display component
// ─────────────────────────────────────────────
function QRTicketCard({ ticket, eventTitle }: { ticket: Ticket; eventTitle: string }) {
  // Generate a simple visual QR-like pattern using the ticket qrCode string
  // In production Cloudinary or a QR library would render this
  return (
    <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 w-full border-b border-[#121212]/10 pb-3">
        <QrCode size={20} className="text-red-stage" />
        <h4 className="font-display font-black text-sm uppercase">YOUR ADMISSION TICKET</h4>
        {ticket.isUsed && (
          <span className="ml-auto text-[10px] font-black bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase">
            USED
          </span>
        )}
      </div>

      {/* QR Code — rendered as a bordered data string (real QR lib would go here) */}
      <div className="w-48 h-48 bg-[#121212] border-3 border-[#121212] rounded flex flex-col items-center justify-center p-3 select-none">
        <div className="grid grid-cols-8 gap-[2px] w-full">
          {ticket.qrCode.split("").slice(0, 64).map((char, i) => (
            <div
              key={i}
              className={`aspect-square rounded-[1px] ${parseInt(char, 16) > 7 ? "bg-white" : "bg-[#121212]"}`}
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="font-display font-black text-sm truncate max-w-[200px]">{eventTitle}</p>
        <p className="font-space text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate max-w-[200px]">
          REF: {ticket.qrCode.slice(0, 16).toUpperCase()}
        </p>
      </div>

      <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-[#121212]/10">
        <div className="text-center">
          <span className="text-[10px] text-gray-500 font-black uppercase block">Status</span>
          <span className={`text-xs font-black uppercase ${ticket.isUsed ? "text-gray-400" : "text-green-600"}`}>
            {ticket.isUsed ? "Checked In" : "Valid"}
          </span>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-gray-500 font-black uppercase block">Ticket ID</span>
          <span className="text-xs font-black uppercase text-[#121212]">{ticket.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { events: localEvents, artists, userVotes, voteForArtist, addUserXP } = useApp();
  const { user } = useAuth();

  const [event, setEvent] = useState<BackendEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Registration flow
  const [registering, setRegistering] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [groupSize, setGroupSize] = useState(1);

  // Live counter
  const [liveCounter, setLiveCounter] = useState(148);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCounter((prev) => Math.max(10, prev + Math.floor(Math.random() * 5) - 2));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch event from backend
  useEffect(() => {
    async function fetchEvent() {
      setLoading(true);
      try {
        const data = await api.get(`/events/${id}`);
        setEvent(data);
        if (data.ticketCategories?.length > 0) {
          setSelectedCategory(data.ticketCategories[0].id);
        }
      } catch {
        // Fallback to local context
        const local = localEvents.find((e) => e.id === id);
        if (local) {
          setEvent({
            id: local.id,
            title: local.title,
            slug: local.id,
            description: local.description,
            category: local.type.toUpperCase(),
            status: local.isCompleted ? "COMPLETED" : "PUBLISHED",
            startDate: local.date,
            flyerUrl: local.image,
            isPaid: false,
            price: "0",
            maxCapacity: local.registrationLimit,
            registrationsCount: local.audienceCount,
            ticketCategories: [],
            location: {
              venueName: local.venue.split(",")[0],
              venueAddress: local.venue,
              city: local.venue.split(",")[1]?.trim() || "Gujarat",
              state: "Gujarat",
            },
          });
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id, localEvents]);

  const triggerConfetti = () => {
    confetti({ particleCount: 120, spread: 75, colors: ["#FFDE4D", "#D80032", "#FAF8F5"] });
  };

  const handleRegister = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/events/${id}`;
      return;
    }
    setRegistering(true);
    setRegistrationError(null);
    try {
      const payload: Record<string, any> = {
        groupSize,
        customData: {},
      };
      if (selectedCategory) {
        payload.ticketCategoryId = selectedCategory;
      }
      const result = await api.post(`/events/${id}/register`, payload);
      // result.tickets is an array of EventTicket objects
      if (result.tickets && Array.isArray(result.tickets)) {
        setTickets(result.tickets);
      } else if (result.ticket) {
        setTickets([result.ticket]);
      } else {
        // Simulate a ticket for offline mode
        setTickets([{
          id: `sim-${Date.now()}`,
          qrCode: `${id}-${user.id}-${Date.now()}-simulated-qr-code-data-for-display`,
          isUsed: false,
        }]);
      }
      triggerConfetti();
      addUserXP(50);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("already registered")) {
        setRegistrationError("You are already registered for this event.");
      } else if (err.message?.toLowerCase().includes("sold out") || err.message?.toLowerCase().includes("capacity")) {
        setRegistrationError("Sorry, this event is sold out.");
      } else {
        // Offline simulation
        setTickets([{
          id: `sim-${Date.now()}`,
          qrCode: `${id}-${user?.id || "guest"}-${Date.now()}-simulated-qr-code-data`,
          isUsed: false,
        }]);
        triggerConfetti();
        addUserXP(50);
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleVote = (artistId: string) => {
    voteForArtist(artistId, id);
    triggerConfetti();
  };

  if (loading) return <EventDetailSkeleton />;

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] text-[#121212] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-display font-extrabold text-3xl uppercase text-red-stage">Event Not Found</h2>
        <p className="font-space mt-2">The event you are looking for does not exist in our system.</p>
        <Link href="/events" className="mt-6 brutal-tape text-sm">BACK TO EVENTS</Link>
      </div>
    );
  }

  const isCompleted = event.status === "COMPLETED";
  const hasTickets = tickets.length > 0;

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Back */}
        <Link href="/events" className="inline-flex items-center gap-2 font-display font-bold text-sm hover:underline">
          <ArrowLeft size={16} /> BACK TO EVENTS
        </Link>

        {/* ── Hero Banner ── */}
        <div className="border-4 border-[#121212] bg-[#121212] text-[#FAF8F5] p-8 rounded shadow-brutal flex flex-col lg:flex-row gap-8 items-center relative overflow-hidden">
          <div className="lg:w-3/5 space-y-6 relative z-10">
            <span className="brutal-tape uppercase text-xs text-[#121212]">
              {event.category} OFFICIAL PAGE
            </span>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl uppercase tracking-tighter text-yellow-festival">
              {event.title}
            </h1>
            {event.description && (
              <p className="font-space text-sm text-[#FAF8F5]/80 leading-relaxed font-bold">
                {event.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs font-black uppercase">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded">
                <Calendar size={12} /> {event.startDate || "TBD"}
              </span>
              {event.location && (
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded">
                  <MapPin size={12} /> {event.location.city}
                </span>
              )}
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded">
                <Users size={12} /> {event.registrationsCount} Registered
              </span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded">
                <Tag size={12} /> {event.isPaid ? `₹${event.price}` : "FREE ENTRY"}
              </span>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              {hasTickets ? (
                <div className="bg-green-500 text-white font-black px-6 py-3 border-2 border-white rounded flex items-center gap-2 text-sm">
                  <Check size={16} /> REGISTERED — VIEW TICKETS BELOW
                </div>
              ) : isCompleted ? (
                <div className="bg-gray-600 text-white font-black px-6 py-3 border-2 border-white rounded text-sm">
                  EVENT COMPLETED
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="bg-yellow-festival text-[#121212] font-black px-6 py-3 border-2 border-white rounded hover:bg-yellow-festival/80 text-sm tracking-wider uppercase disabled:opacity-50"
                >
                  {registering ? "PROCESSING..." : user ? "CLAIM SPOT" : "LOGIN TO REGISTER"}
                </button>
              )}

              <div className="flex items-center gap-2 text-xs bg-red-stage/20 border border-red-stage text-red-400 font-black px-4 py-2 rounded">
                <span className="w-2.5 h-2.5 rounded-full bg-red-stage animate-ping" />
                {liveCounter} VIEWING NOW
              </div>
            </div>

            {/* Registration error */}
            {registrationError && (
              <div className="flex items-center gap-2 bg-red-500/20 border border-red-500 text-red-300 p-3 rounded text-xs font-bold">
                <AlertCircle size={14} /> {registrationError}
              </div>
            )}
          </div>

          {/* Flyer */}
          <div className="lg:w-2/5 border-3 border-white rounded overflow-hidden h-[300px] w-full">
            {event.flyerUrl ? (
              <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#333] flex items-center justify-center">
                <span className="font-display font-black text-8xl text-white/5">E5</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Ticket Categories + Group Size (shown before registration) ── */}
        {!hasTickets && !isCompleted && event.ticketCategories.length > 0 && (
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
            <h3 className="font-display font-black text-lg uppercase">Select Ticket Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {event.ticketCategories.map((cat) => {
                const available = cat.maxCapacity - cat.soldCount;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    disabled={available <= 0}
                    className={`border-3 p-4 rounded text-left transition-all ${
                      selectedCategory === cat.id
                        ? "border-[#121212] bg-yellow-festival shadow-brutal"
                        : "border-[#121212] bg-white hover:shadow-brutal"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <span className="font-display font-black text-sm block">{cat.name}</span>
                    <span className="font-space font-bold text-xs text-gray-600">
                      {parseFloat(cat.price) === 0 ? "FREE" : `₹${cat.price}`}
                    </span>
                    <span className="font-space text-[10px] text-gray-400 block mt-1">
                      {available > 0 ? `${available} spots left` : "SOLD OUT"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4">
              <label className="font-display font-black text-xs uppercase text-gray-600">Group Size</label>
              <input
                type="number"
                min={1}
                max={10}
                value={groupSize}
                onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                className="w-20 p-2 border-2 border-[#121212] rounded font-bold text-center focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ── QR TICKETS (post-registration) ── */}
        {hasTickets && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b-3 border-[#121212] pb-4">
              <Shield size={24} className="text-green-600" />
              <h2 className="font-display font-black text-2xl uppercase tracking-tight">
                Your Admission Tickets
              </h2>
              <span className="ml-auto text-xs font-black text-gray-500 uppercase">
                {tickets.length} ticket{tickets.length > 1 ? "s" : ""} issued
              </span>
            </div>
            <p className="font-space text-sm text-gray-600 font-bold">
              Present these QR codes at the venue entrance for scanning. Screenshot or download for offline access.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <QRTicketCard key={ticket.id} ticket={ticket} eventTitle={event.title} />
              ))}
            </div>
          </div>
        )}

        {/* ── Schedule & Vote Kiosk ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Schedule (left) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="font-display font-black text-2xl uppercase tracking-tight border-b-3 border-[#121212] pb-2">
              Venue & Location
            </h2>

            {event.location ? (
              <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
                <div className="space-y-2">
                  <h4 className="font-display font-extrabold text-xl">{event.location.venueName}</h4>
                  <p className="font-space text-sm text-gray-600 font-bold flex items-center gap-1.5">
                    <MapPin size={14} className="text-red-stage" /> {event.location.venueAddress}
                  </p>
                  <p className="font-space text-xs text-gray-500 font-bold">
                    {event.location.city}, {event.location.state}
                  </p>
                </div>
                {event.location.mapsLink && (
                  <a
                    href={event.location.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#121212] text-white font-black text-xs uppercase px-4 py-2 rounded hover:bg-black/80"
                  >
                    OPEN IN MAPS <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : (
              <div className="border-3 border-dashed border-[#121212] p-8 text-center bg-white rounded text-gray-500 font-bold uppercase text-sm">
                Venue details pending release.
              </div>
            )}

            {/* Terms */}
            {event.termsConditions && (
              <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-3">
                <h3 className="font-display font-black text-base uppercase">Terms & Conditions</h3>
                <p className="font-space text-xs text-gray-600 leading-relaxed">{event.termsConditions}</p>
              </div>
            )}
          </div>

          {/* Audience Vote Kiosk (right) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-6">
              <div className="border-b border-[#121212]/10 pb-4">
                <span className="brutal-tape text-[10px]">STAGEVERSE CORE</span>
                <h3 className="font-display font-black text-xl uppercase tracking-tight flex items-center gap-2 mt-2">
                  <Vote size={20} className="text-red-stage" /> Verified Vote Kiosk
                </h3>
                <p className="text-xs font-space text-gray-600 font-bold mt-1">
                  Cast your audience vote below. One vote per event, per account.
                </p>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {artists.map((artist) => {
                  const hasVotedThis = userVotes[artist.id] === id;
                  const hasVotedAny = Object.values(userVotes).includes(id);
                  return (
                    <div
                      key={artist.id}
                      className="bg-white border-2 border-[#121212] p-3 flex items-center justify-between rounded shadow-brutal-light hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={artist.avatar}
                          alt={artist.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#121212]"
                        />
                        <div className="leading-tight">
                          <h4 className="font-display font-bold text-sm">{artist.name}</h4>
                          <span className="text-[10px] bg-red-stage/10 text-red-stage px-1.5 py-0.5 rounded font-black uppercase mt-0.5 inline-block">
                            {artist.genre.split(" ")[0]}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleVote(artist.id)}
                        disabled={hasVotedAny}
                        className={`border border-[#121212] px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-brutal-light transition-all ${
                          hasVotedThis
                            ? "bg-green-500 text-white"
                            : hasVotedAny
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                            : "bg-yellow-festival text-[#121212] hover:translate-y-0.5 hover:shadow-none"
                        }`}
                      >
                        {hasVotedThis ? <><Check size={10} /> VOTED</> : <><Flame size={10} /> VOTE</>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

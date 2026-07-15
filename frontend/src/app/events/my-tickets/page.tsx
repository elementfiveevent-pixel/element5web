"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { Ticket, ArrowLeft, Calendar, MapPin, RefreshCw, AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import QRTicket from "@/components/ui/QRTicket";

// ── Types ────────────────────────────────────────────────────────────────────
interface MyTicket {
  ticketId: string;
  qrCode: string;
  isUsed: boolean;
  usedAt?: string | null;
  createdAt: string;
  paymentStatus: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
  registrationId: string;
  totalAmount: string;
  event: {
    id: string;
    title: string;
    slug: string;
    flyerUrl?: string;
    category: string;
    status: string;
    startDate: string;
    endDate?: string;
    isPaid: boolean;
    price: string;
    location?: {
      venueName: string;
      venueAddress: string;
      city: string;
      state: string;
    };
  };
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function TicketSkeleton() {
  return (
    <div className="animate-pulse border-3 border-[#121212] rounded overflow-hidden shadow-brutal">
      <div className="bg-gray-300 h-10" />
      <div className="bg-gray-100 p-4 flex gap-4">
        <div className="w-[140px] h-[140px] bg-gray-200 rounded flex-shrink-0" />
        <div className="flex-1 space-y-3 py-2">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="bg-gray-100 h-12 border-t-2 border-dashed border-gray-200" />
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function EventStatusPill({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    PUBLISHED:  { cls: "bg-green-100 text-green-700 border-green-300",   label: "UPCOMING"  },
    COMPLETED:  { cls: "bg-gray-200 text-gray-600 border-gray-300",      label: "COMPLETED" },
    CANCELLED:  { cls: "bg-red-100 text-red-600 border-red-300",         label: "CANCELLED" },
    DRAFT:      { cls: "bg-yellow-100 text-yellow-700 border-yellow-300",label: "DRAFT"     },
    ARCHIVED:   { cls: "bg-gray-100 text-gray-500 border-gray-200",      label: "ARCHIVED"  },
  };
  const { cls, label } = cfg[status] ?? cfg["ARCHIVED"];
  return (
    <span className={`inline-flex items-center gap-1 border font-black text-[9px] uppercase px-2 py-0.5 rounded ${cls}`}>
      {label}
    </span>
  );
}

// ── Payment status icon ───────────────────────────────────────────────────────
function PaymentIcon({ status }: { status: string }) {
  if (status === "APPROVED") return <CheckCircle size={14} className="text-green-600" />;
  if (status === "PENDING")  return <Clock size={14} className="text-yellow-600" />;
  if (status === "REJECTED") return <XCircle size={14} className="text-red-600" />;
  return <RefreshCw size={14} className="text-gray-400" />;
}

// ── Tab filter ───────────────────────────────────────────────────────────────
type Tab = "all" | "upcoming" | "completed" | "pending";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MyTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await api.get("/events/attendee/my-tickets");
      setTickets(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load tickets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter((t) => {
    if (tab === "upcoming")  return t.event.status === "PUBLISHED" && t.paymentStatus !== "REJECTED";
    if (tab === "completed") return t.event.status === "COMPLETED" || t.isUsed;
    if (tab === "pending")   return t.paymentStatus === "PENDING";
    return true;
  });

  const counts = {
    all: tickets.length,
    upcoming: tickets.filter((t) => t.event.status === "PUBLISHED" && t.paymentStatus !== "REJECTED").length,
    completed: tickets.filter((t) => t.event.status === "COMPLETED" || t.isUsed).length,
    pending: tickets.filter((t) => t.paymentStatus === "PENDING").length,
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "all",       label: "All"       },
    { key: "upcoming",  label: "Upcoming"  },
    { key: "completed", label: "Completed" },
    { key: "pending",   label: "Pending"   },
  ];

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Back */}
        <Link href="/events" className="inline-flex items-center gap-2 font-display font-bold text-sm hover:underline text-[#121212]/70 hover:text-[#121212]">
          <ArrowLeft size={15} /> BACK TO EVENTS
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <span className="brutal-tape text-xs uppercase select-none">YOUR PASSES</span>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <h1 className="font-display font-extrabold text-5xl md:text-6xl uppercase tracking-tighter leading-none">
              MY <span className="text-red-stage">TICKETS</span>
            </h1>
            <button
              onClick={() => fetchTickets(true)}
              disabled={refreshing}
              className="flex items-center gap-2 border-2 border-[#121212] bg-white font-black text-xs uppercase px-4 py-2 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              REFRESH
            </button>
          </div>
          <p className="font-space font-bold text-sm text-[#121212]/60 max-w-lg">
            Every event you're registered for lives here. Present your QR code at the venue entrance.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 border-2 border-[#121212] font-display font-black text-xs uppercase rounded shadow-brutal transition-all ${
                tab === key
                  ? "bg-[#121212] text-white translate-x-[2px] translate-y-[2px] shadow-none"
                  : "bg-white text-[#121212] hover:bg-yellow-festival/20"
              }`}
            >
              {label}
              <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-black ${tab === key ? "bg-white/20 text-white" : "bg-[#121212]/10 text-[#121212]/60"}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => <TicketSkeleton key={i} />)}
          </div>

        ) : error ? (
          <div className="border-3 border-red-stage bg-red-50 p-8 rounded shadow-brutal flex items-start gap-3">
            <AlertCircle size={20} className="text-red-stage flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-black text-lg uppercase text-red-stage">Could not load tickets</p>
              <p className="font-space text-sm text-red-700 mt-1">{error}</p>
              <button onClick={() => fetchTickets()} className="mt-4 bg-red-stage text-white font-black text-xs uppercase px-4 py-2 rounded">
                RETRY
              </button>
            </div>
          </div>

        ) : filtered.length === 0 ? (
          <div className="border-3 border-dashed border-[#121212] bg-white rounded p-16 text-center space-y-4">
            <Ticket size={40} className="mx-auto text-[#121212]/20" />
            <p className="font-display font-black text-2xl uppercase text-[#121212]/40">
              {tab === "all" ? "No tickets yet" : `No ${tab} tickets`}
            </p>
            <p className="font-space text-sm text-[#121212]/40 font-bold max-w-xs mx-auto">
              {tab === "all"
                ? "Register for any event to see your tickets and QR codes here."
                : `You don't have any ${tab} tickets right now.`}
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-yellow-festival text-[#121212] border-2 border-[#121212] font-black text-xs uppercase px-6 py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all mt-2"
            >
              BROWSE EVENTS
            </Link>
          </div>

        ) : (
          <div className="space-y-8">
            {filtered.map((t) => {
              const isPast = t.event.status === "COMPLETED" || t.event.status === "ARCHIVED" || t.event.status === "CANCELLED";
              const startDate = t.event.startDate
                ? new Date(t.event.startDate).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })
                : undefined;

              return (
                <div key={t.ticketId} className="space-y-2">
                  {/* Event context row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/events/${t.event.slug || t.event.id}`}
                      className="font-display font-black text-sm uppercase hover:underline tracking-wide"
                    >
                      {t.event.title}
                    </Link>
                    <EventStatusPill status={t.event.status} />
                    <span className="flex items-center gap-1 text-[#121212]/50">
                      <PaymentIcon status={t.paymentStatus} />
                      <span className="font-space font-black text-[10px] uppercase">{t.paymentStatus}</span>
                    </span>
                    {startDate && (
                      <span className="flex items-center gap-1 font-space text-[10px] font-bold text-[#121212]/40">
                        <Calendar size={10} /> {startDate}
                      </span>
                    )}
                    {t.event.location && (
                      <span className="flex items-center gap-1 font-space text-[10px] font-bold text-[#121212]/40">
                        <MapPin size={10} /> {t.event.location.city}
                      </span>
                    )}
                  </div>

                  {/* Ticket card */}
                  <QRTicket
                    ticketId={t.ticketId}
                    qrCode={t.qrCode}
                    isUsed={t.isUsed}
                    usedAt={t.usedAt}
                    eventTitle={t.event.title}
                    eventDate={startDate}
                    venueName={t.event.location?.venueName}
                    venueCity={t.event.location?.city}
                    category={t.event.category}
                    paymentStatus={t.paymentStatus}
                    registrationId={t.registrationId}
                    totalAmount={t.totalAmount}
                  />

                  {/* Pending payment notice */}
                  {t.paymentStatus === "PENDING" && (
                    <div className="flex items-start gap-2 bg-yellow-festival/20 border-2 border-yellow-festival rounded p-3">
                      <Clock size={14} className="text-yellow-700 flex-shrink-0 mt-0.5" />
                      <p className="font-space font-bold text-xs text-yellow-800">
                        Payment verification pending. Your QR code will activate once the organizer approves your registration.
                        {t.event.isPaid && " Upload payment screenshot on the event page if required."}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {!loading && tickets.length > 0 && (
          <div className="border-t-2 border-[#121212]/10 pt-6 flex items-center gap-2 text-[#121212]/40">
            <AlertCircle size={12} />
            <p className="font-space text-[11px] font-bold">
              QR codes are cryptographically signed and single-use. Screenshot them for offline access. Each ticket is tied to your account.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard, BarChart2, Users, QrCode, Ticket, PlusCircle,
  RefreshCw, AlertCircle, Check, X, CheckCircle, Clock, XCircle,
  Calendar, MapPin, TrendingUp, Eye, ArrowRight, Camera, Loader2,
  ChevronDown, ChevronUp, Search
} from "lucide-react";
import QRCode from "qrcode";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrgEvent {
  id: string; title: string; slug: string; status: string; category: string;
  startDate: string; flyerUrl?: string; registrationsCount: number;
  maxCapacity?: number; isPaid: boolean; price: string; viewsCount: number;
  location?: { venueName: string; city: string };
  _count?: { registrations: number; tickets: number };
}
interface Registration {
  id: string; paymentStatus: string; createdAt: string; totalAmount: string;
  customData?: Record<string, any>;
  user: { id: string; fullName: string; email: string; mobileNumber?: string; profilePhotoUrl?: string };
  tickets: { id: string; qrCode: string; isUsed: boolean; usedAt?: string }[];
}
interface Analytics {
  eventId: string; title: string; status: string; maxCapacity?: number;
  totalRegistrations: number; approvedRegistrations: number; pendingRegistrations: number;
  totalTickets: number; checkedIn: number; notCheckedIn: number;
  capacityPct: number; attendanceRate: number; totalRevenue: number;
  viewsCount: number;
  registrationTimeline: { date: string; count: number }[];
  checkInTimeline: { hour: string; count: number }[];
}
interface ScanResult {
  success: boolean; message: string; attendee?: string;
  eventName?: string; checkedInAt?: string; isError?: boolean;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`border-3 border-[#121212] rounded shadow-brutal p-5 ${color}`}>
      <span className="font-display font-black text-[10px] uppercase tracking-widest block opacity-70">{label}</span>
      <span className="font-display font-black text-4xl block mt-1">{value}</span>
      {sub && <span className="font-space font-bold text-[11px] opacity-60 mt-0.5 block">{sub}</span>}
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBarChart({ data, label }: { data: { label: string; count: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      <p className="font-display font-black text-xs uppercase text-[#121212]/50">{label}</p>
      <div className="flex items-end gap-1 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.label}: ${d.count}`}>
            <div
              className="w-full bg-yellow-festival border border-[#121212] rounded-sm transition-all"
              style={{ height: `${Math.round((d.count / max) * 100)}%`, minHeight: d.count > 0 ? "4px" : "0" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QR Scanner panel ──────────────────────────────────────────────────────────
function QRScannerPanel({ events }: { events: OrgEvent[] }) {
  const [selectedEvent, setSelectedEvent] = useState(events[0]?.id ?? "");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const doCheckIn = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    setResult(null);
    try {
      const data = await api.post("/events/tickets/checkin", {
        qrCode: code.trim(),
        deviceFingerprint: navigator.userAgent.slice(0, 32),
      });
      setResult({ ...data, isError: false });
    } catch (err: any) {
      const msg = err.message ?? "Check-in failed";
      const isDuplicate = msg.toLowerCase().includes("already checked");
      setResult({ success: false, message: msg, isError: true,
        attendee: isDuplicate ? "DUPLICATE SCAN" : undefined });
    } finally {
      setScanning(false);
    }
  }, []);

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    doCheckIn(manualCode);
    setManualCode("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual entry */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal p-6 space-y-4">
          <h3 className="font-display font-black text-lg uppercase flex items-center gap-2">
            <QrCode size={20} className="text-yellow-festival" /> Manual Code Entry
          </h3>
          <div className="space-y-2">
            <label className="font-display font-black text-[10px] uppercase text-[#121212]/50">Select Event</label>
            <select className="w-full px-4 py-2.5 border-2 border-[#121212] bg-white rounded font-display font-bold text-sm focus:outline-none"
              value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>
          <form onSubmit={handleManual} className="flex gap-2">
            <input className="flex-1 px-4 py-2.5 border-2 border-[#121212] bg-white rounded font-mono font-bold text-sm focus:outline-none placeholder-[#121212]/30"
              placeholder="Paste QR code hash…"
              value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
            <button type="submit" disabled={scanning || !manualCode.trim()}
              className="bg-[#121212] text-[#FAF8F5] border-2 border-[#121212] font-black text-xs uppercase px-4 py-2.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-40 transition-all">
              {scanning ? <Loader2 size={14} className="animate-spin" /> : "CHECK IN"}
            </button>
          </form>
        </div>

        {/* Result display */}
        <div className={`border-3 rounded shadow-brutal p-6 flex flex-col items-center justify-center min-h-[200px] transition-colors ${
          !result ? "border-[#121212]/20 bg-white"
          : result.success ? "border-green-500 bg-green-50"
          : result.message?.toLowerCase().includes("already") ? "border-yellow-festival bg-yellow-50"
          : "border-red-stage bg-red-50"
        }`}>
          {scanning ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#121212]/40" />
              <span className="font-display font-black text-sm uppercase text-[#121212]/40">VERIFYING…</span>
            </div>
          ) : result ? (
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 rounded-full border-3 border-[#121212] flex items-center justify-center mx-auto ${result.success ? "bg-green-500" : result.message?.toLowerCase().includes("already") ? "bg-yellow-festival" : "bg-red-stage"}`}>
                {result.success ? <Check size={28} className="text-white" />
                  : result.message?.toLowerCase().includes("already") ? <AlertCircle size={28} className="text-[#121212]" />
                  : <X size={28} className="text-white" />}
              </div>
              <div>
                <p className="font-display font-black text-lg uppercase">{result.success ? "CHECKED IN" : result.message?.toLowerCase().includes("already") ? "ALREADY SCANNED" : "INVALID TICKET"}</p>
                {result.attendee && <p className="font-space font-bold text-sm text-[#121212]/70 mt-1">{result.attendee}</p>}
                {result.checkedInAt && <p className="font-space font-bold text-xs text-[#121212]/40 mt-0.5">{new Date(result.checkedInAt).toLocaleTimeString("en-IN")}</p>}
                {!result.success && <p className="font-space text-xs font-bold text-[#121212]/50 mt-2">{result.message}</p>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 opacity-40">
              <QrCode size={40} />
              <span className="font-display font-black text-xs uppercase tracking-widest">Awaiting scan</span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="border-2 border-[#121212]/20 bg-white rounded p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {[
          { icon: <QrCode size={16} />, title: "Scan or Enter", desc: "Paste the QR code string from the attendee's ticket" },
          { icon: <CheckCircle size={16} />, title: "Instant Verify", desc: "Backend validates uniqueness, expiry, and event match" },
          { icon: <Camera size={16} />, title: "Audit Log", desc: "Every scan — pass or fail — is recorded with device info" },
        ].map((item) => (
          <div key={item.title} className="space-y-1">
            <span className="text-yellow-festival flex justify-center">{item.icon}</span>
            <p className="font-display font-black text-xs uppercase">{item.title}</p>
            <p className="font-space text-[11px] text-[#121212]/50 font-bold">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Registrations panel ───────────────────────────────────────────────────────
function RegistrationsPanel({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    api.get(`/events/${eventId}/registrations`)
      .then((d) => setRegs(Array.isArray(d) ? d : []))
      .catch(() => setRegs([]))
      .finally(() => setLoading(false));
  }, [eventId]);

  const review = async (id: string, action: "APPROVED" | "REJECTED") => {
    setReviewing(id);
    try {
      await api.patch(`/events/registrations/${id}/review`, { action });
      setRegs((prev) => prev.map((r) => r.id === id ? { ...r, paymentStatus: action } : r));
    } catch {}
    finally { setReviewing(null); }
  };

  const filtered = regs.filter((r) => {
    const matchSearch = !search || r.user.fullName.toLowerCase().includes(search.toLowerCase()) || r.user.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || r.paymentStatus === filter;
    return matchSearch && matchFilter;
  });

  const statusIcon = (s: string) => s === "APPROVED" ? <CheckCircle size={13} className="text-green-600" /> : s === "PENDING" ? <Clock size={13} className="text-yellow-600" /> : s === "REJECTED" ? <XCircle size={13} className="text-red-600" /> : null;

  if (loading) return <div className="py-12 text-center font-display font-black text-sm uppercase animate-pulse text-[#121212]/40">Loading registrations…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#121212]/40" />
          <input className="w-full pl-9 pr-4 py-2.5 border-2 border-[#121212] rounded font-space font-bold text-sm focus:outline-none" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-4 py-2.5 border-2 border-[#121212] bg-white rounded font-display font-bold text-sm focus:outline-none" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All ({regs.length})</option>
          <option value="APPROVED">Approved ({regs.filter(r=>r.paymentStatus==="APPROVED").length})</option>
          <option value="PENDING">Pending ({regs.filter(r=>r.paymentStatus==="PENDING").length})</option>
          <option value="REJECTED">Rejected ({regs.filter(r=>r.paymentStatus==="REJECTED").length})</option>
        </select>
      </div>
      <div className="border-3 border-[#121212] rounded overflow-hidden shadow-brutal">
        <div className="grid grid-cols-12 bg-[#121212] text-[#FAF8F5] px-4 py-2.5 font-display font-black text-[10px] uppercase tracking-wider">
          <div className="col-span-4">Attendee</div><div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Amount</div><div className="col-span-2 text-center">Ticket</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y divide-[#121212]/10 max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center font-space font-bold text-sm text-[#121212]/40">No registrations found</div>
          ) : filtered.map((r) => (
            <div key={r.id} className="grid grid-cols-12 items-center px-4 py-3 bg-white hover:bg-[#FAF8F5] transition-colors">
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#121212]/10 flex-shrink-0 flex items-center justify-center font-display font-black text-xs">
                  {r.user.fullName[0]}
                </div>
                <div className="min-w-0"><p className="font-display font-bold text-sm truncate">{r.user.fullName}</p><p className="font-space text-[10px] text-[#121212]/40 truncate">{r.user.email}</p></div>
              </div>
              <div className="col-span-2 flex items-center justify-center gap-1">
                {statusIcon(r.paymentStatus)}
                <span className="font-space font-black text-[10px] uppercase">{r.paymentStatus}</span>
              </div>
              <div className="col-span-2 text-center font-space font-black text-sm">
                {Number(r.totalAmount) > 0 ? `₹${r.totalAmount}` : "FREE"}
              </div>
              <div className="col-span-2 text-center">
                {r.tickets[0] ? (
                  <span className={`inline-flex items-center gap-1 font-space font-black text-[10px] uppercase px-2 py-0.5 rounded ${r.tickets[0].isUsed ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700"}`}>
                    {r.tickets[0].isUsed ? "USED" : "VALID"}
                  </span>
                ) : <span className="text-[#121212]/30 font-space text-[10px]">—</span>}
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                {r.paymentStatus === "PENDING" && (
                  <>
                    <button onClick={() => review(r.id, "APPROVED")} disabled={reviewing === r.id}
                      className="text-[9px] font-black bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50 hover:bg-green-600 transition-colors">
                      {reviewing === r.id ? "…" : "APPROVE"}
                    </button>
                    <button onClick={() => review(r.id, "REJECTED")} disabled={reviewing === r.id}
                      className="text-[9px] font-black bg-red-stage text-white px-2 py-1 rounded disabled:opacity-50 hover:bg-red-700 transition-colors">
                      REJECT
                    </button>
                  </>
                )}
                {r.paymentStatus !== "PENDING" && (
                  <span className="text-[9px] font-black text-[#121212]/30 uppercase">Done</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Analytics panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ eventId }: { eventId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    api.get(`/events/${eventId}/analytics`)
      .then(setData)
      .catch((e) => setError(e.message ?? "Failed"))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="py-12 text-center font-display font-black text-sm uppercase animate-pulse text-[#121212]/40">Loading analytics…</div>;
  if (error || !data) return <div className="py-8 text-center font-display font-black text-sm text-red-stage uppercase">{error ?? "No data"}</div>;

  const regTimeline = data.registrationTimeline.slice(-14).map((d) => ({
    label: d.date.slice(5), count: d.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Registrations" value={data.totalRegistrations} sub={`${data.approvedRegistrations} approved`} color="bg-yellow-festival/20" />
        <StatCard label="Checked In" value={data.checkedIn} sub={`${data.attendanceRate}% attendance`} color="bg-green-100" />
        <StatCard label="Capacity" value={`${data.capacityPct}%`} sub={`of ${data.maxCapacity ?? "∞"}`} color="bg-[#FAF8F5]" />
        <StatCard label="Revenue" value={data.totalRevenue > 0 ? `₹${data.totalRevenue.toLocaleString()}` : "FREE"} sub={`${data.totalTickets} tickets`} color="bg-red-stage/10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-5">
          {regTimeline.length > 0
            ? <MiniBarChart data={regTimeline} label="Registrations (last 14 days)" />
            : <p className="font-space text-sm font-bold text-[#121212]/30 text-center py-4">No registration data yet</p>}
        </div>
        <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-5 space-y-3">
          <p className="font-display font-black text-xs uppercase text-[#121212]/50">Attendance Breakdown</p>
          <div className="space-y-2">
            {[
              { label: "Checked In",   val: data.checkedIn,      total: data.totalTickets, cls: "bg-green-500" },
              { label: "Not Checked",  val: data.notCheckedIn,   total: data.totalTickets, cls: "bg-yellow-festival" },
              { label: "Pending Pay",  val: data.pendingRegistrations, total: data.totalRegistrations, cls: "bg-orange-burnt" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between font-space font-black text-[11px] mb-1">
                  <span>{row.label}</span><span>{row.val}</span>
                </div>
                <div className="w-full h-2 bg-[#121212]/10 rounded-full overflow-hidden">
                  <div className={`h-full ${row.cls} rounded-full transition-all`}
                    style={{ width: `${row.total > 0 ? Math.round((row.val / row.total) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "events",         label: "My Events",     icon: <LayoutDashboard size={14} /> },
  { key: "registrations",  label: "Registrations", icon: <Users size={14} /> },
  { key: "analytics",      label: "Analytics",     icon: <BarChart2 size={14} /> },
  { key: "scanner",        label: "QR Scanner",    icon: <QrCode size={14} /> },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) ?? "events";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");

  useEffect(() => {
    api.get("/events/organizer/my-events")
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0].id);
      })
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, []);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const isOrganizerOrAdmin = user && ["SUPER_ADMIN", "ORG_ADMIN", "EVENT_MANAGER"].includes(user.role);

  if (!isOrganizerOrAdmin) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-red-stage" />
          <h2 className="font-display font-black text-2xl uppercase">Access Denied</h2>
          <p className="font-space font-bold text-sm text-[#121212]/60">Organizer access requires ORG_ADMIN or EVENT_MANAGER role.</p>
          <Link href="/events" className="inline-block bg-yellow-festival text-[#121212] border-2 border-[#121212] font-black text-xs uppercase px-6 py-3 rounded shadow-brutal">BACK TO EVENTS</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="brutal-tape text-xs uppercase select-none">ORGANIZER HQ</span>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl uppercase tracking-tighter mt-1">
              EVENT <span className="text-red-stage">DASHBOARD</span>
            </h1>
            <p className="font-space font-bold text-sm text-[#121212]/60">
              Manage events, review registrations, scan tickets, and track analytics.
            </p>
          </div>
          <Link href="/events/create"
            className="flex items-center gap-2 bg-yellow-festival text-[#121212] border-3 border-[#121212] font-black text-xs uppercase px-5 py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex-shrink-0">
            <PlusCircle size={15} /> CREATE EVENT
          </Link>
        </div>

        {/* Event selector (shown on non-events tabs) */}
        {activeTab !== "events" && events.length > 0 && (
          <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="font-display font-black text-xs uppercase text-[#121212]/50 flex-shrink-0">Active Event:</span>
            <select className="flex-1 px-4 py-2.5 border-2 border-[#121212] rounded font-display font-bold text-sm focus:outline-none"
              value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
            {selectedEvent && (
              <Link href={`/events/${selectedEvent.slug}`}
                className="flex items-center gap-1.5 border-2 border-[#121212] font-black text-[10px] uppercase px-3 py-2 rounded hover:bg-[#121212]/5 transition-colors flex-shrink-0">
                <Eye size={12} /> VIEW PAGE
              </Link>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-3 border-[#121212] rounded overflow-hidden max-w-2xl bg-white">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-display font-black text-[10px] uppercase tracking-wider transition-colors ${
                activeTab === t.key ? "bg-[#121212] text-white" : "text-[#121212] hover:bg-[#121212]/5"
              }`}>
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="min-h-[400px]">

          {/* ── MY EVENTS ─────────────────────────────────────────────── */}
          {activeTab === "events" && (
            eventsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3].map((i) => (
                  <div key={i} className="animate-pulse border-3 border-[#121212] bg-white rounded shadow-brutal overflow-hidden">
                    <div className="h-32 bg-gray-200" />
                    <div className="p-4 space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="border-3 border-dashed border-[#121212] bg-white rounded p-16 text-center space-y-4">
                <Calendar size={40} className="mx-auto text-[#121212]/20" />
                <p className="font-display font-black text-2xl uppercase text-[#121212]/40">No events yet</p>
                <Link href="/events/create"
                  className="inline-flex items-center gap-2 bg-yellow-festival text-[#121212] border-2 border-[#121212] font-black text-xs uppercase px-6 py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                  <PlusCircle size={14} /> CREATE YOUR FIRST EVENT
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map((ev) => {
                  const cap = ev.maxCapacity ? Math.min(100, Math.round((ev.registrationsCount / ev.maxCapacity) * 100)) : 0;
                  const statusColor: Record<string, string> = { PUBLISHED: "bg-green-100 text-green-700", DRAFT: "bg-yellow-100 text-yellow-700", COMPLETED: "bg-gray-200 text-gray-600", CANCELLED: "bg-red-100 text-red-700", ARCHIVED: "bg-gray-100 text-gray-400" };
                  return (
                    <div key={ev.id} className="border-3 border-[#121212] bg-white rounded shadow-brutal overflow-hidden flex flex-col hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-yellow transition-all">
                      <div className="relative h-32 bg-[#121212] border-b-3 border-[#121212]">
                        {ev.flyerUrl ? <img src={ev.flyerUrl} alt={ev.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="font-display font-black text-5xl text-white/10">E5</span></div>}
                        <span className={`absolute top-2 right-2 font-black text-[9px] uppercase px-2 py-0.5 rounded border border-[#121212] ${statusColor[ev.status] ?? "bg-gray-200"}`}>{ev.status}</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <div>
                          <span className="font-black text-[9px] uppercase bg-red-stage text-white px-1.5 py-0.5 rounded">{ev.category}</span>
                          <h3 className="font-display font-extrabold text-lg leading-tight mt-1 line-clamp-2">{ev.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-[#121212]/50 font-space">
                            <span className="flex items-center gap-1"><Calendar size={10} />{new Date(ev.startDate).toLocaleDateString("en-IN")}</span>
                            {ev.location && <span className="flex items-center gap-1"><MapPin size={10} />{ev.location.city}</span>}
                          </div>
                        </div>
                        {ev.maxCapacity && (
                          <div className="space-y-1">
                            <div className="flex justify-between font-space font-black text-[10px] text-[#121212]/50">
                              <span>{ev.registrationsCount} registered</span><span>{ev.maxCapacity} cap</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#121212]/10 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-festival rounded-full" style={{ width: `${cap}%` }} />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 mt-auto">
                          <button onClick={() => { setSelectedEventId(ev.id); setActiveTab("registrations"); }}
                            className="flex-1 text-[10px] font-black uppercase border-2 border-[#121212] py-2 rounded hover:bg-[#121212]/5 transition-colors flex items-center justify-center gap-1">
                            <Users size={11} /> {ev.registrationsCount} REGS
                          </button>
                          <button onClick={() => { setSelectedEventId(ev.id); setActiveTab("analytics"); }}
                            className="flex-1 text-[10px] font-black uppercase border-2 border-[#121212] py-2 rounded hover:bg-[#121212]/5 transition-colors flex items-center justify-center gap-1">
                            <BarChart2 size={11} /> ANALYTICS
                          </button>
                          <Link href={`/events/${ev.slug}`}
                            className="flex items-center justify-center border-2 border-[#121212] px-3 py-2 rounded hover:bg-[#121212]/5 transition-colors">
                            <Eye size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {activeTab === "registrations" && selectedEventId && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-xl uppercase">
                Registrations — <span className="text-red-stage">{selectedEvent?.title ?? "…"}</span>
              </h2>
              <RegistrationsPanel eventId={selectedEventId} eventTitle={selectedEvent?.title ?? ""} />
            </div>
          )}

          {activeTab === "analytics" && selectedEventId && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-xl uppercase">
                Analytics — <span className="text-red-stage">{selectedEvent?.title ?? "…"}</span>
              </h2>
              <AnalyticsPanel eventId={selectedEventId} />
            </div>
          )}

          {activeTab === "scanner" && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-xl uppercase">QR Check-In Scanner</h2>
              <QRScannerPanel events={events} />
            </div>
          )}

          {(activeTab === "registrations" || activeTab === "analytics") && !selectedEventId && !eventsLoading && (
            <div className="py-16 text-center">
              <p className="font-display font-black text-lg text-[#121212]/40 uppercase">No event selected — create one first.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

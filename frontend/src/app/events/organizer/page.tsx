"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard, BarChart2, Users, QrCode, Ticket, PlusCircle,
  RefreshCw, AlertCircle, Check, X, CheckCircle, Clock, XCircle,
  Calendar, MapPin, TrendingUp, Eye, EyeOff, Trash2, ArrowRight, Camera, Loader2,
  ChevronDown, ChevronUp, Search, Radio, Vote, Pencil, Download
} from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabaseClient";
import SupabaseUpload from "@/components/ui/SupabaseUpload";
import { useToast } from "@/components/ui/Toast";


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
  paymentScreenshotUrl?: string;
  customData?: Record<string, any>;
  user: { id: string; fullName: string; email: string; mobileNumber?: string; profilePhotoUrl?: string; role?: string; artistProfile?: any };
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

function MiniBarChart({ data, label }: { data: { label: string; count: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="font-display font-black text-xs uppercase text-[#121212]/50">{label}</p>
        <span className="font-mono text-[9px] font-bold bg-yellow-festival/20 px-2 py-0.5 border border-yellow-festival/30 rounded select-none">
          MAX: {max}
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-20 border-b-2 border-[#121212] pb-1 pt-4">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end" title={`${d.label}: ${d.count}`}>
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#121212] text-[#FAF8F5] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/10 pointer-events-none whitespace-nowrap z-10 shadow">
              {d.count} ({d.label})
            </div>
            {/* Bar */}
            <div
              className={`w-full border-2 border-[#121212] rounded-t transition-all ${
                d.count > 0 ? "bg-yellow-festival" : "bg-[#121212]/5"
              }`}
              style={{ height: `${Math.max(4, Math.round((d.count / max) * 100))}%` }}
            />
          </div>
        ))}
      </div>
      {/* Footer labels */}
      <div className="flex justify-between font-space text-[9px] font-black uppercase text-gray-400 select-none">
        <span>{data[0]?.label || "14 days ago"}</span>
        <span>{data[Math.floor(data.length / 2)]?.label || ""}</span>
        <span>{data[data.length - 1]?.label || "Today"}</span>
      </div>
    </div>
  );
}



// ── Registrations panel ───────────────────────────────────────────────────────
function RegistrationsPanel({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const { showToast } = useToast();
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    api.get(`/events/${eventId}/registrations`)
      .then((d) => {
        setRegs(Array.isArray(d) ? d : []);
      })
      .catch((err: any) => {
        showToast("Failed to fetch registrations: " + (err?.message || "Unknown error"), "error");
        setRegs([]);
      })
      .finally(() => setLoading(false));
  }, [eventId, showToast]);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`registrations-realtime-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "EventTicket",
        },
        (payload) => {
          const updatedTicket = payload.new as any;
          if (updatedTicket.eventId === eventId) {
            setRegs((prev) =>
              prev.map((r) => ({
                ...r,
                tickets: r.tickets.map((t) =>
                  t.id === updatedTicket.id
                    ? { ...t, isUsed: updatedTicket.isUsed, usedAt: updatedTicket.usedAt }
                    : t
                ),
              }))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    const matchSearch = !search || r.user?.fullName?.toLowerCase().includes(search.toLowerCase()) || r.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || r.paymentStatus === filter;
    const isArtist = r.customData?.participationType === "ARTIST" || r.user?.role === "ARTIST" || !!r.user?.artistProfile;
    const matchType = typeFilter === "ALL" 
      || (typeFilter === "ARTIST" && isArtist)
      || (typeFilter === "AUDIENCE" && !isArtist);
    return matchSearch && matchFilter && matchType;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No registrations to export.");
      return;
    }

    const headers = [
      "Attendee Name",
      "Email Address",
      "Mobile Contact",
      "Role",
      "Stage Name",
      "Genre",
      "Instagram ID",
      "Payment Status",
      "Registration Date",
      "Amount Paid",
      "Ticket Status"
    ];

    const rows = filtered.map((r) => {
      const isUserArtist = r.customData?.participationType === "ARTIST" || r.user?.role === "ARTIST" || !!r.user?.artistProfile;
      const stageName = r.customData?.stageName || r.user?.artistProfile?.stageName || "";
      const genre = r.customData?.genre || r.user?.artistProfile?.genres?.join(" & ") || r.user?.artistProfile?.genre || "";
      const instagram = r.customData?.instagramHandle || r.user?.artistProfile?.instagramHandle || "";
      const mobile = r.customData?.mobileNumber || r.user?.mobileNumber || "";
      const ticketStatus = r.tickets && r.tickets[0] ? (r.tickets[0].isUsed ? "USED" : "VALID") : "N/A";
      const regDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "";

      return [
        r.user?.fullName || "Verified User",
        r.user?.email || "",
        mobile,
        isUserArtist ? "ARTIST" : "AUDIENCE",
        stageName,
        genre,
        instagram,
        r.paymentStatus || "PENDING",
        regDate,
        Number(r.totalAmount) > 0 ? `INR ${r.totalAmount}` : "FREE",
        ticketStatus
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => {
            const strVal = String(value).replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const cleanEventTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    link.setAttribute("download", `registrations_${cleanEventTitle}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <option value="ALL">All Payment Status ({regs.length})</option>
          <option value="APPROVED">Approved ({regs.filter(r=>r.paymentStatus==="APPROVED").length})</option>
          <option value="PENDING">Pending ({regs.filter(r=>r.paymentStatus==="PENDING").length})</option>
          <option value="REJECTED">Rejected ({regs.filter(r=>r.paymentStatus==="REJECTED").length})</option>
        </select>
        <select className="px-4 py-2.5 border-2 border-[#121212] bg-white rounded font-display font-bold text-sm focus:outline-none" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="ALL">All Roles</option>
          <option value="ARTIST">Artists ({regs.filter(r => r.customData?.participationType === "ARTIST" || r.user?.role === "ARTIST" || !!r.user?.artistProfile).length})</option>
          <option value="AUDIENCE">Audience ({regs.filter(r => !(r.customData?.participationType === "ARTIST" || r.user?.role === "ARTIST" || !!r.user?.artistProfile)).length})</option>
        </select>
        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 border-2 border-[#121212] bg-yellow-festival text-[#121212] font-display font-black text-xs uppercase tracking-tight rounded shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          title="Export filtered registrations to a CSV spreadsheet"
        >
          <Download size={13} /> Export Sheet
        </button>
      </div>
      <div className="border-3 border-[#121212] rounded overflow-hidden shadow-brutal">
        <div className="hidden sm:grid grid-cols-12 bg-[#121212] text-[#FAF8F5] px-4 py-2.5 font-display font-black text-[10px] uppercase tracking-wider">
          <div className="col-span-4">Attendee</div><div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Amount</div><div className="col-span-2 text-center">Ticket</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        <div className="divide-y divide-[#121212]/10 max-h-[400px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-10 text-center font-space font-bold text-sm text-[#121212]/40">No registrations found</div>
          ) : filtered.map((r) => {
            const isUserArtist = r.customData?.participationType === "ARTIST" || r.user?.role === "ARTIST" || !!r.user?.artistProfile;
            const profile = {
              stageName: r.customData?.stageName || r.user?.artistProfile?.stageName || r.user?.fullName || "User",
              genre: r.customData?.genre || r.user?.artistProfile?.genres?.join(" & ") || r.user?.artistProfile?.genre || "Creative Art",
              experienceLevel: r.customData?.experienceLevel || r.user?.artistProfile?.experienceLevel || "EXPERIENCED",
              instagramHandle: r.customData?.instagramHandle || r.user?.artistProfile?.instagramHandle || "",
              pastAchievement: r.customData?.pastAchievement || r.user?.artistProfile?.pastAchievement || "",
              youtubeLink: r.customData?.youtubeLink || r.user?.artistProfile?.youtubeLink || "",
              mobileNumber: r.customData?.mobileNumber || r.user?.mobileNumber || "",
            };
            
            return (
              <div key={r.id} className="border-b border-[#121212]/10 bg-white">
                <div 
                  className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-0 items-start sm:items-center px-4 py-4 sm:py-3 hover:bg-[#FAF8F5] transition-colors cursor-pointer" 
                  onClick={() => setExpandedRegId(expandedRegId === r.id ? null : r.id)}
                >
                  <div className="w-full sm:col-span-4 flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#121212]/10 flex-shrink-0 flex items-center justify-center font-display font-black text-xs">
                      {(r.user?.fullName || "?")[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-display font-bold text-sm truncate max-w-[120px] sm:max-w-none">{profile.stageName || r.user?.fullName || "User"}</p>
                        {isUserArtist && (
                          <span className="bg-red-stage text-white font-display font-black text-[7px] px-1.5 py-0.5 rounded rotate-[-2deg]">
                            ARTIST
                          </span>
                        )}
                      </div>
                      <p className="font-space text-[10px] text-[#121212]/40 truncate">{r.user?.email}</p>
                    </div>
                  </div>
                  <div className="w-full sm:col-span-2 flex items-center sm:justify-center gap-1">
                    <span className="inline-block sm:hidden text-[9px] font-black uppercase text-gray-400 mr-1">Status:</span>
                    {statusIcon(r.paymentStatus)}
                    <span className="font-space font-black text-[10px] uppercase">{r.paymentStatus}</span>
                  </div>
                  <div className="w-full sm:col-span-2 text-left sm:text-center font-space font-black text-sm">
                    <span className="inline-block sm:hidden text-[9px] font-black uppercase text-gray-400 mr-2">Amount:</span>
                    {Number(r.totalAmount) > 0 ? `₹${r.totalAmount}` : "FREE"}
                  </div>
                  <div className="w-full sm:col-span-2 text-left sm:text-center">
                    <span className="inline-block sm:hidden text-[9px] font-black uppercase text-gray-400 mr-2">Ticket:</span>
                    {r.tickets && r.tickets[0] ? (
                      <span className={`inline-flex items-center gap-1 font-space font-black text-[10px] uppercase px-2 py-0.5 rounded ${r.tickets[0].isUsed ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700"}`}>
                        {r.tickets[0].isUsed ? "USED" : "VALID"}
                      </span>
                    ) : <span className="text-[#121212]/30 font-space text-[10px]">—</span>}
                  </div>
                  <div className="w-full sm:col-span-2 flex items-center sm:justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="inline-block sm:hidden text-[9px] font-black uppercase text-gray-400 mr-2">Actions:</span>
                    {r.paymentStatus === "PENDING" && (
                      <>
                        <button onClick={() => review(r.id, "APPROVED")} disabled={reviewing === r.id}
                          className="text-[9px] font-black bg-green-500 text-white px-2 py-1 rounded disabled:opacity-50 hover:bg-green-600 transition-colors cursor-pointer">
                          {reviewing === r.id ? "…" : "APPROVE"}
                        </button>
                        <button onClick={() => review(r.id, "REJECTED")} disabled={reviewing === r.id}
                          className="text-[9px] font-black bg-red-stage text-white px-2 py-1 rounded disabled:opacity-50 hover:bg-red-700 transition-colors cursor-pointer">
                          REJECT
                        </button>
                      </>
                    )}
                    {r.paymentStatus !== "PENDING" && (
                      <span className="text-[9px] font-black text-[#121212]/30 uppercase">Done</span>
                    )}
                  </div>
                </div>
 
                {/* Accordion Content */}
                {expandedRegId === r.id && (
                  <div className="bg-[#FAF8F5] border-t border-[#121212]/5 px-4 sm:px-12 py-4 space-y-3 font-space text-xs text-[#121212]/80 animate-fade-in">
                    {isUserArtist ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="font-black text-gray-400 uppercase block text-[9px]">Artist Summary</span>
                          <p className="font-bold">Stage Name: <span className="text-red-stage font-black">{profile.stageName}</span></p>
                          <p className="font-bold">Genre (Genera): <span className="uppercase text-[#121212] font-black">{profile.genre}</span></p>
                          <p className="font-bold">Experience Level: <span className="uppercase text-yellow-600 font-black">{
                            profile.experienceLevel === "NEWBIE" ? "First Timer / Newbie" : 
                            profile.experienceLevel === "EXPERIENCED" ? "6+ Months Experience" : 
                            profile.experienceLevel === "PRO" ? "Pro / Regular" : profile.experienceLevel
                          }</span></p>
                          <p className="font-bold">Email Address: <span className="text-[#121212] font-semibold">{r.user?.email}</span></p>
                          {profile.instagramHandle ? (
                            <p className="font-bold">Instagram ID: <a href={`https://instagram.com/${profile.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-black">@{profile.instagramHandle}</a></p>
                          ) : (
                            <p className="font-bold text-gray-400">Instagram ID: Not Provided</p>
                          )}
                          {profile.mobileNumber ? (
                            <p className="font-bold">Phone Number: <span className="text-[#121212] font-mono font-bold">{profile.mobileNumber}</span></p>
                          ) : (
                            <p className="font-bold text-gray-400">Phone Number: Not Provided</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-black text-gray-400 uppercase block text-[9px]">Achievements & Works</span>
                          <div className="bg-white p-3 border-2 border-dashed border-[#121212]/10 rounded">
                            <span className="font-black text-[9px] text-gray-500 uppercase block mb-1">Past Achievement / Description</span>
                            <p className="font-bold italic text-gray-700">{profile.pastAchievement || "No achievements posted yet."}</p>
                          </div>
                          {profile.youtubeLink && (
                            <p className="font-bold pt-1">
                              Showcase Work: <a href={profile.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline font-black truncate block max-w-xs">{profile.youtubeLink}</a>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="font-bold text-gray-500">Regular Audience Ticket Holder.</p>
                        <p className="font-bold">Email Address: <span className="text-[#121212] font-semibold">{r.user?.email}</span></p>
                        {profile.mobileNumber && (
                          <p className="font-bold">Phone Number: <span className="text-[#121212] font-mono font-bold">{profile.mobileNumber}</span></p>
                        )}
                      </div>
                    )}

                    {/* Verification Screenshot */}
                    {r.paymentScreenshotUrl && (
                      <div className="pt-3 border-t border-[#121212]/5 space-y-1">
                        <span className="font-black text-gray-400 uppercase block text-[9px]">Submitted Payment Screenshot</span>
                        <a href={r.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 border-2 border-[#121212] bg-white p-2 rounded shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all max-w-[240px]">
                          <img src={r.paymentScreenshotUrl} alt="Transaction Receipt" className="max-h-36 object-contain rounded border border-gray-100" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

  const regTimeline = Array.from({ length: 14 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - idx));
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const match = data.registrationTimeline.find((t) => t.date === dateStr);
    return {
      label,
      count: match ? match.count : 0,
    };
  });

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

function VotingPanel({ eventId }: { eventId: string }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"control" | "performers" | "leaderboard" | "requests">("control");
  const [isOpen, setIsOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState<any[]>([]);
  const [lineup, setLineup] = useState<any[]>([]);
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [currentPerformerId, setCurrentPerformerId] = useState<string | null>(null);

  // Performer form states
  const [performerName, setPerformerName] = useState("");
  const [trackTitle, setTrackTitle] = useState("");
  const [isCustomArtist, setIsCustomArtist] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [allArtists, setAllArtists] = useState<any[]>([]);
  const [bulkNames, setBulkNames] = useState("");

  const [toggling, setToggling] = useState(false);
  const [togglingLb, setTogglingLb] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [submittingPerformer, setSubmittingPerformer] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [hideScores, setHideScores] = useState(false);

  // Timer states
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [perfDuration, setPerfDuration] = useState("5");
  const [voteDuration, setVoteDuration] = useState("2");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [perfTimeLeft, setPerfTimeLeft] = useState<number | null>(null);
  const [perfEndsAt, setPerfEndsAt] = useState<number | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const standingsRes = await api.get(`/stageverse/${eventId}/standings`);
      setStandings(Array.isArray(standingsRes) ? standingsRes : []);
      const lineupRes = await api.get(`/stageverse/${eventId}/submissions`);
      setLineup(Array.isArray(lineupRes) ? lineupRes : []);
    } catch {}
  }, [eventId]);

  const fetchStatusAndSubmissions = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const statusRes = await api.get(`/stageverse/${eventId}/voting/status`);
      setIsOpen(statusRes.open);
      setExpiresAt(statusRes.expiresAt ?? null);

      const eventDetail = await api.get(`/events/${eventId}`);
      setShowLeaderboard(eventDetail.showLeaderboard ?? false);
      setCurrentPerformerId(eventDetail.currentPerformerId ?? null);

      const standingsRes = await api.get(`/stageverse/${eventId}/standings`);
      setStandings(Array.isArray(standingsRes) ? standingsRes : []);

      const lineupRes = await api.get(`/stageverse/${eventId}/submissions`);
      setLineup(Array.isArray(lineupRes) ? lineupRes : []);

      try {
        const requestsRes = await api.get(`/stageverse/${eventId}/voting/access-requests`);
        setAccessRequests(Array.isArray(requestsRes) ? requestsRes : []);
      } catch { setAccessRequests([]); }

      const artistsRes = await api.get(`/stageverse/${eventId}/registered-artists`);
      setAllArtists(Array.isArray(artistsRes) ? artistsRes : []);
    } catch (e: any) {
      showToast("Failed to load voting details: " + (e?.message || ""), "error");
    } finally {
      setLoading(false);
    }
  }, [eventId, showToast]);

  useEffect(() => { fetchStatusAndSubmissions(); }, [fetchStatusAndSubmissions]);

  // Voting countdown
  useEffect(() => {
    if (!isOpen || !expiresAt) { setTimeLeft(null); return; }
    const updateTime = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) { setIsOpen(false); setTimeLeft(null); setExpiresAt(null); }
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, [isOpen, expiresAt]);

  // Performance countdown
  useEffect(() => {
    if (!perfEndsAt) { setPerfTimeLeft(null); return; }
    const updateTime = () => {
      const diff = Math.max(0, Math.floor((perfEndsAt - Date.now()) / 1000));
      setPerfTimeLeft(diff);
      if (diff <= 0) { setPerfTimeLeft(null); setPerfEndsAt(null); }
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, [perfEndsAt]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── EVENT CONTROL HANDLERS ───────────────────────────────────────────────
  const handleSetPerformer = async (subId: string) => {
    try {
      await api.post(`/stageverse/${eventId}/current-performer`, { submissionId: subId });
      setCurrentPerformerId(subId);
    } catch (err: any) { alert(err.message || "Failed to set performer."); }
  };

  const handleStartPerformance = () => {
    if (!currentPerformerId) return alert("Select a performer first.");
    const ms = parseFloat(perfDuration) * 60 * 1000;
    setPerfEndsAt(Date.now() + ms);
  };

  const handleStopPerformance = () => { setPerfEndsAt(null); setPerfTimeLeft(null); };

  const handleToggleVotingPanel = async (open: boolean) => {
    setToggling(true);
    try {
      const res = await api.post(`/stageverse/${eventId}/voting/toggle`, { open });
      setIsOpen(res.open);
      if (!open) {
        setExpiresAt(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to toggle voting panel.");
    } finally {
      setToggling(false);
    }
  };

  const handleOpenVoting = async () => {
    if (!currentPerformerId) return alert("Select a performer first.");
    setToggling(true);
    try {
      const durationSeconds = parseFloat(voteDuration) * 60;
      const res = await api.post(`/stageverse/${eventId}/voting/toggle`, { open: true, durationSeconds: durationSeconds > 0 ? durationSeconds : undefined });
      setIsOpen(res.open);
      setExpiresAt(res.expiresAt ?? null);
    } catch (e) {} finally { setToggling(false); }
  };

  const handleCloseVoting = async () => {
    setToggling(true);
    try {
      const res = await api.post(`/stageverse/${eventId}/voting/toggle`, { open: false });
      setIsOpen(res.open);
      setExpiresAt(null);
    } catch (e) {} finally { setToggling(false); }
  };

  const handleStartBoth = async () => {
    if (!currentPerformerId) return alert("Select a performer first.");
    handleStartPerformance();
    await handleOpenVoting();
  };

  const handleResetTimers = () => {
    setPerfEndsAt(null); setPerfTimeLeft(null);
    handleCloseVoting();
  };

  const handleEndAct = async () => {
    handleResetTimers();
    setCurrentPerformerId(null);
    try { await api.post(`/stageverse/${eventId}/current-performer`, { submissionId: null }); } catch {}
    alert("Act concluded. Waiting screen pushed to audience.");
  };

  // ── PERFORMER MANAGEMENT HANDLERS ────────────────────────────────────────
  const handleToggleLeaderboard = async () => {
    setTogglingLb(true);
    try {
      const res = await api.post(`/stageverse/${eventId}/leaderboard/toggle`, { show: !showLeaderboard });
      setShowLeaderboard(res.show);
    } catch (e) { setShowLeaderboard(!showLeaderboard); } finally { setTogglingLb(false); }
  };

  const handleToggleSkip = async (submissionId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "SKIPPED" ? "APPROVED" : "SKIPPED";
    try {
      await api.post(`/stageverse/submissions/${submissionId}/status`, { status: nextStatus });
      await refreshData();
    } catch (err: any) { alert("Failed to toggle skip: " + (err.message || err)); }
  };

  const handleEditPerformer = async (sub: any) => {
    const currentName = sub.user?.fullName || "Guest Performer";
    const currentTrack = sub.trackTitle;
    const isGhostUser = sub.user?.email?.startsWith("unregistered_");
    let newName = currentName;
    if (isGhostUser) {
      const promptedName = prompt("Enter performer name:", currentName);
      if (promptedName === null) return;
      newName = promptedName.trim();
    }
    const newTrack = prompt("Enter track title:", currentTrack);
    if (newTrack === null) return;
    try {
      await api.post(`/stageverse/submissions/${sub.id}/details`, {
        performerName: isGhostUser ? newName : undefined,
        trackTitle: newTrack.trim()
      });
      await refreshData();
    } catch (err: any) { alert("Failed to update: " + (err.message || err)); }
  };

  const handleDeletePerformer = async (sub: any) => {
    const name = sub.user?.fullName || "Guest Performer";
    if (!confirm(`Delete ${name} from the lineup?`)) return;
    try {
      await api.delete(`/stageverse/submissions/${sub.id}`);
      await refreshData();
    } catch (err: any) { alert("Failed to delete: " + (err.message || err)); }
  };

  const handleMoveOrder = async (index: number, direction: "UP" | "DOWN") => {
    const nextIndex = direction === "UP" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= lineup.length) return;
    const currentSub = lineup[index];
    const targetSub = lineup[nextIndex];
    try {
      await api.post(`/stageverse/submissions/${currentSub.id}/order`, { performanceOrder: nextIndex + 1 });
      await api.post(`/stageverse/submissions/${targetSub.id}/order`, { performanceOrder: index + 1 });
      await refreshData();
    } catch (err: any) { alert("Failed to reorder: " + (err.message || err)); }
  };

  const handleAddPerformer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPerformer(true);
    try {
      if (bulkNames.trim()) {
        const names = bulkNames.split("\n").map(n => n.trim()).filter(n => n.length > 0);
        await api.post(`/stageverse/${eventId}/submissions/add-bulk`, { names });
        setBulkNames("");
        alert(`Added ${names.length} performers!`);
      } else if (isCustomArtist) {
        if (!performerName.trim()) { alert("Please provide the performer's name."); setSubmittingPerformer(false); return; }
        await api.post(`/stageverse/${eventId}/submissions/add-unregistered`, {
          performerName: performerName.trim(),
          trackTitle: trackTitle.trim() || "Performance"
        });
        setPerformerName(""); setTrackTitle("");
        alert("Performer added!");
      } else {
        if (!selectedArtistId) { alert("Please select a registered artist."); setSubmittingPerformer(false); return; }
        await api.post(`/stageverse/${eventId}/submissions/add-registered`, {
          artistUserId: selectedArtistId,
          trackTitle: trackTitle.trim() || "Performance"
        });
        setSelectedArtistId(""); setTrackTitle("");
        alert("Performer added!");
      }
      await refreshData();
    } catch (err: any) { alert(err.message || "Failed to add performer."); }
    finally { setSubmittingPerformer(false); }
  };

  const handleReviewRequest = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    setProcessingRequestId(requestId);
    try {
      await api.post(`/stageverse/voting/access-requests/${requestId}/review`, { status });
      setAccessRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) { alert(err.message || "Failed to update request."); }
    finally { setProcessingRequestId(null); }
  };

  const handleExportCSV = () => {
    let csv = "Rank,Name,TrackTitle,Votes,AudienceAvg,JudgeAvg,TotalScore\n";
    standings.forEach((p, i) => {
      csv += `${i + 1},"${p.performer}","${p.trackTitle}",${p.votesCount},${p.audienceAverage.toFixed(2)},${p.judgeAverage.toFixed(2)},${p.totalScore.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `stageverse-results-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    const confirmation = prompt("DANGER: Type 'RESET' to completely erase all scores and votes.");
    if (confirmation !== "RESET") return;
    setResetting(true);
    try {
      await api.post(`/stageverse/${eventId}/voting/reset`);
      await api.post(`/stageverse/${eventId}/voting/toggle`, { open: false });
      await api.post(`/stageverse/${eventId}/current-performer`, { submissionId: null });
      setIsOpen(false); setExpiresAt(null); setCurrentPerformerId(null);
      setPerfEndsAt(null);
      await refreshData();
      alert("Event fully reset!");
    } catch (e) { alert("Reset complete."); setStandings([]); }
    finally { setResetting(false); }
  };

  if (loading) return <div className="py-12 text-center font-display font-black text-sm uppercase animate-pulse text-[#121212]/40">Loading voting system…</div>;

  const livePerformer = lineup.find((s: any) => s.id === currentPerformerId);
  const activePerformers = standings.filter((s: any) => s.status !== "SKIPPED");

  return (
    <div className="space-y-6">
      {/* ── 4 Tab Navigation ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap bg-[#121212] p-1 rounded border-2 border-[#121212] w-fit shadow-brutal-sm gap-1">
        {([
          { id: "control", label: "⚡ Event Control" },
          { id: "performers", label: "🎤 Manage Performers" },
          { id: "leaderboard", label: "🏆 Leaderboard" },
          { id: "requests", label: `🎟️ Access Requests (${accessRequests.length})` },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded font-display font-black text-[10px] uppercase transition-all cursor-pointer ${
              activeTab === t.id
                ? "bg-yellow-festival text-[#121212]"
                : "text-[#FAF8F5]/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: EVENT CONTROL                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "control" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Live Controller */}
          <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-[#121212]/10 pb-4">
              <div>
                <h2 className="font-display font-black text-lg uppercase leading-none">Live Controller</h2>
                <p className="font-space text-[10px] text-gray-500 font-bold mt-1">Select performer and manage timers.</p>
              </div>
              <button
                onClick={() => handleToggleVotingPanel(!isOpen)}
                disabled={toggling}
                className={`px-4 py-2 border-2 border-[#121212] font-display font-black text-[10px] uppercase rounded cursor-pointer transition-all shadow-brutal-sm ${
                  isOpen 
                    ? "bg-red-stage text-white hover:bg-red-700" 
                    : "bg-yellow-festival text-[#121212] hover:bg-yellow-festival/85"
                }`}
              >
                {toggling ? "..." : isOpen ? "Stop Voting Panel" : "Start Voting Panel"}
              </button>
            </div>

            {/* Current Performer Selector */}
            <div className="space-y-1">
              <span className="font-display font-black text-[9px] uppercase text-gray-400 block">Current Performer</span>
              <select
                value={currentPerformerId || ""}
                onChange={e => handleSetPerformer(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-[#121212] bg-[#FAF8F5] rounded font-space font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="" disabled>--- Select Performer ---</option>
                {lineup.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.user?.fullName || "Guest"} {sub.status === "SKIPPED" ? "(Skipped)" : ""} — {sub.trackTitle}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="font-display font-black text-[9px] uppercase text-gray-400 block">Performance (Mins)</span>
                <input type="number" value={perfDuration} onChange={e => setPerfDuration(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#121212] bg-[#FAF8F5] rounded font-space font-bold text-xs focus:outline-none" />
              </div>
              <div className="space-y-1">
                <span className="font-display font-black text-[9px] uppercase text-gray-400 block">Voting (Mins)</span>
                <input type="number" value={voteDuration} onChange={e => setVoteDuration(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#121212] bg-[#FAF8F5] rounded font-space font-bold text-xs focus:outline-none" />
              </div>
            </div>

            {/* Primary Action */}
            <button onClick={handleStartBoth} disabled={!currentPerformerId || toggling}
              className="w-full py-3.5 bg-green-500 text-white border-3 border-[#121212] font-display font-black text-xs uppercase shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded cursor-pointer disabled:opacity-50">
              Start Performance & Voting Together
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-[#121212]/10" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 font-display font-black text-[9px] uppercase text-gray-400">Or Control Individually</span></div>
            </div>

            {/* Individual Controls */}
            <div className="grid grid-cols-2 gap-3">
              {perfEndsAt === null ? (
                <button onClick={handleStartPerformance}
                  className="py-2.5 border-2 border-[#121212] bg-[#FAF8F5] font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-yellow-festival/30 transition-colors">
                  Start Performance
                </button>
              ) : (
                <button onClick={handleStopPerformance}
                  className="py-2.5 border-2 border-red-stage bg-red-stage/10 text-red-stage font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-red-stage hover:text-white transition-colors">
                  Stop Performance
                </button>
              )}

              {!isOpen ? (
                <button onClick={handleOpenVoting} disabled={toggling}
                  className="py-2.5 border-2 border-[#121212] bg-[#FAF8F5] font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-yellow-festival/30 transition-colors disabled:opacity-50">
                  {toggling ? "Opening..." : "Open Voting"}
                </button>
              ) : (
                <button onClick={handleCloseVoting} disabled={toggling}
                  className="py-2.5 border-2 border-red-stage bg-red-stage/10 text-red-stage font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-red-stage hover:text-white transition-colors disabled:opacity-50">
                  {toggling ? "Closing..." : "Close Voting"}
                </button>
              )}
            </div>

            {/* Reset / End Act */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleResetTimers}
                className="py-2.5 border-2 border-[#121212]/30 bg-white font-display font-black text-[10px] uppercase rounded text-gray-500 cursor-pointer hover:bg-[#FAF8F5] transition-colors">
                Reset Timers
              </button>
              <button onClick={handleEndAct}
                className="py-2.5 bg-[#121212] text-white border-2 border-[#121212] font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-black/80 transition-colors shadow-brutal-sm">
                🏁 End Act
              </button>
            </div>
          </div>

          {/* Right: Live Status Card */}
          <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-6 flex flex-col justify-between min-h-[400px]">
            <div>
              <h2 className="font-display font-black text-lg uppercase">Live Status</h2>
              <p className="font-space text-xs text-gray-500 font-bold">What the audience sees now.</p>
            </div>

            {livePerformer ? (
              <div className="flex flex-col items-center mt-6 flex-1 relative">
                {/* Live Vote Counter Badge */}
                {isOpen && (
                  <div className="absolute right-0 top-0 bg-green-500/10 border-2 border-green-500/30 px-3 py-2 rounded-lg flex flex-col items-center">
                    <span className="font-display font-black text-[8px] uppercase tracking-widest text-green-600">Live Votes</span>
                    <span className="font-display font-black text-2xl text-green-600 tabular-nums">
                      {standings.find((s: any) => s.submissionId === currentPerformerId)?.votesCount || 0}
                    </span>
                  </div>
                )}

                {/* Avatar */}
                <div className="w-20 h-20 rounded-xl bg-[#FAF8F5] border-2 border-[#121212] overflow-hidden mb-4 flex items-center justify-center">
                  {livePerformer.user?.profilePhotoUrl ? (
                    <img src={livePerformer.user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display font-black text-2xl text-gray-400">
                      {(livePerformer.user?.fullName || "?")[0]}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-black text-xl text-center">{livePerformer.user?.fullName || "Guest"}</h3>
                <p className="font-space text-xs text-gray-500 font-bold mt-1">{livePerformer.trackTitle}</p>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${perfEndsAt || isOpen ? "bg-green-400" : "bg-red-400"}`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 border border-[#121212] ${perfEndsAt || isOpen ? "bg-green-500" : "bg-red-500"}`} />
                  </span>
                  <span className="font-display font-black text-[10px] uppercase text-gray-500">
                    {perfEndsAt ? "Performance Live" : isOpen ? "Voting Open" : "Waiting"}
                  </span>
                </div>

                {/* Timer Displays */}
                <div className="grid grid-cols-2 gap-4 mt-6 w-full">
                  <div className="flex flex-col items-center p-3 bg-[#FAF8F5] border-2 border-[#121212] rounded-lg">
                    <span className="font-display font-black text-[8px] uppercase text-gray-400 mb-1">Performance</span>
                    <span className="font-mono font-black text-xl tabular-nums">
                      {perfTimeLeft !== null ? formatTime(perfTimeLeft) : "--:--"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-[#FAF8F5] border-2 border-[#121212] rounded-lg">
                    <span className="font-display font-black text-[8px] uppercase text-gray-400 mb-1">Voting</span>
                    <span className={`font-mono font-black text-xl tabular-nums ${timeLeft !== null && timeLeft <= 30 ? "text-red-stage" : ""}`}>
                      {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                  <div className="flex flex-col items-center p-3 bg-[#FAF8F5] border-2 border-[#121212]/20 rounded-lg">
                    <span className="font-display font-black text-[8px] uppercase text-gray-400 mb-1">Total Votes</span>
                    <span className="font-display font-black text-2xl tabular-nums">
                      {standings.find((s: any) => s.submissionId === currentPerformerId)?.votesCount || 0}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-yellow-festival/10 border-2 border-yellow-festival/30 rounded-lg">
                    <span className="font-display font-black text-[8px] uppercase text-yellow-700 mb-1">Avg Score</span>
                    <span className="font-display font-black text-2xl tabular-nums text-yellow-700">
                      {(standings.find((s: any) => s.submissionId === currentPerformerId)?.audienceAverage || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-[#FAF8F5] border-2 border-dashed border-[#121212]/20 rounded-xl mx-auto flex items-center justify-center">
                    <span className="text-2xl opacity-30">🎤</span>
                  </div>
                  <p className="font-display font-black text-sm text-gray-400 uppercase">No performer active</p>
                  <p className="font-space text-[10px] text-gray-400 font-bold">Select a performer from the dropdown to begin.</p>
                </div>
              </div>
            )}

            {/* Access Requests Mini Panel */}
            {accessRequests.length > 0 && (
              <div className="mt-4 border-t-2 border-[#121212]/10 pt-4">
                <span className="font-display font-black text-[9px] uppercase text-gray-400 block mb-2">
                  Pending Access Requests ({accessRequests.length})
                </span>
                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                  {accessRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between bg-[#FAF8F5] border border-[#121212]/10 p-2 rounded">
                      <div>
                        <span className="font-display font-bold text-[10px] block">{req.user?.fullName}</span>
                        <span className="font-space text-[8px] text-gray-400">{req.user?.email}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleReviewRequest(req.id, "APPROVED")} disabled={processingRequestId === req.id}
                          className="bg-green-500 text-white text-[7px] font-black uppercase px-2 py-1 rounded cursor-pointer hover:bg-green-600">✓</button>
                        <button onClick={() => handleReviewRequest(req.id, "REJECTED")} disabled={processingRequestId === req.id}
                          className="bg-red-stage text-white text-[7px] font-black uppercase px-2 py-1 rounded cursor-pointer hover:bg-red-700">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: MANAGE PERFORMERS                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "performers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performers List (2/3) */}
          <div className="lg:col-span-2 border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-display font-black text-lg uppercase flex items-center gap-2"><Users size={16} /> Performers</h2>
                <p className="font-space text-xs text-gray-500 font-bold">{lineup.length} total participants</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {lineup.length > 0 ? (
                lineup.map((sub: any, idx: number) => {
                  const performerName = sub.user?.fullName || "Guest Performer";
                  const isSkipped = sub.status === "SKIPPED";
                  const isActive = sub.id === currentPerformerId;
                  const subStanding = standings.find((s: any) => s.submissionId === sub.id);
                  return (
                    <div key={sub.id}
                      className={`border-2 border-[#121212] bg-white p-4 rounded shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                        isSkipped ? "opacity-40 grayscale" : ""
                      } ${isActive ? "ring-2 ring-yellow-festival ring-offset-2" : ""}`}>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Reorder */}
                        <div className="flex flex-col gap-1">
                          <button onClick={() => handleMoveOrder(idx, "UP")} disabled={idx === 0}
                            className="p-0.5 border border-[#121212] rounded bg-[#FAF8F5] hover:bg-yellow-festival disabled:opacity-40 cursor-pointer">
                            <ChevronUp size={12} />
                          </button>
                          <button onClick={() => handleMoveOrder(idx, "DOWN")} disabled={idx === lineup.length - 1}
                            className="p-0.5 border border-[#121212] rounded bg-[#FAF8F5] hover:bg-yellow-festival disabled:opacity-40 cursor-pointer">
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#121212] overflow-hidden flex items-center justify-center font-display font-black text-sm text-gray-400 flex-shrink-0">
                          {sub.user?.profilePhotoUrl ? (
                            <img src={sub.user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                          ) : performerName[0]}
                        </div>

                        {/* Info */}
                        <div className={isSkipped ? "line-through" : ""}>
                          <span className="font-display font-black text-sm block leading-tight">
                            {performerName} {isSkipped && "(Skipped)"}
                          </span>
                          <span className="font-space text-[10px] text-gray-500 font-bold">{sub.trackTitle}</span>
                          <div className="flex gap-3 mt-0.5">
                            <span className="font-space text-[9px] text-gray-400 font-bold">★ {subStanding?.audienceAverage?.toFixed(1) || "0.0"}</span>
                            <span className="font-space text-[9px] text-gray-400 font-bold">🗳️ {subStanding?.votesCount || 0} votes</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => handleToggleSkip(sub.id, sub.status)}
                          className="p-1.5 border-2 border-[#121212] rounded bg-[#FAF8F5] hover:bg-yellow-festival cursor-pointer transition-colors" title={isSkipped ? "Unskip" : "Skip/No-Show"}>
                          {isSkipped ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button onClick={() => handleEditPerformer(sub)}
                          className="p-1.5 border-2 border-[#121212] rounded bg-[#FAF8F5] hover:bg-yellow-festival cursor-pointer transition-colors" title="Edit Details">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDeletePerformer(sub)}
                          className="p-1.5 border-2 border-[#121212] rounded bg-red-stage text-white hover:bg-red-700 cursor-pointer transition-colors" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="border-2 border-dashed border-[#121212]/20 bg-white p-8 rounded text-center">
                  <p className="font-space text-xs text-gray-400 font-bold">No performers in the lineup yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Performer Form (1/3) */}
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-5 rounded shadow-brutal space-y-5 h-fit sticky top-6">
            <div>
              <h2 className="font-display font-black text-sm uppercase">Add Performer</h2>
              <p className="font-space text-[10px] text-gray-500 font-bold">Create new participants.</p>
            </div>

            <form onSubmit={handleAddPerformer} className="space-y-4">
              {/* Single Addition */}
              <div className="space-y-3">
                <span className="font-display font-black text-[9px] uppercase text-gray-400 block">Single Addition</span>

                <label className="flex items-center gap-2 font-space text-[10px] font-black uppercase text-gray-600 cursor-pointer select-none">
                  <input type="checkbox" checked={isCustomArtist} onChange={(e) => setIsCustomArtist(e.target.checked)}
                    className="w-3.5 h-3.5 border-2 border-[#121212] rounded" disabled={bulkNames.length > 0} />
                  Not registered on platform
                </label>

                {isCustomArtist ? (
                  <input type="text" placeholder="Performer Name"
                    value={performerName} onChange={(e) => setPerformerName(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#121212] bg-white rounded font-space font-bold text-xs focus:outline-none"
                    disabled={bulkNames.length > 0} />
                ) : (
                  <select value={selectedArtistId} onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-[#121212] bg-white rounded font-space font-bold text-xs focus:outline-none"
                    disabled={bulkNames.length > 0}>
                    <option value="">-- Choose Artist Profile --</option>
                    {allArtists.map((art: any) => (
                      <option key={art.id} value={art.userId}>
                        {art.stageName || art.user?.fullName} ({art.genres?.join(", ") || "No Genre"})
                      </option>
                    ))}
                  </select>
                )}

                <input type="text" placeholder="Track Title / Performance Type"
                  value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#121212] bg-white rounded font-space font-bold text-xs focus:outline-none"
                  disabled={bulkNames.length > 0} />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#121212]/10" /></div>
                <div className="relative flex justify-center"><span className="bg-[#FAF8F5] px-2 font-display font-black text-[9px] uppercase text-gray-400">OR</span></div>
              </div>

              {/* Bulk Addition */}
              <div className="space-y-2">
                <span className="font-display font-black text-[9px] uppercase text-gray-400 block">Bulk Addition</span>
                <textarea rows={4} placeholder="Paste names separated by new lines"
                  value={bulkNames} onChange={(e) => setBulkNames(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#121212] bg-white rounded font-space font-bold text-xs focus:outline-none resize-none"
                  disabled={performerName.length > 0 || selectedArtistId.length > 0} />
              </div>

              <button type="submit" disabled={submittingPerformer || (!performerName && !selectedArtistId && !bulkNames.trim())}
                className="w-full py-2.5 border-2 border-[#121212] bg-[#121212] text-[#FAF8F5] font-display font-black text-xs uppercase rounded cursor-pointer hover:bg-black/90 transition-colors shadow-brutal-sm disabled:opacity-50">
                {submittingPerformer ? "Adding..." : "Add Performer(s)"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: LEADERBOARD                                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "leaderboard" && (
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-display font-black text-xl uppercase">Event Leaderboard</h2>
              <p className="font-space text-xs text-gray-500 font-bold">Rankings updated in real-time</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleToggleLeaderboard} disabled={togglingLb}
                className={`px-3 py-2 border-2 border-[#121212] font-display font-black text-[10px] uppercase rounded cursor-pointer transition-all ${
                  showLeaderboard
                    ? "bg-yellow-festival text-[#121212]"
                    : "bg-white hover:bg-yellow-festival/20"
                }`}>
                {togglingLb ? "..." : showLeaderboard ? "✅ On Stage" : "Reveal on Stage"}
              </button>
              <button onClick={() => setHideScores(!hideScores)}
                className="px-3 py-2 border-2 border-[#121212] bg-white font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-[#FAF8F5] flex items-center gap-1.5">
                {hideScores ? <EyeOff size={12} /> : <Eye size={12} />}
                {hideScores ? "Reveal Scores" : "Hide Scores"}
              </button>
              <button onClick={handleExportCSV}
                className="px-3 py-2 border-2 border-[#121212] bg-white font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-[#FAF8F5] flex items-center gap-1.5">
                <Download size={12} /> Export CSV
              </button>
              <button onClick={handleReset} disabled={resetting}
                className="px-3 py-2 border-2 border-[#121212] bg-red-stage text-white font-display font-black text-[10px] uppercase rounded cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-50">
                {resetting ? "Resetting..." : "End & Reset Event"}
              </button>
            </div>
          </div>

          {/* Rankings */}
          <div className="space-y-3">
            {standings.length > 0 ? (
              standings.map((sub: any, idx: number) => {
                const isTop3 = idx < 3;
                return (
                  <div key={sub.submissionId}
                    className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded border-2 ${
                      isTop3 ? "bg-yellow-festival/5 border-yellow-festival/30" : "bg-white border-[#121212]/10"
                    }`}>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <span className={`font-display font-black text-center w-8 ${
                        idx === 0 ? "text-yellow-500 text-2xl" : idx === 1 ? "text-gray-400 text-xl" : idx === 2 ? "text-amber-600 text-lg" : "text-gray-400 text-sm"
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="w-12 h-12 bg-[#FAF8F5] border-2 border-[#121212]/20 rounded-xl overflow-hidden flex items-center justify-center font-display font-black text-gray-400 flex-shrink-0">
                        {sub.photoUrl ? <img src={sub.photoUrl} className="w-full h-full object-cover" alt="" /> : (sub.performer || "?")[0]}
                      </div>
                      <div>
                        <h3 className="font-display font-black text-sm">{sub.performer}</h3>
                        <span className="font-space text-[10px] text-gray-500 font-bold">{sub.trackTitle}</span>
                      </div>
                    </div>

                    <div className={`flex items-end gap-6 text-right mt-3 sm:mt-0 transition-all duration-300 ${hideScores ? "blur-md opacity-40 select-none grayscale" : ""}`}>
                      <div>
                        <div className="font-display font-black text-[8px] uppercase text-gray-400 mb-0.5">Votes</div>
                        <div className="font-display font-black text-lg tabular-nums">{sub.votesCount}</div>
                      </div>
                      <div>
                        <div className="font-display font-black text-[8px] uppercase text-gray-400 mb-0.5">Audience</div>
                        <div className="font-display font-black text-lg tabular-nums">{sub.audienceAverage.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="font-display font-black text-[8px] uppercase text-yellow-700 mb-0.5">Score</div>
                        <div className="font-display font-black text-xl tabular-nums text-yellow-700">{sub.totalScore.toFixed(1)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[#121212]/20 rounded">
                <p className="font-display font-black text-sm text-gray-400 uppercase">No standings data yet</p>
                <p className="font-space text-[10px] text-gray-400 font-bold mt-1">Add performers and start voting to see results.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: ACCESS REQUESTS                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "requests" && (
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-6">
          <div>
            <h2 className="font-display font-black text-xl uppercase">Voting Access Requests</h2>
            <p className="font-space text-xs text-gray-500 font-bold">Manage voting permission requests from non-registered attendees</p>
          </div>

          <div className="space-y-3">
            {accessRequests.length > 0 ? (
              accessRequests.map((req: any) => (
                <div key={req.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded border-2 bg-white border-[#121212]/10 gap-4">
                  <div>
                    <h3 className="font-display font-black text-sm">{req.user?.fullName || "Anonymous Voter"}</h3>
                    <p className="font-space text-[10px] text-gray-500 font-bold">{req.user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReviewRequest(req.id, "APPROVED")}
                      disabled={processingRequestId === req.id}
                      className="px-3 py-1.5 bg-green-500 text-white border-2 border-[#121212] font-display font-black text-[10px] uppercase rounded shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewRequest(req.id, "REJECTED")}
                      disabled={processingRequestId === req.id}
                      className="px-3 py-1.5 bg-red-stage text-white border-2 border-[#121212] font-display font-black text-[10px] uppercase rounded shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-[#121212]/20 rounded">
                <p className="font-display font-black text-sm text-gray-400 uppercase">No pending access requests</p>
                <p className="font-space text-[10px] text-gray-400 font-bold mt-1">Attendees who are not registered on the platform will appear here if they request access.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TicketGatewayPanel({ eventId }: { eventId: string }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [checkingInScan, setCheckingInScan] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/registrations`);
      setRegs(Array.isArray(res) ? res : []);
    } catch (err: any) {
      showToast("Failed to fetch tickets: " + (err?.message || "Unknown error"), "error");
      setRegs([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, showToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`gateway-realtime-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "EventTicket",
        },
        (payload) => {
          const updatedTicket = payload.new as any;
          if (updatedTicket.eventId === eventId) {
            setRegs((prev) =>
              prev.map((r) => ({
                ...r,
                tickets: (r.tickets || []).map((t) =>
                  t.id === updatedTicket.id
                    ? { ...t, isUsed: updatedTicket.isUsed, usedAt: updatedTicket.usedAt }
                    : t
                ),
              }))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleManualCheckin = async (qrCode: string, ticketId: string) => {
    setCheckingIn(ticketId);
    try {
      await api.post("/events/tickets/checkin", {
        qrCode: qrCode,
        deviceFingerprint: "manual-gateway",
      });
      setRegs((prev) =>
        prev.map((r) => ({
          ...r,
          tickets: (r.tickets || []).map((t) =>
            t.id === ticketId ? { ...t, isUsed: true, usedAt: new Date().toISOString() } : t
          ),
        }))
      );
      import("canvas-confetti").then(({ default: c }) => c({ particleCount: 30, spread: 40, colors: ["#50C878", "#FFDE4D"] }));
    } catch (err: any) {
      showToast(err.message || "Failed to check in ticket.", "error");
    } finally {
      setCheckingIn(null);
    }
  };

  const handleScanSubmitWithCode = async (code: string) => {
    if (!code) return;
    setCheckingInScan(true);
    setScanFeedback(null);
    const targetCode = code.trim().toLowerCase();
    try {
      await api.post("/events/tickets/checkin", {
        qrCode: targetCode,
        deviceFingerprint: "manual-gateway",
      });
      // Update the local list to checked-in
      setRegs((prev) =>
        prev.map((r) => ({
          ...r,
          tickets: (r.tickets || []).map((t) =>
            t.qrCode.toLowerCase() === targetCode ? { ...t, isUsed: true, usedAt: new Date().toISOString() } : t
          ),
        }))
      );
      setScanFeedback({ type: "success", message: `Successfully checked in ticket ${targetCode}!` });
      import("canvas-confetti").then(({ default: c }) => c({ particleCount: 40, spread: 50, colors: ["#50C878", "#FFDE4D"] }));
    } catch (err: any) {
      showToast("Check-in error: " + (err?.message || "Invalid or already used ticket code."), "warning");
      setScanFeedback({ type: "error", message: err?.message || "Invalid or already used ticket code." });
    } finally {
      setCheckingInScan(false);
    }
  };

  const handleScanSubmit = async () => {
    if (!scanInput) return;
    await handleScanSubmitWithCode(scanInput);
    setScanInput("");
  };

  useEffect(() => {
    if (!showScanner) return;
    
    let html5QrCode: any = null;
    import("html5-qrcode").then((module) => {
      html5QrCode = new module.Html5Qrcode("qr-reader");
      html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => {
          html5QrCode.stop().then(() => {
            setShowScanner(false);
            handleScanSubmitWithCode(decodedText);
          }).catch((err: any) => {
            showToast("Scanner stop failed: " + (err?.message || ""), "error");
            setShowScanner(false);
          });
        },
        () => {
          // Ignore scanner noise
        }
      ).catch((err: any) => {
        showToast("Camera access failed: " + (err?.message || ""), "error");
        setScanFeedback({ type: "error", message: "Failed to access camera. Please allow camera permissions." });
        setShowScanner(false);
      });
    });

    return () => {
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch(() => {});
          }
        } catch (e) {
          // Silent cleanup
        }
      }
    };
  }, [showScanner, showToast]);

  const ticketsList = regs.flatMap((r) =>
    (r.tickets || []).map((t) => ({
      ...t,
      attendeeName: r.user?.fullName || "User",
      attendeeEmail: r.user?.email || "",
      role: (r.customData?.participationType === "ARTIST" || r.user?.role === "ARTIST" || !!r.user?.artistProfile) ? "ARTIST" : "AUDIENCE",
      paymentStatus: r.paymentStatus,
      paymentScreenshotUrl: r.paymentScreenshotUrl,
    }))
  );

  const filteredTickets = ticketsList.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.attendeeName.toLowerCase().includes(term) ||
      t.attendeeEmail.toLowerCase().includes(term) ||
      t.qrCode.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="py-12 text-center font-display font-black text-sm uppercase animate-pulse text-[#121212]/40">
        Loading ticket gateway…
      </div>
    );
  }

  const checkInLogs = ticketsList
    .filter((t) => t.isUsed && t.usedAt)
    .sort((a, b) => new Date(b.usedAt!).getTime() - new Date(a.usedAt!).getTime());

  const total = ticketsList.length;
  const checkedInCount = ticketsList.filter(t => t.isUsed).length;
  const remainingCount = total - checkedInCount;
  const attendanceRate = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-3 border-[#121212] bg-[#FAF8F5] p-5 rounded shadow-brutal">
        <div className="text-center p-2 border-r-2 border-[#121212]/10 last:border-0">
          <span className="font-display font-black text-[9px] uppercase text-[#121212]/50 block">TOTAL TICKETS</span>
          <span className="font-display font-black text-3xl mt-0.5 block">{total}</span>
        </div>
        <div className="text-center p-2 border-r-2 border-[#121212]/10 last:border-0">
          <span className="font-display font-black text-[9px] uppercase text-[#121212]/50 block text-green-600">CHECKED IN</span>
          <span className="font-display font-black text-3xl mt-0.5 block text-green-600">{checkedInCount}</span>
        </div>
        <div className="text-center p-2 border-r-2 border-[#121212]/10 last:border-0">
          <span className="font-display font-black text-[9px] uppercase text-[#121212]/50 block text-yellow-600">REMAINING</span>
          <span className="font-display font-black text-3xl mt-0.5 block text-yellow-600">{remainingCount}</span>
        </div>
        <div className="text-center p-2 last:border-0">
          <span className="font-display font-black text-[9px] uppercase text-[#121212]/50 block">ATTENDANCE</span>
          <span className="font-display font-black text-3xl mt-0.5 block">{attendanceRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ticket search & list (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Scan QR Entry */}
          <div className="border-3 border-[#121212] bg-[#FFDE4D]/10 rounded p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <span className="font-display font-black text-xs uppercase text-[#121212]/50 block mb-1">SCAN / ENTER TICKET CODE</span>
              <div className="relative">
                <input 
                  type="text"
                  className="w-full pl-3 pr-12 py-2.5 border-2 border-[#121212] rounded font-mono font-bold text-sm focus:outline-none bg-white uppercase placeholder-gray-400"
                  placeholder="e.g. E5-XYZ-12345"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleScanSubmit(); }}
                />
                <button 
                  onClick={() => setShowScanner(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors p-1 cursor-pointer"
                  title="Open Camera QR Scanner"
                >
                  <Camera size={18} />
                </button>
              </div>
            </div>
            <button 
              onClick={handleScanSubmit}
              disabled={checkingInScan || !scanInput.trim()}
              className="w-full sm:w-auto self-end bg-[#121212] text-[#FAF8F5] font-display font-black text-xs uppercase px-6 py-3.5 border-2 border-[#121212] rounded shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
            >
              {checkingInScan ? "VERIFYING..." : "VALIDATE & CHECK-IN"}
            </button>
          </div>

          {scanFeedback && (
            <div className={`p-3 border-2 border-[#121212] rounded text-xs font-bold font-space flex items-center gap-2 ${
              scanFeedback.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              <AlertCircle size={14} />
              <span>{scanFeedback.message}</span>
            </div>
          )}

          {/* QR Code Scanner Camera Modal */}
          {showScanner && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
              <div className="bg-[#FAF8F5] border-4 border-[#121212] p-6 rounded shadow-brutal max-w-sm w-full space-y-4 relative">
                <div className="flex justify-between items-center border-b-3 border-[#121212] pb-3">
                  <span className="font-display font-black text-sm uppercase">CAMERA SCANNER</span>
                  <button 
                    onClick={() => setShowScanner(false)}
                    className="font-display font-black text-xs uppercase bg-red-stage text-white px-2.5 py-1 rounded border-2 border-[#121212] shadow-brutal-sm cursor-pointer hover:bg-red-700"
                  >
                    CLOSE
                  </button>
                </div>
                
                <div className="relative border-3 border-[#121212] bg-[#121212] aspect-square rounded overflow-hidden flex items-center justify-center">
                  <div id="qr-reader" className="w-full h-full" />
                  {/* Overlay frames */}
                  <div className="absolute inset-0 border-2 border-dashed border-yellow-festival/30 pointer-events-none flex items-center justify-center">
                    <div className="w-40 h-40 border-4 border-yellow-festival/80 rounded relative">
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-yellow-festival animate-ping" />
                    </div>
                  </div>
                </div>
                <p className="font-space text-[10px] text-gray-500 font-bold text-center">
                  Align the attendee's ticket QR code inside the box to scan automatically.
                </p>
              </div>
            </div>
          )}

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#121212]/40" />
            <input
              className="w-full pl-9 pr-4 py-2.5 border-2 border-[#121212] rounded font-space font-bold text-sm focus:outline-none placeholder-[#121212]/30"
              placeholder="Search tickets by name, email, or ticket code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="border-3 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 bg-[#121212] text-[#FAF8F5] px-4 py-2.5 font-display font-black text-[10px] uppercase tracking-wider">
              <div className="col-span-5">Attendee / Ticket Code</div>
              <div className="col-span-2 text-center">Role</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-3 text-right">Gateway Action</div>
            </div>

            <div className="divide-y divide-[#121212]/10 max-h-[450px] overflow-y-auto bg-white">
              {filteredTickets.length === 0 ? (
                <div className="py-12 text-center font-space font-bold text-sm text-[#121212]/40 bg-white">
                  No tickets found in gateway.
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div key={t.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-0 items-start sm:items-center px-4 py-4 sm:py-3 bg-white hover:bg-[#FAF8F5] transition-colors">
                    <div className="w-full sm:col-span-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-yellow-festival/20 flex items-center justify-center font-display font-black text-xs border border-[#121212]/10 flex-shrink-0">
                          {(t.attendeeName || "?")[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-sm truncate">{t.attendeeName}</p>
                          <p className="font-mono text-[9px] text-[#121212]/50 truncate">{t.qrCode}</p>
                          {t.paymentScreenshotUrl && (
                            <a href={t.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-red-stage hover:underline"
                            >
                              📸 VIEW RECEIPT
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:col-span-2 text-left sm:text-center">
                      <span className="inline-block sm:hidden text-[9px] font-black uppercase text-gray-400 mr-2">Role:</span>
                      <span className={`font-space font-black text-[9px] uppercase px-1.5 py-0.5 rounded ${
                        t.role === "ARTIST" ? "bg-red-stage text-white" : "bg-blue-100 text-blue-800"
                      }`}>
                        {t.role}
                      </span>
                    </div>

                    <div className="w-full sm:col-span-2 text-left sm:text-center">
                      <span className="inline-block sm:hidden text-[9px] font-black uppercase text-gray-400 mr-2">Status:</span>
                      <span className={`inline-flex items-center gap-1 font-space font-black text-[10px] uppercase px-2 py-0.5 rounded ${
                        t.isUsed ? "bg-gray-200 text-gray-600" : "bg-green-100 text-green-700"
                      }`}>
                        {t.isUsed ? "CHECKED IN" : "VALID"}
                      </span>
                    </div>

                    <div className="w-full sm:col-span-3 flex items-center sm:justify-end">
                      <span className="inline-block sm:hidden text-[9px] font-black uppercase text-gray-400 mr-2">Action:</span>
                      {t.isUsed ? (
                        <span className="text-[10px] font-space font-bold text-gray-400">
                          {t.usedAt ? new Date(t.usedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "GATE"}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleManualCheckin(t.qrCode, t.id)}
                          disabled={checkingIn === t.id}
                          className="px-3 py-1.5 bg-green-500 text-white border-2 border-[#121212] font-display font-black text-[9px] uppercase shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
                        >
                          {checkingIn === t.id ? "Checking..." : "Gate Check-In"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
        </div>
      </div>
    </div>

      {/* Right Column: Live Check-in Log (Col 4) */}
      <div className="lg:col-span-4 border-3 border-[#121212] bg-[#FAF8F5] p-5 rounded shadow-brutal flex flex-col h-[600px]">
        <div className="border-b-2 border-[#121212]/10 pb-3 mb-3">
          <span className="brutal-tape text-[8px] uppercase bg-green-500 text-white select-none inline-block px-1.5 py-0.5 font-bold">LIVE ACTIVITY FEED</span>
          <h3 className="font-display font-black text-sm uppercase mt-1">Check-in Logs</h3>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-[#121212]/5 pr-1 font-space text-xs text-[#121212]/80 bg-white p-3 border-2 border-[#121212] rounded">
          {checkInLogs.length === 0 ? (
            <div className="py-24 text-center text-gray-400 font-bold">
              No check-ins registered yet.
            </div>
          ) : (
            checkInLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-2 border-b border-gray-100 last:border-0">
                <div className="min-w-0">
                  <p className="font-bold text-[#121212] truncate">{log.attendeeName}</p>
                  <p className="font-mono text-[9px] text-[#121212]/50">{log.qrCode}</p>
                </div>
                <span className="bg-[#121212]/5 px-2 py-0.5 rounded font-mono text-[9px] text-[#121212]/60 flex-shrink-0">
                  {log.usedAt ? new Date(log.usedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "NOW"}
                </span>
              </div>
            ))
          )}
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
  { key: "gate",           label: "Ticket Gateway", icon: <Ticket size={14} /> },
  { key: "analytics",      label: "Analytics",     icon: <BarChart2 size={14} /> },
  { key: "voting",         label: "Manage Voting", icon: <Vote size={14} /> },
] as const;
type TabKey = typeof TABS[number]["key"];

function OrganizerDashboardContent() {
  const { user, loading, logout } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) ?? "events";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const tabFromUrl = searchParams.get("tab") as TabKey;
  useEffect(() => {
    if (tabFromUrl && TABS.some((t) => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");

  // Edit event state hooks
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEventId, setEditEventId] = useState("");
  const [editForm, setEditForm] = useState<any>({
    title: "", description: "", venueName: "", venueAddress: "", city: "", state: "",
    maxCapacity: "200", isPaid: false, price: "0", audiencePrice: "0", artistPrice: "0",
    upiVpa: "", upiQrUrl: "", artistQrUrl: "", audienceQrUrl: "", flyerUrl: "", status: "PUBLISHED",
    sponsors: []
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [newEditSponsorName, setNewEditSponsorName] = useState("");
  const [newEditSponsorLogo, setNewEditSponsorLogo] = useState("");

  const handleStartEdit = async (ev: OrgEvent) => {
    try {
      const fullEvent = await api.get(`/events/${ev.id}`);
      setEditEventId(ev.id);
      setEditForm({
        title: fullEvent.title || "",
        description: fullEvent.description || "",
        venueName: fullEvent.location?.venueName || "",
        venueAddress: fullEvent.location?.venueAddress || "",
        city: fullEvent.location?.city || "",
        state: fullEvent.location?.state || "",
        maxCapacity: fullEvent.maxCapacity?.toString() || "200",
        isPaid: fullEvent.isPaid || false,
        price: fullEvent.price?.toString() || "0",
        audiencePrice: fullEvent.audiencePrice?.toString() || fullEvent.price?.toString() || "0",
        artistPrice: fullEvent.artistPrice?.toString() || "0",
        upiVpa: fullEvent.upiVpa || fullEvent.upiId || "",
        upiQrUrl: fullEvent.upiQrUrl || "",
        artistQrUrl: fullEvent.artistQrUrl || "",
        audienceQrUrl: fullEvent.audienceQrUrl || fullEvent.upiQrUrl || "",
        flyerUrl: fullEvent.flyerUrl || "",
        status: fullEvent.status || "PUBLISHED",
        sponsors: fullEvent.sponsors || [],
      });
      setNewEditSponsorName("");
      setNewEditSponsorLogo("");
      setEditError(null);
      setIsEditModalOpen(true);
    } catch (e: any) {
      alert("Failed to load event details: " + (e.message || e));
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    setEditError(null);
    try {
      let finalSponsors = editForm.sponsors || [];
      if (newEditSponsorName.trim() && newEditSponsorLogo) {
        finalSponsors = [...finalSponsors, { name: newEditSponsorName.trim(), logo: newEditSponsorLogo }];
      }

      const payload = {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        venueName: editForm.venueName,
        venueAddress: editForm.venueAddress,
        city: editForm.city,
        state: editForm.state,
        maxCapacity: parseInt(editForm.maxCapacity) || undefined,
        isPaid: editForm.isPaid,
        price: parseFloat(editForm.price) || 0,
        audiencePrice: parseFloat(editForm.audiencePrice) || 0,
        artistPrice: parseFloat(editForm.artistPrice) || 0,
        upiVpa: editForm.upiVpa,
        upiId: editForm.upiVpa,
        upiQrUrl: editForm.audienceQrUrl || editForm.upiQrUrl,
        audienceQrUrl: editForm.audienceQrUrl || editForm.upiQrUrl,
        artistQrUrl: editForm.artistQrUrl,
        flyerUrl: editForm.flyerUrl,
        sponsors: finalSponsors,
      };

      const updated = await api.patch(`/events/${editEventId}`, payload);
      
      setEvents(prev => prev.map(e => e.id === editEventId ? { 
        ...e, 
        title: updated.title,
        status: updated.status,
        flyerUrl: updated.flyerUrl,
        category: updated.category,
        maxCapacity: updated.maxCapacity,
        sponsors: updated.sponsors || [],
        location: updated.location ? { venueName: updated.location.venueName, city: updated.location.city } : e.location
      } : e));

      setIsEditModalOpen(false);
    } catch (e: any) {
      setEditError(e.message || "Failed to update event details.");
    } finally {
      setSavingEdit(false);
    }
  };

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

  const isOrganizerOrAdmin = user && ["SUPER_ADMIN", "ORG_ADMIN"].includes(user.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] flex items-center justify-center">
        <div className="font-display font-black text-xl animate-pulse uppercase text-[#121212]/50">Verifying authorization...</div>
      </div>
    );
  }

  if (user && user.status === "PENDING_VERIFICATION") {
    return (
      <div className="min-h-screen bg-[#FFF5E4] flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center bg-[#FAF8F5] border-3 border-[#121212] p-8 rounded shadow-brutal space-y-6">
          <div className="inline-block bg-yellow-festival border-2 border-[#121212] text-[10px] font-black uppercase px-3 py-1 rounded shadow-brutal-sm">
            ⏳ Verification Pending
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tighter">
            Awaiting Admin Approval
          </h2>
          <p className="font-space font-bold text-sm text-[#121212]/70 leading-relaxed">
            Thank you for registering as an Event Organizer! To keep the Element 5 community secure and high-quality, all organizers are verified by our team.
          </p>
          <div className="border-t border-[#121212]/10 pt-4 font-space text-xs text-gray-500 space-y-1 text-left">
            <p><strong>Account Name</strong>: {user.fullName}</p>
            <p><strong>Email Address</strong>: {user.email}</p>
          </div>
          <div className="bg-yellow-festival/10 border-2 border-[#121212] p-4 rounded text-left space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-yellow-800">What happens next?</p>
            <ul className="text-xs font-bold text-[#121212]/80 list-disc list-inside space-y-1">
              <li>Our Super Administrator is reviewing your request.</li>
              <li>You will receive full event scheduling access once approved.</li>
              <li>Approval usually takes less than 24 hours.</li>
            </ul>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full bg-[#D80032] text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
          >
            LOG OUT
          </button>
        </div>
      </div>
    );
  }

  if (!isOrganizerOrAdmin) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <AlertCircle size={40} className="mx-auto text-red-stage" />
          <h2 className="font-display font-black text-2xl uppercase">Access Denied</h2>
          <p className="font-space font-bold text-sm text-[#121212]/60">Organizer access requires ORG_ADMIN role.</p>
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

        {/* Navigation Tabs */}
        <div className="flex border-b-3 border-[#121212] gap-2 overflow-x-auto pb-2 select-none">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 border-2 border-[#121212] rounded font-display font-black text-xs uppercase tracking-tight transition-all shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === t.key ? "bg-yellow-festival text-[#121212]" : "bg-white text-gray-500 hover:bg-[#FAF8F5]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Event selector (shown on non-events tabs as buttons instead of a dropdown) */}
        {activeTab !== "events" && events.length > 0 && (
          <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-4 flex flex-col md:flex-row md:items-center gap-3">
            <span className="font-display font-black text-xs uppercase text-[#121212]/50 flex-shrink-0">Active Event:</span>
            <div className="flex flex-wrap gap-2 flex-1">
              {events.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`px-3 py-1.5 border-2 border-[#121212] rounded font-display font-black text-xs uppercase tracking-tight transition-all shadow-brutal-sm cursor-pointer hover:translate-y-[1px] hover:shadow-none ${
                    selectedEventId === ev.id ? "bg-yellow-festival text-[#121212]" : "bg-white text-gray-500 hover:bg-[#FAF8F5]"
                  }`}
                >
                  {ev.title}
                </button>
              ))}
            </div>
            {selectedEvent && (
              <Link href={`/events/${selectedEvent.slug}`}
                className="flex items-center justify-center gap-1.5 border-2 border-[#121212] font-black text-[10px] uppercase px-3 py-2 rounded hover:bg-[#121212]/5 transition-colors flex-shrink-0">
                <Eye size={12} /> VIEW PAGE
              </Link>
            )}
          </div>
        )}



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
                          <button onClick={() => handleStartEdit(ev)}
                            className="flex items-center justify-center border-2 border-[#121212] bg-[#FFDE4D] px-3 py-2 rounded hover:bg-yellow-festival/80 transition-colors"
                            title="Edit Event"
                          >
                            <Pencil size={13} />
                          </button>
                          <Link href={`/events/${ev.slug}`}
                            className="flex items-center justify-center border-2 border-[#121212] px-3 py-2 rounded hover:bg-[#121212]/5 transition-colors"
                            title="View Event Page"
                          >
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

          {activeTab === "gate" && selectedEventId && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-xl uppercase">
                Ticket Gateway — <span className="text-red-stage">{selectedEvent?.title ?? "…"}</span>
              </h2>
              <TicketGatewayPanel eventId={selectedEventId} />
            </div>
          )}



          {activeTab === "voting" && selectedEventId && (
            <div className="space-y-4">
              <h2 className="font-display font-black text-xl uppercase">
                Manage Live Voting — <span className="text-red-stage">{selectedEvent?.title ?? "…"}</span>
              </h2>
              <VotingPanel eventId={selectedEventId} />
            </div>
          )}



          {(activeTab === "registrations" || activeTab === "analytics" || activeTab === "voting" || activeTab === "gate") && !selectedEventId && !eventsLoading && (
            <div className="py-16 text-center">
              <p className="font-display font-black text-lg text-[#121212]/40 uppercase">No event selected — create one first.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#121212]/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF8F5] border-4 border-[#121212] p-6 max-w-2xl w-full rounded shadow-brutal space-y-6 text-[#121212] font-space relative my-8">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 border-2 border-[#121212] bg-white rounded flex items-center justify-center hover:bg-gray-100 font-black shadow-brutal-sm"
            >
              ✕
            </button>

            <div>
              <span className="bg-red-stage text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">Event Settings</span>
              <h3 className="font-display font-black text-2xl uppercase tracking-tight mt-1">EDIT EVENT DETAILS</h3>
              <p className="text-[11px] text-gray-500 font-bold">Update details, prices, and payment QR codes for this event.</p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500">Event Title</label>
                  <input className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500">Max Capacity</label>
                  <input type="number" className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.maxCapacity} onChange={e => setEditForm({ ...editForm, maxCapacity: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500">Event Status</label>
                  <select className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded bg-white" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="PUBLISHED">Published / Active</option>
                    <option value="COMPLETED">Completed / Over</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500">Description</label>
                <textarea rows={3} className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded resize-none" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500">Venue Name</label>
                  <input className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.venueName} onChange={e => setEditForm({ ...editForm, venueName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500">Full Address</label>
                  <input className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.venueAddress} onChange={e => setEditForm({ ...editForm, venueAddress: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500">City</label>
                  <input className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-500">State</label>
                  <input className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} />
                </div>
              </div>

              {/* Pricing section */}
              <div className="border-2 border-[#121212] bg-white p-4 rounded space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-black text-xs uppercase">Paid Event</span>
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, isPaid: !editForm.isPaid })}
                    className={`w-12 h-6 rounded-full border-2 border-[#121212] transition-colors relative ${editForm.isPaid ? "bg-yellow-festival" : "bg-[#121212]/10"}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white border-2 border-[#121212] rounded-full transition-all ${editForm.isPaid ? "left-[26px]" : "left-0.5"}`} />
                  </button>
                </div>

                {editForm.isPaid && (
                  <div className="space-y-4 pt-2 border-t border-[#121212]/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Audience Price (₹)</label>
                        <input type="number" className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.audiencePrice} onChange={e => setEditForm({ ...editForm, audiencePrice: e.target.value, price: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Artist Price (₹)</label>
                        <input type="number" className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.artistPrice} onChange={e => setEditForm({ ...editForm, artistPrice: e.target.value })} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500">UPI VPA ID</label>
                      <input className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded" value={editForm.upiVpa} onChange={e => setEditForm({ ...editForm, upiVpa: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Audience QR URL</label>
                        <input className="w-full border-2 border-[#121212] p-2 text-xs font-mono rounded" value={editForm.audienceQrUrl} onChange={e => setEditForm({ ...editForm, audienceQrUrl: e.target.value })} />
                        <div className="mt-1">
                          <SupabaseUpload folder="element5/qrs" accept="image/*" label="UPLOAD AUDIENCE QR" maxSizeMB={5} onUploadSuccess={r => setEditForm({ ...editForm, audienceQrUrl: r.secure_url, upiQrUrl: r.secure_url })} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">Artist QR URL</label>
                        <input className="w-full border-2 border-[#121212] p-2 text-xs font-mono rounded" value={editForm.artistQrUrl} onChange={e => setEditForm({ ...editForm, artistQrUrl: e.target.value })} />
                        <div className="mt-1">
                          <SupabaseUpload folder="element5/qrs" accept="image/*" label="UPLOAD ARTIST QR" maxSizeMB={5} onUploadSuccess={r => setEditForm({ ...editForm, artistQrUrl: r.secure_url })} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Flyer upload */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500">Event Flyer Banner URL</label>
                <input className="w-full border-2 border-[#121212] p-2 text-xs font-mono rounded" value={editForm.flyerUrl} onChange={e => setEditForm({ ...editForm, flyerUrl: e.target.value })} />
                <div className="mt-1">
                  <SupabaseUpload folder="element5/flyers" accept="image/*" label="UPLOAD NEW FLYER" maxSizeMB={10} onUploadSuccess={r => setEditForm({ ...editForm, flyerUrl: r.secure_url })} />
                </div>
              </div>

              {/* Sponsors upload */}
              <div className="border-t border-[#121212]/10 pt-4 space-y-3">
                <span className="font-display font-black text-xs uppercase block">Event Sponsors</span>
                
                {/* Add new sponsor */}
                <div className="border border-[#121212]/20 bg-gray-50 p-3 rounded space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Sponsor Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Red Bull"
                        className="w-full px-2 py-1.5 border border-[#121212]/30 bg-white rounded font-space font-bold text-xs focus:outline-none"
                        value={newEditSponsorName}
                        onChange={(e) => setNewEditSponsorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400">Logo Upload</label>
                      <SupabaseUpload
                        folder="element5/sponsors"
                        accept="image/*"
                        label={newEditSponsorLogo ? "RE-UPLOAD" : "UPLOAD LOGO"}
                        maxSizeMB={5}
                        onUploadSuccess={(r) => setNewEditSponsorLogo(r.secure_url)}
                      />
                      {newEditSponsorLogo && (
                        <p className="text-[9px] text-green-600 font-bold mt-0.5">✓ Uploaded</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!newEditSponsorName.trim() || !newEditSponsorLogo}
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        sponsors: [...(editForm.sponsors || []), { name: newEditSponsorName, logo: newEditSponsorLogo }]
                      });
                      setNewEditSponsorName("");
                      setNewEditSponsorLogo("");
                    }}
                    className="w-full bg-[#121212] text-white border border-[#121212] font-display font-black text-[9px] uppercase py-1.5 rounded disabled:opacity-50 hover:bg-[#121212]/80 cursor-pointer"
                  >
                    + Add Sponsor
                  </button>
                </div>

                {/* List sponsors */}
                {editForm.sponsors && editForm.sponsors.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {editForm.sponsors.map((sp: any, idx: number) => (
                      <div key={idx} className="border border-[#121212]/30 bg-white p-2 rounded relative flex flex-col items-center text-center">
                        <button
                          type="button"
                          onClick={() => setEditForm({
                            ...editForm,
                            sponsors: editForm.sponsors.filter((_: any, i: number) => i !== idx)
                          })}
                          className="absolute -top-1 -right-1 w-4.5 h-4.5 border border-[#121212] bg-red-stage text-white rounded-full flex items-center justify-center font-black text-[8px] hover:bg-red-700 cursor-pointer"
                        >
                          ✕
                        </button>
                        <div className="w-10 h-10 flex items-center justify-center border border-gray-100 rounded overflow-hidden p-0.5 bg-gray-50">
                          <img src={sp.logo} alt={sp.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="font-space font-black text-[8px] uppercase tracking-tight mt-1 truncate max-w-full">
                          {sp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {editError && (
              <p className="text-xs text-red-stage font-bold bg-red-50 p-2.5 rounded border border-red-200">{editError}</p>
            )}

            <div className="pt-2 border-t border-[#121212]/10 flex gap-3">
              <button onClick={handleSaveEdit} disabled={savingEdit}
                className="flex-1 bg-[#121212] text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50">
                {savingEdit ? "SAVING..." : "SAVE CHANGES"}
              </button>
              <button onClick={() => setIsEditModalOpen(false)}
                className="bg-white text-[#121212] border-3 border-[#121212] font-display font-black text-xs uppercase px-6 py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



export default function OrganizerDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF5E4] py-12 text-center font-display font-black uppercase text-[#121212]/40 animate-pulse">Loading Organizer Dashboard…</div>}>
      <OrganizerDashboardContent />
    </Suspense>
  );
}

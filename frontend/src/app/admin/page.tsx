"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Users, Vote, Calendar, TrendingUp, Check, ShieldAlert,
  Award, Database, Cpu, Activity, RefreshCw, AlertCircle, FileText, Eye, X, Scan
} from "lucide-react";
import SupabaseUpload from "@/components/ui/SupabaseUpload";

// ── Types ──────────────────────────────────────────────────────────────────
interface BackendStats {
  users?: number;
  creators?: number;
  organizers?: number;
  events?: number;
  votesCast?: number;
  ticketsCheckedIn?: number;
}
interface ModerationReport {
  id: string; targetType: string; reason: string; status: string; createdAt: string;
  reporter?: { fullName: string };
}
interface AuditLog {
  id: string; action: string; createdAt: string; user?: { fullName: string };
}
interface HealthStatus {
  status: "HEALTHY" | "UNHEALTHY" | "LOADING" | "OFFLINE";
  database: "UP" | "DOWN" | "UNKNOWN"; redis: "UP" | "DOWN" | "UNKNOWN";
  uptime: number; timestamp: string;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.FC<{ className?: string; size?: number }>; color: string }) {
  return (
    <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal">
      <span className="text-gray-500 font-black text-[10px] uppercase tracking-wider block">{label}</span>
      <div className="flex justify-between items-end mt-2">
        <h3 className="font-display font-black text-4xl">{value}</h3>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Icon className={`mb-1 ${color}`} size={24} />
      </div>
    </div>
  );
}

function HealthBadge({ status }: { status: "UP" | "DOWN" | "UNKNOWN" }) {
  const cls = status === "UP" ? "bg-green-500" : status === "DOWN" ? "bg-red-500" : "bg-gray-400";
  return (
    <span className={`inline-flex items-center gap-1.5 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-white ${status === "UP" ? "animate-pulse" : ""}`} />{status}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { artists, events, collabRequests, setArtists, setEvents } = useApp();

  const TABS = ["overview", "events", "creators", "organizers", "leaderboard", "highlights", "media", "health"] as const;
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("overview");

  const [backendStats, setBackendStats] = useState<BackendStats | null>(null);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [health, setHealth] = useState<HealthStatus>({ status: "LOADING", database: "UNKNOWN", redis: "UNKNOWN", uptime: 0, timestamp: "" });
  const [statsLoading, setStatsLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [resolvingReport, setResolvingReport] = useState<string | null>(null);

  const [creators, setCreators] = useState<any[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);
  const [verifyingCreatorId, setVerifyingCreatorId] = useState<string | null>(null);

  const [allOrganizers, setAllOrganizers] = useState<any[]>([]);
  const [organizersLoading, setOrganizersLoading] = useState(false);
  const [verifyingOrganizerId, setVerifyingOrganizerId] = useState<string | null>(null);

  // CMS state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventVenue, setNewEventVenue] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [eventSuccess, setEventSuccess] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "SUPER_ADMIN")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try { setStatsLoading(true); const d = await api.get("/admin/stats"); setBackendStats(d); } catch {} finally { setStatsLoading(false); }
    })();
    (async () => {
      try { setReportsLoading(true); const d = await api.get("/admin/reports"); if (Array.isArray(d)) setReports(d); } catch {} finally { setReportsLoading(false); }
    })();
    (async () => {
      try { const d = await api.get("/admin/audits"); if (Array.isArray(d)) setAuditLogs(d.slice(0, 20)); } catch {}
    })();
  }, [user]);

  useEffect(() => {
    if (activeTab === "health") fetchHealth();
    if (activeTab === "creators") fetchCreators();
    if (activeTab === "organizers") fetchAllOrganizers();
  }, [activeTab]);

  async function fetchHealth() {
    setHealthLoading(true);
    try { const d = await api.get("/health"); setHealth({ ...d, status: d.status === "HEALTHY" ? "HEALTHY" : "UNHEALTHY" }); }
    catch { setHealth({ status: "OFFLINE", database: "DOWN", redis: "DOWN", uptime: 0, timestamp: new Date().toISOString() }); }
    finally { setHealthLoading(false); }
  }

  async function resolveReport(id: string, action: string) {
    setResolvingReport(id);
    try { await api.put(`/admin/reports/${id}/resolve`, { action }); setReports(prev => prev.map(r => r.id === id ? { ...r, status: "RESOLVED" } : r)); }
    catch {} finally { setResolvingReport(null); }
  }

  async function fetchCreators() {
    setCreatorsLoading(true);
    try {
      const data = await api.get("/artists", { params: { limit: 100 } });
      setCreators(Array.isArray(data) ? data : []);
    } catch {
      setCreators([]);
    } finally {
      setCreatorsLoading(false);
    }
  }

  async function fetchAllOrganizers() {
    setOrganizersLoading(true);
    try {
      const data = await api.get("/admin/users/organizers");
      setAllOrganizers(Array.isArray(data) ? data : []);
    } catch {
      setAllOrganizers([]);
    } finally {
      setOrganizersLoading(false);
    }
  }

  async function handleVerifyOrganizer(userId: string, action: "APPROVE" | "REJECT") {
    setVerifyingOrganizerId(userId);
    try {
      await api.put(`/admin/users/${userId}/verify`, { action });
      if (action === "APPROVE") {
        setAllOrganizers(prev =>
          prev.map(org => org.id === userId ? { ...org, status: "ACTIVE" } : org)
        );
        import("canvas-confetti").then(({ default: c }) => c({ particleCount: 40, spread: 30, colors: ["#FFDE4D", "#D80032"] }));
      } else {
        setAllOrganizers(prev => prev.filter(org => org.id !== userId));
      }
    } catch (err) {
      console.error("Failed to verify organizer:", err);
    } finally {
      setVerifyingOrganizerId(null);
    }
  }

  async function handleToggleVerification(artistId: string, currentStatus: boolean) {
    setVerifyingCreatorId(artistId);
    try {
      await api.put(`/admin/artists/${artistId}/verify`, { isVerified: !currentStatus });
      setCreators(prev =>
        prev.map(c => (c.id === artistId ? { ...c, isVerified: !currentStatus } : c))
      );
    } catch (err) {
      console.error("Failed to verify creator:", err);
    } finally {
      setVerifyingCreatorId(null);
    }
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-[#FFF5E4] flex items-center justify-center"><p className="font-display font-black text-2xl animate-pulse uppercase">VERIFYING ACCESS...</p></div>;
  }

  const totalVotes = artists.reduce((a, c) => a + c.votes, 0);
  const totalReg = events.reduce((a, c) => a + c.audienceCount, 0);
  const stats = {
    users: backendStats?.users ?? totalReg,
    votes: backendStats?.votesCast ?? totalVotes,
    artists: backendStats?.creators ?? artists.length,
    organizers: backendStats?.organizers ?? 0,
    events: backendStats?.events ?? events.length,
    revenue: (backendStats?.ticketsCheckedIn ?? totalReg) * 150,
    active: Math.floor((backendStats?.users ?? totalReg) * 0.6),
  };

  const handleToggleEvent = (id: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, isCompleted: !e.isCompleted } : e));
    import("canvas-confetti").then(({ default: c }) => c({ particleCount: 40, spread: 30, colors: ["#FFDE4D", "#D80032"] }));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setEvents([{
      id: `event-${Date.now()}`, title: newEventTitle, type: "StageVerse", date: newEventDate || "TBD",
      time: "7:00 PM", venue: newEventVenue, description: "Admin-scheduled event.",
      image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=500&fit=crop",
      countdownDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      schedule: [], sponsors: [], audienceCount: 0, registrationProgress: 0, registrationLimit: 200, isCompleted: false,
    }, ...events]);
    setNewEventTitle(""); setNewEventVenue(""); setEventSuccess(true);
    import("canvas-confetti").then(({ default: c }) => c({ particleCount: 80, spread: 60, colors: ["#FFDE4D", "#D80032"] }));
    setTimeout(() => setEventSuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3">
            <span className="brutal-tape uppercase text-xs">AETHERIS CENTRAL</span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl uppercase tracking-tighter">
              ADMIN <span className="text-red-stage inline-block">CMS</span>
            </h1>
            <p className="font-space text-sm sm:text-base font-bold text-gray-700 max-w-xl">
              Live telemetry, content management, and moderation tools for the Element 5 platform.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-3 border-[#121212] rounded overflow-hidden max-w-2xl bg-white">
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 font-display font-black text-xs uppercase transition-colors ${activeTab === t ? "bg-[#121212] text-white" : "bg-white text-[#121212]"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-12">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
              <StatCard label="Registrations" value={stats.users} icon={Users} color="text-yellow-festival" />
              <StatCard label="Total Votes" value={stats.votes} icon={Vote} color="text-red-stage" />
              <StatCard label="Creators" value={stats.artists} icon={Award} color="text-orange-burnt" />
              <StatCard label="Organizers" value={stats.organizers} icon={Users} color="text-teal-500" />
              <StatCard label="Events" value={stats.events} icon={Calendar} color="text-blue-500" />
              <StatCard label="Revenue" value={`₹${Number(stats.revenue).toLocaleString()}`} icon={TrendingUp} color="text-green-500" />
              <StatCard label="Active Now" value={stats.active} icon={Activity} color="text-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Audit logs */}
              <div className="border-3 border-[#121212] bg-[#121212] text-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
                <h3 className="font-display font-black text-lg uppercase text-yellow-festival flex items-center gap-2">
                  <ShieldAlert size={20} /> Audit Stream
                </h3>
                <div className="space-y-3 text-xs font-space max-h-64 overflow-y-auto">
                  {auditLogs.length > 0 ? auditLogs.map(log => (
                    <div key={log.id} className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-green-400 font-bold truncate max-w-[70%]">{log.user?.fullName || "System"} — {log.action}</span>
                      <span className="text-gray-500 text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  )) : (
                    <>
                      <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-green-400 font-bold">✓ Event registered by user</span><span className="text-gray-500">1m ago</span></div>
                      <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-yellow-festival font-bold">★ Leaderboard vote cast</span><span className="text-gray-500">4m ago</span></div>
                      <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-red-400 font-bold">⚡ Collaboration pin posted</span><span className="text-gray-500">12m ago</span></div>
                      <div className="flex justify-between"><span className="text-gray-400 font-bold">⚙ Backend initialized</span><span className="text-gray-500">1h ago</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Moderation reports */}
              <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
                <h3 className="font-display font-black text-lg uppercase flex items-center gap-2">
                  <FileText size={20} className="text-red-stage" /> Moderation Reports
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {reportsLoading ? (
                    <p className="text-xs font-bold text-gray-400 animate-pulse uppercase">Loading reports...</p>
                  ) : reports.length > 0 ? reports.map(r => (
                    <div key={r.id} className="border-b border-gray-100 pb-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-display font-black text-xs block truncate">{r.reason}</span>
                        <span className="text-[10px] text-gray-400 font-space">{r.targetType} · {r.reporter?.fullName || "Anonymous"}</span>
                      </div>
                      {r.status === "OPEN" ? (
                        <button onClick={() => resolveReport(r.id, "CONTENT_REMOVED")} disabled={resolvingReport === r.id}
                          className="text-[10px] font-black bg-[#121212] text-white px-2 py-1 rounded flex-shrink-0 disabled:opacity-50">
                          {resolvingReport === r.id ? "..." : "RESOLVE"}
                        </button>
                      ) : (
                        <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded">{r.status}</span>
                      )}
                    </div>
                  )) : collabRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div><span className="text-xs font-bold">{req.title}</span><span className="text-[10px] text-gray-400 block">By {req.authorName}</span></div>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-black">APPROVED</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EVENTS ── */}
        {activeTab === "events" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-display font-black text-xl uppercase">Active Events</h3>
              {events.map(event => (
                <div key={event.id} className="bg-white border-2 border-[#121212] p-4 flex items-center justify-between rounded shadow-brutal">
                  <div><h4 className="font-display font-bold text-base">{event.title}</h4><p className="text-xs text-gray-500 font-space">{event.venue.split(",")[0]} · {event.date}</p></div>
                  <button onClick={() => handleToggleEvent(event.id)}
                    className={`text-xs font-black px-4 py-2 border border-[#121212] rounded shadow-brutal-light transition-all ${event.isCompleted ? "bg-red-stage text-white" : "bg-green-500 text-[#121212]"}`}>
                    {event.isCompleted ? "SET ACTIVE" : "CLOSE EVENT"}
                  </button>
                </div>
              ))}
            </div>
            <div className="lg:col-span-5">
              <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
                <h3 className="font-display font-black text-lg uppercase flex items-center gap-2">
                  <Calendar size={20} className="text-yellow-festival" /> Schedule Event
                </h3>
                {eventSuccess ? (
                  <div className="bg-green-500 text-white font-bold p-4 rounded text-center border-2 border-[#121212] text-xs flex items-center justify-center gap-2">
                    <Check size={16} /> EVENT SCHEDULED
                  </div>
                ) : (
                  <form onSubmit={handleCreateEvent} className="space-y-3">
                    {[
                      { label: "Event Title", val: newEventTitle, set: setNewEventTitle, ph: "e.g. StageVerse 4.0" },
                      { label: "Venue", val: newEventVenue, set: setNewEventVenue, ph: "e.g. The Comedy Club, Rajkot" },
                      { label: "Date", val: newEventDate, set: setNewEventDate, ph: "August 22, 2026" },
                    ].map(({ label, val, set, ph }) => (
                      <div key={label} className="space-y-1">
                        <label className="text-xs font-black uppercase text-gray-500 block">{label}</label>
                        <input type="text" placeholder={ph} value={val} onChange={e => set(e.target.value)}
                          className="w-full p-2 border-2 border-[#121212] bg-white rounded font-space font-bold placeholder-gray-400 focus:outline-none" />
                      </div>
                    ))}
                    <button type="submit" className="w-full bg-[#121212] text-white font-black uppercase text-xs tracking-wider py-3 rounded">ADD EVENT</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CREATORS ── */}
        {activeTab === "creators" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-black text-xl uppercase">Creator Verification Panel</h3>
              <button 
                onClick={fetchCreators}
                disabled={creatorsLoading}
                className="flex items-center gap-1.5 border-2 border-[#121212] font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-[#121212]/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={creatorsLoading ? "animate-spin" : ""} /> REFRESH
              </button>
            </div>
            {creatorsLoading ? (
              <div className="text-center font-space font-bold py-16 animate-pulse text-gray-500 uppercase">
                Loading creators...
              </div>
            ) : creators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {creators.map((creator) => (
                  <div key={creator.id} className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={creator.user?.profilePhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creator.stageName || "User")}&backgroundColor=121212&textColor=FAF8F5`}
                          alt="" 
                          className="w-12 h-12 rounded border-2 border-[#121212] object-cover" 
                        />
                        <div>
                          <h4 className="font-display font-black text-lg uppercase tracking-tight">{creator.stageName}</h4>
                          <p className="font-space text-xs text-gray-500 font-bold mt-0.5">Real Name: {creator.user?.fullName || "N/A"}</p>
                          <p className="font-space text-xs text-gray-400 font-bold mt-0.5">Genres: {creator.genres?.join(", ") || "None"}</p>
                        </div>
                      </div>
                      <span className={`border-2 border-[#121212] text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-brutal-sm ${
                        creator.isVerified ? "bg-yellow-festival text-[#121212]" : "bg-gray-200 text-gray-500"
                      }`}>
                        {creator.isVerified ? "✓ VERIFIED" : "UNVERIFIED"}
                      </span>
                    </div>
                    
                    {creator.biography && (
                      <p className="font-space text-xs text-gray-600 font-bold italic line-clamp-2 bg-white p-2.5 border border-dashed border-[#121212]/10 rounded">
                        "{creator.biography}"
                      </p>
                    )}

                    <div className="pt-4 border-t border-[#121212]/10">
                      <button
                        onClick={() => handleToggleVerification(creator.id, creator.isVerified)}
                        disabled={verifyingCreatorId === creator.id}
                        className={`w-full border-2 border-[#121212] font-display font-black text-xs uppercase py-2.5 rounded shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer disabled:opacity-50 ${
                          creator.isVerified ? "bg-[#D80032] text-white" : "bg-green-500 text-white"
                        }`}
                      >
                        {verifyingCreatorId === creator.id 
                          ? "PROCESSING..." 
                          : creator.isVerified 
                          ? "REVOKE VERIFICATION" 
                          : "VERIFY CREATOR"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-3 border-dashed border-gray-300 p-12 text-center rounded bg-white font-space">
                <p className="text-sm font-bold text-gray-500">No creators found on the platform.</p>
              </div>
            )}
          </div>
        )}

        {/* ── ORGANIZERS ── */}
        {activeTab === "organizers" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-black text-xl uppercase">Organizer Profiles</h3>
              <button 
                onClick={fetchAllOrganizers}
                disabled={organizersLoading}
                className="flex items-center gap-1.5 border-2 border-[#121212] font-black text-[10px] uppercase px-3 py-1.5 rounded hover:bg-[#121212]/5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={organizersLoading ? "animate-spin" : ""} /> REFRESH
              </button>
            </div>
            {organizersLoading ? (
              <div className="text-center font-space font-bold py-16 animate-pulse text-gray-500 uppercase">
                Loading organizers...
              </div>
            ) : allOrganizers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allOrganizers.map((org) => (
                  <div key={org.id} className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={org.profilePhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(org.fullName || "User")}&backgroundColor=121212&textColor=FAF8F5`}
                          alt="" 
                          className="w-12 h-12 rounded border-2 border-[#121212] object-cover" 
                        />
                        <div>
                          <h4 className="font-display font-black text-lg uppercase tracking-tight">{org.fullName}</h4>
                          <p className="font-space text-xs text-gray-500 font-bold mt-0.5">Email: {org.email}</p>
                          <p className="font-space text-xs text-gray-400 font-bold mt-0.5">Mobile: {org.mobileNumber || "N/A"}</p>
                        </div>
                      </div>
                      <span className={`border-2 border-[#121212] text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-brutal-sm ${
                        org.status === "ACTIVE" ? "bg-green-500 text-white" : "bg-yellow-300 text-[#121212]"
                      }`}>
                        {org.status === "ACTIVE" ? "✓ ACTIVE" : "PENDING APPROVAL"}
                      </span>
                    </div>

                    {org.status !== "ACTIVE" && (
                      <div className="pt-4 border-t border-[#121212]/10 flex gap-4">
                        <button
                          onClick={() => handleVerifyOrganizer(org.id, "APPROVE")}
                          disabled={verifyingOrganizerId === org.id}
                          className="flex-1 bg-green-500 text-white border-2 border-[#121212] font-display font-black text-xs uppercase py-2.5 rounded shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
                        >
                          {verifyingOrganizerId === org.id ? "PROCESSING..." : "APPROVE ORGANIZER"}
                        </button>
                        <button
                          onClick={() => handleVerifyOrganizer(org.id, "REJECT")}
                          disabled={verifyingOrganizerId === org.id}
                          className="flex-1 bg-[#D80032] text-white border-2 border-[#121212] font-display font-black text-xs uppercase py-2.5 rounded shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
                        >
                          {verifyingOrganizerId === org.id ? "PROCESSING..." : "REJECT / DELETE"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-3 border-dashed border-gray-300 p-12 text-center rounded bg-white font-space">
                <p className="text-sm font-bold text-gray-500">No organizer profiles found on the platform.</p>
              </div>
            )}
          </div>
        )}

        {/* ── LEADERBOARD ── */}
        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            <h3 className="font-display font-black text-xl uppercase">Vote Reset System</h3>
            <div className="border-3 border-[#121212] bg-white rounded overflow-hidden shadow-brutal">
              <div className="grid grid-cols-12 bg-[#121212] text-white p-3 font-display font-black text-xs uppercase tracking-wider">
                <div className="col-span-5">ARTIST</div><div className="col-span-3 text-center">VOTES</div>
                <div className="col-span-2 text-center">SCORE</div><div className="col-span-2 text-right">RESET</div>
              </div>
              <div className="divide-y divide-[#121212]">
                {artists.map(artist => (
                  <div key={artist.id} className="grid grid-cols-12 items-center p-3 font-space font-bold text-sm">
                    <div className="col-span-5 flex items-center gap-3">
                      <img src={artist.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-[#121212]" />
                      <span className="truncate">{artist.name}</span>
                    </div>
                    <div className="col-span-3 text-center text-red-stage font-black">{artist.votes}</div>
                    <div className="col-span-2 text-center">{artist.stageVerseScore}%</div>
                    <div className="col-span-2 text-right">
                      <button onClick={() => setArtists(artists.map(a => a.id === artist.id ? { ...a, votes: 0 } : a))}
                        disabled={artist.votes === 0}
                        className="text-xs bg-[#121212] text-white border border-[#121212] px-2.5 py-1 rounded disabled:opacity-30 hover:bg-red-stage">
                        RESET
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MEDIA ── */}
        {activeTab === "media" && (
          <div className="space-y-8">
            <div><h3 className="font-display font-black text-xl uppercase">Media Asset Manager</h3>
              <p className="font-space text-sm text-gray-600 font-bold mt-1">Upload images and flyers to Cloudinary CDN via signed server-side signature.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
                <h4 className="font-display font-black text-base uppercase">Event Flyer Upload</h4>
                <SupabaseUpload folder="element5/flyers" accept="image/*" label="UPLOAD EVENT FLYER" maxSizeMB={10}
                  onUploadSuccess={r => console.log("Uploaded:", r.secure_url)} />
              </div>
              <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
                <h4 className="font-display font-black text-base uppercase">Performance Media</h4>
                <SupabaseUpload folder="element5/performances" accept="image/*,video/*" label="UPLOAD PERFORMANCE MEDIA" maxSizeMB={50}
                  onUploadSuccess={r => console.log("Uploaded:", r.secure_url)} />
              </div>
            </div>
          </div>
        )}

        {/* ── HEALTH ── */}
        {activeTab === "health" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xl uppercase">System Health & Metrics</h3>
              <button onClick={fetchHealth} disabled={healthLoading}
                className="flex items-center gap-2 border-2 border-[#121212] bg-white px-4 py-2 rounded font-black uppercase text-xs hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw size={14} className={healthLoading ? "animate-spin" : ""} /> REFRESH
              </button>
            </div>

            <div className={`border-3 border-[#121212] p-6 rounded shadow-brutal ${
              health.status === "HEALTHY" ? "bg-green-50" : health.status === "UNHEALTHY" ? "bg-red-50" : "bg-[#FAF8F5]"
            }`}>
              <div className="flex items-center gap-3 pb-4 border-b border-[#121212]/10">
                {health.status === "LOADING" ? <RefreshCw size={24} className="animate-spin text-gray-400" />
                  : health.status === "HEALTHY" ? <Activity size={24} className="text-green-600" />
                  : <AlertCircle size={24} className="text-red-stage" />}
                <div>
                  <h4 className="font-display font-black text-xl uppercase">{health.status === "LOADING" ? "Checking..." : health.status}</h4>
                  {health.timestamp && <p className="font-space text-xs text-gray-500">Checked: {new Date(health.timestamp).toLocaleTimeString()}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                <div className="space-y-1">
                  <span className="font-display font-black text-xs uppercase text-gray-500 flex items-center gap-1.5"><Database size={12} /> PostgreSQL</span>
                  <HealthBadge status={health.database} />
                </div>
                <div className="space-y-1">
                  <span className="font-display font-black text-xs uppercase text-gray-500 flex items-center gap-1.5"><Cpu size={12} /> Redis</span>
                  <HealthBadge status={health.redis} />
                </div>
                <div className="space-y-1">
                  <span className="font-display font-black text-xs uppercase text-gray-500 flex items-center gap-1.5"><Activity size={12} /> Uptime</span>
                  <span className="font-space font-black text-sm">
                    {health.uptime > 0 ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
              <h4 className="font-display font-black text-base uppercase flex items-center gap-2">
                <Eye size={18} className="text-red-stage" /> Prometheus Metrics
        {/* ── HIGHLIGHTS FEED ── */}
        {activeTab === "highlights" && (
          <HighlightsPanel />
        )}

      </div>
    </div>
  );
}

function HighlightsPanel() {
  const [highlights, setHighlights] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // List of pending highlights that the admin is editing/adding
  const [pendingItems, setPendingItems] = React.useState<{ id: string; imageUrl: string; description: string }[]>([
    { id: Math.random().toString(), imageUrl: "", description: "" }
  ]);
  const [publishing, setPublishing] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchHighlights = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/highlights");
      setHighlights(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Failed to fetch highlights:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  const addPendingRow = () => {
    setPendingItems((prev) => [...prev, { id: Math.random().toString(), imageUrl: "", description: "" }]);
  };

  const removePendingRow = (id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updatePendingItem = (id: string, field: "imageUrl" | "description", value: string) => {
    setPendingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handlePublishAll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = pendingItems.filter((item) => item.imageUrl && item.description.trim());
    if (validItems.length === 0) return;
    
    setPublishing(true);
    setError(null);
    try {
      // Publish each valid highlight
      const promises = validItems.map((item) =>
        api.post("/highlights", { imageUrl: item.imageUrl, description: item.description })
      );
      const results = await Promise.all(promises);
      
      // Update local highlights state
      setHighlights((prev) => [...results, ...prev]);
      
      // Reset pending items to a single empty row
      setPendingItems([{ id: Math.random().toString(), imageUrl: "", description: "" }]);
    } catch (err: any) {
      setError(err?.message || "Failed to publish highlights.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/highlights/${id}`);
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch (err: any) {
      alert("Failed to delete highlight: " + (err?.message || err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Add Multiple Highlights Form */}
      <div className="lg:col-span-6 border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
        <div>
          <h3 className="font-display font-black text-xl uppercase">Publish Highlights</h3>
          <p className="font-space text-xs text-gray-500 font-bold mt-1">Add one or multiple highlight panels to publish to the landing page Highlights Feed.</p>
        </div>

        {error && (
          <div className="bg-red-stage text-white p-3 rounded text-xs font-bold font-space border-2 border-[#121212]">
            {error}
          </div>
        )}

        <form onSubmit={handlePublishAll} className="space-y-6">
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {pendingItems.map((item, idx) => (
              <div key={item.id} className="border-2 border-[#121212] bg-white p-4 rounded relative space-y-3 shadow-brutal-sm">
                {pendingItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePendingRow(item.id)}
                    className="absolute top-2 right-2 w-5 h-5 border border-[#121212] bg-red-stage text-white rounded-full flex items-center justify-center font-black text-[10px] hover:bg-red-700 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
                <div className="font-display font-black text-xs uppercase text-gray-400">
                  Highlight Panel #{idx + 1}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-500 block">Image URL / Upload</label>
                    <input
                      type="text"
                      placeholder="Image URL or upload below..."
                      value={item.imageUrl}
                      onChange={(e) => updatePendingItem(item.id, "imageUrl", e.target.value)}
                      className="w-full p-2 border border-[#121212] bg-white rounded font-bold text-[11px] focus:outline-none"
                      required
                    />
                    <div className="mt-1.5">
                      <SupabaseUpload
                        folder="element5/highlights"
                        accept="image/*"
                        label={item.imageUrl ? "CHANGE UPLOAD" : "UPLOAD IMAGE"}
                        maxSizeMB={5}
                        onUploadSuccess={(r) => updatePendingItem(item.id, "imageUrl", r.secure_url)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-gray-500 block">Description / Caption</label>
                    <textarea
                      placeholder="e.g. Sufi Acoustic Jam Session..."
                      value={item.description}
                      onChange={(e) => updatePendingItem(item.id, "description", e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-[#121212] bg-white rounded font-bold text-[11px] focus:outline-none resize-none h-[72px]"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={addPendingRow}
              className="flex-1 bg-white text-[#121212] border-3 border-[#121212] font-display font-black text-xs uppercase py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
            >
              + Add Another Panel
            </button>
            <button
              type="submit"
              disabled={publishing || pendingItems.filter(i => i.imageUrl && i.description.trim()).length === 0}
              className="flex-1 bg-yellow-festival text-[#121212] border-3 border-[#121212] font-display font-black text-xs uppercase py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
            >
              {publishing ? "PUBLISHING..." : "PUBLISH PANELS"}
            </button>
          </div>
        </form>
      </div>

      {/* Active Highlights List */}
      <div className="lg:col-span-6 border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
        <div>
          <h3 className="font-display font-black text-xl uppercase">Active Feed</h3>
          <p className="font-space text-xs text-gray-500 font-bold mt-1">Highlights currently visible on the landing page.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center font-display font-black text-sm uppercase animate-pulse text-[#121212]/40">
            Loading Highlights Feed...
          </div>
        ) : highlights.length === 0 ? (
          <div className="border-2 border-dashed border-[#121212]/20 p-8 rounded text-center">
            <p className="font-space text-xs text-gray-400 font-bold">No dynamic highlights published yet. Showing system defaults.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
            {highlights.map((h) => (
              <div key={h.id} className="border-2 border-[#121212] bg-[#FAF8F5] p-2.5 rounded shadow-brutal-sm relative flex flex-col justify-between gap-3 animate-fade-in">
                <button
                  type="button"
                  disabled={deletingId === h.id}
                  onClick={() => handleDelete(h.id)}
                  className="absolute top-2 right-2 w-6 h-6 border-2 border-[#121212] bg-red-stage text-white rounded-full flex items-center justify-center font-black text-xs hover:bg-red-700 disabled:opacity-50 cursor-pointer z-10 shadow-brutal-sm"
                  title="Remove Highlight"
                >
                  ✕
                </button>
                <div className="aspect-video w-full border border-[#121212]/20 rounded overflow-hidden bg-gray-100 relative">
                  <img src={h.imageUrl} alt={h.description} className="w-full h-full object-cover" />
                </div>
                <p className="font-display font-bold text-xs uppercase tracking-tight text-red-stage line-clamp-2">
                  {h.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


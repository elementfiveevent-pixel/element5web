"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useApp } from "@/context/AppContext";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Search, Calendar, MapPin, Users, ArrowRight, Flame, Tag,
  Clock, Trophy, Ticket, SlidersHorizontal, X
} from "lucide-react";

interface BackendEvent {
  id: string; title: string; slug: string; description?: string;
  category: string; status: string; startDate: string; flyerUrl?: string;
  isPaid: boolean; price: string; maxCapacity?: number; registrationsCount: number;
  location?: { venueName: string; city: string; state: string };
}

function EventCardSkeleton() {
  return (
    <div className="bg-white border-3 border-[#121212] rounded shadow-brutal animate-pulse overflow-hidden">
      <div className="h-48 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-10 bg-gray-200 rounded w-full mt-2" />
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  STAGEVERSE:  "bg-red-stage text-white",
  FESTIVAL:    "bg-yellow-festival text-[#121212]",
  WORKSHOP:    "bg-blue-500 text-white",
  MEETUP:      "bg-green-500 text-white",
  NETWORKING:  "bg-purple-500 text-white",
  AWARDS:      "bg-orange-burnt text-white",
  COMMUNITY:   "bg-teal-500 text-white",
  PRIVATE:     "bg-gray-700 text-white",
  EXHIBITION:  "bg-pink-500 text-white",
};

const CATEGORIES = ["All", "STAGEVERSE", "FESTIVAL", "WORKSHOP", "MEETUP", "NETWORKING", "AWARDS", "COMMUNITY", "EXHIBITION"];
const CITIES     = ["All", "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"];

function EventsContent() {
  const { events: localEvents } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab = searchParams.get("tab") === "past" ? "past" : "upcoming";
  const [tab, setTab] = useState<"upcoming" | "past">(initialTab);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const mapLocal = useCallback(
    (tab: "upcoming" | "past"): BackendEvent[] =>
      localEvents
        .filter((e) => (tab === "past" ? e.isCompleted : !e.isCompleted))
        .filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()))
        .filter((e) => category === "All" || e.type.toUpperCase().includes(category))
        .filter((e) => city === "All" || e.venue.toLowerCase().includes(city.toLowerCase()))
        .map((e) => ({
          id: e.id, title: e.title, slug: e.id, description: e.description,
          category: e.type.toUpperCase(),
          status: e.isCompleted ? "COMPLETED" : "PUBLISHED",
          startDate: e.date, flyerUrl: e.image, isPaid: false, price: "0",
          maxCapacity: e.registrationLimit, registrationsCount: e.audienceCount,
          location: { venueName: e.venue.split(",")[0], city: e.venue.split(",")[1]?.trim() ?? "Gujarat", state: "Gujarat" },
        })),
    [localEvents, search, category, city]
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params: Record<string, any> = { limit: 30, period: tab };
        if (search)            params.search   = search;
        if (category !== "All") params.category = category;
        if (city !== "All")     params.city     = city;
        // Backend doesn't have a tab param yet — filter by status client-side
        const data = await api.get("/events", { params });
        const list: BackendEvent[] = Array.isArray(data) ? data : (data?.data ?? []);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const filtered = list.filter((e) =>
          tab === "past"
            ? ["COMPLETED", "ARCHIVED", "CANCELLED"].includes(e.status) || new Date(e.startDate) < today
            : e.status === "PUBLISHED" && new Date(e.startDate) >= today
        );
        setEvents(filtered.length > 0 ? filtered : mapLocal(tab));
      } catch {
        setEvents(mapLocal(tab));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, city, tab, mapLocal]);

  const switchTab = (t: "upcoming" | "past") => {
    setTab(t);
    router.push(t === "past" ? "/events?tab=past" : "/events", { scroll: false });
  };

  const categoryColor = (cat: string) => CATEGORY_COLORS[cat] ?? "bg-gray-200 text-[#121212]";

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">

        {/* Page header */}
        <div className="space-y-3">
          <span className="brutal-tape text-xs uppercase select-none">ELEMENT 5 EVENTS</span>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-7xl uppercase tracking-tighter leading-none mt-2">
            {tab === "past" ? "PAST" : "ALL"} <span className="text-red-stage inline-block">EVENTS</span>
          </h1>
          <p className="font-space text-sm font-bold text-[#121212]/60 max-w-xl">
            {tab === "past"
              ? "Revisit completed open mics, festivals, and creator showcases across Gujarat."
              : "Browse upcoming StageVerse open mics, festivals, workshops, and community events across Gujarat."}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2">
          <button onClick={() => switchTab("upcoming")}
            className={`flex items-center gap-2 px-5 py-2.5 border-3 border-[#121212] font-display font-black text-xs uppercase rounded shadow-brutal transition-all ${
              tab === "upcoming" ? "bg-[#121212] text-white translate-x-[2px] translate-y-[2px] shadow-none" : "bg-white text-[#121212] hover:bg-yellow-festival/20"
            }`}>
            <Ticket size={13} /> UPCOMING
          </button>
          <button onClick={() => switchTab("past")}
            className={`flex items-center gap-2 px-5 py-2.5 border-3 border-[#121212] font-display font-black text-xs uppercase rounded shadow-brutal transition-all ${
              tab === "past" ? "bg-[#121212] text-white translate-x-[2px] translate-y-[2px] shadow-none" : "bg-white text-[#121212] hover:bg-yellow-festival/20"
            }`}>
            <Trophy size={13} /> PAST EVENTS
          </button>
        </div>

        {/* Filters */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <span className="font-display font-black text-xs uppercase">Find events</span>
            <button onClick={() => setFiltersOpen((open) => !open)} className="border-2 border-[#121212] bg-white p-2 rounded" aria-expanded={filtersOpen} aria-label="Toggle event filters">
              {filtersOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
            </button>
          </div>
          <div className={`${filtersOpen ? "flex" : "hidden"} sm:flex flex-col gap-3 mt-3 sm:mt-0`}>
          <div className="relative w-full">
            <Search size={16} className="absolute inset-y-0 left-3 my-auto text-[#121212]/40" />
            <input type="text" placeholder="Search events…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold placeholder-[#121212]/30 focus:outline-none" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="flex-1 px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-bold focus:outline-none">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
            </select>
            <select value={city} onChange={(e) => setCity(e.target.value)}
              className="flex-1 px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-bold focus:outline-none">
              {CITIES.map((c) => <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>)}
            </select>
            {!loading && (
              <span className="font-space font-black text-xs text-[#121212]/40 uppercase self-center sm:self-auto whitespace-nowrap text-center sm:text-left">
                {events.length} event{events.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="border-3 border-dashed border-[#121212] bg-white rounded p-16 text-center space-y-4">
            <Calendar size={40} className="mx-auto text-[#121212]/20" />
            <p className="font-display font-bold text-2xl text-[#121212]/40 uppercase">
              No {tab === "past" ? "past" : "upcoming"} events match your filters.
            </p>
            <button onClick={() => { setSearch(""); setCategory("All"); setCity("All"); }}
              className="inline-flex items-center gap-2 border-2 border-[#121212] font-black text-xs uppercase px-5 py-2.5 rounded hover:bg-[#121212]/5 transition-colors">
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event) => {
              const isCompleted = ["COMPLETED", "ARCHIVED", "CANCELLED"].includes(event.status);
              const capacityPct = event.maxCapacity && event.maxCapacity > 0
                ? Math.min(100, Math.round((event.registrationsCount / event.maxCapacity) * 100)) : 0;
              const isAlmostFull = capacityPct >= 80 && !isCompleted;
              const eventLink = `/events/${event.slug ?? event.id}`;
              const formattedDate = event.startDate
                ? (() => { try { return new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return event.startDate; } })()
                : "TBD";

              return (
                <div key={event.id}
                  className={`bg-white border-3 border-[#121212] rounded shadow-brutal hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-brutal-yellow transition-all flex flex-col sm:flex-row overflow-hidden ${isCompleted ? "opacity-75" : ""}`}>
                  
                  {/* Flyer (Left Side) */}
                  <div className="w-full sm:w-2/5 aspect-[4/5] bg-[#121212] border-b-3 sm:border-b-0 sm:border-r-3 border-[#121212] overflow-hidden flex-shrink-0 relative">
                    {event.flyerUrl ? (
                      <img src={event.flyerUrl} alt={event.title} className="w-full h-full object-contain" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#121212] to-[#2a2a2a] flex items-center justify-center">
                        <span className="font-display font-black text-7xl text-white/[0.06]">E5</span>
                      </div>
                    )}
                  </div>

                  {/* Content (Right Side) */}
                  <div className="p-5 sm:p-6 flex flex-col justify-between gap-4 flex-1 min-w-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#121212] ${categoryColor(event.category)}`}>
                          {event.category}
                        </span>
                        {isCompleted ? (
                          <span className="bg-gray-700 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded border border-white/10">
                            {event.status}
                          </span>
                        ) : isAlmostFull ? (
                          <span className="bg-red-stage text-white font-black text-[9px] uppercase px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                            <Flame size={9} /> ALMOST FULL
                          </span>
                        ) : null}
                      </div>

                      <h3 className="font-display font-extrabold text-xl sm:text-2xl uppercase leading-tight tracking-tight line-clamp-2">{event.title}</h3>
                      
                      {event.description && (
                        <p className="font-space text-xs text-[#121212]/60 font-bold line-clamp-2">{event.description}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs font-bold text-[#121212]/70 font-space">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-red-stage flex-shrink-0" />
                        <span>{formattedDate}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-red-stage flex-shrink-0" />
                          <span className="truncate">{event.location.venueName}, {event.location.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users size={13} className="text-red-stage flex-shrink-0" />
                        <span>{event.registrationsCount} registered</span>
                        {event.maxCapacity && <span className="text-[#121212]/30">/ {event.maxCapacity}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag size={13} className="text-red-stage flex-shrink-0" />
                        <span className="font-black text-red-stage">{event.isPaid ? `₹${event.price}` : "FREE ENTRY"}</span>
                      </div>
                    </div>

                    {event.maxCapacity && event.maxCapacity > 0 && (
                      <div className="space-y-1">
                        <div className="w-full h-1.5 bg-[#121212]/10 rounded-full overflow-hidden border border-[#121212]/10">
                          <div className={`h-full rounded-full transition-all ${isAlmostFull ? "bg-red-stage" : "bg-yellow-festival"}`}
                            style={{ width: `${capacityPct}%` }} />
                        </div>
                        <p className="text-[9px] font-black text-[#121212]/40 uppercase tracking-wider">
                          {capacityPct}% capacity filled
                        </p>
                      </div>
                    )}

                    <div className="pt-2 mt-auto">
                      <Link href={eventLink}
                        className={`w-full flex items-center justify-center gap-2 py-3 border-3 border-[#121212] font-black uppercase text-xs tracking-wider rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${
                          isCompleted ? "bg-[#121212]/5 text-[#121212]/50" : "bg-yellow-festival text-[#121212]"
                        }`}>
                        {isCompleted ? "VIEW RECAP" : "VIEW & REGISTER"} <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF5E4] py-12 text-center font-display font-black uppercase text-[#121212]/40 animate-pulse">Loading Events…</div>}>
      <EventsContent />
    </Suspense>
  );
}

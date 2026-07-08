"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, Calendar, MapPin, Clock, Users, ArrowRight, Flame, Tag } from "lucide-react";

interface BackendEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  status: string;
  startDate: string;
  flyerUrl?: string;
  isPaid: boolean;
  price: string;
  maxCapacity?: number;
  registrationsCount: number;
  location?: {
    venueName: string;
    city: string;
    state: string;
  };
}

// Skeleton card for loading state
function EventCardSkeleton() {
  return (
    <div className="bg-white border-3 border-[#121212] rounded shadow-brutal animate-pulse overflow-hidden">
      <div className="h-48 bg-gray-200" />
      <div className="p-6 space-y-4">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  STAGEVERSE: "bg-red-stage text-white",
  FESTIVAL: "bg-yellow-festival text-[#121212]",
  WORKSHOP: "bg-blue-500 text-white",
  MEETUP: "bg-green-500 text-white",
  NETWORKING: "bg-purple-500 text-white",
  AWARDS: "bg-orange-burnt text-white",
  COMMUNITY: "bg-teal-500 text-white",
};

export default function EventsPage() {
  const { events: localEvents } = useApp();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cities = ["All", "Ahmedabad", "Surat", "Vadodara", "Rajkot"];
  const categories = ["All", "STAGEVERSE", "FESTIVAL", "WORKSHOP", "MEETUP", "NETWORKING", "AWARDS", "COMMUNITY"];

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = {};
        if (search) params.search = search;
        if (category !== "All") params.category = category;
        if (city !== "All") params.city = city;
        params.limit = 20;

        const data = await api.get("/events", { params });
        if (data && Array.isArray(data) && data.length > 0) {
          setEvents(data);
        } else {
          // Graceful fallback to local context events
          setEvents(mapLocalEvents(localEvents));
        }
      } catch {
        setEvents(mapLocalEvents(localEvents));
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(debounceTimer);
  }, [search, category, city, localEvents]);

  function mapLocalEvents(evts: typeof localEvents): BackendEvent[] {
    return evts
      .filter((e) => {
        const matchSearch =
          !search || e.title.toLowerCase().includes(search.toLowerCase());
        const matchCat =
          category === "All" || e.type.toUpperCase().includes(category);
        const matchCity =
          city === "All" || e.venue.toLowerCase().includes(city.toLowerCase());
        return matchSearch && matchCat && matchCity;
      })
      .map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.id,
        description: e.description,
        category: e.type.toUpperCase(),
        status: e.isCompleted ? "COMPLETED" : "PUBLISHED",
        startDate: e.date,
        flyerUrl: e.image,
        isPaid: false,
        price: "0",
        maxCapacity: e.registrationLimit,
        registrationsCount: e.audienceCount,
        location: {
          venueName: e.venue.split(",")[0],
          city: e.venue.split(",")[1]?.trim() || "Gujarat",
          state: "Gujarat",
        },
      }));
  }

  const categoryColor = (cat: string) =>
    CATEGORY_COLORS[cat] || "bg-gray-200 text-[#121212]";

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <span className="brutal-tape text-xs uppercase select-none">LIVE & UPCOMING</span>
          <h1 className="font-display font-extrabold text-5xl md:text-7xl uppercase tracking-tighter">
            ALL <span className="text-red-stage">EVENTS</span>
          </h1>
          <p className="font-space text-base font-bold text-gray-700 max-w-xl">
            Browse all upcoming StageVerse open mics, festivals, workshops, and community events across Gujarat.
          </p>
        </div>

        {/* Filters */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal flex flex-col md:flex-row items-stretch md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold placeholder-gray-400 focus:outline-none"
            />
          </div>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-bold focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>

          {/* City */}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-bold focus:outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>
            ))}
          </select>

          {/* Results count */}
          {!loading && (
            <span className="font-space font-black text-xs text-gray-500 uppercase whitespace-nowrap">
              {events.length} Event{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="border-3 border-red-stage bg-red-50 p-8 rounded text-center space-y-2">
            <p className="font-display font-black text-xl text-red-stage uppercase">{error}</p>
            <p className="font-space text-sm text-gray-600">Showing locally cached events instead.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="border-3 border-dashed border-[#121212] p-16 text-center bg-[#FAF8F5] rounded">
            <p className="font-display font-bold text-2xl text-gray-500 uppercase">
              No events match your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => {
              const isCompleted = event.status === "COMPLETED";
              const capacityPct =
                event.maxCapacity && event.maxCapacity > 0
                  ? Math.min(100, Math.round((event.registrationsCount / event.maxCapacity) * 100))
                  : 0;
              const isAlmostFull = capacityPct >= 80;
              const eventLink = `/events/${event.slug || event.id}`;

              return (
                <div
                  key={event.id}
                  className={`bg-white border-3 border-[#121212] rounded shadow-brutal hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-brutal-yellow transition-all flex flex-col overflow-hidden ${
                    isCompleted ? "opacity-60" : ""
                  }`}
                >
                  {/* Flyer Image */}
                  <div className="relative h-48 bg-gray-200 border-b-3 border-[#121212] overflow-hidden">
                    {event.flyerUrl ? (
                      <img
                        src={event.flyerUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#121212] to-[#2a2a2a] flex items-center justify-center">
                        <span className="font-display font-black text-6xl text-white/10">E5</span>
                      </div>
                    )}

                    {/* Category badge */}
                    <span
                      className={`absolute top-3 left-3 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border border-[#121212] ${categoryColor(event.category)}`}
                    >
                      {event.category}
                    </span>

                    {/* Status badge */}
                    {isCompleted && (
                      <span className="absolute top-3 right-3 bg-gray-700 text-white font-black text-[10px] uppercase px-2 py-1 rounded border border-white/20">
                        COMPLETED
                      </span>
                    )}
                    {isAlmostFull && !isCompleted && (
                      <span className="absolute top-3 right-3 bg-red-stage text-white font-black text-[10px] uppercase px-2 py-1 rounded border border-white/20 flex items-center gap-1">
                        <Flame size={10} /> ALMOST FULL
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col gap-4 flex-grow">
                    <div className="space-y-2">
                      <h3 className="font-display font-extrabold text-xl leading-tight line-clamp-2">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="font-space text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs font-bold text-gray-600 font-space">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-red-stage flex-shrink-0" />
                        <span>{event.startDate || "TBD"}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-red-stage flex-shrink-0" />
                          <span className="truncate">{event.location.venueName}, {event.location.city}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-red-stage flex-shrink-0" />
                        <span>{event.registrationsCount} registered</span>
                        {event.maxCapacity && (
                          <span className="text-gray-400">/ {event.maxCapacity} spots</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className="text-red-stage flex-shrink-0" />
                        <span>{event.isPaid ? `₹${event.price}` : "FREE ENTRY"}</span>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    {event.maxCapacity && event.maxCapacity > 0 && (
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-gray-100 border border-[#121212] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all rounded-full ${isAlmostFull ? "bg-red-stage" : "bg-yellow-festival"}`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          {capacityPct}% capacity filled
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="mt-auto pt-2">
                      <Link
                        href={eventLink}
                        className={`w-full flex items-center justify-center gap-2 py-3 border-3 border-[#121212] font-black uppercase text-xs tracking-wider rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${
                          isCompleted
                            ? "bg-gray-100 text-gray-500 cursor-default"
                            : "bg-yellow-festival text-[#121212]"
                        }`}
                      >
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

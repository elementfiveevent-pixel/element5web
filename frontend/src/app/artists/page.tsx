"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useApp, Artist } from "@/context/AppContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, MapPin, Grid, Map, ChevronRight, Navigation, AlertCircle } from "lucide-react";

// Skeleton card
function ArtistCardSkeleton() {
  return (
    <div className="bg-white border-3 border-[#121212] rounded shadow-brutal animate-pulse overflow-hidden">
      <div className="h-28 bg-gray-200" />
      <div className="p-6 pt-0 -mt-8 space-y-3">
        <div className="flex gap-4 items-end">
          <div className="w-16 h-16 rounded-full bg-gray-300 border-3 border-white" />
          <div className="pb-1 space-y-1 flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex gap-1 pt-1">
          {[1, 2, 3].map((i) => <div key={i} className="h-5 w-16 bg-gray-200 rounded" />)}
        </div>
      </div>
    </div>
  );
}

interface BackendArtist {
  id: string;
  userId: string;
  stageName: string;
  biography?: string;
  genres: string[];
  skills: string[];
  isVerified: boolean;
  availabilityStatus: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  user?: { fullName: string; profilePhotoUrl?: string };
}

function mapBackendArtist(a: BackendArtist): Artist {
  return {
    id: a.userId || a.id,
    name: a.stageName || a.user?.fullName || "Unknown Artist",
    genre: (a.genres || []).join(" & ") || "Creator",
    location: [a.city, a.state].filter(Boolean).join(", ") || "Gujarat",
    rating: 4.5,
    followers: 0,
    bio: a.biography || "",
    votes: 0,
    stageVerseScore: 70,
    performancesCount: 0,
    badges: a.isVerified ? ["Verified"] : [],
    recentActivity: "",
    trend: "stable",
    avatar: a.user?.profilePhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(a.stageName || "User")}&backgroundColor=121212&textColor=FAF8F5`,
    cover: "https://images.unsplash.com/photo-1540039155733-5bb30b4f21f0?w=1200&h=400&fit=crop",
    videos: [],
    skills: a.skills || [],
    experience: "",
    awards: [],
    availability: a.availabilityStatus === "AVAILABLE" ? "Available" : a.availabilityStatus === "BOOKED" ? "Booked" : "Collab Only",
    collaborationsOpen: a.availabilityStatus !== "UNAVAILABLE",
    socials: {},
  };
}

export default function DiscoverArtists() {
  const { artists: localArtists } = useApp();
  const [displayArtists, setDisplayArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const locations = ["All", "Ahmedabad", "Surat", "Vadodara", "Rajkot"];
  const genres = ["All", "Poetry", "Rap", "Singing", "Comedy", "Beatbox"];

  // Fetch artists from backend
  useEffect(() => {
    async function fetchArtists() {
      setLoading(true);
      try {
        const params: Record<string, any> = { limit: 30, isVerified: "true" };
        if (searchQuery) params.search = searchQuery;
        if (selectedGenre !== "All") params.genre = selectedGenre;
        if (selectedLocation !== "All") params.city = selectedLocation;

        const data = await api.get("/artists", { params });
        if (data && Array.isArray(data) && data.length > 0) {
          setDisplayArtists(data.map(mapBackendArtist));
        } else {
          setDisplayArtists(filterLocalArtists(localArtists, searchQuery, selectedGenre, selectedLocation));
        }
      } catch {
        setDisplayArtists(filterLocalArtists(localArtists, searchQuery, selectedGenre, selectedLocation));
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchArtists, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedGenre, selectedLocation, localArtists]);

  function filterLocalArtists(artists: Artist[], q: string, genre: string, loc: string) {
    return artists.filter((a) => {
      const matchSearch = !q || a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.skills.some((s) => s.toLowerCase().includes(q.toLowerCase()));
      const matchGenre = genre === "All" || a.genre.toLowerCase().includes(genre.toLowerCase());
      const matchLoc = loc === "All" || a.location.toLowerCase().includes(loc.toLowerCase());
      return matchSearch && matchGenre && matchLoc;
    });
  }

  // Use browser geolocation for nearby search
  const handleNearbySearch = useCallback(() => {
    if (!navigator.geolocation) {
      setNearbyError("Geolocation not supported by this browser.");
      return;
    }
    setNearbyLoading(true);
    setNearbyError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const data = await api.get("/artists/nearby", {
            params: { latitude, longitude, radius: 100 },
          });
          if (data && Array.isArray(data) && data.length > 0) {
            setDisplayArtists(data.map(mapBackendArtist));
          } else {
            setNearbyError("No artists found within 100km of your location.");
            setDisplayArtists(filterLocalArtists(localArtists, "", "All", "All"));
          }
        } catch {
          setNearbyError("Could not fetch nearby artists. Showing all artists instead.");
          setDisplayArtists(filterLocalArtists(localArtists, "", "All", "All"));
        } finally {
          setNearbyLoading(false);
        }
      },
      () => {
        setNearbyError("Location access denied. Enable it in your browser settings.");
        setNearbyLoading(false);
      }
    );
  }, [localArtists]);

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <div className="space-y-4">
          <span className="brutal-tape uppercase text-xs">VERIFIED DIRECTORY</span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl uppercase tracking-tighter">
            DISCOVER <span className="text-red-stage inline-block">CREATORS</span>
          </h1>
          <p className="font-space text-base font-bold text-gray-700 max-w-xl">
            "LinkedIn + Spotify + Instagram" for Gujarat's independent performers. Find rappers, beatboxers, comedians, and storytellers.
          </p>
        </div>

        {/* Filters */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold placeholder-gray-400 focus:outline-none"
              />
            </div>

            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-bold focus:outline-none"
            >
              {genres.map((g) => <option key={g}>{g === "All" ? "All Genres" : g}</option>)}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-bold focus:outline-none"
            >
              {locations.map((l) => <option key={l}>{l === "All" ? "All Locations" : l}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {/* Nearby Button */}
            <button
              onClick={handleNearbySearch}
              disabled={nearbyLoading}
              title="Find creators near your location"
              className="flex items-center gap-2 px-4 py-3 border-3 border-[#121212] bg-white rounded font-display font-black text-xs uppercase hover:bg-yellow-festival hover:shadow-brutal transition-all disabled:opacity-50"
            >
              <Navigation size={16} className={nearbyLoading ? "animate-spin" : ""} />
              {nearbyLoading ? "LOCATING..." : "NEARBY"}
            </button>

            {/* View toggle */}
            <div className="flex items-center border-3 border-[#121212] rounded overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 ${viewMode === "grid" ? "bg-[#121212] text-white" : "bg-white text-[#121212]"}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-3 ${viewMode === "map" ? "bg-[#121212] text-white" : "bg-white text-[#121212]"}`}
              >
                <Map size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Nearby error banner */}
        {nearbyError && (
          <div className="flex items-center gap-2 border-2 border-red-stage bg-red-50 p-3 rounded text-xs font-bold text-red-stage">
            <AlertCircle size={14} /> {nearbyError}
          </div>
        )}

        {/* ── GRID VIEW ── */}
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <ArtistCardSkeleton key={i} />)
            ) : displayArtists.length === 0 ? (
              <div className="col-span-full border-3 border-dashed border-[#121212] p-16 text-center bg-[#FAF8F5] rounded">
                <p className="font-display font-bold text-2xl text-gray-500 uppercase">
                  No creators match your search options.
                </p>
              </div>
            ) : (
              displayArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-white border-3 border-[#121212] p-6 rounded shadow-brutal hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-brutal-yellow transition-all flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Cover */}
                    <div className="relative h-28 border-2 border-[#121212] bg-gray-200 rounded overflow-hidden">
                      <img src={artist.cover} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 bg-yellow-festival border border-[#121212] text-[10px] font-black px-1.5 py-0.5 rounded rotate-[3deg]">
                        ★ {artist.rating.toFixed(1)}
                      </div>
                      {artist.badges.includes("Verified") && (
                        <div className="absolute top-2 left-2 bg-green-500 border border-[#121212] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                          ✓ VERIFIED
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 items-start -mt-12 relative px-2">
                      <img
                        src={artist.avatar}
                        alt={artist.name}
                        className="w-16 h-16 rounded-full object-cover border-3 border-[#121212] bg-white z-10"
                      />
                      <div className="pt-10">
                        <h3 className="font-display font-extrabold text-xl leading-tight">
                          <Link href={`/artists/${artist.id}`} className="hover:underline">{artist.name}</Link>
                        </h3>
                        <p className="text-xs font-space font-medium text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {artist.location}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 px-2">
                      <span className="inline-block bg-red-stage text-white font-bold text-xs px-2.5 py-1 rounded select-none border border-[#121212]">
                        {artist.genre}
                      </span>
                      <p className="text-sm font-space text-gray-600 line-clamp-2">{artist.bio}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 px-2">
                      {artist.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="text-[10px] font-black bg-gray-100 border border-gray-300 px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[#121212]/10 mt-6 pt-4 flex items-center justify-between px-2">
                    <span className="text-xs font-black uppercase text-gray-500">
                      {artist.availability}
                    </span>
                    <Link
                      href={`/artists/${artist.id}`}
                      className="flex items-center gap-1 font-display font-black text-sm uppercase text-red-stage hover:underline"
                    >
                      PROFILE <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── MAP VIEW ── */}
        {viewMode === "map" && (
          <div className="border-3 border-[#121212] bg-[#121212] text-[#FAF8F5] p-8 rounded shadow-brutal min-h-[500px] flex flex-col lg:flex-row gap-12 items-center justify-between">
            <div className="lg:w-1/2 space-y-6">
              <span className="brutal-tape-red text-xs">VIRTUAL RADIUS</span>
              <h2 className="font-display font-extrabold text-4xl uppercase tracking-tighter text-yellow-festival">
                GUJARAT CREATIVE HUB
              </h2>
              <p className="font-space text-sm text-[#FAF8F5]/80">
                Click on a region to filter creators by city. Use "NEARBY" to find artists within 100km of your current location.
              </p>

              <div className="space-y-3">
                {[
                  { name: "Ahmedabad", key: "Ahmedabad" },
                  { name: "Surat", key: "Surat" },
                  { name: "Vadodara", key: "Vadodara" },
                  { name: "Rajkot", key: "Rajkot" },
                ].map(({ name, key }) => {
                  const count = loading
                    ? 0
                    : displayArtists.filter((a) => a.location.toLowerCase().includes(key.toLowerCase())).length;
                  return (
                    <div
                      key={key}
                      onClick={() => { setSelectedLocation(key); setViewMode("grid"); }}
                      className={`border-2 p-3 rounded cursor-pointer flex justify-between items-center transition-all ${
                        selectedLocation === key
                          ? "bg-yellow-festival text-[#121212] border-yellow-festival"
                          : "border-[#FAF8F5]/20 hover:border-white"
                      }`}
                    >
                      <span className="font-display font-bold">{name} District</span>
                      <span className="text-xs font-black bg-red-stage text-white px-2 py-0.5 rounded">
                        {count} Creators
                      </span>
                    </div>
                  );
                })}
                {selectedLocation !== "All" && (
                  <button
                    onClick={() => setSelectedLocation("All")}
                    className="w-full text-center text-xs font-black underline text-red-stage hover:text-red-400 mt-2 block"
                  >
                    RESET MAP FILTER
                  </button>
                )}
              </div>

              <button
                onClick={handleNearbySearch}
                disabled={nearbyLoading}
                className="flex items-center gap-2 border-2 border-yellow-festival text-yellow-festival font-black uppercase text-xs px-4 py-2 rounded hover:bg-yellow-festival hover:text-[#121212] transition-all disabled:opacity-50"
              >
                <Navigation size={14} className={nearbyLoading ? "animate-spin" : ""} />
                {nearbyLoading ? "LOCATING YOU..." : "FIND CREATORS NEAR ME"}
              </button>
            </div>

            {/* Gujarat SVG Map */}
            <div className="lg:w-1/2 flex justify-center">
              <svg viewBox="0 0 500 500" className="w-[380px] h-[380px] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
                <path
                  d="M100,100 L250,50 L400,120 L450,220 L380,320 L280,380 L180,320 L150,240 L100,100 Z"
                  fill="#0F0E0E" stroke="#FAF8F5" strokeWidth="3" strokeDasharray="4"
                />
                {[
                  { cx: 280, cy: 180, label: "AHMEDABAD", key: "Ahmedabad" },
                  { cx: 340, cy: 260, label: "VADODARA", key: "Vadodara" },
                  { cx: 310, cy: 340, label: "SURAT", key: "Surat" },
                  { cx: 180, cy: 230, label: "RAJKOT", key: "Rajkot" },
                ].map(({ cx, cy, label, key }) => (
                  <g key={key} className="cursor-pointer" onClick={() => { setSelectedLocation(key); setViewMode("grid"); }}>
                    <circle
                      cx={cx} cy={cy} r={selectedLocation === key ? 18 : 14}
                      fill={selectedLocation === key ? "#FFDE4D" : "#D80032"}
                      stroke="#FAF8F5" strokeWidth="2"
                    />
                    {selectedLocation === key && (
                      <circle cx={cx} cy={cy} r="28" fill="none" stroke="#FFDE4D" strokeWidth="1" opacity="0.4" className="animate-ping" />
                    )}
                    <text x={cx} y={cy + (selectedLocation === key ? 38 : 34)} textAnchor="middle" fill="#FAF8F5" fontSize="10" fontWeight="bold">
                      {label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

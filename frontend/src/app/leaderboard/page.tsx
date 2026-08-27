"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, Trophy, Sparkles, MapPin, ArrowUpRight, Calendar, Filter } from "lucide-react";

interface Standing {
  id: string;
  name: string;
  genre: string;
  location: string;
  votes: number;
  score: number;
  rating: number;
  avatar: string;
  eventTitle?: string;
  trackTitle?: string;
}

interface VotingEvent {
  id: string;
  title: string;
  category: string;
  startDate: string;
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<"ALL_TIME" | "MONTHLY" | "EVENT">("ALL_TIME");
  const [events, setEvents] = useState<VotingEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch list of voting events on mount
  useEffect(() => {
    async function fetchVotingEvents() {
      try {
        const data = await api.get("/leaderboard/events").catch(() => null);
        if (data && Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setSelectedEventId(data[0].id);
        } else {
          // Fallback to /events list if backend hot-reload is completing
          const fallbackData = await api.get("/events").catch(() => null);
          const list = Array.isArray(fallbackData?.events) ? fallbackData.events : Array.isArray(fallbackData) ? fallbackData : [];
          if (list.length > 0) {
            setEvents(list.map((e: any) => ({
              id: e.id,
              title: e.title || e.name || "Stage Event",
              category: e.category || "General",
              startDate: e.startDate || new Date().toISOString(),
            })));
            setSelectedEventId(list[0].id);
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    fetchVotingEvents();
  }, []);

  // Fetch Leaderboard standings based on timeframe & eventId
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const params: any = { timeframe, limit: 50 };
        if (timeframe === "EVENT" && selectedEventId) {
          params.eventId = selectedEventId;
        }

        const data = await api.get("/leaderboard", { params });

        if (data && Array.isArray(data)) {
          const normalised: Standing[] = data.map((item: any) => ({
            id: item.userId || item.artistProfileId || item.id || "",
            name: item.name || item.performer || "Verified Performer",
            genre: item.genre || "Creator",
            location: item.location || "Gujarat",
            votes: item.votes ?? item.votesCount ?? 0,
            score: item.score ?? item.totalScore ?? 0,
            rating: item.rating ?? item.audienceAverage ?? 0,
            avatar: item.avatar || item.photoUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name || "A")}&backgroundColor=121212&textColor=FAF8F5`,
            eventTitle: item.eventTitle,
            trackTitle: item.trackTitle,
          }));

          // STRICT FILTER: Show ONLY performers with > 0 votes
          setStandings(normalised.filter(s => s.votes > 0));
        } else {
          setStandings([]);
        }
      } catch {
        setStandings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [timeframe, selectedEventId]);

  // Search filter
  const filteredStandings = standings.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredStandings.slice(0, 3);
  const remaining = filteredStandings.slice(3);

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <span className="brutal-tape text-xs uppercase select-none">EVENT VOTING LEADERBOARD</span>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-7xl uppercase tracking-tighter leading-none">
            THE <span className="inline-block">STAGEVERSE</span> <span className="text-red-stage inline-block">CHARTS</span>
          </h1>
          <p className="font-space text-base font-bold text-gray-700 max-w-xl">
            Live voting standings calculated strictly from audience scores cast across stage events.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-4 sm:p-6 rounded shadow-brutal flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Timeframe & Event selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="grid grid-cols-3 border-3 border-[#121212] rounded overflow-hidden bg-white w-full sm:w-auto">
              {(["ALL_TIME", "MONTHLY", "EVENT"] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`py-2.5 px-2 sm:px-4 font-display font-black text-[10px] sm:text-xs uppercase transition-colors cursor-pointer ${
                    timeframe === tf ? "bg-[#121212] text-white" : "bg-white text-[#121212] hover:bg-gray-100"
                  }`}
                >
                  {tf === "ALL_TIME" ? "ALL TIME" : tf === "MONTHLY" ? "MONTHLY" : "EVENT WISE"}
                </button>
              ))}
            </div>

            {/* Event Dropdown selector when EVENT WISE is selected */}
            {timeframe === "EVENT" && (
              <div className="relative">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full sm:w-64 border-3 border-[#121212] bg-[#FFDE4D] text-[#121212] font-display font-black text-xs uppercase py-2.5 px-3 rounded shadow-brutal-sm cursor-pointer focus:outline-none"
                >
                  {events.length > 0 ? (
                    events.map((evt) => (
                      <option key={evt.id} value={evt.id} className="bg-white text-[#121212]">
                        {evt.title}
                      </option>
                    ))
                  ) : (
                    <option value="">No Active Events Found</option>
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search voted performers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Podium Display */}
        {filteredStandings.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 items-end pt-2 sm:pt-8">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="border-3 border-[#121212] bg-white p-4 sm:p-6 rounded shadow-brutal flex flex-col items-center text-center space-y-3 sm:space-y-4 md:order-1 order-2">
                <div className="relative">
                  <img
                    src={topThree[1].avatar}
                    alt={topThree[1].name}
                    className="w-24 h-24 rounded-full object-cover border-3 border-[#121212]"
                  />
                  <span className="absolute bottom-[-10px] right-0 left-0 mx-auto w-8 h-8 rounded-full border-2 border-[#121212] bg-[#FAF8F5] text-[#121212] font-display font-black flex items-center justify-center text-xs">
                    2
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-xl leading-tight truncate max-w-[200px]">
                    <Link href={`/artists/${topThree[1].id}`} className="hover:underline">{topThree[1].name}</Link>
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">{topThree[1].genre}</span>
                </div>
                <div className="w-full py-2 bg-[#FAF8F5] border-2 border-[#121212] rounded font-space font-black text-sm">
                  SCORE: {topThree[1].score} / 100
                  <span className="block text-[10px] font-normal text-gray-500">{topThree[1].votes} VOTES</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="border-3 border-[#121212] bg-white p-5 sm:p-8 rounded shadow-brutal flex flex-col items-center text-center space-y-3 sm:space-y-4 md:order-2 order-1 md:scale-105 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-yellow-festival border-b-2 border-l-2 border-[#121212] p-2">
                  <Trophy size={20} className="text-[#121212]" />
                </div>
                <div className="relative">
                  <img
                    src={topThree[0].avatar}
                    alt={topThree[0].name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#121212]"
                  />
                  <span className="absolute bottom-[-10px] right-0 left-0 mx-auto w-10 h-10 rounded-full border-3 border-[#121212] bg-yellow-festival text-[#121212] font-display font-black flex items-center justify-center text-sm shadow-sm">
                    1
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-2xl leading-tight truncate max-w-[240px] flex items-center justify-center gap-1">
                    <Link href={`/artists/${topThree[0].id}`} className="hover:underline">{topThree[0].name}</Link>
                    <Sparkles size={16} className="text-yellow-festival fill-yellow-festival" />
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">{topThree[0].genre}</span>
                </div>
                <div className="w-full py-2.5 bg-yellow-festival border-2 border-[#121212] rounded font-space font-black text-sm">
                  SCORE: {topThree[0].score} / 100
                  <span className="block text-[10px] font-normal text-[#121212]/70">{topThree[0].votes} VOTES</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="border-3 border-[#121212] bg-white p-4 sm:p-6 rounded shadow-brutal flex flex-col items-center text-center space-y-3 sm:space-y-4 md:order-3 order-3">
                <div className="relative">
                  <img
                    src={topThree[2].avatar}
                    alt={topThree[2].name}
                    className="w-20 h-20 rounded-full object-cover border-3 border-[#121212]"
                  />
                  <span className="absolute bottom-[-10px] right-0 left-0 mx-auto w-8 h-8 rounded-full border-2 border-[#121212] bg-[#E36414] text-white font-display font-black flex items-center justify-center text-xs">
                    3
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-lg leading-tight truncate max-w-[200px]">
                    <Link href={`/artists/${topThree[2].id}`} className="hover:underline">{topThree[2].name}</Link>
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">{topThree[2].genre}</span>
                </div>
                <div className="w-full py-2 bg-[#FAF8F5] border-2 border-[#121212] rounded font-space font-black text-sm">
                  SCORE: {topThree[2].score} / 100
                  <span className="block text-[10px] font-normal text-gray-500">{topThree[2].votes} VOTES</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Table List */}
        <div className="border-3 border-[#121212] bg-white rounded overflow-hidden shadow-brutal">
          <div className="bg-[#121212] text-white p-4 font-display font-black text-[10px] sm:text-xs tracking-wider grid grid-cols-12 gap-2 sm:gap-4 uppercase select-none">
            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-6">Performer</div>
            <div className="col-span-4 md:col-span-3 text-center">Overall Voting Score</div>
            <div className="col-span-2 hidden md:block text-center">Profile</div>
          </div>

          <div className="divide-y-2 divide-[#121212]">
            {loading ? (
              <div className="p-16 text-center font-display font-bold text-gray-500 uppercase animate-pulse">
                RETRIEVING VOTING STANDINGS...
              </div>
            ) : filteredStandings.length > 0 ? (
              remaining.map((item, index) => {
                const rank = index + 4;
                return (
                  <div key={item.id} className="p-3 sm:p-4 grid grid-cols-12 gap-2 sm:gap-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-2 md:col-span-1 font-display font-black text-center text-base sm:text-lg">{rank}</div>
                    <div className="col-span-6 md:col-span-6 flex items-center gap-2 sm:gap-3 min-w-0">
                      <img
                        src={item.avatar}
                        alt={item.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#121212] flex-shrink-0"
                      />
                      <div className="truncate min-w-0">
                        <Link href={`/artists/${item.id}`} className="font-display font-extrabold hover:underline block truncate text-xs sm:text-sm">
                          {item.name}
                        </Link>
                        <span className="text-[10px] text-gray-500 font-medium font-space flex items-center gap-0.5 truncate">
                          <MapPin size={9} className="flex-shrink-0" /> {item.location.split(",")[0]}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-3 text-center font-space font-black text-xs sm:text-sm">
                      <span className="text-red-stage">{item.score} / 100</span>
                      <span className="text-[10px] text-gray-500 block font-normal font-sans">{item.votes} Votes</span>
                    </div>
                    <div className="col-span-2 hidden md:flex justify-center">
                      <Link
                        href={`/artists/${item.id}`}
                        className="p-2 border-2 border-[#121212] bg-[#FAF8F5] text-[#121212] rounded hover:bg-yellow-festival hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-16 text-center font-display font-bold text-gray-500 uppercase space-y-2">
                <p className="text-base text-[#121212]">No voting standings found for this filter.</p>
                <p className="text-xs text-gray-400 font-normal font-space">Only performers who have received votes in live events appear on the leaderboard.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

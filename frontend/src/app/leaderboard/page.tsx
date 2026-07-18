"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, Trophy, Sparkles, MapPin, Award, ArrowUpRight } from "lucide-react";

interface Standing {
  id: string;
  name: string;
  genre: string;
  location: string;
  votes: number;
  rating: number;
  avatar: string;
}

export default function LeaderboardPage() {
  const { artists } = useApp();
    // Map UI label -> backend timeframe key
  const TIMEFRAME_MAP = {
    WEEKLY: "WEEKLY",
    MONTHLY: "MONTHLY",
    SEASON: "SEASON",
    ALL_TIME: "ALL_TIME",
  } as const;

  const [timeframe, setTimeframe] = useState<keyof typeof TIMEFRAME_MAP>("WEEKLY");
  const [searchQuery, setSearchQuery] = useState("");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  function buildFallback(tf: keyof typeof TIMEFRAME_MAP): Standing[] {
    const multiplier = tf === "WEEKLY" ? 0.15 : tf === "MONTHLY" ? 0.45 : tf === "SEASON" ? 0.75 : 1;
    return [...artists]
      .sort((a, b) => b.votes - a.votes)
      .map((a) => ({
        id: a.id,
        name: a.name,
        genre: a.genre,
        location: a.location,
        votes: Math.max(1, Math.floor(a.votes * multiplier)),
        rating: a.rating,
        avatar: a.avatar,
      }));
  }

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const backendTf = TIMEFRAME_MAP[timeframe];
        const data = await api.get("/leaderboard", { params: { timeframe: backendTf, limit: 20 } });
        if (data && Array.isArray(data) && data.length > 0) {
          // Backend may return LeaderboardStanding objects — normalise them
          const normalised: Standing[] = data.map((item: any) => ({
            id: item.artistProfileId || item.id || "",
            name: item.artistProfile?.stageName || item.name || "Unknown",
            genre: item.artistProfile?.genres?.[0] || item.genre || "Creator",
            location: item.artistProfile?.city || item.location || "Gujarat",
            votes: item.audienceVotesCount ?? item.votes ?? 0,
            rating: item.judgeAverageScore ? item.judgeAverageScore / 2 : item.rating ?? 4,
            avatar: item.artistProfile?.user?.profilePhotoUrl || item.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.name || "A")}&backgroundColor=121212&textColor=FAF8F5`,
          }));
          setStandings(normalised);
        } else {
          setStandings(buildFallback(timeframe));
        }
      } catch {
        setStandings(buildFallback(timeframe));
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [timeframe, artists]);

  // Search filter
  const filteredStandings = standings.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredStandings.slice(0, 3);
  const remaining = filteredStandings.slice(3);

  // Helper to get corresponding podium color
  const getPodiumColor = (index: number) => {
    if (index === 0) return "bg-[#FFDE4D]"; // Gold
    if (index === 1) return "bg-[#FAF8F5] text-[#121212]"; // Silver
    return "bg-[#E36414] text-white"; // Bronze
  };

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="space-y-4">
          <span className="brutal-tape text-xs uppercase select-none">CREATOR LEADERBOARD</span>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-7xl uppercase tracking-tighter">
            THE <span className="inline-block">STAGEVERSE</span> <span className="text-red-stage inline-block">CHARTS</span>
          </h1>
          <p className="font-space text-base font-bold text-gray-700 max-w-xl">
            Live rank updates based on audience votes, active performance reviews, and judge ratings in our arena.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          {/* Timeframe selector */}
          <div className="flex border-3 border-[#121212] rounded overflow-hidden max-w-sm bg-white w-full md:w-auto">
            {(["WEEKLY", "MONTHLY", "SEASON", "ALL_TIME"] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 py-2.5 px-1.5 sm:px-3 font-display font-black text-[8px] sm:text-[10px] uppercase transition-colors cursor-pointer ${
                  timeframe === tf ? "bg-[#121212] text-white" : "bg-white text-[#121212]"
                }`}
              >
                {tf === "ALL_TIME" ? "ALL TIME" : tf}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search creator charts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-3 border-[#121212] bg-white rounded font-space font-bold placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Podium Display */}
        {filteredStandings.length > 0 && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end pt-8">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal flex flex-col items-center text-center space-y-4 md:order-1 order-2">
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
                  {topThree[1].votes} VOTES
                </div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="border-3 border-[#121212] bg-white p-8 rounded shadow-brutal flex flex-col items-center text-center space-y-4 md:order-2 order-1 md:scale-105 relative overflow-hidden">
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
                  {topThree[0].votes} VOTES
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal flex flex-col items-center text-center space-y-4 md:order-3 order-3">
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
                  {topThree[2].votes} VOTES
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Table List */}
        <div className="border-3 border-[#121212] bg-white rounded overflow-hidden shadow-brutal">
          <div className="bg-[#121212] text-white p-4 font-display font-black text-[10px] sm:text-xs tracking-wider grid grid-cols-12 gap-2 sm:gap-4 uppercase select-none">
            <div className="col-span-2 md:col-span-1 text-center">Rank</div>
            <div className="col-span-7 md:col-span-7">Creator</div>
            <div className="col-span-3 md:col-span-2 text-center">Score / Votes</div>
            <div className="col-span-2 hidden md:block text-center">Profile</div>
          </div>

          <div className="divide-y-2 divide-[#121212]">
            {loading ? (
              <div className="p-16 text-center font-display font-bold text-gray-500 uppercase animate-pulse">
                RETRIEVING LEADERBOARD DATA...
              </div>
            ) : filteredStandings.length > 0 ? (
              remaining.map((item, index) => {
                const rank = index + 4;
                return (
                  <div key={item.id} className="p-3 sm:p-4 grid grid-cols-12 gap-2 sm:gap-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-2 md:col-span-1 font-display font-black text-center text-base sm:text-lg">{rank}</div>
                    <div className="col-span-7 md:col-span-7 flex items-center gap-2 sm:gap-3 min-w-0">
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
                    <div className="col-span-3 md:col-span-2 text-center font-space font-black text-xs sm:text-sm">
                      {item.votes} <span className="text-[9px] text-gray-400 block font-normal font-sans">Votes</span>
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
              <div className="p-16 text-center font-display font-bold text-gray-500 uppercase">
                No creators registered in this chart timeframe.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

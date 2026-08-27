"use client";

import React, { useState, useEffect, use } from "react";
import { useApp, Artist } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Play, Award, Send, Check, Heart, Mail, ExternalLink,
  Share2, Video, Music, Globe
} from "lucide-react";
import confetti from "canvas-confetti";

function InstagramIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

function YoutubeIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function getYoutubeEmbedUrl(url: string) {
  if (!url) return null;
  let videoId = "";
  try {
    if (url.includes("youtube.com/watch")) {
      const searchParams = new URLSearchParams(new URL(url).search);
      videoId = searchParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0] || "";
    }
  } catch {
    // Ignore invalid
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
function ArtistProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] py-12 px-6 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="h-4 w-20 bg-gray-200 rounded" />
        <div className="border-4 border-[#121212] bg-gray-200 rounded h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-64 bg-gray-200 rounded" />
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Backend artist profile type
// ─────────────────────────────────────────────
interface BackendArtistProfile {
  id: string;
  userId: string;
  stageName: string;
  instagramHandle?: string;
  pastAchievement?: string;
  youtubeLink?: string;
  spotifyLink?: string;
  biography?: string;
  portfolioUrls: string[];
  genres: string[];
  skills: string[];
  languages: string[];
  isVerified: boolean;
  availabilityStatus: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  user?: {
    fullName: string;
    profilePhotoUrl?: string;
    reputationXp: number;
  };
  achievements?: { achievement: { title: string; badgeIconUrl: string; xpReward: number } }[];
  performances?: { eventId: string; performanceDate: string; videoUrl?: string }[];
}

function mapBackend(data: BackendArtistProfile): Artist {
  const urls = (data.portfolioUrls || []).filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  
  let instagramUrl = "";
  if (data.instagramHandle && data.instagramHandle.trim().length > 0) {
    const handle = data.instagramHandle.trim();
    instagramUrl = handle.startsWith("http") ? handle : `https://instagram.com/${handle.replace(/^@/, "")}`;
  } else {
    const foundInsta = urls.find((u) => u.toLowerCase().includes("instagram.com"));
    if (foundInsta) {
      instagramUrl = foundInsta;
    } else if (urls.length > 0) {
      const handleCandidate = urls.find((u) => !u.toLowerCase().includes("youtube") && !u.toLowerCase().includes("youtu") && !u.toLowerCase().includes("spotify"));
      if (handleCandidate) {
        const cleanHandle = handleCandidate.replace(/^@/, "").trim();
        if (cleanHandle.length > 0) {
          instagramUrl = cleanHandle.startsWith("http") ? cleanHandle : `https://instagram.com/${cleanHandle}`;
        }
      }
    }
  }

  const youtubeUrl = urls.find((u) => u.toLowerCase().includes("youtube.com") || u.toLowerCase().includes("youtu.be")) || data.youtubeLink || "";
  const spotifyUrl = urls.find((u) => u.toLowerCase().includes("spotify.com")) || data.spotifyLink || "";
  const websiteUrl = urls.find((u) => !u.toLowerCase().includes("instagram") && !u.toLowerCase().includes("youtu") && !u.toLowerCase().includes("spotify") && u.startsWith("http")) || "";

  const cityStateLocation = [data.city, data.state].filter(Boolean).join(", ");
  const displayLocation = cityStateLocation.length > 0 ? cityStateLocation : "Gujarat, IN";

  const achList = (data.achievements || []).map((a: any) => a.achievement?.title || a.title).filter(Boolean);
  if (achList.length === 0 && data.pastAchievement) {
    achList.push(data.pastAchievement);
  }

  return {
      id: data.userId || data.id,
      name: data.stageName,
      genre: (data.genres && data.genres.length > 0) ? data.genres.join(" & ") : "Creator",
      location: displayLocation,
      rating: 4.5,
      followers: data.user?.reputationXp || 0,
      bio: data.biography || "Crafting unique creative expressions.",
      votes: 0,
      stageVerseScore: 70,
      performancesCount: data.performances?.length || 0,
      badges: [
        ...(data.isVerified ? ["Verified"] : []),
        ...achList,
      ],
      recentActivity: "",
      trend: "stable",
      avatar: (data.user?.profilePhotoUrl && data.user.profilePhotoUrl.startsWith("http"))
        ? data.user.profilePhotoUrl 
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.stageName || "Artist")}&backgroundColor=121212&textColor=FAF8F5`,
      cover: "",
      videos: data.performances?.filter((p) => p.videoUrl).map((p) => ({
        title: `Performance on ${new Date(p.performanceDate).toLocaleDateString()}`,
        url: p.videoUrl!,
        platform: "youtube" as const,
      })) || [],
      skills: data.skills,
      experience: data.languages.join(", "),
      awards: data.achievements?.map((a) => a.achievement.title) || [],
      availability: data.availabilityStatus === "AVAILABLE"
        ? "Available"
        : data.availabilityStatus === "BOOKED"
        ? "Booked"
        : "Collab Only",
      collaborationsOpen: data.availabilityStatus !== "UNAVAILABLE",
      socials: {
        instagram: instagramUrl,
        youtube: youtubeUrl,
        spotify: spotifyUrl,
        website: websiteUrl,
      },
    };
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ArtistProfile({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const { artists: localArtists, sendMessage, addUserXP } = useApp();
  const { user } = useAuth();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [collabSent, setCollabSent] = useState(false);
  const [likes, setLikes] = useState(0);
  const [rank, setRank] = useState<number | string>(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [coverError, setCoverError] = useState(false);

  // Real-time stats sync (Rank, Likes, Shows)
  useEffect(() => {
    async function syncRealtimeStats() {
      try {
        // 1. Fetch artist details
        const data: BackendArtistProfile = await api.get(`/artists/${id}`);
        setArtist(mapBackend(data));

        // 2. Fetch leaderboard rank
        const standings = await api.get("/leaderboard").catch(() => []);
        if (Array.isArray(standings)) {
          const found = standings.find((s: any) => s.id === id || s.userId === id || s.artistProfileId === id);
          setRank(found ? `#${found.rank}` : 0);
        }
      } catch {
        const local = localArtists.find((a) => a.id === id);
        if (local) {
          setArtist(local);
        } else {
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    }

    syncRealtimeStats();
    const interval = setInterval(syncRealtimeStats, 3000);
    return () => clearInterval(interval);
  }, [id, localArtists]);



  const handleLike = () => {
    if (hasLiked) {
      setLikes((p) => p - 1);
      setHasLiked(false);
    } else {
      setLikes((p) => p + 1);
      setHasLiked(true);
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#D80032", "#FFDE4D"] });
      addUserXP(10);
    }
  };

  const handleCollabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSendingMessage(true);

    try {
      if (user) {
        await api.post("/social/messages", { recipientId: id, content: messageText });
      }
    } catch {
      // Fallback to local context
    }

    sendMessage(id, messageText);
    setCollabSent(true);
    setMessageText("");
    setSendingMessage(false);
    confetti({ particleCount: 80, spread: 60, colors: ["#FFDE4D", "#D80032", "#FAF8F5"] });
    addUserXP(30);
  };

  if (loading) return <ArtistProfileSkeleton />;

  if (notFound || !artist) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] text-[#121212] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="font-display font-extrabold text-3xl uppercase text-red-stage">Creator Not Found</h2>
        <p className="font-space mt-2">The artist you are looking for does not exist in our system.</p>
        <Link href="/artists" className="mt-6 brutal-tape text-sm">BACK TO DIRECTORY</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">

        <Link href="/artists" className="inline-flex items-center gap-2 font-display font-bold text-sm hover:underline">
          <ArrowLeft size={16} /> BACK TO DIRECTORY
        </Link>

        {/* ── Profile Card ── */}
        <div className="border-4 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal">
          <div className="p-5 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Left column */}
            <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              <img
                src={artist.avatar}
                alt={artist.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded object-cover border-4 border-[#121212] bg-white shadow-brutal"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(artist.name || "Artist")}&backgroundColor=121212&textColor=FAF8F5`;
                }}
              />
              <div className="space-y-2">
                <h2 className="font-display font-black text-2xl tracking-tight leading-none">{artist.name}</h2>
                <p className="text-xs font-black uppercase text-red-stage tracking-wider">{artist.genre}</p>
                <p className="text-xs font-space font-medium text-gray-500 flex items-center justify-center md:justify-start gap-1">
                  <MapPin size={12} /> {artist.location}
                </p>
                {artist.availability && (
                  <span className="inline-block bg-green-500 text-white font-display font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-green-500 mt-1 select-none">
                    {artist.availability}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 border-t border-b border-[#121212]/10 py-3 w-full text-center">
                <div>
                  <span className="block font-display font-black text-lg truncate text-red-stage">{rank}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">RANK</span>
                </div>
                <div>
                  <span className="block font-display font-black text-lg truncate">{likes}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">LIKES</span>
                </div>
                <div>
                  <span className="block font-display font-black text-lg truncate">{artist.performancesCount || 0}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase block tracking-wider">SHOWS</span>
                </div>
              </div>

              {/* Like */}
              <button
                onClick={handleLike}
                className={`w-full border-2 border-[#121212] py-2.5 px-4 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 rounded shadow-brutal transition-all ${
                  hasLiked ? "bg-red-stage text-white" : "bg-white text-[#121212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                }`}
              >
                <Heart size={14} fill={hasLiked ? "white" : "none"} />
                {hasLiked ? "LIKED" : "LIKE"}
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  confetti({ particleCount: 30, spread: 25, colors: ["#FFDE4D", "#D80032"] });
                  alert("Profile link copied to clipboard!");
                }}
                className="w-full border-2 border-[#121212] bg-[#FFDE4D] text-[#121212] py-2.5 px-4 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
              >
                <Share2 size={14} />
                SHARE PROFILE
              </button>

            </div>

            {/* Right: Bio + Skills + Awards */}
            <div className="md:col-span-3 space-y-6">
              {/* Bio Block with Top-Right Social Media Buttons */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="brutal-tape text-[10px] bg-yellow-festival rotate-[-2deg] inline-block uppercase select-none">BIO</span>

                  {/* Social Media Links (Top-Right of Bio section) */}
                  {artist.socials && (artist.socials.instagram || artist.socials.youtube || artist.socials.spotify || artist.socials.website) && (
                    <div className="flex flex-wrap items-center gap-2">
                      {artist.socials.instagram && (
                        <a 
                          href={artist.socials.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2 border-2 border-[#121212] bg-white text-[#121212] rounded hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-brutal-sm"
                          title="Instagram Profile"
                        >
                          <InstagramIcon size={16} className="text-[#E1306C]" />
                        </a>
                      )}
                      {artist.socials.youtube && (
                        <a 
                          href={artist.socials.youtube} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2 border-2 border-[#121212] bg-white text-[#121212] rounded hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-brutal-sm"
                          title="YouTube Channel"
                        >
                          <YoutubeIcon size={16} className="text-[#FF0000]" />
                        </a>
                      )}
                      {artist.socials.spotify && (
                        <a 
                          href={artist.socials.spotify} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2 border-2 border-[#121212] bg-white text-[#121212] rounded hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-brutal-sm"
                          title="Spotify Track"
                        >
                          <Music size={16} className="text-[#1DB954]" />
                        </a>
                      )}
                      {artist.socials.website && (
                        <a 
                          href={artist.socials.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2 border-2 border-[#121212] bg-white text-[#121212] rounded hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-brutal-sm"
                          title="Official Website"
                        >
                          <Globe size={16} className="text-[#121212]" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <p className="font-space text-base font-bold leading-relaxed text-gray-700">
                  {artist.bio || "No biography available yet."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#121212]/10">
                <div className="space-y-3">
                  <h4 className="font-display font-black text-sm uppercase text-gray-500">Skills & Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {artist.skills.length > 0 ? artist.skills.map((skill) => (
                      <span key={skill} className="bg-yellow-festival/20 text-[#121212] border-2 border-[#121212] px-3 py-1 font-bold text-xs rounded shadow-brutal-light">
                        {skill}
                      </span>
                    )) : <span className="text-xs text-gray-400 font-space">Skills not listed.</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-display font-black text-sm uppercase text-gray-500">Achievements & Awards</h4>
                  {artist.awards.length > 0 ? (
                    <ul className="space-y-1.5">
                      {artist.awards.map((award) => (
                        <li key={award} className="text-xs font-bold font-space flex items-center gap-1.5">
                          <Award size={14} className="text-red-stage flex-shrink-0" /> {award}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-gray-400 font-space">No awards yet. Vote for this creator!</span>
                  )}
                </div>
              </div>

              {/* Languages */}
              {artist.experience && (
                <p className="font-space text-xs text-gray-500 font-bold border-t border-[#121212]/10 pt-4">
                  Languages: <span className="text-[#121212]">{artist.experience}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Video Reel + Collab / Badge Cabinet ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Video reel */}
          <div className="lg:col-span-2 border-3 border-[#121212] bg-[#121212] p-4 rounded shadow-brutal flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="flex items-center gap-2 font-display font-bold text-sm text-yellow-festival">
                <Play size={16} fill="#FFDE4D" /> PERFORMANCE VIDEO REEL
              </span>
              <span className="text-xs bg-red-stage text-white px-2 py-0.5 rounded uppercase font-black tracking-wider">
                STAGEVERSE LIVE
              </span>
            </div>

            <div className="w-full flex-grow bg-[#0F0E0E] rounded border-2 border-white/20 mt-4 flex items-center justify-center relative overflow-hidden">
              {artist.videos.length > 0 ? (
                <iframe
                  src={getYoutubeEmbedUrl(artist.videos[0].url) || artist.videos[0].url}
                  title={artist.videos[0].title}
                  className="w-full h-full min-h-[280px]"
                  allowFullScreen
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <Play size={40} className="text-white/20 mx-auto" />
                  <p className="font-space text-xs text-white/40 font-bold uppercase">
                    No performance videos uploaded yet.
                  </p>
                </div>
              )}
            </div>

            {/* Portfolio links */}
            {artist.cover && artist.cover.includes("unsplash") === false && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <a
                  href={artist.cover}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-yellow-festival hover:underline"
                >
                  <ExternalLink size={12} /> VIEW PORTFOLIO
                </a>
              </div>
            )}
          </div>

          {/* Right panel: Badges + Collab */}
          <div className="space-y-8">
            {/* Badge Cabinet */}
            <div className="border-3 border-[#121212] bg-white p-6 rounded shadow-brutal space-y-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight flex items-center gap-2">
                <Award size={20} className="text-yellow-festival" /> BADGE CABINET
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {artist.badges.length > 0 ? artist.badges.map((badge) => (
                  <span key={badge} className="border-2 border-[#121212] bg-yellow-festival text-[#121212] font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded shadow-brutal select-none">
                    🏆 {badge}
                  </span>
                )) : (
                  <span className="text-xs text-gray-400 font-space">No badges yet.</span>
                )}
              </div>
              <div className="border-t border-[#121212]/10 pt-4 flex justify-between items-center text-xs font-bold">
                <span>Reputation XP</span>
                <span className="text-red-stage">{artist.stageVerseScore * 10} XP</span>
              </div>
            </div>

            {/* Collaboration box */}
            <div className="border-3 border-[#121212] bg-[#121212] text-[#FAF8F5] p-6 rounded shadow-brutal space-y-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight flex items-center gap-2 text-yellow-festival">
                <Mail size={20} /> COLLABORATION REQUESTS
              </h3>
              <p className="text-xs font-space text-[#FAF8F5]/70 font-medium">
                {artist.collaborationsOpen
                  ? `${artist.name.split(" ")[0]} is open to collaborations. Send a pitch!`
                  : `${artist.name.split(" ")[0]} is currently unavailable for new collabs.`}
              </p>

              {collabSent ? (
                <div className="bg-green-500 text-white border-2 border-[#121212] p-4 rounded text-center font-bold text-xs space-y-1">
                  <Check size={16} className="mx-auto" />
                  <p>INVITE SENT SUCCESSFULLY</p>
                  <p className="text-[9px] opacity-75">Check your Network messages tab for replies.</p>
                </div>
              ) : !user ? (
                <Link
                  href="/login"
                  className="w-full bg-yellow-festival text-[#121212] border-2 border-[#121212] font-black uppercase text-xs tracking-widest py-3 flex items-center justify-center gap-2 rounded hover:opacity-90"
                >
                  LOGIN TO MESSAGE
                </Link>
              ) : (
                <form onSubmit={handleCollabSubmit} className="space-y-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Hey ${artist.name.split(" ")[0]}, let's work on...`}
                    rows={3}
                    disabled={!artist.collaborationsOpen}
                    className="w-full p-3 border-2 border-white/20 bg-[#0F0E0E] text-white rounded text-xs font-space placeholder-gray-500 focus:outline-none focus:border-yellow-festival disabled:opacity-50"
                    required
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !artist.collaborationsOpen}
                    className="w-full bg-yellow-festival text-[#121212] border-2 border-[#121212] font-black uppercase text-xs tracking-widest py-3 flex items-center justify-center gap-2 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
                  >
                    {sendingMessage ? "SENDING..." : <><Send size={12} /> SEND INVITE</>}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

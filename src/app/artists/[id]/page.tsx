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
  return {
    id: data.userId || data.id,
    name: data.stageName,
    genre: data.genres.join(" & ") || "Creator",
    location: [data.city, data.state].filter(Boolean).join(", ") || "Gujarat",
    rating: 4.5,
    followers: data.user?.reputationXp || 0,
    bio: data.biography || "",
    votes: 0,
    stageVerseScore: 70,
    performancesCount: data.performances?.length || 0,
    badges: [
      ...(data.isVerified ? ["Verified"] : []),
      ...(data.achievements?.map((a) => a.achievement.title) || []),
    ],
    recentActivity: "",
    trend: "stable",
    avatar: data.user?.profilePhotoUrl ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.stageName)}&backgroundColor=121212&textColor=FAF8F5`,
    cover: data.portfolioUrls[0] ||
      "https://images.unsplash.com/photo-1540039155733-5bb30b4f21f0?w=1200&h=400&fit=crop",
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
    socials: {},
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
  const [collabSent, setCollabSent] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [likes, setLikes] = useState(140);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    async function fetchArtist() {
      setLoading(true);
      try {
        const data: BackendArtistProfile = await api.get(`/artists/${id}`);
        setArtist(mapBackend(data));
      } catch {
        // Fallback to local context
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
    fetchArtist();
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
        <div className="border-4 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal overflow-hidden">
          {/* Cover */}
          <div className="h-56 bg-gray-200 border-b-4 border-[#121212] relative overflow-hidden">
            <img src={artist.cover} alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 right-4 flex gap-2">
              {artist.badges.includes("Verified") && (
                <span className="brutal-tape text-xs bg-green-400 rotate-[2deg]">✓ VERIFIED CREATOR</span>
              )}
              <span className="brutal-tape text-xs rotate-[-2deg]">🔥 {artist.availability}</span>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Left column */}
            <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              <img
                src={artist.avatar}
                alt={artist.name}
                className="w-36 h-36 rounded-full object-cover border-4 border-[#121212] bg-white -mt-24 shadow-brutal relative z-10"
              />
              <div className="space-y-1">
                <h2 className="font-display font-black text-2xl tracking-tight leading-none">{artist.name}</h2>
                <p className="text-xs font-black uppercase text-red-stage tracking-wider">{artist.genre}</p>
                <p className="text-xs font-space font-medium text-gray-500 flex items-center justify-center md:justify-start gap-1">
                  <MapPin size={12} /> {artist.location}
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 border-t border-b border-[#121212]/10 py-3 w-full justify-center md:justify-start">
                <div className="text-center">
                  <span className="block font-display font-black text-lg">{artist.followers.toLocaleString()}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">XP</span>
                </div>
                <div className="text-center">
                  <span className="block font-display font-black text-lg">{likes}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">Likes</span>
                </div>
                <div className="text-center">
                  <span className="block font-display font-black text-lg">{artist.performancesCount}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">Shows</span>
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

              {/* Socials */}
              {(artist.socials.instagram || artist.socials.youtube || artist.socials.spotify || artist.socials.website) && (
                <div className="flex gap-2 flex-wrap">
                  {artist.socials.instagram && (
                    <a href={artist.socials.instagram} target="_blank" rel="noopener noreferrer"
                      className="p-2 border-2 border-[#121212] bg-white rounded hover:bg-yellow-festival transition-all" title="Instagram">
                      <Share2 size={14} />
                    </a>
                  )}
                  {artist.socials.youtube && (
                    <a href={artist.socials.youtube} target="_blank" rel="noopener noreferrer"
                      className="p-2 border-2 border-[#121212] bg-white rounded hover:bg-yellow-festival transition-all" title="YouTube">
                      <Video size={14} />
                    </a>
                  )}
                  {artist.socials.spotify && (
                    <a href={artist.socials.spotify} target="_blank" rel="noopener noreferrer"
                      className="p-2 border-2 border-[#121212] bg-white rounded hover:bg-yellow-festival transition-all">
                      <Music size={14} />
                    </a>
                  )}
                  {artist.socials.website && (
                    <a href={artist.socials.website} target="_blank" rel="noopener noreferrer"
                      className="p-2 border-2 border-[#121212] bg-white rounded hover:bg-yellow-festival transition-all">
                      <Globe size={14} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Right: Bio + Skills + Awards */}
            <div className="md:col-span-3 space-y-6">
              <div className="space-y-3">
                <span className="brutal-tape text-[10px] bg-yellow-festival rotate-[-2deg] inline-block">BIO</span>
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
                  src={artist.videos[0].url}
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

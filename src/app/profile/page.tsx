"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, Shield, Award, Mail, User, Ticket, Share2, Video, Globe, Star, Music, Edit2, Play, MapPin } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

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
    // Ignore invalid urls
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="font-display font-black text-xl animate-pulse uppercase">Loading Profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="border-3 border-[#121212] bg-white rounded shadow-brutal p-8 text-center max-w-md w-full space-y-6">
          <Shield size={48} className="mx-auto text-red-stage" />
          <h2 className="font-display font-black text-2xl uppercase tracking-tight">Access Denied</h2>
          <p className="font-space text-sm text-[#121212]/60 font-bold">
            Please log in to view your creator profile and claim rewards.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-yellow-festival text-[#121212] font-black border-2 border-[#121212] py-3 text-xs tracking-wider shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded uppercase text-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      const profileUrl = `${window.location.origin}/artists/${user.id}`;
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      confetti({ particleCount: 40, spread: 30, colors: ["#FFDE4D", "#D80032"] });
    }
  };

  // Safe checks for artist profile details
  const isArtist = user.role === "ARTIST";
  const artistProfile = (user as any).artistProfile || {};
  const stageName = artistProfile.stageName || user.fullName;
  const instagram = artistProfile.instagramHandle || "";
  const genre = artistProfile.genre || "Creative Art";
  const experienceLevel = artistProfile.experienceLevel || "NEWBIE";
  const bioText = artistProfile.bio || "Crafting unique creative expressions.";
  const languagesText = artistProfile.languages || "English, Hindi";
  const availabilityStatus = artistProfile.availability || "Open for Gigs";
  const skillsText = artistProfile.skills || "Creative Art";
  const spotifyLinkUrl = artistProfile.spotifyLink || "";
  const pastAchievement = artistProfile.pastAchievement || "No achievements posted yet.";
  const youtubeUrl = artistProfile.youtubeLink || "";
  const youtubeEmbedUrl = youtubeUrl ? getYoutubeEmbedUrl(youtubeUrl) : null;
  const avatarImage = user.profilePhotoUrl || artistProfile.profilePhotoUrl || "";
  const coverImage = artistProfile.cover || "https://images.unsplash.com/photo-1540039155733-5bb30b4f21f0?w=1200&h=400&fit=crop";

  // Calculate dynamic rank
  const rank = user.reputationXp >= 500 ? "#3" : user.reputationXp >= 200 ? "#12" : user.reputationXp >= 100 ? "#24" : "#45";

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back Link */}
        <div className="flex justify-between items-center">
          <Link href="/stageverse" className="inline-flex items-center gap-2 font-display font-bold text-xs uppercase hover:underline text-[#121212]/60">
            ← BACK TO STAGEVERSE
          </Link>
        </div>

        {/* ── Main Profile Card (Matching Public Artist Layout) ── */}
        <div className="border-4 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal overflow-hidden">
          
          {/* Cover Header */}
          <div className="h-56 bg-gray-200 border-b-4 border-[#121212] relative overflow-hidden">
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <span className="brutal-tape text-xs bg-yellow-festival rotate-[2deg] select-none">✓ VERIFIED CREATOR</span>
              <span className="brutal-tape text-xs rotate-[-2deg] select-none">🟢 {availabilityStatus}</span>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Left Column: Avatar + Profile Details Sidebar */}
            <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              
              {/* Square Avatar Overlay */}
              <div className="w-36 h-36 border-4 border-[#121212] bg-white -mt-24 shadow-brutal relative z-10 overflow-hidden rounded">
                {avatarImage ? (
                  <img src={avatarImage} alt={stageName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#121212] flex items-center justify-center text-yellow-festival font-display font-black text-4xl uppercase select-none">
                    {stageName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Identity info */}
              <div className="space-y-1 w-full">
                <h2 className="font-display font-black text-2xl tracking-tight leading-none uppercase">{stageName}</h2>
                <p className="text-xs font-black uppercase text-red-stage tracking-wider">{genre}</p>
                <p className="text-xs font-space font-medium text-gray-500 flex items-center justify-center md:justify-start gap-1">
                  <MapPin size={12} /> Gujarat, IN
                </p>
                {bioText && (
                  <p className="font-space text-xs font-bold text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
                    {bioText}
                  </p>
                )}
              </div>

              {/* Stats Row */}
              <div className="flex gap-4 border-t border-b border-[#121212]/10 py-3 w-full justify-center md:justify-start font-space">
                <div className="text-center">
                  <span className="block font-display font-black text-lg">{rank}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">Rank</span>
                </div>
                <div className="text-center">
                  <span className="block font-display font-black text-lg">140</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">Likes</span>
                </div>
                <div className="text-center">
                  <span className="block font-display font-black text-lg">{youtubeUrl ? 1 : 0}</span>
                  <span className="text-[10px] font-black text-gray-400 uppercase">Shows</span>
                </div>
              </div>

              {/* Edit Buttons */}
              <Link
                href="/onboarding"
                className="w-full border-2 border-[#121212] bg-white text-[#121212] py-2.5 px-4 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-center cursor-pointer"
              >
                <Edit2 size={13} /> EDIT PROFILE
              </Link>

              <button
                onClick={handleShare}
                className="w-full border-2 border-[#121212] bg-[#FFDE4D] text-[#121212] py-2.5 px-4 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
              >
                <Share2 size={13} /> {copied ? "COPIED LINK!" : "SHARE PROFILE"}
              </button>

              {instagram && (
                <div className="pt-2 w-full">
                  <a
                    href={`https://instagram.com/${instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-900 font-black text-xs hover:underline flex items-center gap-1 justify-center md:justify-start"
                  >
                    <Globe size={13} /> instagram.com/{instagram}
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Bio + Skills + Achievements details panel */}
            <div className="md:col-span-3 space-y-6">
              
              {/* Bio Block */}
              <div className="space-y-3">
                <span className="brutal-tape text-[10px] bg-yellow-festival rotate-[-2deg] inline-block uppercase">BIO</span>
                <p className="font-space text-base font-bold leading-relaxed text-gray-700">
                  {bioText}
                </p>
              </div>

              {/* Skills and Achievements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#121212]/10">
                <div className="space-y-3">
                  <h4 className="font-display font-black text-sm uppercase text-gray-500">Skills & Specializations</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillsText ? skillsText.split(",").map((skill: string) => (
                      <span key={skill} className="bg-yellow-festival/20 text-[#121212] border-2 border-[#121212] px-3 py-1 font-bold text-xs rounded shadow-brutal-light">
                        {skill.trim()}
                      </span>
                    )) : <span className="text-xs text-gray-400 font-space">Skills not listed.</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-display font-black text-sm uppercase text-gray-500">Achievements & Awards</h4>
                  {pastAchievement ? (
                    <div className="text-xs font-bold font-space bg-white border-2 border-dashed border-[#121212]/10 p-3 rounded italic text-gray-600">
                      "{pastAchievement}"
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-space">No achievements posted yet.</span>
                  )}
                </div>
              </div>

              {/* Languages & Experience */}
              <div className="pt-4 border-t border-[#121212]/10 font-space text-xs space-y-2">
                <p className="font-bold text-gray-600">
                  Languages: <span className="text-[#121212]">{languagesText}</span>
                </p>
                <p className="font-bold text-gray-600">
                  Experience Tier: <span className="text-yellow-600 uppercase font-black bg-white border border-[#121212]/10 px-1.5 py-0.5 rounded text-[10px] ml-1">
                    {experienceLevel === "NEWBIE" ? "First Timer / Newbie" : experienceLevel === "EXPERIENCED" ? "6+ Months Experience" : "Pro / Regular"}
                  </span>
                </p>
                {spotifyLinkUrl && (
                  <p className="font-bold text-gray-600">
                    Spotify Track: <a href={spotifyLinkUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline inline-flex items-center gap-0.5 ml-1"><Music size={11} /> Link</a>
                  </p>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* ── Lower Section: Videos Reel (Left) & Badge Cabinet / Tickets (Right) ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Performance Video Reel (Left Col) */}
          <div className="md:col-span-8 space-y-4">
            <div className="border-4 border-[#121212] bg-[#0F0E0E] text-[#FAF8F5] rounded shadow-brutal p-6 space-y-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight flex items-center justify-between">
                <span className="flex items-center gap-2">▶ FEATURED WORK</span>
                <span className="text-[9px] bg-red-stage text-white px-2 py-0.5 rounded">STAGEVERSE LIVE</span>
              </h3>
              
              <div className="w-full aspect-video bg-[#121212] rounded border-2 border-white/20 flex items-center justify-center relative overflow-hidden">
                {youtubeEmbedUrl ? (
                  <iframe
                    src={youtubeEmbedUrl}
                    title="Featured performance work showcase"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
            </div>
          </div>

          {/* Badge Cabinet & Tickets Links (Right Col) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Badge Cabinet */}
            <div className="border-4 border-[#121212] bg-white rounded shadow-brutal p-6 space-y-4">
              <h3 className="font-display font-black text-base uppercase border-b-2 border-[#121212] pb-2 flex items-center gap-1.5">
                🎖 BADGE CABINET
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-yellow-festival border-2 border-[#121212] px-2 py-1 font-space font-black text-[10px] uppercase rounded shadow-brutal-sm">
                  🎖 VERIFIED
                </span>
                <span className="bg-red-stage/10 text-red-700 border border-red-200 px-2 py-1 font-space font-bold text-[10px] uppercase rounded">
                  🔥 {genre}
                </span>
              </div>
              <div className="border-t border-[#121212]/5 pt-4 flex items-center justify-between text-xs font-space">
                <span className="font-bold text-gray-500">Reputation XP</span>
                <span className="font-black text-red-stage">{user.reputationXp} XP</span>
              </div>
            </div>

            {/* Admission Tickets */}
            <div className="border-4 border-[#121212] bg-[#FFDE4D] rounded shadow-brutal p-6 space-y-4">
              <h3 className="font-display font-black text-base uppercase border-b-2 border-[#121212] pb-2 flex items-center gap-1.5">
                🎫 MY TICKETS
              </h3>
              <p className="font-space text-xs font-bold text-[#121212]/80 leading-relaxed">
                Scan, check-in, or manage your active booking ticket reservations for upcoming events & battles.
              </p>
              <Link
                href="/events/my-tickets"
                className="w-full flex items-center justify-center gap-2 bg-[#121212] text-white border-2 border-[#121212] font-display font-black text-xs uppercase py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-center cursor-pointer"
              >
                Go to My Tickets
              </Link>
            </div>

            {/* Organizer Dashboard */}
            {(user.role === "SUPER_ADMIN" || user.role === "ORG_ADMIN" || user.email.includes("admin")) && (
              <div className="border-4 border-[#121212] bg-[#FAF8F5] rounded shadow-brutal p-6 space-y-4">
                <h3 className="font-display font-black text-base uppercase border-b-2 border-[#121212] pb-2 flex items-center gap-1.5">
                  💼 ORGANIZER DASHBOARD
                </h3>
                <p className="font-space text-xs font-bold text-gray-600 leading-relaxed">
                  Manage registered attendees, verify tickets, view check-ins, and event analytics.
                </p>
                <Link
                  href="/events/organizer"
                  className="w-full flex items-center justify-center gap-2 bg-[#FFDE4D] text-[#121212] border-2 border-[#121212] font-display font-black text-xs uppercase py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-center cursor-pointer"
                >
                  Go to Organizer Panel
                </Link>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-[#D80032] text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
            >
              LOGOUT FROM BROWSER
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}

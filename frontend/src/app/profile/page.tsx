"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, Shield, Award, Mail, User, Ticket, Share2, Video, Globe, Star, Music, Edit2, Play, MapPin, Camera, X } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import SupabaseUpload from "@/components/ui/SupabaseUpload";

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
  const { user, logout, loading, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (user && user.role !== "ARTIST") {
      setTicketsLoading(true);
      api.get("/events/attendee/my-tickets")
        .then((data) => {
          setTickets(Array.isArray(data) ? data : []);
        })
        .catch((err: any) => {
          showToast("Failed to load tickets: " + (err?.message || "Unknown error"), "error");
        })
        .finally(() => {
          setTicketsLoading(false);
        });
    }
  }, [user]);

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
  
  const genresArray = artistProfile.genres || [];
  const genre = Array.isArray(genresArray)
    ? (genresArray.length > 0 ? genresArray.join(" & ") : "Creative Art")
    : typeof genresArray === "string"
    ? genresArray
    : artistProfile.genre || "Creative Art";

  const experienceLevel = artistProfile.experienceLevel || "NEWBIE";
  const bioText = artistProfile.biography || artistProfile.bio || "Crafting unique creative expressions.";
  
  const languagesVal = artistProfile.languages || "English, Hindi";
  const languagesText = Array.isArray(languagesVal)
    ? languagesVal.join(", ")
    : typeof languagesVal === "string"
    ? languagesVal
    : "";

  const availabilityStatus = artistProfile.availabilityStatus || artistProfile.availability || "Open for Gigs";
  
  const skillsVal = artistProfile.skills || "Creative Art";
  const skillsArray = Array.isArray(skillsVal)
    ? skillsVal
    : typeof skillsVal === "string"
    ? skillsVal.split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const portfolioUrls = artistProfile.portfolioUrls || [];
  const youtubeUrl = Array.isArray(portfolioUrls)
    ? portfolioUrls.find((u: string) => u.includes("youtube.com") || u.includes("youtu.be")) || artistProfile.youtubeLink || ""
    : artistProfile.youtubeLink || "";

  const spotifyLinkUrl = Array.isArray(portfolioUrls)
    ? portfolioUrls.find((u: string) => u.includes("spotify.com")) || artistProfile.spotifyLink || ""
    : artistProfile.spotifyLink || "";

  const pastAchievement = artistProfile.pastAchievement || "No achievements posted yet.";
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
              {isArtist ? (
                <>
                  <span className="brutal-tape text-xs bg-yellow-festival rotate-[2deg] select-none">✓ VERIFIED CREATOR</span>
                  <span className="brutal-tape text-xs rotate-[-2deg] select-none">🟢 {availabilityStatus}</span>
                </>
              ) : (
                <>
                  <span className="brutal-tape text-xs bg-yellow-festival rotate-[2deg] select-none">✓ {user.role} MEMBER</span>
                  <span className="brutal-tape text-xs rotate-[-2deg] select-none">🟢 ACTIVE MEMBER</span>
                </>
              )}
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Left Column: Avatar + Profile Details Sidebar */}
            <div className="md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              
              {/* Square Avatar Overlay */}
              <div 
                onClick={() => setShowUploadModal(true)}
                className="w-36 h-36 border-4 border-[#121212] bg-white -mt-24 shadow-brutal relative z-10 overflow-hidden rounded group cursor-pointer"
                title="Click to update profile photo"
              >
                {avatarImage ? (
                  <img src={avatarImage} alt={stageName} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-[#121212] flex items-center justify-center text-yellow-festival font-display font-black text-4xl uppercase select-none">
                    {stageName.charAt(0)}
                  </div>
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-[#121212]/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-200 z-20">
                  <Camera className="text-yellow-festival w-6 h-6 animate-bounce" />
                  <span className="text-[10px] font-display font-black uppercase text-white tracking-wider">Change Photo</span>
                </div>
              </div>

              {/* Identity info */}
              <div className="space-y-1 w-full">
                <h2 className="font-display font-black text-2xl tracking-tight leading-none uppercase">{stageName}</h2>
                {isArtist ? (
                  <>
                    <p className="text-xs font-black uppercase text-red-stage tracking-wider">{genre}</p>
                    <p className="text-xs font-space font-medium text-gray-500 flex items-center justify-center md:justify-start gap-1">
                      <MapPin size={12} /> Gujarat, IN
                    </p>
                    {bioText && (
                      <p className="font-space text-xs font-bold text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">
                        {bioText}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-xs font-space font-medium text-gray-500 flex items-center justify-center md:justify-start gap-1">
                      <MapPin size={12} /> Gujarat, IN
                    </p>
                    <p className="font-space text-xs font-bold text-gray-600 mt-2 leading-relaxed">
                      Welcome to the Element 5 community portal. View your registered tickets and badges below.
                    </p>
                  </>
                )}
              </div>

              {/* Edit Buttons */}
              <Link
                href="/onboarding"
                className="w-full border-2 border-[#121212] bg-white text-[#121212] py-2.5 px-4 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-center cursor-pointer"
              >
                <Edit2 size={13} /> {isArtist ? "EDIT PROFILE" : "CREATE CREATOR PROFILE"}
              </Link>

              <button
                onClick={handleShare}
                className="w-full border-2 border-[#121212] bg-[#FFDE4D] text-[#121212] py-2.5 px-4 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-1.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
              >
                <Share2 size={13} /> {copied ? "COPIED LINK!" : "SHARE PROFILE"}
              </button>

              {!isArtist && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-[#D80032] text-white border-2 border-[#121212] font-display font-black text-xs uppercase py-2.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
                >
                  LOGOUT FROM BROWSER
                </button>
              )}

              {!isArtist && (user.role === "SUPER_ADMIN" || user.role === "ORG_ADMIN" || user.email.includes("admin")) && (
                <Link
                  href="/events/organizer"
                  className="w-full flex items-center justify-center gap-2 bg-[#FFDE4D] text-[#121212] border-2 border-[#121212] font-display font-black text-xs uppercase py-2.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-center cursor-pointer"
                >
                  Go to Organizer Panel
                </Link>
              )}

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
              {isArtist ? (
                <>
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
                        {skillsArray.length > 0 ? skillsArray.map((skill: string) => (
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
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <span className="brutal-tape text-[10px] bg-yellow-festival rotate-[-2deg] inline-block uppercase">My Registered Events</span>
                    <h3 className="font-display font-black text-xl uppercase tracking-tight">Active Bookings</h3>
                  </div>

                  {ticketsLoading ? (
                    <div className="text-center font-space font-bold py-10 animate-pulse text-gray-500 uppercase">
                      Loading tickets...
                    </div>
                  ) : tickets.length > 0 ? (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {tickets.map((t) => (
                        <div key={t.id} className="border-2 border-[#121212] bg-white p-4 rounded shadow-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <h4 className="font-display font-black text-sm uppercase">{t.eventTitle || t.event?.title || "Upcoming Event"}</h4>
                            <p className="text-[10px] text-gray-500 font-space font-bold mt-0.5">
                              📅 {t.eventDate || t.event?.date || "TBD"} · 📍 {t.eventVenue || t.event?.venue || "Main Hall"}
                            </p>
                            <p className="text-[9px] font-space font-bold text-gray-400 mt-0.5">
                              Ticket ID: {t.ticketCode || t.id}
                            </p>
                          </div>
                          <span className={`border-2 border-[#121212] text-[8px] font-black uppercase px-2 py-0.5 rounded shadow-brutal-sm ${
                            t.isUsed ? "bg-red-stage text-white" : "bg-green-500 text-[#121212]"
                          }`}>
                            {t.isUsed ? "✓ USED" : "🎟 ACTIVE"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded bg-white font-space">
                      <p className="text-xs font-bold text-gray-500">You haven't registered for any events yet.</p>
                      <Link href="/stageverse" className="text-[10px] font-black hover:underline mt-2 inline-block">
                        Browse Upcoming Events →
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Lower Section: Videos Reel (Left) & Badge Cabinet / Tickets (Right) ── */}
        {isArtist && (
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
        )}

      </div>

      {/* Profile Photo Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-[#121212]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border-4 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal max-w-md w-full relative space-y-6">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 border-2 border-[#121212] bg-white p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-2">
              <h3 className="font-display font-black text-xl uppercase tracking-tight">Update Profile Photo</h3>
              <p className="font-space text-xs text-gray-500 font-bold">
                Upload a new photo for your artist or audience profile. Supported formats: JPEG, PNG, WEBP.
              </p>
            </div>

            <SupabaseUpload
              folder="profile-photos"
              accept="image/*"
              label="Select Profile Photo"
              onUploadSuccess={async (result) => {
                try {
                  await api.post("/auth/profile-photo", { profilePhotoUrl: result.secure_url });
                  await refreshUser();
                  setShowUploadModal(false);
                  alert("Profile photo updated successfully!");
                } catch (err: any) {
                  alert(err.message || "Failed to update profile photo.");
                }
              }}
              onUploadError={(err) => {
                alert(`Upload failed: ${err}`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

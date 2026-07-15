"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, AlertCircle, ArrowRight, Shield, Video, Music, Camera } from "lucide-react";
import confetti from "canvas-confetti";

export default function OnboardingPage() {
  const { user, refreshUser, loading } = useAuth();
  const router = useRouter();

  const [stageName, setStageName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [genre, setGenre] = useState("Rap");
  const [experienceLevel, setExperienceLevel] = useState("NEWBIE");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState("");
  const [availability, setAvailability] = useState("Open for Gigs");
  const [skills, setSkills] = useState("");
  const [spotifyLink, setSpotifyLink] = useState("");
  const [pastAchievement, setPastAchievement] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "ARTIST") {
      router.push("/");
    } else if (user) {
      const artProfile = (user as any).artistProfile || {};
      setStageName(artProfile.stageName || user.fullName || "");
      setInstagramHandle(artProfile.instagramHandle || "");
      setGenre(artProfile.genre || "Rap");
      setExperienceLevel(artProfile.experienceLevel || "NEWBIE");
      setBio(artProfile.bio || "");
      setLanguages(artProfile.languages || "");
      setAvailability(artProfile.availability || "Open for Gigs");
      setSkills(artProfile.skills || "");
      setSpotifyLink(artProfile.spotifyLink || "");
      setPastAchievement(artProfile.pastAchievement || "");
      setYoutubeLink(artProfile.youtubeLink || "");
      setProfilePhotoUrl(user.profilePhotoUrl || artProfile.profilePhotoUrl || "");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FFF5E4] flex items-center justify-center">
        <div className="font-display font-black text-xl animate-pulse uppercase text-[#121212]">Loading Creator Setup...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!stageName.trim()) {
      setError("Stage/Artist Name is required.");
      setSaving(false);
      return;
    }

    try {
      // Build artist profile object
      const artistProfile = {
        stageName,
        instagramHandle,
        genre,
        experienceLevel,
        bio,
        languages,
        availability,
        skills,
        spotifyLink,
        pastAchievement,
        youtubeLink,
        profilePhotoUrl,
      };

      // Attempt API update
      const { api } = await import("@/lib/api");
      await api.post("/auth/artist-profile", artistProfile);

      await refreshUser();
      confetti({ particleCount: 100, spread: 80, colors: ["#FFDE4D", "#D80032", "#FAF8F5"] });
      
      // Redirect to events page
      router.push("/events");
    } catch (err: any) {
      setError(err?.message || "Failed to save artist profile details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-[#FFF5E4] text-[#121212] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-xl bg-[#FAF8F5] border-3 border-[#121212] p-8 rounded shadow-brutal space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 border-b-3 border-[#121212] pb-6">
          <span className="brutal-tape text-xs uppercase select-none">CREATOR ONBOARDING</span>
          <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter mt-2">
            EDIT STAGE PROFILE
          </h2>
          <p className="font-space text-xs text-gray-500 font-bold max-w-md mx-auto">
            Tell us about your craft! All fields can be updated at any time. Your details will be visible to organizers and community members.
          </p>
        </div>

        {error && (
          <div className="bg-red-500 text-white border-2 border-[#121212] p-3 rounded text-xs font-bold font-space flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 font-space text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Stage / Artist Name</label>
              <input
                type="text"
                placeholder="e.g. MC Kavyo"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Instagram Handle</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-xs text-gray-400 font-black">@</span>
                <input
                  type="text"
                  placeholder="mckavyo"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value.replace("@", ""))}
                  className="w-full pl-7 pr-3 py-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Profile Image URL</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={profilePhotoUrl}
                  onChange={(e) => setProfilePhotoUrl(e.target.value)}
                  className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Availability Status</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold focus:outline-none"
              >
                <option value="Open for Gigs">Open for Gigs / Bookings</option>
                <option value="Collabs Only">Collabs / Network Only</option>
                <option value="Not Available">Not Active / Unavailable</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-600 block">Short Biography / Pitch</label>
            <textarea
              rows={2}
              placeholder="Tell your story. Describe your style, inspirations, and what you represent..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Genre / Medium</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold focus:outline-none"
              >
                <option value="Rap">Rap / Hip-Hop</option>
                <option value="Poetry">Poetry / Spoken Word</option>
                <option value="Beatboxing">Beatboxing</option>
                <option value="Stand-up Comedy">Stand-up Comedy</option>
                <option value="Music">Acoustic / Experimental Music</option>
                <option value="Other">Other Creative Art</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Languages Performed In</label>
              <input
                type="text"
                placeholder="e.g. Gujarati, Hindi, English"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Skills / Tags (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Freestyle, Lyricism, Storytelling"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-600 block">Spotify / Audio Link (Optional)</label>
              <input
                type="url"
                placeholder="https://open.spotify.com/artist/..."
                value={spotifyLink}
                onChange={(e) => setSpotifyLink(e.target.value)}
                className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-600 block">YouTube Video Link (Showcase)</label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none text-xs"
            />
          </div>

          <div className="space-y-2 border-2 border-[#121212] p-4 bg-white rounded">
            <label className="text-xs font-black uppercase text-gray-600 block mb-2">Experience Level</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "NEWBIE", title: "First Timer / Newbie", desc: "Just starting out on stage" },
                { id: "EXPERIENCED", title: "6+ Months Experience", desc: "Performed in a few open mics" },
                { id: "PRO", title: "Pro / Regular", desc: "Seasoned veteran, ready to battle" }
              ].map((lvl) => (
                <label
                  key={lvl.id}
                  className={`border-2 border-[#121212] rounded p-3 flex flex-col justify-between cursor-pointer transition-all hover:bg-yellow-festival/10 ${
                    experienceLevel === lvl.id ? "bg-yellow-festival border-[#121212] shadow-brutal-sm" : "bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="experienceLevel"
                    value={lvl.id}
                    checked={experienceLevel === lvl.id}
                    onChange={() => setExperienceLevel(lvl.id)}
                    className="sr-only"
                  />
                  <div>
                    <span className="block text-xs font-black uppercase tracking-tight">{lvl.title}</span>
                    <span className="block text-[9px] text-gray-500 font-bold mt-1 leading-tight">{lvl.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-gray-600 block">Past Achievements</label>
            <textarea
              rows={2}
              placeholder="e.g. Featured in Ahmedabad Open Mic Season 2, Released 3 singles on Spotify..."
              value={pastAchievement}
              onChange={(e) => setPastAchievement(e.target.value)}
              className="w-full p-3 border-2 border-[#121212] bg-white rounded font-bold placeholder-gray-400 focus:outline-none text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#121212] text-white border-3 border-[#121212] font-black uppercase text-sm tracking-wider py-4 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all rounded flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {saving ? "SAVING SETUP..." : (
              <>
                COMPLETE SETUP & SAVE DETAILS <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DiscoverArtists from "@/app/artists/page";
import ArtistNetwork from "@/app/network/page";

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialTab = searchParams.get("tab") === "network" ? "network" : "artists";
  const [activeTab, setActiveTab] = useState<"artists" | "network">(initialTab);

  const handleTabChange = (tab: "artists" | "network") => {
    setActiveTab(tab);
    router.replace(`/community?tab=${tab}`);
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "network" || tabParam === "artists") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] pt-8">
      {/* Community Header & Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-3 border-[#121212] bg-[#FFDE4D] p-6 rounded shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="brutal-tape text-xs uppercase select-none">ELEMENT 5 HUB</span>
            <h2 className="font-display font-extrabold text-3xl uppercase tracking-tighter mt-1">
              THE CREATOR COMMUNITY
            </h2>
            <p className="font-space text-xs sm:text-sm font-bold text-gray-700 max-w-xl">
              Connect with verified creators, explore collaborations, and chat with local artists.
            </p>
          </div>
          
          {/* Tabs Selector */}
          <div className="flex border-3 border-[#121212] rounded overflow-hidden bg-white max-w-md">
            <button
              onClick={() => handleTabChange("artists")}
              className={`flex-1 px-6 py-3 font-display font-black text-xs uppercase transition-colors tracking-widest ${
                activeTab === "artists" ? "bg-[#121212] text-[#FAF8F5]" : "bg-white text-[#121212] hover:bg-gray-100"
              }`}
            >
              Discover Artists
            </button>
            <button
              onClick={() => handleTabChange("network")}
              className={`flex-1 px-6 py-3 font-display font-black text-xs uppercase transition-colors tracking-widest ${
                activeTab === "network" ? "bg-[#121212] text-[#FAF8F5]" : "bg-white text-[#121212] hover:bg-gray-100"
              }`}
            >
              Creator Network
            </button>
          </div>
        </div>
      </div>

      {/* Render selected component */}
      <div className="-mt-12">
        {activeTab === "artists" ? <DiscoverArtists /> : <ArtistNetwork />}
      </div>
    </div>
  );
}

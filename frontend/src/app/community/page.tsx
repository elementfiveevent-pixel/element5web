"use client";

import React, { Suspense } from "react";
import DiscoverArtists from "@/app/artists/page";

function CommunityContent() {
  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] pt-4">
      <DiscoverArtists />
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF5E4] py-12 text-center font-display font-black uppercase text-[#121212]/40">Loading Community…</div>}>
      <CommunityContent />
    </Suspense>
  );
}

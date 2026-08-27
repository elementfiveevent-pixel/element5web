"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Flag, MapPin, MessageSquare, Plus, Send, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Community = { id: string; name: string; description?: string };
type CollabPost = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  metadata?: { creatorType?: string; location?: string; timeline?: string; contactMethod?: string };
  author?: { id: string; fullName: string; profilePhotoUrl?: string };
  _count?: { likes?: number; comments?: number };
};

const CREATOR_TYPES = ["Any creator", "Musician", "Poet", "Rapper", "Beatboxer", "Comedian", "Visual artist"];

export default function CommunityPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [posts, setPosts] = useState<CollabPost[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", creatorType: "Any creator", location: "Ahmedabad", timeline: "", contactMethod: "Message on Element 5", content: "" });

  const activeCommunity = useMemo(() => communities.find((community) => community.id === selectedCommunity), [communities, selectedCommunity]);

  const loadCommunities = async () => {
    try {
      const data = await api.get("/social/communities");
      const list = Array.isArray(data) ? data : [];
      setCommunities(list);
      const collab = list.find((community) => community.name.toLowerCase().includes("collaboration"));
      setSelectedCommunity(collab?.id || "all");
    } catch (err: any) {
      setError(err.message || "Sign in to load community opportunities.");
    }
  };

  const loadPosts = async (communityId: string) => {
    setLoading(true);
    try {
      const data = await api.get(`/social/communities/${communityId}/posts`);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Could not load collaboration posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCommunities(); }, []);
  useEffect(() => { if (selectedCommunity) void loadPosts(selectedCommunity); }, [selectedCommunity]);

  const submitPost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/social/communities/${selectedCommunity}/posts`, {
        title: form.title,
        content: form.content,
        metadata: { creatorType: form.creatorType, location: form.location, timeline: form.timeline, contactMethod: form.contactMethod },
      });
      setForm({ title: "", creatorType: "Any creator", location: "Ahmedabad", timeline: "", contactMethod: "Message on Element 5", content: "" });
      setShowComposer(false);
      await loadPosts(selectedCommunity);
    } catch (err: any) {
      setError(err.message || "Could not publish your opportunity.");
    } finally {
      setSubmitting(false);
    }
  };

  const reportPost = async (postId: string) => {
    if (!user) return;
    try {
      await api.post(`/social/posts/${postId}/report`, { reason: "Community guidelines concern" });
    } catch (err: any) {
      setError(err.message || "Could not submit the report.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-10 sm:py-14 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-7 sm:space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <span className="brutal-tape text-xs uppercase">CREATOR NETWORK</span>
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl uppercase leading-none">COLLAB <span className="text-red-stage">CIRCLE</span></h1>
            <p className="font-space text-sm font-bold text-[#121212]/65 max-w-xl">Open calls, project needs, and practical ways for Gujarat creators to work together.</p>
          </div>
          {user ? <button onClick={() => setShowComposer(true)} className="inline-flex items-center justify-center gap-2 bg-yellow-festival border-3 border-[#121212] rounded px-4 py-3 shadow-brutal font-display font-black text-xs uppercase"><Plus size={15} /> Post a need</button> : <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-yellow-festival border-3 border-[#121212] rounded px-4 py-3 shadow-brutal font-display font-black text-xs uppercase">Log in to post</Link>}
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCommunity("all")} className={`flex-shrink-0 border-2 border-[#121212] rounded px-3 py-2 text-xs font-black uppercase ${selectedCommunity === "all" ? "bg-[#121212] text-white" : "bg-white"}`}>All posts</button>
          {communities.map((community) => <button key={community.id} onClick={() => setSelectedCommunity(community.id)} className={`flex-shrink-0 border-2 border-[#121212] rounded px-3 py-2 text-xs font-black uppercase ${selectedCommunity === community.id ? "bg-[#121212] text-white" : "bg-white"}`}>{community.name}</button>)}
        </div>

        {error && <div className="flex items-center gap-2 border-2 border-red-stage bg-red-50 p-3 rounded text-xs font-bold text-red-stage"><AlertCircle size={15} /> {error}</div>}

        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_16rem] gap-5 sm:gap-7 items-start">
          <div className="space-y-4">
            {loading ? <div className="border-3 border-[#121212] bg-white p-8 rounded shadow-brutal font-display font-black uppercase text-sm text-[#121212]/40 animate-pulse">Loading open calls...</div> : posts.map((post) => (
              <article key={post.id} className="border-3 border-[#121212] bg-white p-4 sm:p-5 rounded shadow-brutal space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h2 className="font-display font-black text-lg sm:text-xl uppercase leading-tight break-words">{post.title || "Open collaboration"}</h2><p className="text-[11px] font-bold text-[#121212]/45 mt-1">{post.author?.fullName || "Element 5 creator"} · {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div>
                  <button onClick={() => void reportPost(post.id)} className="p-2 border-2 border-[#121212] bg-[#FAF8F5] rounded flex-shrink-0" title="Report post" aria-label="Report post"><Flag size={14} /></button>
                </div>
                <p className="font-space text-sm text-[#121212]/70 leading-relaxed">{post.content}</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
                  {post.metadata?.creatorType && <span className="border border-[#121212] bg-red-stage text-white rounded px-2 py-1">{post.metadata.creatorType}</span>}
                  {post.metadata?.location && <span className="border border-[#121212] bg-[#FAF8F5] rounded px-2 py-1 flex items-center gap-1"><MapPin size={11} /> {post.metadata.location}</span>}
                  {post.metadata?.timeline && <span className="border border-[#121212] bg-[#FAF8F5] rounded px-2 py-1">{post.metadata.timeline}</span>}
                </div>
                <div className="border-t border-[#121212]/10 pt-3 flex items-center justify-between gap-3"><span className="text-[10px] font-black text-[#121212]/45 uppercase flex items-center gap-1"><MessageSquare size={12} /> {post._count?.comments || 0} replies</span><Link href={`/artists/${post.author?.id || ""}`} className="text-xs font-black text-red-stage uppercase hover:underline">{post.metadata?.contactMethod || "Contact creator"}</Link></div>
              </article>
            ))}
            {!loading && posts.length === 0 && <div className="border-3 border-dashed border-[#121212] bg-white p-8 rounded text-center font-display font-black uppercase text-[#121212]/45">No open calls here yet.</div>}
          </div>
          <aside className="border-3 border-[#121212] bg-[#121212] text-[#FAF8F5] p-4 rounded shadow-brutal space-y-3">
            <Users size={20} className="text-yellow-festival" /><h2 className="font-display font-black text-base uppercase">{activeCommunity?.name || "Collab Circle"}</h2><p className="font-space text-xs text-[#FAF8F5]/65 leading-relaxed">{activeCommunity?.description || "Browse all creator opportunities and share yours when the timing is right."}</p><p className="text-[10px] font-black uppercase text-yellow-festival">Keep posts specific, respectful, and useful.</p>
          </aside>
        </section>
      </div>

      {showComposer && <div className="fixed inset-0 z-50 bg-[#121212]/70 p-4 overflow-y-auto flex items-start sm:items-center justify-center"><form onSubmit={submitPost} className="my-6 w-full max-w-xl border-4 border-[#121212] bg-[#FAF8F5] p-5 sm:p-6 rounded shadow-brutal space-y-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display font-black text-xl uppercase">Post an open call</h2><p className="font-space text-xs text-[#121212]/60 mt-1">Give collaborators the details they need to respond.</p></div><button type="button" onClick={() => setShowComposer(false)} className="p-2 border-2 border-[#121212] bg-white rounded"><X size={15} /></button></div><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project title" className="w-full border-3 border-[#121212] bg-white rounded px-3 py-3 font-bold text-sm" /><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><select value={form.creatorType} onChange={(e) => setForm({ ...form, creatorType: e.target.value })} className="border-3 border-[#121212] bg-white rounded px-3 py-3 font-bold text-sm">{CREATOR_TYPES.map((type) => <option key={type}>{type}</option>)}</select><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City or locality" className="border-3 border-[#121212] bg-white rounded px-3 py-3 font-bold text-sm" /><input value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="Availability / timeline" className="border-3 border-[#121212] bg-white rounded px-3 py-3 font-bold text-sm" /><input value={form.contactMethod} onChange={(e) => setForm({ ...form, contactMethod: e.target.value })} placeholder="Contact method" className="border-3 border-[#121212] bg-white rounded px-3 py-3 font-bold text-sm" /></div><textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} placeholder="Describe the project, skills needed, and what collaboration looks like." className="w-full border-3 border-[#121212] bg-white rounded px-3 py-3 font-space text-sm" /><button disabled={submitting} className="w-full inline-flex justify-center items-center gap-2 bg-red-stage text-white border-3 border-[#121212] rounded py-3 font-display font-black text-xs uppercase shadow-brutal disabled:opacity-60"><Send size={14} /> {submitting ? "Publishing..." : "Publish open call"}</button></form></div>}
    </div>
  );
}

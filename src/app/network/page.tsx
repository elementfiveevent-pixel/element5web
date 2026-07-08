"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp, CollabRequest } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Send, Check, Users, MessageSquare, Plus, Award, User, Sparkles, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface BackendMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface BackendPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  communityId: string;
  mediaUrls: string[];
  createdAt: string;
  _count?: { likes: number; comments: number };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────
export default function ArtistNetwork() {
  const {
    artists,
    messages: localMessages,
    collabRequests,
    sendMessage,
    createCollabRequest,
    userXP,
    userLevel,
    userBadges,
    addUserXP,
  } = useApp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"circles" | "messages">("circles");

  // ── Messaging ──
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(artists[0]?.id || "");
  const [chatInput, setChatInput] = useState("");
  const [backendMessages, setBackendMessages] = useState<BackendMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Community Posts ──
  const [posts, setPosts] = useState<BackendPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [communityId] = useState<string>(""); // populated once communities API is wired
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // ── Collab Form ──
  const [collabTitle, setCollabTitle] = useState("");
  const [collabCategory, setCollabCategory] = useState<CollabRequest["category"]>("Need Guitarist");
  const [collabDescription, setCollabDescription] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // ── Fetch DM history when recipient changes ──
  useEffect(() => {
    if (!user || !selectedRecipientId) return;

    async function fetchMessages() {
      setMessagesLoading(true);
      try {
        const data = await api.get(`/social/messages/${selectedRecipientId}`);
        if (Array.isArray(data)) setBackendMessages(data);
      } catch {
        setBackendMessages([]); // fall through to local context messages
      } finally {
        setMessagesLoading(false);
      }
    }

    fetchMessages();
  }, [selectedRecipientId, user]);

  // ── Auto-scroll chat to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [backendMessages, localMessages]);

  // ── Fetch community posts ──
  useEffect(() => {
    async function fetchPosts() {
      setPostsLoading(true);
      try {
        // Using social controller — get communities first then posts
        // For now hit a general communities endpoint if it exists
        const data = await api.get("/social/communities");
        if (Array.isArray(data) && data.length > 0) {
          // Fetch posts from first community
          const postsData = await api.get(`/social/communities/${data[0].id}/posts`);
          if (Array.isArray(postsData)) setPosts(postsData);
        }
      } catch {
        // Silently fall back — show collab requests instead
      } finally {
        setPostsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // ── Send DM ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setSendingMessage(true);

    const optimisticMsg: BackendMessage = {
      id: `local-${Date.now()}`,
      senderId: user?.id || "currentUser",
      recipientId: selectedRecipientId,
      content: chatInput,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setBackendMessages((prev) => [...prev, optimisticMsg]);
    const draft = chatInput;
    setChatInput("");

    try {
      if (user) {
        await api.post("/social/messages", { recipientId: selectedRecipientId, content: draft });
      }
    } catch {
      // Already shown optimistically
    }

    sendMessage(selectedRecipientId, draft); // also update local context
    addUserXP(5);
    setSendingMessage(false);
  };

  // ── Like a post ──
  const handleLikePost = async (postId: string) => {
    const already = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      already ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, _count: { likes: (p._count?.likes || 0) + (already ? -1 : 1), comments: p._count?.comments || 0 } }
          : p
      )
    );
    try {
      await api.post(`/social/posts/${postId}/like`);
      addUserXP(2);
    } catch {
      // Revert optimistic
      setLikedPosts((prev) => {
        const next = new Set(prev);
        already ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  };

  // ── Submit comment ──
  const handleSubmitComment = async (postId: string) => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await api.post(`/social/posts/${postId}/comments`, { content: commentText });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, _count: { likes: p._count?.likes || 0, comments: (p._count?.comments || 0) + 1 } }
            : p
        )
      );
      addUserXP(5);
    } catch {
      // best-effort
    } finally {
      setCommentText("");
      setCommentingOn(null);
      setSubmittingComment(false);
    }
  };

  // ── Post collab request ──
  const handlePostCollab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabTitle.trim() || !collabDescription.trim()) return;
    createCollabRequest(collabCategory, collabTitle, collabDescription);
    setCollabTitle("");
    setCollabDescription("");
    setPostSuccess(true);
    confetti({ particleCount: 60, spread: 50, colors: ["#FFDE4D", "#D80032"] });
    setTimeout(() => { setPostSuccess(false); setFormOpen(false); }, 2000);
  };

  const activeChatArtist = artists.find((a) => a.id === selectedRecipientId);

  // Merge backend + local messages for display
  const localThreadMessages = localMessages.filter(
    (m) =>
      (m.senderId === "currentUser" && m.receiverId === selectedRecipientId) ||
      (m.senderId === selectedRecipientId && m.receiverId === "currentUser")
  );
  const allMessages = backendMessages.length > 0 ? backendMessages : localThreadMessages;

  return (
    <div className="min-h-screen bg-[#FFF5E4] text-[#121212] py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* ── LEFT: Profile Panel + Tabs ── */}
        <div className="lg:col-span-4 space-y-8">
          <div className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-yellow-festival border-3 border-[#121212] flex items-center justify-center overflow-hidden">
                {user?.profilePhotoUrl ? (
                  <img src={user.profilePhotoUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-[#121212]" />
                )}
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl">
                  {user?.fullName || "Your Creator Hub"}
                </h3>
                <span className="text-xs bg-red-stage text-white font-bold px-2 py-0.5 rounded uppercase border border-[#121212]">
                  LEVEL {userLevel} CREATOR
                </span>
              </div>
            </div>

            {/* XP Gauge */}
            <div className="space-y-2 border-t border-[#121212]/10 pt-4">
              <div className="flex justify-between text-xs font-black uppercase">
                <span>XP PROGRESS</span>
                <span>{userXP} XP</span>
              </div>
              <div className="w-full h-4 border-2 border-[#121212] bg-white rounded p-0.5">
                <div
                  className="h-full bg-yellow-festival transition-all duration-500"
                  style={{ width: `${Math.min(100, userXP % 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 font-bold font-space">
                Earn XP by voting, messaging creators, and liking posts.
              </p>
            </div>

            {/* Badges */}
            <div className="space-y-3 border-t border-[#121212]/10 pt-4">
              <h4 className="font-display font-black text-xs uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Award size={16} className="text-red-stage" /> Earned Achievements
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {userBadges.map((badge) => (
                  <span key={badge} className="text-[10px] font-black bg-[#121212] text-[#FAF8F5] border border-black px-2.5 py-1 rounded shadow-brutal-light select-none">
                    🏆 {badge}
                  </span>
                ))}
                {userBadges.length === 0 && (
                  <span className="text-xs text-gray-400 font-space">Keep engaging to earn badges!</span>
                )}
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="flex border-3 border-[#121212] rounded overflow-hidden">
            <button
              onClick={() => setActiveTab("circles")}
              className={`flex-1 py-4 font-display font-black text-sm uppercase flex items-center justify-center gap-2 ${
                activeTab === "circles" ? "bg-[#121212] text-white" : "bg-white text-[#121212]"
              }`}
            >
              <Users size={16} /> COLLAB CIRCLES
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 py-4 font-display font-black text-sm uppercase flex items-center justify-center gap-2 ${
                activeTab === "messages" ? "bg-[#121212] text-white" : "bg-white text-[#121212]"
              }`}
            >
              <MessageSquare size={16} /> MESSAGES
            </button>
          </div>
        </div>

        {/* ── RIGHT: Content ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── TAB 1: COLLAB CIRCLES + COMMUNITY POSTS ── */}
          {activeTab === "circles" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b-3 border-[#121212] pb-4">
                <h2 className="font-display font-black text-2xl uppercase tracking-tight">
                  Active Collaboration Feed
                </h2>
                <button
                  onClick={() => setFormOpen(!formOpen)}
                  className="bg-yellow-festival border-2 border-[#121212] font-black uppercase text-xs tracking-wider px-4 py-2 flex items-center gap-1.5 rounded shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  <Plus size={14} /> POST REQUEST
                </button>
              </div>

              {/* New collab form */}
              {formOpen && (
                <form
                  onSubmit={handlePostCollab}
                  className="border-3 border-[#121212] bg-[#FAF8F5] p-6 rounded shadow-brutal space-y-4"
                >
                  <h3 className="font-display font-bold text-lg">Create Collaboration Pin</h3>
                  {postSuccess ? (
                    <div className="bg-green-500 text-white font-bold p-4 rounded text-center border-2 border-[#121212] text-xs flex items-center justify-center gap-2">
                      <Check size={18} /> REQUEST PINNED TO CIRCLES FEED
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-gray-500 block">Category</label>
                          <select
                            value={collabCategory}
                            onChange={(e) => setCollabCategory(e.target.value as CollabRequest["category"])}
                            className="w-full p-2.5 border-2 border-[#121212] bg-white rounded font-space font-bold focus:outline-none"
                          >
                            {["Need Guitarist","Need Singer","Need Rapper","Need Host","Need Photographer","Need Videographer","Need Dancer"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-black uppercase text-gray-500 block">Hook Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Lead Vocals for Sufi Fusion"
                            value={collabTitle}
                            onChange={(e) => setCollabTitle(e.target.value)}
                            className="w-full p-2 border-2 border-[#121212] bg-white rounded font-space font-bold placeholder-gray-400 focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="List dates, locations, goals..."
                        value={collabDescription}
                        onChange={(e) => setCollabDescription(e.target.value)}
                        rows={3}
                        className="w-full p-3 border-2 border-[#121212] bg-white rounded font-space placeholder-gray-400 focus:outline-none"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full bg-[#121212] text-[#FAF8F5] font-black uppercase text-xs tracking-widest py-3 border-2 border-[#121212] rounded hover:bg-[#121212]/80"
                      >
                        SUBMIT REQUEST
                      </button>
                    </>
                  )}
                </form>
              )}

              {/* Community Posts (from backend) */}
              {posts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-display font-black text-sm uppercase text-gray-500 tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-festival" /> COMMUNITY POSTS
                  </h3>
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white border-3 border-[#121212] p-5 rounded shadow-brutal space-y-3">
                      <div className="space-y-1">
                        <h4 className="font-display font-extrabold text-lg">{post.title}</h4>
                        <p className="font-space text-sm text-gray-600">{post.content}</p>
                      </div>
                      <div className="flex items-center gap-4 border-t border-[#121212]/10 pt-3">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`text-xs font-black uppercase flex items-center gap-1 px-3 py-1.5 rounded border-2 border-[#121212] transition-all ${
                            likedPosts.has(post.id) ? "bg-red-stage text-white" : "bg-white hover:bg-red-50"
                          }`}
                        >
                          ♥ {post._count?.likes || 0}
                        </button>
                        <button
                          onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                          className="text-xs font-black uppercase flex items-center gap-1 px-3 py-1.5 rounded border-2 border-[#121212] bg-white hover:bg-gray-50 transition-all"
                        >
                          💬 {post._count?.comments || 0} COMMENTS
                        </button>
                        <span className="ml-auto text-[10px] text-gray-400 font-space">{timeAgo(post.createdAt)}</span>
                      </div>

                      {commentingOn === post.id && (
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 p-2 border-2 border-[#121212] rounded font-space text-xs focus:outline-none"
                          />
                          <button
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={submittingComment}
                            className="px-3 py-2 bg-yellow-festival border-2 border-[#121212] rounded font-black text-xs uppercase disabled:opacity-50"
                          >
                            {submittingComment ? "..." : "POST"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Collab Requests (local context) */}
              <div className="space-y-4">
                {posts.length > 0 && (
                  <h3 className="font-display font-black text-sm uppercase text-gray-500 tracking-wider">
                    COLLABORATION PINS
                  </h3>
                )}
                {collabRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white border-3 border-[#121212] p-6 rounded shadow-brutal space-y-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-red transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="inline-block bg-yellow-festival font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-[#121212]">
                          {req.category}
                        </span>
                        <h4 className="font-display font-extrabold text-xl">{req.title}</h4>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">{req.date}</span>
                    </div>
                    <p className="font-space text-sm text-gray-600">{req.description}</p>
                    <div className="border-t border-[#121212]/10 pt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500">
                        Posted by: <span className="font-black text-[#121212]">{req.authorName}</span>
                      </span>
                      {req.authorId !== "currentUser" && (
                        <button
                          onClick={() => { setSelectedRecipientId(req.authorId); setActiveTab("messages"); }}
                          className="text-xs font-display font-black text-red-stage uppercase hover:underline"
                        >
                          CONNECT & MESSAGE →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 2: DIRECT MESSAGES ── */}
          {activeTab === "messages" && (
            <div className="border-3 border-[#121212] bg-[#121212] rounded shadow-brutal min-h-[560px] flex flex-col md:flex-row">

              {/* Recipient Picker */}
              <div className="w-full md:w-1/3 border-b-3 md:border-b-0 md:border-r-3 border-[#121212] bg-[#0F0E0E] p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-display font-black text-xs text-yellow-festival uppercase tracking-wider select-none">
                    CREATOR DIRECTORY
                  </h4>
                  {messagesLoading && (
                    <RefreshCw size={12} className="text-white/40 animate-spin" />
                  )}
                </div>
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {artists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => setSelectedRecipientId(artist.id)}
                      className={`flex items-center gap-3 p-2.5 rounded cursor-pointer border-2 transition-all ${
                        selectedRecipientId === artist.id
                          ? "bg-yellow-festival text-[#121212] border-yellow-festival"
                          : "border-transparent text-[#FAF8F5]/80 hover:bg-white/5"
                      }`}
                    >
                      <img src={artist.avatar} alt={artist.name} className="w-8 h-8 rounded-full object-cover border flex-shrink-0" />
                      <div className="text-left leading-tight truncate">
                        <span className="font-display font-bold text-sm block truncate">{artist.name}</span>
                        <span className="text-[10px] opacity-75 font-space block truncate">{artist.genre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Console */}
              <div className="flex-1 flex flex-col bg-[#1A1A1A]">
                {/* Header */}
                <div className="bg-[#0F0E0E] p-4 border-b border-white/10 flex items-center gap-3 select-none">
                  {activeChatArtist && (
                    <>
                      <img src={activeChatArtist.avatar} alt={activeChatArtist.name} className="w-10 h-10 rounded-full object-cover border" />
                      <div>
                        <h4 className="font-display font-bold text-sm text-[#FAF8F5] leading-tight">{activeChatArtist.name}</h4>
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Message Log */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto max-h-[360px]">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw size={24} className="text-white/20 animate-spin" />
                    </div>
                  ) : allMessages.length > 0 ? (
                    allMessages.map((msg) => {
                      const isMe =
                        ("senderId" in msg && msg.senderId === (user?.id || "currentUser")) ||
                        ("senderId" in msg && msg.senderId === "currentUser");
                      const content = "content" in msg ? msg.content : (msg as any).text;
                      const timestamp = "createdAt" in msg
                        ? timeAgo(msg.createdAt)
                        : (msg as any).timestamp;

                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] p-3 rounded font-space text-xs leading-relaxed border-2 ${
                              isMe
                                ? "bg-yellow-festival text-[#121212] border-yellow-festival"
                                : "bg-[#0F0E0E] text-[#FAF8F5] border-white/10"
                            }`}
                          >
                            <p>{content}</p>
                            <span className="text-[9px] opacity-60 mt-1 block text-right">{timestamp}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center p-8 text-center">
                      <p className="text-xs text-[#FAF8F5]/40 font-bold uppercase">
                        {user ? "Start your collaboration thread below." : "Login to send messages."}
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 bg-[#0F0E0E] border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={user ? "Type pitch or collaboration link..." : "Login to send messages"}
                    disabled={!user || sendingMessage}
                    className="flex-grow bg-[#1A1A1A] text-white p-3 border-2 border-white/10 rounded text-xs font-space focus:outline-none focus:border-yellow-festival disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!user || sendingMessage || !chatInput.trim()}
                    className="p-3 bg-yellow-festival text-[#121212] rounded border-2 border-yellow-festival hover:bg-yellow-festival/80 disabled:opacity-40"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

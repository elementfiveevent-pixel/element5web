"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Send, Check, Users, MessageSquare, Plus, Award, User, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
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
  author?: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
  } | null;
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
    sendMessage,
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

  // ── Community Hubs & Posts ──
  const [posts, setPosts] = useState<BackendPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  


  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const [joiningCommunity, setJoiningCommunity] = useState<string | null>(null);



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

  // Fetch communities from backend
  const fetchCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    try {
      const data = await api.get("/social/communities");
      const list = Array.isArray(data) ? data : [];
      setCommunities(list);
      if (list.length > 0 && !selectedCommunityId) {
        setSelectedCommunityId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load communities:", err);
      setCommunities([]);
    } finally {
      setCommunitiesLoading(false);
    }
  }, [selectedCommunityId]);

  useEffect(() => {
    fetchCommunities();
  }, []);

  // Fetch posts for the selected community
  useEffect(() => {
    if (!selectedCommunityId) {
      setPosts([]);
      return;
    }

    async function fetchPosts() {
      setPostsLoading(true);
      try {
        const postsData = await api.get(`/social/communities/${selectedCommunityId}/posts`);
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.error("Failed to fetch community posts:", err);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    }

    fetchPosts();
  }, [selectedCommunityId]);



  const handleJoinCommunity = async (communityId: string) => {
    setJoiningCommunity(communityId);
    try {
      await api.post(`/social/communities/${communityId}/join`);
      confetti({ particleCount: 30, spread: 40, colors: ["#50C878", "#FAF8F5"] });
      alert("Joined community successfully!");
      addUserXP(20);
    } catch (err: any) {
      alert(err.message || "Failed to join community.");
    } finally {
      setJoiningCommunity(null);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim() || !selectedCommunityId) return;
    setCreatingPost(true);
    setPostError(null);
    try {
      const created = await api.post(`/social/communities/${selectedCommunityId}/posts`, {
        title: newPostTitle,
        content: newPostContent
      });
      confetti({ particleCount: 40, spread: 50, colors: ["#50C878", "#FFDE4D"] });
      
      const newPostEnriched = {
        ...created,
        author: {
          id: user?.id || "currentUser",
          fullName: user?.fullName || "You",
          profilePhotoUrl: user?.profilePhotoUrl
        },
        _count: { likes: 0, comments: 0 }
      };
      setPosts(prev => [newPostEnriched, ...prev]);
      setNewPostTitle("");
      setNewPostContent("");
      setShowCreatePostModal(false);
      addUserXP(30);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("join") || err.message?.toLowerCase().includes("member")) {
        try {
          await api.post(`/social/communities/${selectedCommunityId}/join`);
          const created = await api.post(`/social/communities/${selectedCommunityId}/posts`, {
            title: newPostTitle,
            content: newPostContent
          });
          const newPostEnriched = {
            ...created,
            author: {
              id: user?.id || "currentUser",
              fullName: user?.fullName || "You",
              profilePhotoUrl: user?.profilePhotoUrl
            },
            _count: { likes: 0, comments: 0 }
          };
          setPosts(prev => [newPostEnriched, ...prev]);
          setNewPostTitle("");
          setNewPostContent("");
          setShowCreatePostModal(false);
          addUserXP(30);
          return;
        } catch (joinErr: any) {
          setPostError(joinErr.message || "Must join community before posting.");
        }
      } else {
        setPostError(err.message || "Failed to publish post.");
      }
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/social/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      addUserXP(-30);
      alert("Post deleted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to delete post.");
    }
  };

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



  const activeChatArtist = artists.find((a) => a.id === selectedRecipientId);

  // Merge backend + local messages for display
  const localThreadMessages = localMessages.filter(
    (m) =>
      (m.senderId === "currentUser" && m.receiverId === selectedRecipientId) ||
      (m.senderId === selectedRecipientId && m.receiverId === "currentUser")
  );
  const allMessages = user ? backendMessages : localThreadMessages;

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
              {/* Header block */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#121212] pb-4">
                <div className="space-y-1">
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight">
                    Active Collaboration Feed
                  </h2>
                  <p className="font-space text-xs text-gray-500 font-bold">
                    Participate in community groups and share discussion posts.
                  </p>
                </div>
              </div>

              {/* Communities list / selector */}
              <div className="space-y-3">
                <span className="font-display font-black text-xs uppercase text-gray-500 tracking-wider block">
                  👥 CREATOR COMMUNITY HUBS
                </span>

                {communitiesLoading ? (
                  <div className="flex gap-2 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 w-28 bg-gray-200 border-2 border-[#121212] rounded" />
                    ))}
                  </div>
                ) : communities.length === 0 ? (
                  <div className="border-3 border-dashed border-[#121212] bg-white rounded p-8 text-center">
                    <p className="font-space text-xs font-bold text-gray-400">No active community hubs found. Please contact an admin to start a new hub.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {communities.map((comm) => (
                      <button
                        key={comm.id}
                        onClick={() => setSelectedCommunityId(comm.id)}
                        className={`px-4 py-2 border-2 border-[#121212] rounded font-display font-black text-xs uppercase tracking-wider transition-all shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none cursor-pointer ${
                          selectedCommunityId === comm.id
                            ? "bg-yellow-festival text-[#121212]"
                            : "bg-white text-gray-500 hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {comm.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Community Hub Feed */}
              {selectedCommunityId && (
                <div className="border-3 border-[#121212] bg-[#FAF8F5] p-5 rounded shadow-brutal space-y-4">
                  {(() => {
                    const currentComm = communities.find((c) => c.id === selectedCommunityId);
                    if (!currentComm) return null;
                    return (
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#121212]/15 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-black text-lg uppercase text-red-stage">
                              {currentComm.name}
                            </h3>
                            <button
                              onClick={() => handleJoinCommunity(currentComm.id)}
                              disabled={joiningCommunity === currentComm.id}
                              className="text-[9px] font-black bg-green-100 hover:bg-green-200 text-green-800 px-2 py-0.5 border border-green-300 rounded uppercase tracking-widest cursor-pointer disabled:opacity-50"
                            >
                              {joiningCommunity === currentComm.id ? "JOINING..." : "JOIN HUB"}
                            </button>
                          </div>
                          <p className="font-space text-xs text-gray-600 italic">
                            {currentComm.description || "Active community hub for creator discussions."}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => setShowCreatePostModal(true)}
                          className="bg-[#121212] text-[#FAF8F5] font-black uppercase text-[10px] tracking-wider px-3 py-2 border border-[#121212] rounded shadow-brutal-sm hover:translate-y-[1px] hover:shadow-none cursor-pointer"
                        >
                          + Write Post
                        </button>
                      </div>
                    );
                  })()}

                  {postsLoading ? (
                    <div className="space-y-3 py-6">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse bg-white border-2 border-[#121212] p-4 rounded space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3" />
                          <div className="h-3 bg-gray-200 rounded w-full" />
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="py-12 text-center bg-white border-2 border-dashed border-[#121212]/10 rounded space-y-3">
                      <Sparkles size={24} className="mx-auto text-gray-300 animate-spin" />
                      <p className="font-space text-xs font-bold text-gray-400">
                        No discussion posts here yet. Be the first to write one!
                      </p>
                      <button
                        onClick={() => setShowCreatePostModal(true)}
                        className="bg-yellow-festival border-2 border-[#121212] font-black uppercase text-[10px] px-3.5 py-1.5 rounded shadow-brutal-sm cursor-pointer"
                      >
                        + Write First Post
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div key={post.id} className="bg-white border-3 border-[#121212] p-5 rounded shadow-brutal space-y-3 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-red-stage/10 flex items-center justify-center font-display font-black text-[10px] border border-[#121212]/10">
                              {(post.author?.fullName || "?")[0]}
                            </div>
                            <div className="leading-none">
                              <span className="font-display font-bold text-xs block">{post.author?.fullName || "Creator"}</span>
                              <span className="text-[8px] text-gray-400 font-mono block">{timeAgo(post.createdAt)}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <h4 className="font-display font-extrabold text-sm uppercase">{post.title || "Untitled Discussion"}</h4>
                            <p className="font-space text-xs text-gray-600 leading-relaxed">{post.content}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 border-t border-[#121212]/10 pt-3">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className={`text-[9px] font-black uppercase flex items-center gap-1 px-2.5 py-1  rounded border-2 border-[#121212] transition-all cursor-pointer ${
                                likedPosts.has(post.id) ? "bg-red-stage text-white" : "bg-white hover:bg-red-50"
                              }`}
                            >
                              ♥ {post._count?.likes || 0}
                            </button>
                            <button
                              onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                              className="text-[9px] font-black uppercase flex items-center gap-1 px-2.5 py-1  rounded border-2 border-[#121212] bg-white hover:bg-gray-50 transition-all cursor-pointer"
                            >
                              💬 {post._count?.comments || 0} Comments
                            </button>

                            {post.authorId === user?.id && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-[9px] font-black uppercase flex items-center gap-1 px-2.5 py-1 rounded border-2 border-red-500 bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer ml-auto"
                              >
                                🗑 Delete
                              </button>
                            )}
                          </div>

                          {commentingOn === post.id && (
                            <div className="flex gap-2 pt-2">
                              <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 p-2 border-2 border-[#121212] rounded font-space text-xs focus:outline-none bg-white"
                              />
                              <button
                                onClick={() => handleSubmitComment(post.id)}
                                disabled={submittingComment}
                                className="px-3 py-2 bg-yellow-festival border-2 border-[#121212] rounded font-black text-xs uppercase disabled:opacity-50 cursor-pointer"
                              >
                                {submittingComment ? "..." : "POST"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}           onClick={() => handleSubmitComment(post.id)}
                                disabled={submittingComment}
                                className="px-3 py-2 bg-yellow-festival border-2 border-[#121212] rounded font-black text-xs uppercase disabled:opacity-50 cursor-pointer"
                              >
                                {submittingComment ? "..." : "POST"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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



      {/* Create Discussion Post Modal */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-[9999] bg-[#121212]/80 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <form 
            onSubmit={handleCreatePost}
            className="bg-[#FAF8F5] border-4 border-[#121212] p-6 max-w-md w-full rounded shadow-brutal space-y-4 text-[#121212] font-space relative my-8"
          >
            <button 
              type="button"
              onClick={() => setShowCreatePostModal(false)}
              className="absolute top-4 right-4 w-8 h-8 border-2 border-[#121212] bg-white rounded flex items-center justify-center hover:bg-gray-100 font-black shadow-brutal-sm cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="bg-yellow-festival text-[#121212] text-[9px] font-black uppercase px-2 py-0.5 rounded">Discussion Board</span>
              <h3 className="font-display font-black text-2xl uppercase tracking-tight mt-1">WRITE A NEW POST</h3>
              <p className="text-[11px] text-gray-500 font-bold">Start a thread or share a collaboration query in this hub.</p>
            </div>

            {postError && (
              <div className="bg-red-100 text-red-800 border-2 border-red-300 p-2.5 rounded text-xs font-bold flex items-center gap-1">
                <AlertCircle size={14} />
                <span>{postError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500">Post Title</label>
                <input 
                  className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded"
                  placeholder="e.g. Seeking Flute Player for next Sunday jam"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500">Content</label>
                <textarea 
                  rows={4} 
                  className="w-full border-2 border-[#121212] p-2 text-xs font-bold rounded resize-none"
                  placeholder="Share details, dates, coordinates..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingPost}
              className="w-full bg-[#121212] text-white border-3 border-[#121212] font-display font-black text-xs uppercase py-3 rounded shadow-brutal hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
            >
              {creatingPost ? "Publishing..." : "Publish Post (+30 XP)"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

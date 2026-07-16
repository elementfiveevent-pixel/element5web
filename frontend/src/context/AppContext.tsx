"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

// Types
export interface Artist {
  id: string;
  name: string;
  genre: string;
  location: string;
  rating: number;
  followers: number;
  bio: string;
  votes: number;
  stageVerseScore: number;
  performancesCount: number;
  badges: string[];
  recentActivity: string;
  trend: "up" | "down" | "stable";
  avatar: string;
  cover: string;
  videos: { title: string; url: string; platform: "youtube" | "vimeo" }[];
  skills: string[];
  experience: string;
  awards: string[];
  availability: "Available" | "Booked" | "Collab Only";
  collaborationsOpen: boolean;
  socials: {
    instagram?: string;
    youtube?: string;
    spotify?: string;
    website?: string;
  };
}

export interface EventScheduleItem {
  time: string;
  title: string;
  description: string;
  artist?: string;
}

export interface Event {
  id: string;
  title: string;
  type: "StageVerse" | "Element Talks" | "Element Expo" | "Element Fest" | "Element Connect";
  date: string;
  time: string;
  venue: string;
  description: string;
  image: string;
  countdownDate: string;
  schedule: EventScheduleItem[];
  sponsors: { name: string; logo: string }[];
  audienceCount: number;
  registrationProgress: number; // 0 to 100
  registrationLimit: number;
  isCompleted: boolean;
  slug?: string;
  isPaid?: boolean;
  price?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface CollabRequest {
  id: string;
  title: string;
  category: "Need Guitarist" | "Need Singer" | "Need Rapper" | "Need Host" | "Need Photographer" | "Need Videographer" | "Need Dancer";
  authorId: string;
  authorName: string;
  description: string;
  date: string;
}

interface AppContextProps {
  artists: Artist[];
  events: Event[];
  messages: Message[];
  collabRequests: CollabRequest[];
  userVotes: Record<string, string>; // artistId -> eventId
  registeredEvents: string[]; // eventIds
  userXP: number;
  userLevel: number;
  userBadges: string[];
  voteForArtist: (artistId: string, eventId: string) => void;
  registerForEvent: (eventId: string) => void;
  sendMessage: (receiverId: string, text: string) => void;
  createCollabRequest: (category: CollabRequest["category"], title: string, description: string) => void;
  setArtists: React.Dispatch<React.SetStateAction<Artist[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  addUserXP: (amount: number) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const initialArtists: Artist[] = [];

const initialEvents: Event[] = [];

const initialMessages: Message[] = [];

const initialCollabs: CollabRequest[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [collabRequests, setCollabRequests] = useState<CollabRequest[]>(initialCollabs);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [userXP, setUserXP] = useState(120);
  const [userLevel, setUserLevel] = useState(1);
  const [userBadges, setUserBadges] = useState<string[]>(["First Performance"]);

  // Load state from local storage on mount
  useEffect(() => {
    const cachedVotes = localStorage.getItem("e5_user_votes");
    const cachedRegs = localStorage.getItem("e5_user_regs");
    const cachedXP = localStorage.getItem("e5_user_xp");
    const cachedLevel = localStorage.getItem("e5_user_level");
    const cachedBadges = localStorage.getItem("e5_user_badges");
    const cachedArtists = localStorage.getItem("e5_artists");
    const cachedCollabs = localStorage.getItem("e5_collabs");

    if (cachedVotes) setUserVotes(JSON.parse(cachedVotes));
    if (cachedRegs) setRegisteredEvents(JSON.parse(cachedRegs));
    if (cachedXP) setUserXP(parseInt(cachedXP));
    if (cachedLevel) setUserLevel(parseInt(cachedLevel));
    if (cachedBadges) setUserBadges(JSON.parse(cachedBadges));
    if (cachedArtists) setArtists(JSON.parse(cachedArtists));
    if (cachedCollabs) setCollabRequests(JSON.parse(cachedCollabs));
  }, []);

  // Fetch events from the backend on mount
  useEffect(() => {
    api.get("/events")
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        if (list.length > 0) {
          const mapped = list.map((e: any) => ({
            id: e.id,
            title: e.title,
            type: e.category === "STAGEVERSE" ? "StageVerse" : "Element Talks",
            date: e.startDate ? (() => { try { return new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch { return "TBD"; } })() : "TBD",
            time: e.startDate ? (() => { try { return new Date(e.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); } catch { return "TBD"; } })() : "TBD",
            venue: e.location?.venueName || "TBD",
            description: e.description || "",
            image: e.flyerUrl || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
            countdownDate: e.startDate,
            schedule: [],
            sponsors: [],
            audienceCount: e.registrationsCount || 0,
            registrationProgress: e.maxCapacity ? Math.round((e.registrationsCount / e.maxCapacity) * 100) : 0,
            registrationLimit: e.maxCapacity || 100,
            isCompleted: ["COMPLETED", "ARCHIVED", "CANCELLED"].includes(e.status) || new Date(e.endDate || e.startDate) < new Date(),
            slug: e.slug,
            isPaid: e.isPaid,
            price: e.price,
          }));
          setEvents(mapped);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch events in AppContext:", err);
      });
  }, []);

  // Fetch artists from the backend on mount
  useEffect(() => {
    api.get("/artists")
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        if (list.length > 0) {
          const mapped = list.map((ap: any) => ({
            id: ap.user?.id || ap.userId || `artist-${ap.id}`,
            name: ap.stageName || ap.user?.fullName || "Verified Creator",
            genre: Array.isArray(ap.genres) ? ap.genres.join(" / ") : ap.genre || "Performance",
            location: `${ap.city || "Gujarat"}, India`,
            rating: 4.8,
            followers: ap.user?.reputationXp ? Math.floor(ap.user.reputationXp * 1.5) + 120 : 120,
            bio: ap.biography || "No bio posted yet.",
            votes: 0,
            stageVerseScore: 50,
            performancesCount: ap.performances?.length || 0,
            badges: ap.isVerified ? ["Verified Creator"] : [],
            recentActivity: "Joined Element 5 Hub",
            trend: "stable" as const,
            avatar: ap.user?.profilePhotoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
            cover: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
            videos: ap.portfolioUrls ? ap.portfolioUrls.map((url: string) => ({ title: "Portfolio Work", url, platform: "youtube" as const })) : [],
            skills: ap.skills || [],
            experience: ap.experience || "1 Year",
            awards: ap.achievements ? ap.achievements.map((ac: any) => ac.achievement?.title || "Award") : [],
            availability: ap.availabilityStatus === "AVAILABLE" ? "Available" as const : ap.availabilityStatus === "BOOKED" ? "Booked" as const : "Collab Only" as const,
            collaborationsOpen: ap.availabilityStatus === "AVAILABLE" || ap.availabilityStatus === "ON_TOUR",
            socials: {
              instagram: ap.instagramHandle || "",
              youtube: ap.youtubeLink || "",
            },
          }));
          setArtists(mapped);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch artists in AppContext:", err);
      });
  }, []);

  const addUserXP = (amount: number) => {
    setUserXP((prev) => {
      const newXP = prev + amount;
      localStorage.setItem("e5_user_xp", newXP.toString());
      
      // Calculate level-up (every 100 XP is a level)
      const newLevel = Math.floor(newXP / 100) + 1;
      if (newLevel > userLevel) {
        setUserLevel(newLevel);
        localStorage.setItem("e5_user_level", newLevel.toString());
        // Award badge for leveling up
        if (newLevel === 2 && !userBadges.includes("Rising Star")) {
          const updatedBadges = [...userBadges, "Rising Star"];
          setUserBadges(updatedBadges);
          localStorage.setItem("e5_user_badges", JSON.stringify(updatedBadges));
        }
      }
      return newXP;
    });
  };

  const voteForArtist = async (artistId: string, eventId: string) => {
    try {
      await api.post(`/stageverse/submissions/${artistId}/vote`);
    } catch (err) {
      console.warn("Backend vote failed, falling back to local simulation:", err);
    }

    // Cast user vote locally
    const updatedVotes = { ...userVotes, [artistId]: eventId };
    setUserVotes(updatedVotes);
    localStorage.setItem("e5_user_votes", JSON.stringify(updatedVotes));

    // Increment artist votes & leaderboard score
    const updatedArtists = artists.map((artist) => {
      if (artist.id === artistId) {
        const votesCount = artist.votes + 1;
        const score = Math.min(100, Math.floor(artist.stageVerseScore + 0.5));
        
        // Award user badge for voting
        if (!userBadges.includes("Active Judge")) {
          const updatedBadges = [...userBadges, "Active Judge"];
          setUserBadges(updatedBadges);
          localStorage.setItem("e5_user_badges", JSON.stringify(updatedBadges));
        }
        
        return {
          ...artist,
          votes: votesCount,
          stageVerseScore: score
        };
      }
      return artist;
    });

    setArtists(updatedArtists);
    localStorage.setItem("e5_artists", JSON.stringify(updatedArtists));
    addUserXP(25); // 25 XP for voting
  };

  const registerForEvent = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/register`);
    } catch (err) {
      console.warn("Backend registration failed, falling back to local simulation:", err);
    }

    if (registeredEvents.includes(eventId)) return;

    const updatedRegs = [...registeredEvents, eventId];
    setRegisteredEvents(updatedRegs);
    localStorage.setItem("e5_user_regs", JSON.stringify(updatedRegs));

    // Update event registration progress
    const updatedEvents = events.map((event) => {
      if (event.id === eventId) {
        const newAudience = event.audienceCount + 1;
        const progress = Math.floor((newAudience / event.registrationLimit) * 100);
        return {
          ...event,
          audienceCount: newAudience,
          registrationProgress: progress
        };
      }
      return event;
    });

    setEvents(updatedEvents);
    addUserXP(50); // 50 XP for registering
  };

  const sendMessage = async (receiverId: string, text: string) => {
    try {
      await api.post("/social/messages", { recipientId: receiverId, content: text });
    } catch (err) {
      console.warn("Backend message send failed, falling back to local simulation:", err);
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: "currentUser",
      receiverId,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);
    addUserXP(10); // 10 XP for communicating
  };

  const createCollabRequest = async (category: CollabRequest["category"], title: string, description: string) => {
    try {
      await api.post("/social/communities", { name: title, description: `${category}: ${description}` });
    } catch (err) {
      console.warn("Backend community creation failed, falling back to local simulation:", err);
    }

    const newRequest: CollabRequest = {
      id: `collab-${Date.now()}`,
      title,
      category,
      authorId: "currentUser",
      authorName: "You (Creator)",
      description,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" })
    };

    const updatedCollabs = [newRequest, ...collabRequests];
    setCollabRequests(updatedCollabs);
    localStorage.setItem("e5_collabs", JSON.stringify(updatedCollabs));
    addUserXP(40); // 40 XP for creating a request
  };

  return (
    <AppContext.Provider
      value={{
        artists,
        events,
        messages,
        collabRequests,
        userVotes,
        registeredEvents,
        userXP,
        userLevel,
        userBadges,
        voteForArtist,
        registerForEvent,
        sendMessage,
        createCollabRequest,
        setArtists,
        setEvents,
        addUserXP
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

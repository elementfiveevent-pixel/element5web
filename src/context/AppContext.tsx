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

const initialArtists: Artist[] = [
  {
    id: "artist-1",
    name: "MC Kavyo",
    genre: "Hip-Hop / Rap",
    location: "Rajkot, India",
    rating: 4.9,
    followers: 1240,
    bio: "Pioneer of Gujarati underground hip-hop. Spitting bars since 2021. Founder of Rajkot Rap Cyphers. Focuses on bringing authentic street poetry to the masses.",
    votes: 430,
    stageVerseScore: 92,
    performancesCount: 15,
    badges: ["Verified Creator", "Lyrics Champ", "Crowd Puller"],
    recentActivity: "Performed at Replay Arena Rajkot",
    trend: "up",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    cover: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4",
    videos: [{ title: "Kavyo - 'Street Truths' Live", url: "https://youtu.be/dQw4w9WgXcQ", platform: "youtube" }],
    skills: ["Rapping", "Lyricism", "Beatbox", "Hosting"],
    experience: "5+ Years",
    awards: ["Best Underground Artist 2024", "StageVerse Rajkot Champion"],
    availability: "Available",
    collaborationsOpen: true,
    socials: { instagram: "kavyo_rap", youtube: "kavyoofficial" },
  },
  {
    id: "artist-2",
    name: "Electronic Gentry",
    genre: "EDM / Synthwave",
    location: "Ahmedabad, India",
    rating: 4.7,
    followers: 820,
    bio: "Independent electronic music producer blending retro synth waves with modern hard hitting drops. Known for high energy live visual synthesizers.",
    votes: 210,
    stageVerseScore: 84,
    performancesCount: 8,
    badges: ["Verified Creator", "Synth Wizard"],
    recentActivity: "Released new single 'Neon Rajkot'",
    trend: "up",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
    videos: [],
    skills: ["Music Production", "Ableton Live", "Modular Synth"],
    experience: "3 Years",
    awards: ["Best Electronic Act - Vadodara Hub"],
    availability: "Collab Only",
    collaborationsOpen: true,
    socials: { instagram: "elec_gentry", spotify: "open.spotify.com/artist/elec" },
  },
  {
    id: "artist-3",
    name: "Aanya Mehta",
    genre: "Indie Pop",
    location: "Vadodara, India",
    rating: 4.8,
    followers: 2100,
    bio: "Singer songwriter and acoustic guitarist writing heartfelt lyrics about simple lives. Often seen doing intimate living room gigs and local cafe events.",
    votes: 350,
    stageVerseScore: 89,
    performancesCount: 22,
    badges: ["Verified Creator", "Melody Queen"],
    recentActivity: "Cafe tour completed in Vadodara",
    trend: "stable",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
    videos: [],
    skills: ["Singing", "Acoustic Guitar", "Songwriting"],
    experience: "4 Years",
    awards: [],
    availability: "Booked",
    collaborationsOpen: false,
    socials: { instagram: "aanya_music" },
  }
];

const initialEvents: Event[] = [
  {
    id: "mock-event-1",
    title: "StageVerse 4.0: Rajkot Edition",
    type: "StageVerse",
    date: "18 Jul, 2026",
    time: "19:00",
    venue: "Replay Arena, Rajkot, Gujarat",
    description: "The ultimate live performance showdown for underground hip-hop, rap, and electronic artists in Rajkot. Cast your votes live, witness raw talent on stage, and be part of the creator economy.",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7",
    countdownDate: "2026-07-18T19:00:00",
    schedule: [
      { time: "19:00", title: "Gates Open", description: "Audience check-in and entry" },
      { time: "19:30", title: "Opening Beats", description: "DJ set by Electronic Gentry" },
      { time: "20:00", title: "StageVerse Showdown", description: "Live voting round with 6 artists" },
      { time: "21:30", title: "Winner Announcement", description: "XP and rewards distribution" },
    ],
    sponsors: [
      { name: "Red Bull", logo: "https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=50" },
      { name: "Pioneer DJ", logo: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=50" },
    ],
    audienceCount: 142,
    registrationProgress: 71,
    registrationLimit: 200,
    isCompleted: false,
  },
  {
    id: "mock-event-2",
    title: "Soundwaves Music Festival",
    type: "Element Fest",
    date: "25 Aug, 2026",
    time: "16:00",
    venue: "Shastri Ground, Rajkot, Gujarat",
    description: "A grand multi-genre music festival featuring indie rock bands, electronic DJs, folk artists, and food trucks. Experience the biggest cultural event of the year.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745",
    countdownDate: "2026-08-25T16:00:00",
    schedule: [],
    sponsors: [],
    audienceCount: 850,
    registrationProgress: 85,
    registrationLimit: 1000,
    isCompleted: false,
  },
  {
    id: "mock-event-3",
    title: "Vocal Masterclass with MC Kavyo",
    type: "Element Talks",
    date: "10 Sep, 2026",
    time: "14:00",
    venue: "Studio 51, Rajkot, Gujarat",
    description: "Learn performance skills, mic control, stage presence, and voice modulation from the pioneer of Gujarati rap, MC Kavyo. Limited seats available.",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b",
    countdownDate: "2026-09-10T14:00:00",
    schedule: [],
    sponsors: [],
    audienceCount: 18,
    registrationProgress: 36,
    registrationLimit: 50,
    isCompleted: false,
  }
];

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
            date: new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            time: new Date(e.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
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

    // Simulate mock responder after 2 seconds
    setTimeout(() => {
      const recipient = artists.find((a) => a.id === receiverId);
      const recipientName = recipient ? recipient.name : "Artist";
      const replyMsg: Message = {
        id: `msg-reply-${Date.now()}`,
        senderId: receiverId,
        receiverId: "currentUser",
        text: `Hey there! This is ${recipientName}. Thanks for reaching out! Let's check schedules soon and hook up for a jam. Send me your work links!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 2000);
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

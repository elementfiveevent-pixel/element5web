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
    id: "aarav-mehta",
    name: "Aarav Mehta",
    genre: "Gujarati Poetry & Storytelling",
    location: "Ahmedabad, Gujarat",
    rating: 4.9,
    followers: 12400,
    bio: "Blending classical Gujarati literature with modern spoken-word rhythms. Telling stories of Ahmedabad streets, ancient pols, and contemporary youth struggles.",
    votes: 485,
    stageVerseScore: 97,
    performancesCount: 18,
    badges: ["Legend", "1000 Votes", "Community Favorite"],
    recentActivity: "Performed at StageVerse 1.0 (Winner)",
    trend: "up",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    cover: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=1200&h=400&fit=crop",
    videos: [
      { title: "Ahmedabad Ni Galiyo (Spoken Word)", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", platform: "youtube" },
      { title: "Maro Shaher (StageVerse 1.0)", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", platform: "youtube" }
    ],
    skills: ["Spoken Word Poetry", "Script Writing", "Narrator"],
    experience: "3+ Years performing across Western India",
    awards: ["Best Poet - StageVerse 1.0", "Youth Icon of Gujarat 2025 Nominee"],
    availability: "Available",
    collaborationsOpen: true,
    socials: {
      instagram: "https://instagram.com/aarav_mehta",
      youtube: "https://youtube.com/c/aaravpoetry",
      spotify: "https://open.spotify.com/artist/aarav"
    }
  },
  {
    id: "shreya-joshi",
    name: "Shreya Joshi",
    genre: "Sufi & Experimental Indie Rock",
    location: "Vadodara, Gujarat",
    rating: 4.8,
    followers: 9800,
    bio: "Combining traditional Sufi poetry with alternative rock. Known for powerful high notes and haunting acoustic arrangements.",
    votes: 420,
    stageVerseScore: 94,
    performancesCount: 12,
    badges: ["Top Performer", "500 Votes", "Rising Star"],
    recentActivity: "Released a new acoustic session video",
    trend: "up",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop",
    videos: [
      { title: "Maula - Sufi Cover Live", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", platform: "youtube" }
    ],
    skills: ["Classical Vocals", "Acoustic Guitar", "Songwriting"],
    experience: "5 Years classical training, 2 years stage performance",
    awards: ["Winner - Vadodara Indie Fest 2025"],
    availability: "Collab Only",
    collaborationsOpen: true,
    socials: {
      instagram: "https://instagram.com/shreya_sufirock",
      spotify: "https://open.spotify.com/artist/shreya"
    }
  },
  {
    id: "krish-patel",
    name: "D-Vibe (Krish Patel)",
    genre: "Desi Hip-Hop & Rap",
    location: "Surat, Gujarat",
    rating: 4.7,
    followers: 18200,
    bio: "Spitting rapid-fire bars in Gujarati, Hindi, and English. Bringing the raw Surat street culture onto the big stage.",
    votes: 395,
    stageVerseScore: 92,
    performancesCount: 22,
    badges: ["1000 Votes", "Rising Star"],
    recentActivity: "Freestyle session went viral on Instagram Reels",
    trend: "stable",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=400&fit=crop",
    videos: [
      { title: "Surti Locho (Gujarati Rap)", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", platform: "youtube" }
    ],
    skills: ["Rapping", "Beat Production", "Songwriting"],
    experience: "Rap battles veteran in Mumbai & Surat circuits",
    awards: ["StageVerse 2.0 Runner Up"],
    availability: "Available",
    collaborationsOpen: true,
    socials: {
      instagram: "https://instagram.com/dvibe_music",
      youtube: "https://youtube.com/c/dvibehiphop"
    }
  },
  {
    id: "riya-shah",
    name: "Riya Shah",
    genre: "Stand-Up Comedy",
    location: "Rajkot, Gujarat",
    rating: 4.6,
    followers: 7200,
    bio: "Observations on Gujarati family dynamics, NRI cousins, and engineering struggles. Punchy, clean, and relatable humor.",
    votes: 310,
    stageVerseScore: 89,
    performancesCount: 10,
    badges: ["Community Favorite", "10 Performances"],
    recentActivity: "Booked for upcoming corporate show in Ahmedabad",
    trend: "up",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=1200&h=400&fit=crop",
    videos: [
      { title: "Gujarati Shaadi Shenanigans", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", platform: "youtube" }
    ],
    skills: ["Stand-Up Comedy", "Improv", "Acting"],
    experience: "Performed 40+ open mics across India",
    awards: ["Best Comic - Rajkot Comedy Open 2024"],
    availability: "Available",
    collaborationsOpen: false,
    socials: {
      instagram: "https://instagram.com/riya_laughs"
    }
  },
  {
    id: "kunal-vyas",
    name: "Beat-Boxer Kunal",
    genre: "Beatboxing & Loop Station",
    location: "Ahmedabad, Gujarat",
    rating: 4.9,
    followers: 15600,
    bio: "A one-man electronic dance music show using only vocal cords and loops. Reinventing EDM live performances.",
    votes: 490,
    stageVerseScore: 98,
    performancesCount: 26,
    badges: ["Legend", "1000 Votes", "Top Performer"],
    recentActivity: "Headlining the pre-event showcase of StageVerse 3.0",
    trend: "up",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=400&fit=crop",
    videos: [
      { title: "Vocal Synthesizer Routine", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", platform: "youtube" }
    ],
    skills: ["Vocal Scratching", "Loop Station Setup", "Bass Synthesis"],
    experience: "Represented Gujarat in National Beatboxing Championship",
    awards: ["Gujarat Beatbox Champion 2025"],
    availability: "Available",
    collaborationsOpen: true,
    socials: {
      instagram: "https://instagram.com/kunal_beats",
      youtube: "https://youtube.com/c/kunalbeatbox"
    }
  }
];

const initialEvents: Event[] = [
  {
    id: "stageverse-3.0",
    title: "StageVerse 3.0: Ahmedabad Edition",
    type: "StageVerse",
    date: "July 26, 2026",
    time: "7:00 PM onwards",
    venue: "The Brutalist Box, Sindhu Bhavan Road, Ahmedabad",
    description: "Gujarat's biggest community-driven Open Mic is back for Season 3. Witness 15 hand-selected creators battling live. You are the judge — audience votes decide the champion who walks away with ₹2,500, professional recordings, and featured promotion.",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=500&fit=crop",
    countdownDate: "2026-07-26T19:00:00+05:30",
    schedule: [
      { time: "07:00 PM", title: "Gates Open & Networking", description: "Grab a drink, meet fellow creators, and experience interactive digital installations." },
      { time: "07:30 PM", title: "Opening Showcase", description: "Guest routine by Kunal Vyas (Loop Station Beatboxing)." },
      { time: "07:45 PM", title: "Artist Lineup: Round 1", description: "First 7 artists perform (Poetry, Rap, Stand-up)." },
      { time: "08:45 PM", title: "Mid-Show Talks", description: "Brief panel on building the creator ecosystem in Gujarat by Element 5 Founders." },
      { time: "09:00 PM", title: "Artist Lineup: Round 2", description: "Remaining 8 artists perform." },
      { time: "10:00 PM", title: "Live Audience Voting & Winner Crowned", description: "Audience scans code, casts votes, live leaderboard results, and awards ceremony." }
    ],
    sponsors: [
      { name: "Red Bull Culture", logo: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&h=50&fit=crop" },
      { name: "Vite Studios", logo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=50&fit=crop" }
    ],
    audienceCount: 148,
    registrationProgress: 72,
    registrationLimit: 250,
    isCompleted: false
  },
  {
    id: "element-talks-1.0",
    title: "Element Talks 1.0: Creative Monetization",
    type: "Element Talks",
    date: "August 15, 2026",
    time: "4:00 PM - 6:30 PM",
    venue: "Vibrant Hub, Vadodara",
    description: "An intensive masterclass panel on how local regional artists can build sustainable income models, secure brand deals, and distribute music/performances on major streaming portals.",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=500&fit=crop",
    countdownDate: "2026-08-15T16:00:00+05:30",
    schedule: [
      { time: "04:00 PM", title: "Keynote Address", description: "Structuring your creator brand." },
      { time: "04:45 PM", title: "Panel Discussion", description: "Surviving as a full-time creator in Gujarat." },
      { time: "05:45 PM", title: "Interactive Q&A", description: "Reviewing audience portfolios." }
    ],
    sponsors: [],
    audienceCount: 82,
    registrationProgress: 45,
    registrationLimit: 120,
    isCompleted: false
  },
  {
    id: "stageverse-2.0",
    title: "StageVerse 2.0: Surat Showcase",
    type: "StageVerse",
    date: "June 14, 2026",
    time: "6:30 PM",
    venue: "The Art Loft, Surat",
    description: "Our historic Surat event where D-Vibe and Kunal Vyas set the stage on fire. Fully booked within 2 hours of announcement, resulting in over 10K social views.",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
    countdownDate: "2026-06-14T18:30:00+05:30",
    schedule: [],
    sponsors: [],
    audienceCount: 180,
    registrationProgress: 100,
    registrationLimit: 180,
    isCompleted: true
  }
];

const initialMessages: Message[] = [
  { id: "m1", senderId: "aarav-mehta", receiverId: "currentUser", text: "Hey! Loved your recent video submission. Are you down to collaborate on a poetry-meets-beatbox track for the next StageVerse?", timestamp: "07:32 PM" }
];

const initialCollabs: CollabRequest[] = [
  { id: "c1", title: "Need Guitarist for Sufi Rock Track", category: "Need Guitarist", authorId: "shreya-joshi", authorName: "Shreya Joshi", description: "Looking for an acoustic/electric guitarist in Vadodara to track riffs for an upcoming single. High energy Sufi structure.", date: "July 07, 2026" },
  { id: "c2", title: "Videographer needed for Rap Video", category: "Need Videographer", authorId: "krish-patel", authorName: "Krish Patel", description: "Shooting a street rap video around Surat. Need someone with active stabilizer rig and sharp editing style.", date: "July 06, 2026" }
];

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

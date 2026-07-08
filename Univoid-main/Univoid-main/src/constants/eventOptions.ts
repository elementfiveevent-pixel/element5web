// Event Categories (Main Themes) - organized by groups
export interface CategoryGroup {
  emoji: string;
  label: string;
  items: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    emoji: "🎓",
    label: "Academic / Education",
    items: ["Academic", "Education", "Research", "Science", "Engineering", "Medical", "Law", "Business Studies"],
  },
  {
    emoji: "💻",
    label: "Technology",
    items: ["Tech", "AI / ML", "Programming", "Cybersecurity", "Data Science", "Web Development", "Mobile Development", "Blockchain", "Gaming / Game Dev"],
  },
  {
    emoji: "🚀",
    label: "Startup & Business",
    items: ["Startup", "Entrepreneurship", "Business", "Marketing", "Finance", "Investment", "Networking"],
  },
  {
    emoji: "🎭",
    label: "Cultural & Arts",
    items: ["Cultural", "Arts", "Literature", "Theatre", "Dance", "Painting", "Photography", "Film"],
  },
  {
    emoji: "🎵",
    label: "Music & Performance",
    items: ["Music", "Performance", "Live Music", "Band", "DJ"],
  },
  {
    emoji: "🎤",
    label: "Entertainment",
    items: ["Comedy", "Entertainment", "Open Mic", "Talent Show", "Show"],
  },
  {
    emoji: "🧘",
    label: "Lifestyle & Wellness",
    items: ["Fitness", "Yoga", "Meditation", "Health", "Mental Health", "Wellness"],
  },
  {
    emoji: "⚽",
    label: "Sports",
    items: ["Sports", "Athletics", "eSports", "Fitness Challenge"],
  },
  {
    emoji: "🙏",
    label: "Spiritual / Religious",
    items: ["Spiritual", "Religious", "Bhajan", "Kirtan", "Satsang"],
  },
  {
    emoji: "🌍",
    label: "Community",
    items: ["Community", "Social", "Meetup", "Volunteering", "NGO"],
  },
  {
    emoji: "🎉",
    label: "Festival / Celebration",
    items: ["Festival", "Celebration", "Holiday Event"],
  },
];

// Flat list of all categories for validation
export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.items);

// Event Types (Format of Event) - organized by groups
export interface TypeGroup {
  label: string;
  items: string[];
}

export const TYPE_GROUPS: TypeGroup[] = [
  {
    label: "General Formats",
    items: [
      "Hackathon", "Workshop", "Seminar", "Conference", "Meetup",
      "Competition", "Festival", "Party", "Concert", "Webinar",
      "Bootcamp", "Panel Discussion", "Masterclass", "Networking Event",
      "Training", "Summit", "Exhibition", "Expo", "Launch Event",
      "Demo Day", "Orientation", "Camp", "Tournament", "Screening",
    ],
  },
  {
    label: "Open Mic Types",
    items: [
      "Poetry Open Mic", "Standup Comedy Open Mic", "Music Open Mic",
      "Storytelling Open Mic", "Rap / Hip Hop Open Mic", "Spoken Word",
      "Shayari Night", "Mixed Open Mic",
    ],
  },
  {
    label: "Competition Types",
    items: [
      "Coding Competition", "Case Study Competition", "Debate Competition",
      "Quiz Competition", "Dance Competition", "Singing Competition",
      "Startup Pitch Competition", "Gaming Tournament",
    ],
  },
  {
    label: "Music Event Types",
    items: [
      "Live Concert", "DJ Night", "Band Night", "Music Festival",
      "Classical Music Event", "Folk Music Event",
    ],
  },
  {
    label: "Startup Event Types",
    items: [
      "Startup Pitch", "Investor Meet", "Founder Meetup",
      "Startup Networking",
    ],
  },
  {
    label: "Sports Event Types",
    items: [
      "League", "Marathon", "Friendly Match",
    ],
  },
  {
    label: "College Event Types",
    items: [
      "Tech Fest", "Cultural Fest", "Sports Fest",
    ],
  },
];

// Flat list of all event types
export const ALL_EVENT_TYPES = TYPE_GROUPS.flatMap(g => g.items);

// Max selections allowed
export const MAX_CATEGORIES = 3;
export const MAX_EVENT_TYPES = 3;

// Helper to parse comma-separated values from DB
export function parseMultiValue(value: string): string[] {
  if (!value) return [];
  return value.split(",").map(v => v.trim()).filter(Boolean);
}

// Helper to join values for DB storage
export function joinMultiValue(values: string[]): string {
  return values.join(", ");
}

// For filter dropdown - flattened unique categories with "all"
export const FILTER_CATEGORIES = [
  { value: "all", label: "All Categories" },
  ...CATEGORY_GROUPS.map(g => ({
    value: g.items[0].toLowerCase(),
    label: `${g.emoji} ${g.label}`,
  })),
];

// Database types for UniVoid

export type ContentStatus = 'pending' | 'approved' | 'rejected';
export type AppRole = 'admin' | 'student' | 'organizer' | 'admin_assistant';
export type ProfileType = 'quick' | 'full';
export type OnboardingStatus = 'none' | 'partial' | 'complete';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  college_name: string;
  course_stream: string;
  year_semester: string;
  mobile_number: string | null;
  profile_photo_url: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
  // Verification fields
  email_verified?: boolean;
  phone_verified?: boolean;
  is_disabled?: boolean;
  // Onboarding fields
  profile_complete?: boolean;
  profile_type?: ProfileType;
  onboarding_status?: OnboardingStatus;
  degree?: string | null;
  branch?: string | null;
  current_year?: number | null;
  city?: string | null;
  state?: string | null;
  interests?: string[] | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  // Metadata fields
  course: string | null;
  branch: string | null;
  subject: string | null;
  language: string | null;
  college: string | null;
  // Engagement metrics
  views_count: number;
  downloads_count: number;
  likes_count: number;
  shares_count: number;
  file_hash: string | null;
  thumbnail_url: string | null;
  // Joined data
  contributor_name?: string;
  user_has_liked?: boolean;
}

export interface News {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  external_link: string | null;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  contributor_name?: string;
}

export type BookListingType = 'sell' | 'rent' | 'donate' | 'exchange';

export interface Book {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  condition: string | null;
  image_urls: string[];
  seller_mobile: string;
  seller_address: string;
  seller_email: string;
  is_sold: boolean;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  // New fields
  category: string | null;
  author: string | null;
  views_count: number;
  listing_type: BookListingType;
  contributor_name?: string;
  // SEO slug for URL-friendly paths
  slug?: string | null;
}

// Book categories
export const BOOK_CATEGORIES = [
  'Academic Textbooks',
  'Technology & Programming',
  'Competitive Exams',
  'Fiction',
  'Non-Fiction',
  'Reference Books',
  'Self-Help',
  'Other',
] as const;

export type BookCategory = typeof BOOK_CATEGORIES[number];

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  content_type: string | null;
  content_id: string | null;
  created_at: string;
}

// XP values per requirement
export const XP_VALUES = {
  verification: 20,      // Email OR Phone verification (one-time)
  material_approved: 30, // Study material upload
  news_approved: 10,     // News publish
  book_listed: 20,       // Book listing
  daily_login: 2,        // Daily login (once per day)
} as const;

// Blocked video formats
export const BLOCKED_VIDEO_FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];

// Calculate user level from XP per requirement:
// Level 1: 0–50 XP
// Level 2: 51–150 XP
// Level 3: 151–300 XP
// Level 4: 300+ XP
export function calculateLevel(xp: number): number {
  if (xp <= 50) return 1;
  if (xp <= 150) return 2;
  if (xp <= 300) return 3;
  return 4;
}

// Get XP thresholds for level progress
export function getLevelProgress(xp: number): { current: number; max: number; nextLevel: number } {
  if (xp <= 50) return { current: xp, max: 50, nextLevel: 2 };
  if (xp <= 150) return { current: xp - 50, max: 100, nextLevel: 3 };
  if (xp <= 300) return { current: xp - 150, max: 150, nextLevel: 4 };
  return { current: xp - 300, max: xp - 300 + 100, nextLevel: 5 }; // Level 4+ continues
}

// Public profile (what's shown to others)
export interface PublicProfile {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  total_xp: number;
  level: number;
  rank?: number;
  materials_count: number;
  news_count: number;
  books_count: number;
}

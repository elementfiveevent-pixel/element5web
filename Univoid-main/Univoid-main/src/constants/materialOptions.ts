// Material upload options with "Other" support

export const COURSE_OPTIONS = [
  'BE',
  'BTech',
  'BSc',
  'Diploma',
  'BCA',
  'MCA',
  'MTech',
  'MBA',
  'Other',
] as const;

export const BRANCH_OPTIONS = [
  'CSE',
  'IT',
  'Mechanical',
  'Civil',
  'Electrical',
  'Electronics',
  'ECE',
  'ALL',
  'Other',
] as const;

export const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Gujarati',
  'Other',
] as const;

export type CourseOption = typeof COURSE_OPTIONS[number];
export type BranchOption = typeof BRANCH_OPTIONS[number];
export type LanguageOption = typeof LANGUAGE_OPTIONS[number];

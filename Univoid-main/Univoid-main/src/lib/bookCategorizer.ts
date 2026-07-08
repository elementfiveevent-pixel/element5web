/**
 * Simple keyword-based book categorization
 * Analyzes title and description to auto-assign a category
 */

type BookCategory = 
  | 'Fiction'
  | 'Academic'
  | 'Competitive Exam'
  | 'Biography'
  | 'Self-Help'
  | 'Technology'
  | 'Other';

interface CategoryRule {
  category: BookCategory;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Competitive Exam',
    keywords: ['jee', 'neet', 'upsc', 'gate', 'cat', 'gre', 'gmat', 'ssc', 'bank exam', 'railway', 'defence', 'nda', 'cds', 'ias', 'ips', 'clat', 'aiims'],
  },
  {
    category: 'Academic',
    keywords: ['textbook', 'engineering', 'maths', 'mathematics', 'physics', 'chemistry', 'biology', 'economics', 'accounting', 'management', 'btech', 'bsc', 'mba', 'bba', 'bca', 'mca', 'medical', 'law', 'semester', 'syllabus', 'ncert', 'cbse', 'icse'],
  },
  {
    category: 'Technology',
    keywords: ['programming', 'coding', 'software', 'ai', 'artificial intelligence', 'machine learning', 'computer', 'python', 'java', 'javascript', 'web development', 'data science', 'algorithm', 'database', 'cloud', 'devops', 'cybersecurity'],
  },
  {
    category: 'Biography',
    keywords: ['biography', 'life of', 'autobiography', 'memoir', 'life story', 'journey of'],
  },
  {
    category: 'Self-Help',
    keywords: ['self help', 'self-help', 'motivation', 'mindset', 'success', 'habits', 'productivity', 'personal development', 'growth', 'leadership', 'think and grow', 'atomic habits', 'power of'],
  },
  {
    category: 'Fiction',
    keywords: ['novel', 'story', 'fiction', 'thriller', 'mystery', 'romance', 'fantasy', 'adventure', 'horror', 'sci-fi', 'science fiction', 'short stories', 'tales'],
  },
];

/**
 * Determines the category for a book based on its title and description
 */
export function categorizeBook(title: string, description?: string | null): BookCategory {
  const searchText = `${title} ${description || ''}`.toLowerCase();
  
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return rule.category;
      }
    }
  }
  
  return 'Other';
}

/**
 * Get display-friendly category or fallback to "Other"
 */
export function getDisplayCategory(category: string | null | undefined): string {
  if (!category || category.trim() === '') {
    return 'Other';
  }
  return category;
}

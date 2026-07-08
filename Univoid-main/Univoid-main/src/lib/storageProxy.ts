/**
 * STORAGE URL UTILITIES
 * 
 * This module provides utilities for generating UniVoid-branded URLs
 * that proxy file requests through edge functions. Supabase URLs are
 * NEVER exposed to end users.
 * 
 * All storage files are served via:
 * - univoid.tech/api/file-proxy (for downloads)
 * - univoid.tech/api/image-proxy (for inline images)
 * 
 * STORAGE PATH FORMAT:
 * Files are stored as "bucket:path" in the database (e.g., "event-assets:userId/flyer.png")
 * This format is converted to proxy URLs when displaying to users.
 */

// Base URL for edge functions (auto-detected from environment)
const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL 
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

// Production domain for user-facing URLs
const PRODUCTION_DOMAIN = 'https://univoid.tech';

/**
 * Bucket types supported by the proxy
 */
export type StorageBucket = 
  | 'materials'
  | 'book-images'
  | 'profile-photos'
  | 'event-assets'
  | 'organizer-logos'
  | 'news-images';

/**
 * Extracts the storage path from a full Supabase URL
 * Handles both public and signed URLs
 */
export function extractStoragePath(url: string, bucket: StorageBucket): string | null {
  if (!url) return null;
  
  // If it's already just a path (no http), return as-is
  if (!url.startsWith('http')) {
    return url;
  }
  
  // Extract path from Supabase public URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/bucket/path
  const publicMatch = url.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+?)(?:\\?|$)`));
  if (publicMatch) {
    return decodeURIComponent(publicMatch[1]);
  }
  
  // Extract path from Supabase signed URL
  // Format: https://xxx.supabase.co/storage/v1/object/sign/bucket/path?token=xxx
  const signedMatch = url.match(new RegExp(`/storage/v1/object/sign/${bucket}/(.+?)(?:\\?|$)`));
  if (signedMatch) {
    return decodeURIComponent(signedMatch[1]);
  }
  
  // Can't extract - might be external URL
  return null;
}

/**
 * Generates a proxied file URL that hides Supabase infrastructure
 * For downloads and PDF previews
 */
export function getProxiedFileUrl(
  bucket: StorageBucket,
  path: string,
  options?: { download?: boolean }
): string {
  const params = new URLSearchParams({
    bucket,
    path,
  });
  
  if (options?.download) {
    params.set('download', 'true');
  }
  
  return `${EDGE_FUNCTION_BASE}/file-proxy?${params.toString()}`;
}

/**
 * Generates a proxied image URL for inline display
 * Optimized for image loading with aggressive caching
 */
export function getProxiedImageUrl(bucket: StorageBucket, path: string): string {
  const params = new URLSearchParams({
    bucket,
    path,
  });
  
  return `${EDGE_FUNCTION_BASE}/image-proxy?${params.toString()}`;
}

/**
 * Generates a proxied material download URL by ID
 * For material downloads where we know the material ID
 */
export function getMaterialDownloadUrl(materialId: string, download = true): string {
  const params = new URLSearchParams({
    id: materialId,
  });
  
  if (download) {
    params.set('download', 'true');
  }
  
  return `${EDGE_FUNCTION_BASE}/file-proxy?${params.toString()}`;
}

/**
 * Converts any Supabase storage URL to a UniVoid proxy URL
 * Use this for URLs stored in the database that need to be displayed to users
 */
export function toProxiedUrl(
  originalUrl: string | null | undefined,
  bucket: StorageBucket,
  options?: { forceImage?: boolean; download?: boolean }
): string | null {
  if (!originalUrl) return null;
  
  // If it's already a proxy URL, return as-is
  if (originalUrl.includes('/file-proxy') || originalUrl.includes('/image-proxy')) {
    return originalUrl;
  }
  
  // Extract the storage path
  const path = extractStoragePath(originalUrl, bucket);
  if (!path) {
    // Can't extract path - might be external URL (like Google avatar)
    // Return original if it doesn't contain supabase.co
    if (!originalUrl.includes('supabase.co')) {
      return originalUrl;
    }
    return null;
  }
  
  // Generate proxy URL
  if (options?.forceImage) {
    return getProxiedImageUrl(bucket, path);
  }
  
  return getProxiedFileUrl(bucket, path, { download: options?.download });
}

/**
 * Gets a user-facing URL for sharing (uses production domain)
 * This should be used for URLs that will be shared externally
 */
export function getShareableFileUrl(bucket: StorageBucket, path: string): string {
  const params = new URLSearchParams({
    bucket,
    path,
  });
  
  // Use production domain for shareable URLs
  return `${PRODUCTION_DOMAIN}/api/file?${params.toString()}`;
}

/**
 * Check if a URL is a Supabase storage URL
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage');
}

/**
 * Parse stored path format "bucket:path" into components
 * Returns null if not in stored path format
 */
export function parseStoredPath(storedPath: string): { bucket: StorageBucket; path: string } | null {
  if (!storedPath || !storedPath.includes(':')) return null;
  
  const colonIndex = storedPath.indexOf(':');
  const bucket = storedPath.substring(0, colonIndex) as StorageBucket;
  const path = storedPath.substring(colonIndex + 1);
  
  // Validate bucket
  const validBuckets: StorageBucket[] = [
    'materials', 'book-images', 'profile-photos', 
    'event-assets', 'organizer-logos', 'news-images'
  ];
  
  if (!validBuckets.includes(bucket)) return null;
  
  return { bucket, path };
}

/**
 * Convert stored path to display URL
 * Handles all formats:
 * - "bucket:path" format -> proxy URL
 * - Full Supabase URL -> proxy URL
 * - External URL (Google avatar) -> pass through
 * - null/undefined -> null
 */
export function toDisplayUrl(
  storedValue: string | null | undefined,
  options?: { forceImage?: boolean; download?: boolean }
): string | null {
  if (!storedValue) return null;
  
  // Check for "bucket:path" format first (new format)
  const parsed = parseStoredPath(storedValue);
  if (parsed) {
    if (options?.forceImage) {
      return getProxiedImageUrl(parsed.bucket, parsed.path);
    }
    return getProxiedFileUrl(parsed.bucket, parsed.path, { download: options?.download });
  }
  
  // If it's not a Supabase URL, return as-is (external URLs like Google avatar)
  if (!storedValue.includes('supabase.co')) {
    return storedValue;
  }
  
  // Legacy: Extract path from Supabase URL and convert to proxy
  // Try to detect bucket from URL
  const buckets: StorageBucket[] = [
    'materials', 'book-images', 'profile-photos', 
    'event-assets', 'organizer-logos', 'news-images'
  ];
  
  for (const bucket of buckets) {
    const path = extractStoragePath(storedValue, bucket);
    if (path) {
      if (options?.forceImage) {
        return getProxiedImageUrl(bucket, path);
      }
      return getProxiedFileUrl(bucket, path, { download: options?.download });
    }
  }
  
  // Can't parse - return null to hide the broken URL
  console.warn('Could not parse storage URL:', storedValue);
  return null;
}

/**
 * Sanitizes a URL to ensure no Supabase infrastructure is exposed
 * Returns null if the URL can't be sanitized
 */
export function sanitizeStorageUrl(
  url: string | null | undefined,
  bucket: StorageBucket
): string | null {
  if (!url) return null;
  
  // Check for stored path format
  const parsed = parseStoredPath(url);
  if (parsed) {
    return getProxiedImageUrl(parsed.bucket, parsed.path);
  }
  
  // Already safe (external URL not from Supabase)
  if (!url.includes('supabase.co')) {
    return url;
  }
  
  // Convert to proxy URL
  return toProxiedUrl(url, bucket, { forceImage: true });
}

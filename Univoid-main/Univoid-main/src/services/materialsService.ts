import { supabase } from '@/integrations/supabase/client';
import { Material, BLOCKED_VIDEO_FORMATS } from '@/types/database';
import { MAX_FILE_SIZE_BYTES, validateMaterialFile } from '@/lib/fileCompression';
import { materialsLogger } from '@/services/errorLoggingService';
import type { CursorPage, CursorPageParam } from '@/hooks/useCursorPagination';
import { resumableUpload, RESUMABLE_THRESHOLD } from '@/hooks/useResumableUpload';
import { getMaterialDownloadUrl } from '@/lib/storageProxy';

/**
 * Get proper user-friendly error message for upload failures
 * NEVER show "Network error" unless user is actually offline
 */
function getUploadErrorMessage(error: any): string {
  // Only show network error if actually offline
  if (!navigator.onLine) {
    return 'You are offline. Please check your internet connection.';
  }

  const message = error?.message || '';
  const statusCode = error?.statusCode || error?.status;

  // Storage-specific errors
  if (message.includes('Invalid key') || message.includes('invalid key')) {
    return 'Upload failed due to file path issue. Please try again.';
  }

  if (message.includes('exceeded') || message.includes('size') || statusCode === 413) {
    return 'File is too large. Please try a smaller file (max 16MB).';
  }

  if (statusCode === 403 || message.includes('permission') || message.includes('not authorized')) {
    return 'You do not have permission to upload. Please log in again.';
  }

  if (statusCode === 401 || message.includes('unauthorized') || message.includes('JWT')) {
    return 'Your session has expired. Please refresh the page and try again.';
  }

  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'Upload timed out. Please try again with a stable connection.';
  }

  if (message.includes('bucket') || message.includes('Bucket')) {
    return 'Storage configuration error. Please contact support.';
  }

  // Generic fetch failures - could be CORS, policy, or actual network
  if (message.includes('fetch') || message.includes('network')) {
    // But we already checked navigator.onLine, so it's likely a backend issue
    return 'Upload failed. Please try again or contact support if the issue persists.';
  }

  // Default: show the actual error for debugging
  return message || 'Upload failed. Please try again.';
}

export interface MaterialFilters {
  status?: 'approved' | 'all';
  branch?: string;
  course?: string;
  subject?: string;
  search?: string;
}

/**
 * Fetch materials with cursor-based pagination
 * Uses created_at as the cursor for consistent ordering
 */
export async function getMaterialsWithCursor(
  params: CursorPageParam,
  filters: MaterialFilters = {}
): Promise<CursorPage<Material>> {
  const { cursor, limit } = params;
  const { status = 'approved', branch, course, subject, search } = filters;

  let query = supabase
    .from('materials')
    .select('id, title, description, file_type, file_size, subject, branch, course, college, language, downloads_count, views_count, likes_count, shares_count, status, created_at, created_by, thumbnail_url', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit + 1); // Fetch one extra to check if there's more

  // Apply cursor filter
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Apply filters
  if (status === 'approved') {
    query = query.eq('status', 'approved');
  }
  if (branch) {
    query = query.eq('branch', branch);
  }
  if (course) {
    query = query.eq('course', course);
  }
  if (subject) {
    query = query.ilike('subject', `%${subject}%`);
  }
  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const materials = (data || []) as Material[];
  
  // Check if there are more items
  const hasMore = materials.length > limit;
  const items = hasMore ? materials.slice(0, limit) : materials;
  
  // Get next cursor from the last item
  const nextCursor = hasMore && items.length > 0 
    ? items[items.length - 1].created_at 
    : null;

  // Batch fetch contributor names in a single query
  const userIds = [...new Set(items.map(m => m.created_by))];
  const contributorNames: Record<string, string> = {};
  
  if (userIds.length > 0) {
    const { data: namesData } = await supabase.rpc('get_contributor_names', {
      user_ids: userIds,
    });
    
    if (namesData) {
      for (const row of namesData) {
        contributorNames[row.user_id] = row.full_name || 'Anonymous';
      }
    }
  }

  for (const material of items) {
    material.contributor_name = contributorNames[material.created_by] || 'Anonymous';
  }

  return {
    data: items,
    nextCursor,
    hasMore,
    totalCount: count ?? undefined,
  };
}

// Legacy function for backward compatibility
export async function getMaterials(status: 'approved' | 'all' = 'approved'): Promise<Material[]> {
  const result = await getMaterialsWithCursor({ cursor: null, limit: 50 }, { status });
  return result.data;
}

// Explicit column selection for materials - includes all required fields
const MATERIAL_COLUMNS = 'id, title, description, file_type, file_size, file_url, subject, branch, course, college, language, downloads_count, views_count, likes_count, shares_count, status, created_at, created_by, updated_at, thumbnail_url, preview_file_url, preview_page_limit, preview_ready, file_hash, admin_previewed';

export async function getMaterialById(id: string): Promise<Material | null> {
  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_COLUMNS)
    .eq('id', id)
    .single();

  if (error) return null;

  const material = data as Material;
  const { data: nameData } = await supabase.rpc('get_contributor_name', {
    user_id: material.created_by,
  });
  material.contributor_name = nameData || 'Anonymous';

  return material;
}

interface UploadOptions {
  onProgress?: (progress: number, stage: string) => void;
  course?: string;
  branch?: string;
  subject?: string;
  language?: string;
  college?: string;
  skipCompression?: boolean; // Skip client-side compression for faster uploads
}

/**
 * OPTIMIZED UPLOAD FLOW:
 * 1. Validate file (instant)
 * 2. Upload raw file to storage (main wait time - network dependent)
 * 3. Insert DB record immediately with status='pending'
 * 4. Return success to user FAST
 * 5. Background: PDF compression, signed URL refresh, notifications
 * 
 * This removes 5-10 seconds of blocking on mobile devices.
 */
export async function uploadMaterial(
  file: File,
  title: string,
  description: string,
  userId: string,
  options?: UploadOptions
): Promise<{ id: string | null; error: Error | null }> {
  const uploadId = crypto.randomUUID().slice(0, 8);
  const logPrefix = `[Upload ${uploadId}]`;
  
  console.log(`${logPrefix} Starting optimized upload:`, {
    originalFileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    fileType: file.type,
    online: navigator.onLine,
  });

  const reportProgress = (progress: number, stage: string) => {
    options?.onProgress?.(progress, stage);
  };

  try {
    // STAGE 1: Validate file (instant)
    reportProgress(5, 'Validating file...');
    
    const validationError = validateMaterialFile(file);
    if (validationError) {
      console.error(`${logPrefix} Validation failed:`, validationError);
      return { id: null, error: new Error(validationError) };
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (BLOCKED_VIDEO_FORMATS.includes(fileExt)) {
      return { id: null, error: new Error('Video files are not allowed') };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { id: null, error: new Error('File size must be less than 100MB') };
    }

    reportProgress(10, 'Preparing upload...');

    // STAGE 2: Upload file to storage
    // Use resumable upload for large files (>10MB), regular upload for smaller files
    const safeStorageFileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${userId}/${safeStorageFileName}`;
    const useResumable = file.size > RESUMABLE_THRESHOLD;
    
    console.log(`${logPrefix} Upload method:`, { 
      filePath, 
      useResumable,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      threshold: `${(RESUMABLE_THRESHOLD / 1024 / 1024).toFixed(0)} MB`,
    });

    const uploadStartTime = Date.now();
    
    if (useResumable) {
      // Large file: Use TUS resumable upload (can resume on failure)
      reportProgress(15, 'Starting resumable upload...');
      
      try {
        await resumableUpload(file, filePath, 'materials', (progress) => {
          // Map 0-100 to 15-70 range for our progress
          const mappedProgress = 15 + (progress.progress * 0.55);
          reportProgress(Math.round(mappedProgress), progress.stage);
        });
        console.log(`${logPrefix} Resumable upload completed in ${Date.now() - uploadStartTime}ms`);
      } catch (uploadError: any) {
        console.error(`${logPrefix} Resumable upload FAILED:`, uploadError);
        return { id: null, error: new Error(getUploadErrorMessage(uploadError)) };
      }
    } else {
      // Small file: Use regular upload (faster for small files)
      reportProgress(15, 'Uploading file...');
      
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      console.log(`${logPrefix} Storage upload completed in ${Date.now() - uploadStartTime}ms`);

      if (uploadError) {
        console.error(`${logPrefix} UPLOAD FAILED:`, {
          errorMessage: uploadError.message,
          statusCode: (uploadError as any).statusCode,
          online: navigator.onLine,
        });
        return { id: null, error: new Error(getUploadErrorMessage(uploadError)) };
      }
    }

    reportProgress(70, 'Saving to database...');

    // STAGE 3: Insert DB record immediately
    // Store file_path instead of signed URL - URLs generated on-demand
    const isImageFile = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExt.toLowerCase());
    
    const { data, error } = await supabase
      .from('materials')
      .insert({
        title,
        description,
        file_url: filePath, // Store path, not signed URL (generated on-demand)
        file_type: fileExt,
        file_size: file.size,
        created_by: userId,
        status: 'pending',
        course: options?.course || null,
        branch: options?.branch || null,
        subject: options?.subject || null,
        language: options?.language || null,
        college: options?.college || null,
        preview_file_url: null, // Generated in background
        preview_page_limit: isImageFile ? 1 : 5,
        preview_ready: false, // Background processing will set to true
      })
      .select('id')
      .single();

    if (error) {
      console.error(`${logPrefix} Database insert error:`, error);
      return { id: null, error: new Error('Failed to save material. Please try again.') };
    }

    console.log(`${logPrefix} Material created successfully:`, { materialId: data.id });
    reportProgress(90, 'Finalizing...');

    // STAGE 4: Background tasks (non-blocking)
    // These run AFTER we return success to the user
    triggerBackgroundProcessing(data.id, filePath, fileExt, userId, title);

    reportProgress(100, 'Done!');
    
    return { id: data.id, error: null };
  } catch (error: any) {
    console.error(`${logPrefix} UNEXPECTED ERROR:`, error);
    return { id: null, error: new Error(getUploadErrorMessage(error)) };
  }
}

/**
 * Background processing - runs after upload success is returned to user
 * Handles: PDF compression, preview generation, notifications
 */
function triggerBackgroundProcessing(
  materialId: string,
  filePath: string,
  fileExt: string,
  userId: string,
  title: string
) {
  // All these are fire-and-forget (non-blocking)
  
  // 1. PDF compression (if applicable)
  if (fileExt === 'pdf') {
    supabase.functions.invoke('compress-pdf', {
      body: { filePath, bucket: 'materials', materialId },
    }).catch((err) => console.warn('Background PDF compression failed:', err));
  }

  // 2. Get uploader name and notify admins (async, wrap in Promise for proper chaining)
  (async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      
      await supabase.functions.invoke('notify-pending-review', {
        body: {
          materialId,
          title,
          uploaderName: profile?.full_name || 'A user',
          contentType: 'material',
        },
      });
    } catch (err) {
      console.warn('Background notification failed:', err);
    }
  })();
}

export async function getMyMaterials(userId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_COLUMNS)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Material[];
}

/**
 * Generate signed URL on-demand for downloads
 * This is called when user clicks download, NOT during upload
 */
export async function getDownloadUrl(materialId: string): Promise<string | null> {
  const material = await getMaterialById(materialId);
  if (!material) return null;

  return getMaterialDownloadUrl(materialId, true);
}

export async function getPendingMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select(MATERIAL_COLUMNS)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const materials = data as Material[];
  
  // Batch fetch contributor names
  const userIds = [...new Set(materials.map(m => m.created_by))];
  if (userIds.length > 0) {
    const { data: namesData } = await supabase.rpc('get_contributor_names', {
      user_ids: userIds,
    });
    
    const contributorNames: Record<string, string> = {};
    if (namesData) {
      for (const row of namesData) {
        contributorNames[row.user_id] = row.full_name || 'Anonymous';
      }
    }
    
    for (const material of materials) {
      material.contributor_name = contributorNames[material.created_by] || 'Anonymous';
    }
  }

  return materials;
}

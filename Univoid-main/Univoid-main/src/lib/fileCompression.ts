// Enhanced file compression utility for study materials (100MB support)

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionProgress {
  stage: 'analyzing' | 'compressing' | 'optimizing' | 'complete';
  progress: number;
  message: string;
}

// Maximum upload size: 100MB
export const MAX_FILE_SIZE_MB = 100;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  documents: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf'],
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
  archives: ['zip', 'rar', '7z'],
  ebooks: ['epub', 'mobi'],
};

export const BLOCKED_FILE_TYPES = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'exe', 'bat', 'sh', 'dll', 'apk'];

// Validate file before upload
export function validateMaterialFile(file: File): string | null {
  // Check size (100MB limit)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File size must be less than ${MAX_FILE_SIZE_MB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`;
  }
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Check blocked types
  if (BLOCKED_FILE_TYPES.includes(ext)) {
    return `${ext.toUpperCase()} files are not allowed`;
  }
  
  // Check if it's an allowed type
  const allAllowed = [
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.archives,
    ...ALLOWED_FILE_TYPES.ebooks,
  ];
  
  if (!allAllowed.includes(ext)) {
    return `${ext.toUpperCase()} files are not supported. Allowed: PDF, DOC, PPT, images, ZIP`;
  }
  
  return null;
}

// Determine if file is a book/ebook
export function isBookFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ['pdf', 'epub', 'mobi'].includes(ext);
}

// Compress image with quality reduction
async function compressImage(
  file: File, 
  targetSizeMB: number = 5,
  onProgress?: (p: CompressionProgress) => void
): Promise<File> {
  return new Promise((resolve) => {
    onProgress?.({ stage: 'analyzing', progress: 10, message: 'Analyzing image...' });
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        onProgress?.({ stage: 'compressing', progress: 30, message: 'Compressing image...' });
        
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Scale down large images
        const maxDimension = 2400;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        onProgress?.({ stage: 'optimizing', progress: 60, message: 'Optimizing quality...' });
        
        // Try different quality levels
        let quality = 0.85;
        const targetSize = targetSizeMB * 1024 * 1024;
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              
              if (blob.size > targetSize && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
                return;
              }
              
              onProgress?.({ stage: 'complete', progress: 100, message: 'Compression complete!' });
              
              // Use WebP for better compression if possible
              const outputType = 'image/webp';
              const ext = file.name.includes('.') ? file.name.split('.').pop() : 'webp';
              const newName = file.name.replace(`.${ext}`, '.webp');
              
              const compressedFile = new File([blob], newName, {
                type: outputType,
                lastModified: Date.now(),
              });
              
              resolve(compressedFile);
            },
            'image/webp',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => resolve(file);
    };
    
    reader.onerror = () => resolve(file);
  });
}

// Main compression function
export async function compressFile(
  file: File,
  onProgress?: (p: CompressionProgress) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  onProgress?.({ stage: 'analyzing', progress: 5, message: 'Analyzing file...' });
  
  // Compress images
  if (ALLOWED_FILE_TYPES.images.includes(ext)) {
    const compressed = await compressImage(file, 5, onProgress);
    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
      compressionRatio: ((originalSize - compressed.size) / originalSize) * 100,
    };
  }
  
  // For PDFs, documents, and other files - return as-is
  // Server-side compression would handle these
  onProgress?.({ stage: 'complete', progress: 100, message: 'Ready for upload' });
  
  return {
    file,
    originalSize,
    compressedSize: file.size,
    compressionRatio: 0,
  };
}

// Generate preview pages info for books/PDFs
export function getPreviewPagesCount(totalPages: number): number {
  // Allow preview of first 10-15% of pages, minimum 3, maximum 20
  const previewPercent = 0.15;
  const calculated = Math.ceil(totalPages * previewPercent);
  return Math.max(3, Math.min(20, calculated));
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Image compression utility for book uploads

export interface CompressedImage {
  file: File;
  preview: string;
}

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve({
              file: compressedFile,
              preview: canvas.toDataURL('image/jpeg', quality),
            });
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Could not load image'));
    };
    
    reader.onerror = () => reject(new Error('Could not read file'));
  });
}

export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed';
  }
  
  // 10MB max before compression
  if (file.size > 10 * 1024 * 1024) {
    return 'Image must be less than 10MB';
  }
  
  return null;
}

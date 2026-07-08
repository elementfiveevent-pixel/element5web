import { useState, useCallback, useRef } from 'react';
import * as tus from 'tus-js-client';
import { supabase } from '@/integrations/supabase/client';

// Files larger than 10MB use resumable uploads
export const RESUMABLE_THRESHOLD = 10 * 1024 * 1024;

interface UploadProgress {
  progress: number;
  stage: string;
  bytesUploaded: number;
  bytesTotal: number;
  speed?: number; // bytes per second
}

interface UseResumableUploadOptions {
  bucket: string;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (filePath: string) => void;
  onError?: (error: Error) => void;
  chunkSize?: number;
}

interface UseResumableUploadReturn {
  upload: (file: File, filePath: string) => Promise<string>;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isUploading: boolean;
  isPaused: boolean;
  progress: UploadProgress;
}

/**
 * Hook for resumable file uploads using TUS protocol
 * Automatically resumes failed uploads and shows detailed progress
 */
export function useResumableUpload(options: UseResumableUploadOptions): UseResumableUploadReturn {
  const { bucket, onProgress, onSuccess, onError, chunkSize = 6 * 1024 * 1024 } = options;
  
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    progress: 0,
    stage: 'Preparing...',
    bytesUploaded: 0,
    bytesTotal: 0,
  });
  
  const uploadRef = useRef<tus.Upload | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastBytesRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const updateProgress = useCallback((bytesUploaded: number, bytesTotal: number) => {
    const now = Date.now();
    const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
    
    // Calculate speed (bytes per second)
    let speed: number | undefined;
    if (lastTimeRef.current && now - lastTimeRef.current > 500) {
      const timeDiff = (now - lastTimeRef.current) / 1000;
      const bytesDiff = bytesUploaded - lastBytesRef.current;
      speed = bytesDiff / timeDiff;
      lastBytesRef.current = bytesUploaded;
      lastTimeRef.current = now;
    } else if (!lastTimeRef.current) {
      lastTimeRef.current = now;
      lastBytesRef.current = bytesUploaded;
    }
    
    let stage = 'Uploading...';
    if (percentage < 5) stage = 'Starting upload...';
    else if (percentage >= 95) stage = 'Finalizing...';
    else if (speed) {
      const mbSpeed = (speed / 1024 / 1024).toFixed(1);
      stage = `Uploading (${mbSpeed} MB/s)...`;
    }
    
    const progressData: UploadProgress = {
      progress: percentage,
      stage,
      bytesUploaded,
      bytesTotal,
      speed,
    };
    
    setProgress(progressData);
    onProgress?.(progressData);
  }, [onProgress]);

  const upload = useCallback(async (file: File, filePath: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsUploading(true);
        setIsPaused(false);
        startTimeRef.current = Date.now();
        lastTimeRef.current = 0;
        lastBytesRef.current = 0;
        
        // Get auth session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Authentication required for upload');
        }

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        if (!projectId) {
          throw new Error('Supabase project configuration missing');
        }

        // Create TUS upload
        const tusUpload = new tus.Upload(file, {
          endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000, 10000], // Retry on failure
          chunkSize,
          headers: {
            authorization: `Bearer ${session.access_token}`,
            apikey: anonKey,
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucket,
            objectName: filePath,
            contentType: file.type || 'application/octet-stream',
            cacheControl: '3600',
          },
          onError: (error) => {
            console.error('TUS upload error:', error);
            setIsUploading(false);
            const err = new Error(error.message || 'Upload failed');
            onError?.(err);
            reject(err);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            updateProgress(bytesUploaded, bytesTotal);
          },
          onSuccess: () => {
            setIsUploading(false);
            setProgress({
              progress: 100,
              stage: 'Upload complete!',
              bytesUploaded: file.size,
              bytesTotal: file.size,
            });
            onSuccess?.(filePath);
            resolve(filePath);
          },
        });

        uploadRef.current = tusUpload;

        // Check for previous uploads to resume
        const previousUploads = await tusUpload.findPreviousUploads();
        if (previousUploads.length > 0) {
          console.log('Resuming previous upload...');
          setProgress(prev => ({ ...prev, stage: 'Resuming upload...' }));
          tusUpload.resumeFromPreviousUpload(previousUploads[0]);
        }

        // Start the upload
        tusUpload.start();
      } catch (error: any) {
        setIsUploading(false);
        const err = error instanceof Error ? error : new Error(error?.message || 'Upload failed');
        onError?.(err);
        reject(err);
      }
    });
  }, [bucket, chunkSize, onError, onProgress, onSuccess, updateProgress]);

  const cancel = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
      setIsUploading(false);
      setIsPaused(false);
      setProgress({
        progress: 0,
        stage: 'Cancelled',
        bytesUploaded: 0,
        bytesTotal: 0,
      });
    }
  }, []);

  const pause = useCallback(() => {
    if (uploadRef.current && isUploading && !isPaused) {
      uploadRef.current.abort();
      setIsPaused(true);
      setProgress(prev => ({ ...prev, stage: 'Paused' }));
    }
  }, [isUploading, isPaused]);

  const resume = useCallback(() => {
    if (uploadRef.current && isPaused) {
      uploadRef.current.start();
      setIsPaused(false);
      setProgress(prev => ({ ...prev, stage: 'Resuming...' }));
    }
  }, [isPaused]);

  return {
    upload,
    cancel,
    pause,
    resume,
    isUploading,
    isPaused,
    progress,
  };
}

/**
 * One-shot resumable upload function for use outside of React components
 */
export async function resumableUpload(
  file: File,
  filePath: string,
  bucket: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Authentication required for upload');
  }

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  if (!projectId) {
    throw new Error('Supabase project configuration missing');
  }

  return new Promise((resolve, reject) => {
    const tusUpload = new tus.Upload(file, {
      endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      chunkSize: 6 * 1024 * 1024,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: filePath,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      onError: (error) => {
        console.error('Resumable upload error:', error);
        reject(new Error(error.message || 'Upload failed'));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        onProgress?.({
          progress: percentage,
          stage: percentage >= 95 ? 'Finalizing...' : 'Uploading...',
          bytesUploaded,
          bytesTotal,
        });
      },
      onSuccess: () => {
        onProgress?.({
          progress: 100,
          stage: 'Complete!',
          bytesUploaded: file.size,
          bytesTotal: file.size,
        });
        resolve(filePath);
      },
    });

    // Check for previous uploads
    tusUpload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        console.log('Resuming previous upload for:', filePath);
        tusUpload.resumeFromPreviousUpload(previousUploads[0]);
      }
      tusUpload.start();
    });
  });
}

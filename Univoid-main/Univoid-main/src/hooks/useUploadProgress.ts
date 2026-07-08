import { useState, useRef, useCallback } from 'react';

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  fileName: string | null;
}

export function useUploadProgress() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    fileName: null,
  });

  const startUpload = useCallback((fileName: string) => {
    setUploadProgress({
      isUploading: true,
      progress: 0,
      fileName,
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setUploadProgress((prev) => ({
      ...prev,
      progress: Math.min(progress, 100),
    }));
  }, []);

  const completeUpload = useCallback(() => {
    setUploadProgress((prev) => ({
      ...prev,
      progress: 100,
    }));
    
    // Reset after a short delay
    setTimeout(() => {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        fileName: null,
      });
    }, 500);
  }, []);

  const resetUpload = useCallback(() => {
    setUploadProgress({
      isUploading: false,
      progress: 0,
      fileName: null,
    });
  }, []);

  // Simulate progress for uploads that don't report progress
  const simulateProgress = useCallback((durationMs: number = 3000) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / durationMs) * 90, 90); // Max 90% until complete
      setUploadProgress((prev) => ({
        ...prev,
        progress,
      }));
      
      if (elapsed >= durationMs) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    uploadProgress,
    startUpload,
    updateProgress,
    completeUpload,
    resetUpload,
    simulateProgress,
  };
}

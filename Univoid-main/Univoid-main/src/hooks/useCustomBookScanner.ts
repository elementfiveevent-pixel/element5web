import { useState, useCallback } from 'react';

/**
 * Response from the custom book scanning API
 */
interface BookMetadata {
  title: string | null;
  author: string | null;
  isbn: string | null;
  confidence: number;
  raw_text?: string;
}

interface ScanResponse {
  success: boolean;
  data?: BookMetadata;
  error?: string;
}

interface UseCustomBookScannerOptions {
  /** The base URL of your custom API (e.g., 'https://your-api.railway.app') */
  apiUrl?: string;
}

/**
 * Custom hook for scanning book covers using external FastAPI service.
 * Calls custom OCR/ML API for book cover recognition.
 *
 * @example
 * ```tsx
 * const { scanBookImage, scanning, result, error } = useCustomBookScanner({
 *   apiUrl: 'https://your-api.railway.app'
 * });
 * 
 * const handleImageUpload = async (file: File) => {
 *   const metadata = await scanBookImage(file);
 *   if (metadata) {
 *     setTitle(metadata.title || '');
 *     setAuthor(metadata.author || '');
 *   }
 * };
 * ```
 */
export const useCustomBookScanner = (options?: UseCustomBookScannerOptions) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<BookMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get API URL from options, environment variable, or use empty string
  const apiUrl = options?.apiUrl || import.meta.env.VITE_BOOK_SCANNER_API_URL || '';

  /**
   * Scan a book cover image using the custom API
   * @param file - Image file to scan
   * @returns Book metadata or null if scan failed
   */
  const scanBookImage = useCallback(async (file: File): Promise<BookMetadata | null> => {
    if (!apiUrl) {
      const errorMsg = 'Book scanner API URL not configured. Set VITE_BOOK_SCANNER_API_URL in your environment.';
      console.error(errorMsg);
      setError(errorMsg);
      return null;
    }

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/scan-book`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data: ScanResponse = await response.json();

      if (data.success && data.data) {
        setResult(data.data);
        return data.data;
      } else {
        const errorMsg = data.error || 'Scan failed - no data returned';
        setError(errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? `Network error: ${err.message}` 
        : 'Network error: Unable to connect to scanning service';
      console.error('Book scan error:', err);
      setError(errorMsg);
      return null;
    } finally {
      setScanning(false);
    }
  }, [apiUrl]);

  /**
   * Scan a book cover from a base64 image string
   * @param base64Image - Base64 encoded image (data URL format)
   * @returns Book metadata or null if scan failed
   */
  const scanBookImageBase64 = useCallback(async (base64Image: string): Promise<BookMetadata | null> => {
    // Convert base64 to File
    const response = await fetch(base64Image);
    const blob = await response.blob();
    const file = new File([blob], 'book-cover.jpg', { type: 'image/jpeg' });
    
    return scanBookImage(file);
  }, [scanBookImage]);

  /**
   * Clear the current result and error state
   */
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    /** Scan a book cover image file */
    scanBookImage,
    /** Scan a book cover from base64 string */
    scanBookImageBase64,
    /** Clear result and error state */
    clearResult,
    /** Whether a scan is in progress */
    scanning,
    /** The result of the last successful scan */
    result,
    /** Error message from the last scan attempt */
    error,
    /** Whether the API is configured */
    isConfigured: !!apiUrl,
  };
};

export type { BookMetadata, ScanResponse };

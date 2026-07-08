/**
 * Force download a file from URL without opening in a new tab
 * Creates an anchor element with download attribute to trigger browser download
 */
export async function forceDownloadFile(url: string, filename?: string): Promise<void> {
  try {
    // Fetch the file as a blob to ensure we have control over the download
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch file');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create anchor element for download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || extractFilename(url) || 'download';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Force download failed, falling back to direct link:', error);
    // Fallback: use anchor with download attribute directly
    fallbackDownload(url, filename);
  }
}

/**
 * Fallback download method using anchor element with download attribute
 */
function fallbackDownload(url: string, filename?: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || extractFilename(url) || 'download';
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Extract filename from URL
 */
function extractFilename(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    // Decode URI component and clean up
    if (lastSegment) {
      const decoded = decodeURIComponent(lastSegment);
      // Remove timestamp prefix if present (e.g., "1234567890-filename.pdf")
      const cleaned = decoded.replace(/^\d+-/, '');
      return cleaned || null;
    }
    return null;
  } catch {
    return null;
  }
}

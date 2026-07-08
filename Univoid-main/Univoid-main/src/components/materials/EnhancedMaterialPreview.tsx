import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  FileText,
  Image,
  File,
  Lock,
  Eye,
  Calendar,
  User,
  HardDrive,
  Loader2,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Archive,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatFileSize } from "@/lib/fileCompression";
import { format } from "date-fns";
import { getMaterialDownloadUrl } from "@/lib/storageProxy";

interface MaterialData {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  subject?: string;
  branch?: string;
  course?: string;
  college?: string;
  language?: string;
  downloads_count: number;
  views_count: number;
  likes_count: number;
  created_at: string;
  contributor_name?: string;
  status: string;
  thumbnail_url?: string;
  preview_file_url?: string;
  preview_page_limit?: number;
  preview_ready?: boolean;
  admin_previewed?: boolean;
}

interface EnhancedMaterialPreviewProps {
  material: MaterialData | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  isAdmin?: boolean;
  onAdminPreviewComplete?: (materialId: string) => void;
}

const PDF_LOAD_TIMEOUT_MS = 10000;

const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const OFFICE_TYPES = ["doc", "docx", "ppt", "pptx", "xls", "xlsx"];
const TEXT_TYPES = ["txt", "rtf"];
const ARCHIVE_TYPES = ["zip", "rar", "7z"];
const EBOOK_TYPES = ["epub", "mobi"];

const getPreferredPdfViewer = () => {
  try {
    return localStorage.getItem("pdf-viewer-preference") === "google";
  } catch {
    return false;
  }
};

const savePreferredPdfViewer = (useGoogle: boolean) => {
  try {
    localStorage.setItem("pdf-viewer-preference", useGoogle ? "google" : "native");
  } catch {
    // ignore
  }
};

const stripRtf = (value: string) =>
  value
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\'[0-9a-fA-F]{2}/g, "")
    .replace(/\\[a-z]+-?\d* ?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export default function EnhancedMaterialPreview({
  material,
  isOpen,
  onClose,
  onDownload,
  isAdmin = false,
  onAdminPreviewComplete,
}: EnhancedMaterialPreviewProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [hasAdminPreviewed, setHasAdminPreviewed] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(getPreferredPdfViewer);
  const [useOfficeViewer, setUseOfficeViewer] = useState(true);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileType = material?.file_type.toLowerCase() || "";
  const isPdf = fileType === "pdf";
  const isImage = IMAGE_TYPES.includes(fileType);
  const isOfficeDocument = OFFICE_TYPES.includes(fileType);
  const isTextDocument = TEXT_TYPES.includes(fileType);
  const isArchive = ARCHIVE_TYPES.includes(fileType);
  const isEbook = EBOOK_TYPES.includes(fileType);
  const isLoggedIn = !!user;
  const previewLimit = material?.preview_page_limit || 5;

  const clearLoadTimeout = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  };

  const completeAdminPreview = () => {
    if (!isAdmin || !material || material.status !== "pending" || hasAdminPreviewed) return;
    setHasAdminPreviewed(true);
    onAdminPreviewComplete?.(material.id);
  };

  useEffect(() => {
    if (!isOpen || !material) {
      clearLoadTimeout();
      return;
    }

    setIsLoading(true);
    setPreviewError(false);
    setPreviewUrl(getMaterialDownloadUrl(material.id, false));
    setUrlError(null);
    setHasAdminPreviewed(false);
    setUseGoogleViewer(getPreferredPdfViewer());
    setUseOfficeViewer(true);
    setTextPreview(null);

    return () => clearLoadTimeout();
  }, [isOpen, material?.id]);

  useEffect(() => {
    if (!isOpen || !material || !previewUrl || !isTextDocument) return;

    let cancelled = false;
    setIsLoading(true);
    setPreviewError(false);
    setUrlError(null);

    fetch(previewUrl)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load preview (${response.status})`);
        }

        const content = await response.text();
        if (cancelled) return;

        const normalized = fileType === "rtf" ? stripRtf(content) : content;
        setTextPreview(normalized || "This file is empty.");
        setIsLoading(false);
        completeAdminPreview();
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[Material Preview] Text preview failed:", error);
        setPreviewError(true);
        setUrlError("This text document could not be rendered inline. You can still open or download it.");
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, material?.id, previewUrl, isTextDocument, fileType]);

  useEffect(() => {
    if (!isOpen || !isPdf || !previewUrl || !isLoading || useGoogleViewer || previewError) return;

    clearLoadTimeout();
    loadTimeoutRef.current = setTimeout(() => {
      setUseGoogleViewer(true);
      savePreferredPdfViewer(true);
      setPreviewError(false);
      setIsLoading(true);
    }, PDF_LOAD_TIMEOUT_MS);

    return () => clearLoadTimeout();
  }, [isOpen, isPdf, previewUrl, isLoading, useGoogleViewer, previewError]);

  if (!material) return null;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setPreviewError(false);
    clearLoadTimeout();
    completeAdminPreview();
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setPreviewError(true);
    clearLoadTimeout();
  };

  const handleOpenDocument = () => {
    if (!previewUrl) {
      setUrlError("File link is not available right now.");
      return;
    }

    window.open(previewUrl, "_blank", "noopener,noreferrer");
    completeAdminPreview();
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>Preparing preview…</span>
        </div>
        <Button variant="default" size="sm" onClick={handleOpenDocument} disabled={!previewUrl}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Document
        </Button>
      </div>

      <div className="aspect-[3/4] min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border p-6 space-y-4">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-3 mt-8">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="text-center mt-6">
          <span className="text-sm text-muted-foreground">Preparing preview...</span>
        </div>
      </div>
    </div>
  );

  const renderNoUrlError = () => (
    <div className="aspect-[3/4] min-h-[400px] bg-muted rounded-lg flex flex-col items-center justify-center border border-border p-8">
      <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
      <span className="text-lg font-medium text-foreground mb-2">Preview Not Available</span>
      <span className="text-sm text-muted-foreground text-center mb-4">
        {urlError || "The preview file is not ready yet."}
      </span>
      <Button variant="default" onClick={handleOpenDocument} disabled={!previewUrl}>
        <ExternalLink className="w-4 h-4 mr-2" />
        Open Document
      </Button>
    </div>
  );

  const renderPdfPreview = () => {
    if (!previewUrl || urlError) return renderNoUrlError();

    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`;
    const nativeViewerUrl = `${previewUrl}#toolbar=${isAdmin ? "1" : "0"}&navpanes=0&scrollbar=1`;
    const viewerUrl = useGoogleViewer ? googleViewerUrl : nativeViewerUrl;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Can&apos;t see the preview?</span>
          </div>
          <Button variant="default" size="sm" onClick={handleOpenDocument}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Document
          </Button>
        </div>

        <div className="relative w-full aspect-[3/4] min-h-[300px] sm:min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Loading preview...</span>
            </div>
          )}

          {previewError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-2">Inline PDF preview failed</p>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Switch viewers or open the file directly.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewError(false);
                    setIsLoading(true);
                    const nextValue = !useGoogleViewer;
                    setUseGoogleViewer(nextValue);
                    savePreferredPdfViewer(nextValue);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {useGoogleViewer ? "Try Native Viewer" : "Try Google Viewer"}
                </Button>
                <Button variant="default" size="sm" onClick={handleOpenDocument}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Document
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={material.title}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ border: "none" }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-downloads"
            />
          )}

          {isAdmin && !previewError && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  setPreviewError(false);
                  const nextValue = !useGoogleViewer;
                  setUseGoogleViewer(nextValue);
                  savePreferredPdfViewer(nextValue);
                }}
                className="text-xs opacity-80 hover:opacity-100"
              >
                {useGoogleViewer ? "Native Viewer" : "Google Viewer"}
              </Button>
            </div>
          )}

          {!isAdmin && isLoggedIn && !previewError && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 to-transparent p-6 text-center pointer-events-none">
              <Badge variant="secondary" className="mb-2 bg-primary/20 text-primary">
                <Eye className="w-3 h-3 mr-1" />
                Preview: First {previewLimit} pages
              </Badge>
              <p className="text-xs text-muted-foreground">Download to view the complete document</p>
            </div>
          )}

          {!isLoggedIn && !isAdmin && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
              <Lock className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Login Required</p>
              <p className="text-sm text-muted-foreground mb-4">Sign in to preview this material</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderImagePreview = () => {
    if (!previewUrl || urlError) return renderNoUrlError();

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Image className="w-4 h-4" />
            <span>Can&apos;t see the image?</span>
          </div>
          <Button variant="default" size="sm" onClick={handleOpenDocument}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Image
          </Button>
        </div>

        <div className="relative w-full min-h-[300px] sm:min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
          {!previewError && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 transition-opacity duration-300 ${isLoading ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Loading image...</span>
            </div>
          )}

          {previewError ? (
            <div className="flex flex-col items-center justify-center p-4">
              <Image className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-2">Image preview not available</p>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Use the button above to open the file directly.
              </p>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt={material.title}
              className="max-w-full max-h-[600px] object-contain"
              onLoad={() => {
                setIsLoading(false);
                setPreviewError(false);
                completeAdminPreview();
              }}
              onError={() => {
                setIsLoading(false);
                setPreviewError(true);
              }}
            />
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {material.file_type.toUpperCase()} • {material.file_size ? formatFileSize(material.file_size) : "Unknown size"}
        </p>
      </div>
    );
  };

  const renderOfficePreview = () => {
    if (!previewUrl || urlError) return renderNoUrlError();

    const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`;
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`;
    const viewerUrl = useOfficeViewer ? officeViewerUrl : googleViewerUrl;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Previewing via web document viewer</span>
          </div>
          <Button variant="default" size="sm" onClick={handleOpenDocument}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Document
          </Button>
        </div>

        <div className="relative w-full aspect-[3/4] min-h-[300px] sm:min-h-[500px] bg-muted rounded-lg overflow-hidden border border-border">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Loading {material.file_type.toUpperCase()} preview...</span>
            </div>
          )}

          {previewError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <File className="w-16 h-16 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-2">This viewer could not load the document</p>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Switch viewers or open the original file.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewError(false);
                    setIsLoading(true);
                    setUseOfficeViewer((current) => !current);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {useOfficeViewer ? "Try Google Viewer" : "Try Microsoft Viewer"}
                </Button>
                <Button variant="default" size="sm" onClick={handleOpenDocument}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Document
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={material.title}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ border: "none" }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-downloads"
            />
          )}

          {isAdmin && !previewError && (
            <div className="absolute top-2 right-2 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  setPreviewError(false);
                  setUseOfficeViewer((current) => !current);
                }}
                className="text-xs opacity-80 hover:opacity-100"
              >
                {useOfficeViewer ? "Google Viewer" : "Microsoft Viewer"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTextPreview = () => {
    if (!previewUrl || urlError) return renderNoUrlError();

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>Inline text preview</span>
          </div>
          <Button variant="default" size="sm" onClick={handleOpenDocument}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Document
          </Button>
        </div>

        <div className="min-h-[400px] rounded-lg border border-border bg-muted/30 overflow-hidden">
          {isLoading ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-muted-foreground">Loading text preview...</span>
            </div>
          ) : previewError ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">This text document could not be displayed inline.</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground p-5 font-mono overflow-auto max-h-[600px]">
              {textPreview}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const renderFallbackPreview = (title: string, description: string, icon: "file" | "archive") => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>Open the original file to inspect it</span>
        </div>
        <Button variant="default" size="sm" onClick={handleOpenDocument}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Document
        </Button>
      </div>

      <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border border-border p-8 text-center">
        {icon === "archive" ? (
          <Archive className="w-20 h-20 text-muted-foreground/40 mb-4" />
        ) : (
          <File className="w-20 h-20 text-muted-foreground/40 mb-4" />
        )}
        <span className="text-lg font-medium text-foreground mb-2">{title}</span>
        <span className="text-sm text-muted-foreground mb-2">{description}</span>
        <span className="text-xs text-muted-foreground">
          {material.file_size ? formatFileSize(material.file_size) : "Unknown size"}
        </span>
      </div>
    </div>
  );

  const renderPreviewArea = () => {
    if (urlError && !previewUrl) return renderNoUrlError();
    if (isTextDocument) return renderTextPreview();
    if (!previewUrl) return renderLoadingSkeleton();
    if (isPdf) return renderPdfPreview();
    if (isImage) return renderImagePreview();
    if (isOfficeDocument) return renderOfficePreview();
    if (isArchive) {
      return renderFallbackPreview("Archive File", "Archive contents can still be downloaded and reviewed externally.", "archive");
    }
    if (isEbook) {
      return renderFallbackPreview(`${material.file_type.toUpperCase()} eBook`, "Open the file directly to review it in your preferred reader.", "file");
    }
    return renderFallbackPreview(`${material.file_type.toUpperCase()} Document`, "This format opens in a separate tab for review.", "file");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 border-b border-border p-4 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                {material.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                {material.subject && <Badge variant="secondary">{material.subject}</Badge>}
                {material.branch && <Badge variant="outline">{material.branch}</Badge>}
                <Badge variant="outline" className="uppercase">{material.file_type}</Badge>
                {material.status === "pending" && (
                  <Badge variant="secondary">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Pending Review
                  </Badge>
                )}
                {isAdmin && (
                  <Badge variant="secondary">
                    <Eye className="w-3 h-3 mr-1" />
                    Admin View
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-auto">
          <div className="p-4 space-y-6">
            {renderPreviewArea()}

            {isAdmin && material.status === "pending" && (
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${hasAdminPreviewed ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground border-border"}`}>
                {hasAdminPreviewed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Preview loaded successfully.</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="text-sm font-medium">Preview is optional — you can approve even if it fails to load.</span>
                  </>
                )}
              </div>
            )}

            {material.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{material.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {material.contributor_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="truncate">{material.contributor_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(material.created_at), "MMM dd, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Download className="w-4 h-4" />
                <span>{material.downloads_count} downloads</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{material.views_count} views</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <span>{material.file_size ? formatFileSize(material.file_size) : "Unknown"}</span>
              </div>
              {material.language && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span>{material.language}</span>
                </div>
              )}
              {material.college && (
                <span className="text-muted-foreground truncate max-w-[200px]">{material.college}</span>
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="shrink-0 flex gap-3 p-4 pt-4 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          {isAdmin || material.status === "approved" ? (
            <Button className="flex-1" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              {isAdmin ? "Download Full File" : "Download"}
            </Button>
          ) : (
            <Button className="flex-1" disabled>
              <Lock className="w-4 h-4 mr-2" />
              Pending Approval
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

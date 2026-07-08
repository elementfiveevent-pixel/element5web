import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { validateFileUpload } from "@/lib/fileValidation";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  file: File | null;
  onClear: () => void;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  label?: string;
  hint?: string;
  uploadStage?: string; // Optional stage description like "Compressing..." or "Uploading..."
}

export function FileUploadZone({
  onFileSelect,
  file,
  onClear,
  accept = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.jpg,.jpeg,.png,.zip",
  maxSizeMB = 100,
  disabled = false,
  isUploading = false,
  uploadProgress = 0,
  label = "Upload File",
  hint,
  uploadStage,
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate default hint based on maxSizeMB
  const displayHint = hint || `PDF, DOC, PPT, images, ZIP (max ${maxSizeMB}MB)`;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const validateFile = useCallback((selectedFile: File): boolean => {
    const validationError = validateFileUpload(selectedFile, 'any');
    if (validationError) {
      toast.error(validationError);
      return false;
    }

    // Check video files first
    
    // Check file size with clear error message
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      const fileSizeMB = (selectedFile.size / 1024 / 1024).toFixed(1);
      toast.error(`File too large (${fileSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB.`);
      return false;
    }
    
    return true;
  }, [maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (validateFile(droppedFile)) {
        onFileSelect(droppedFile);
      }
    }
  }, [disabled, isUploading, validateFile, onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        onFileSelect(selectedFile);
      }
    }
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [validateFile, onFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
  }, [onClear]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-accent/50",
          "touch-manipulation",
          isDragOver && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none"
        )}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
            <div className="space-y-1">
              <p className="text-sm text-foreground font-medium">
                {uploadStage || (uploadProgress < 15 ? "Preparing..." : uploadProgress < 70 ? "Uploading..." : "Processing...")}
              </p>
              {file && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px] mx-auto">
                  {file.name}
                </p>
              )}
            </div>
            <div className="max-w-xs mx-auto">
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
                {file && uploadProgress > 0 && uploadProgress < 100 && (
                  <p className="text-xs text-muted-foreground">
                    {((file.size / 1024 / 1024) * (uploadProgress / 100)).toFixed(1)} / {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleClear}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors touch-manipulation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground font-medium">
              <span className="hidden sm:inline">Drag & drop or </span>
              <span className="text-primary">tap to upload</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{displayHint}</p>
          </>
        )}
      </div>
    </div>
  );
}
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { compressImage, validateImageFile, CompressedImage } from "@/lib/imageCompression";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BookImageUploadProps {
  images: CompressedImage[];
  onImagesChange: (images: CompressedImage[]) => void;
  onBookDetected?: (info: { title?: string; author?: string; category?: string }) => void;
  maxImages?: number;
}

const BookImageUpload = ({ images, onImagesChange, onBookDetected, maxImages = 1 }: BookImageUploadProps) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectBookFromImage = async (imageBase64: string) => {
    if (!onBookDetected) return;
    
    setIsDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-book-cover", {
        body: { image: imageBase64 },
      });

      if (error) {
        console.error("AI detection error:", error);
        return;
      }

      if (data?.title || data?.author) {
        onBookDetected({
          title: data.title || undefined,
          author: data.author || undefined,
        });
        toast.success("Book details detected!");
      }
    } catch (error) {
      console.error("Error detecting book:", error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Only allow single image - replace existing
    const file = files[0];
    setIsCompressing(true);

    try {
      const error = validateImageFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      const compressed = await compressImage(file);
      // Replace any existing image with the new one
      onImagesChange([compressed]);
      toast.success("Book cover added");
      
      // Auto-detect book info from image
      if (compressed.preview) {
        detectBookFromImage(compressed.preview);
      }
    } catch (error) {
      toast.error("Failed to process image");
    } finally {
      setIsCompressing(false);
      // Reset inputs
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const replaceImage = () => {
    // Prefer camera on mobile
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const hasImage = images.length > 0;
  const isProcessing = isCompressing || isDetecting;

  return (
    <div className="space-y-3">
      {/* Camera input - primary for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {/* File input - fallback for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {hasImage ? (
        // Show captured image with replace option
        <div className="relative">
          <div className="aspect-[3/4] max-w-[200px] mx-auto rounded-lg overflow-hidden border-2 border-primary bg-secondary">
            <img
              src={images[0].preview}
              alt="Book cover"
              className="w-full h-full object-cover"
            />
            {isDetecting && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary animate-pulse mb-2" />
                <p className="text-xs text-muted-foreground">Detecting book...</p>
              </div>
            )}
          </div>
          
          {/* Replace button */}
          <div className="flex justify-center mt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={replaceImage}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Replace Cover
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Gallery
            </Button>
          </div>
        </div>
      ) : (
        // Camera-first capture area
        <div
          onClick={() => cameraInputRef.current?.click()}
          className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
        >
          {isCompressing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Processing...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">
                Scan Book Cover
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Tap to open camera and capture your book's cover
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="mb-2"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Open Camera
              </Button>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">or</span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Choose from Gallery
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        Only 1 book cover image allowed • AI auto-detects title & author
      </p>
    </div>
  );
};

export default BookImageUpload;

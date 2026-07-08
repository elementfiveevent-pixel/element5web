import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2, ScanBarcode, BookOpen, AlertCircle } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { useCustomBookScanner } from "@/hooks/useCustomBookScanner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookScannerProps {
  onBookScanned: (bookInfo: { title: string; author?: string }) => void;
  onImageCaptured?: (imageBase64: string) => void;
}

interface OpenLibraryBook {
  title?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
}

type ScanMode = "barcode" | "cover";

const BookScanner = ({ onBookScanned, onImageCaptured }: BookScannerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("barcode");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerContainerId = "book-scanner-container";

  // Use custom book scanner hook (calls external OCR API)
  const { scanBookImageBase64, scanning: customScanning, error: scanError, isConfigured } = useCustomBookScanner();

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.log("Scanner already stopped");
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const stopCoverCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const fetchBookByISBN = async (isbn: string): Promise<{ title: string; author?: string } | null> => {
    try {
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
      const data = await response.json();
      
      const bookKey = `ISBN:${isbn}`;
      if (data[bookKey]) {
        const book: OpenLibraryBook = data[bookKey];
        return {
          title: book.title || isbn,
          author: book.authors?.[0]?.name,
        };
      }
      
      const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      const googleData = await googleResponse.json();
      
      if (googleData.items && googleData.items.length > 0) {
        const volumeInfo = googleData.items[0].volumeInfo;
        return {
          title: volumeInfo.title,
          author: volumeInfo.authors?.[0],
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching book info:", error);
      return null;
    }
  };

  /**
   * Extract book info from cover using custom external OCR API.
   */
  const extractBookInfoFromCover = async (imageBase64: string): Promise<{ title: string; author?: string } | null> => {
    try {
      // Use custom book scanner API
      const result = await scanBookImageBase64(imageBase64);

      if (result?.title) {
        return {
          title: result.title,
          author: result.author || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error("Error extracting book info:", error);
      return null;
    }
  };

  const startCoverCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);
    } catch (error: any) {
      console.error("Camera error:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Camera permission denied");
      } else {
        toast.error("Failed to access camera");
      }
    }
  };

  const captureAndAnalyzeCover = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);
    
    setCapturedImage(imageBase64);
    stopCoverCamera();
    setIsScanning(false);
    setIsFetching(true);
    toast.info("Analyzing book cover...");

    // Immediately pass image to parent for upload
    if (onImageCaptured) {
      onImageCaptured(imageBase64);
    }

    const bookInfo = await extractBookInfoFromCover(imageBase64);
    setIsFetching(false);
    
    if (bookInfo) {
      onBookScanned(bookInfo);
      toast.success(`Found: ${bookInfo.title}`);
      handleClose();
    } else {
      toast.error("Could not detect book title. Try again or enter manually.");
      setCapturedImage(null);
      startCoverCamera();
    }
  };

  const handleBarcodeDetected = async (decodedText: string) => {
    // Stop scanning immediately
    await stopScanner();
    
    // Check if it looks like an ISBN (10 or 13 digits)
    const cleanedCode = decodedText.replace(/[^0-9X]/gi, "");
    const isISBN = cleanedCode.length === 10 || cleanedCode.length === 13;
    
    if (!isISBN) {
      toast.error("Please scan an ISBN barcode (on book back cover)");
      setIsOpen(false);
      return;
    }

    setIsFetching(true);
    toast.info("Fetching book details...");

    const bookInfo = await fetchBookByISBN(cleanedCode);
    setIsFetching(false);
    setIsOpen(false);

    if (bookInfo) {
      onBookScanned(bookInfo);
      toast.success(`Found: ${bookInfo.title}`);
    } else {
      // Still provide the ISBN for manual lookup
      onBookScanned({ title: `ISBN: ${cleanedCode}` });
      toast.info("Book not found in database. ISBN captured for manual entry.");
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    
    try {
      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const container = document.getElementById(scannerContainerId);
      if (!container) {
        throw new Error("Scanner container not found");
      }

      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
        },
        handleBarcodeDetected,
        () => {} // Ignore scan errors (no barcode found yet)
      );
    } catch (error: any) {
      console.error("Scanner error:", error);
      setIsScanning(false);
      
      if (error.message?.includes("NotAllowedError") || error.name === "NotAllowedError") {
        toast.error("Camera permission denied. Please allow camera access.");
      } else if (error.message?.includes("NotFoundError") || error.name === "NotFoundError") {
        toast.error("No camera found on this device.");
      } else {
        toast.error("Failed to start scanner. Try again.");
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    stopCoverCamera();
    setCapturedImage(null);
    setIsOpen(false);
  };

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  const switchMode = (mode: ScanMode) => {
    stopScanner();
    stopCoverCamera();
    setCapturedImage(null);
    setScanMode(mode);
  };

  useEffect(() => {
    if (isOpen && !isScanning && !isFetching && !capturedImage) {
      if (scanMode === "barcode") {
        startScanner();
      } else {
        startCoverCamera();
      }
    }
  }, [isOpen, scanMode]);

  useEffect(() => {
    return () => {
      stopScanner();
      stopCoverCamera();
    };
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <ScanBarcode className="w-4 h-4" />
        Scan Book
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              {scanMode === "barcode" ? "Scan ISBN Barcode" : "Scan Book Cover"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* API Configuration Warning */}
            {!isConfigured && scanMode === "cover" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Book scanner API not configured. Set VITE_BOOK_SCANNER_API_URL in your environment.
                </AlertDescription>
              </Alert>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                type="button"
                variant={scanMode === "barcode" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => switchMode("barcode")}
              >
                <ScanBarcode className="w-4 h-4" />
                ISBN Barcode
              </Button>
              <Button
                type="button"
                variant={scanMode === "cover" ? "default" : "ghost"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => switchMode("cover")}
              >
                <BookOpen className="w-4 h-4" />
                Book Cover
              </Button>
            </div>

            {isFetching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  {scanMode === "barcode" ? "Fetching book details..." : "Analyzing book cover..."}
                </p>
              </div>
            ) : scanMode === "barcode" ? (
              <>
                <div 
                  id={scannerContainerId} 
                  className="w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden"
                />
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Point camera at the <strong>ISBN barcode</strong> on the book's back cover
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The barcode usually starts with 978 or 979
                  </p>
                </div>

                {!isScanning && (
                  <Button onClick={startScanner} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {!isScanning && !capturedImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">Camera loading...</p>
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Point camera at the <strong>front cover</strong> of the book
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Make sure the title is clearly visible
                  </p>
                </div>

                {isScanning && (
                  <Button onClick={captureAndAnalyzeCover} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Cover
                  </Button>
                )}

                {!isScanning && !capturedImage && (
                  <Button onClick={startCoverCamera} className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookScanner;

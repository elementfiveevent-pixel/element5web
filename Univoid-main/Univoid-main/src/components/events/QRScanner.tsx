import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, CameraOff, Loader2, CheckCircle, XCircle, AlertTriangle, Scan, Keyboard, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRScannerProps {
  onScan: (qrCode: string) => Promise<void>;
  eventId: string;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';
type CameraError = 'permission_denied' | 'not_found' | 'busy' | 'not_supported' | 'unknown' | null;

export default function QRScanner({ onScan, eventId }: QRScannerProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(true);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);
  const scanCooldownRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if browser supports camera - be more permissive
  const isCameraSupported = typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator;

  // Check if page is served over HTTPS (required for camera on mobile)
  const isSecureContext = typeof window !== 'undefined' && 
    (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  const stopScanner = useCallback(async () => {
    if (scanCooldownRef.current) {
      clearTimeout(scanCooldownRef.current);
      scanCooldownRef.current = null;
    }
    
    // Stop any active media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('[QRScanner] Stopped track:', track.label);
      });
      streamRef.current = null;
    }
    
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.log('[QRScanner] Cleanup warning:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanStatus('idle');
    setStatusMessage('');
    isProcessingRef.current = false;
    lastScannedRef.current = null;
    setNeedsUserGesture(true);
  }, []);

  const getCameraErrorInfo = (error: any): { type: CameraError; message: string } => {
    const errorName = error?.name || '';
    const errorMessage = (error?.message || '').toLowerCase();
    
    console.log('[QRScanner] Error details:', { name: errorName, message: errorMessage });
    
    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorMessage.includes('denied') || errorMessage.includes('permission')) {
      return {
        type: 'permission_denied',
        message: 'Camera permission was denied. Please tap the camera icon in your browser address bar to allow access, then reload the page.'
      };
    }
    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError' || errorMessage.includes('not found') || errorMessage.includes('no video')) {
      return {
        type: 'not_found',
        message: 'No camera found. Please ensure your device has a camera and try again.'
      };
    }
    if (errorName === 'NotReadableError' || errorName === 'TrackStartError' || errorMessage.includes('busy') || errorMessage.includes('in use') || errorMessage.includes('could not start')) {
      return {
        type: 'busy',
        message: 'Camera is in use by another app. Close other apps using the camera (like video calls) and try again.'
      };
    }
    if (errorName === 'OverconstrainedError') {
      return {
        type: 'not_supported',
        message: 'Camera settings not supported. Trying with basic settings...'
      };
    }
    if (errorName === 'NotSupportedError' || errorName === 'TypeError') {
      return {
        type: 'not_supported',
        message: 'Camera not supported in this browser. Please try Chrome, Safari, or Firefox.'
      };
    }
    if (errorName === 'AbortError') {
      return {
        type: 'unknown',
        message: 'Camera access was interrupted. Please try again.'
      };
    }
    return {
      type: 'unknown',
      message: `Camera error: ${errorMessage || 'Unknown error'}. Try using Manual Entry below.`
    };
  };

  const startScanner = useCallback(async () => {
    if (!containerRef.current) {
      console.error('[QRScanner] Container not ready');
      return;
    }
    
    // Clear previous errors
    setCameraError(null);
    setErrorDetails('');
    setNeedsUserGesture(false);
    
    // Pre-flight checks
    if (!isSecureContext) {
      setCameraError('not_supported');
      setErrorDetails('Camera requires HTTPS. Please use manual entry.');
      return;
    }

    if (!isCameraSupported) {
      setCameraError('not_supported');
      setErrorDetails('Your browser does not support camera access. Please use Chrome, Safari, or Firefox.');
      return;
    }
    
    setIsStarting(true);
    isProcessingRef.current = false;
    lastScannedRef.current = null;
    
    try {
      // STEP 1: Request camera with simple constraints first
      console.log('[QRScanner] Step 1: Requesting camera permission...');
      
      let stream: MediaStream | null = null;
      const attempts = [
        { video: true },  // Most basic - should work everywhere
        { video: { facingMode: 'environment' } },  // Back camera
        { video: { facingMode: 'user' } }  // Front camera as last resort
      ];
      
      for (const constraints of attempts) {
        try {
          console.log('[QRScanner] Trying constraints:', JSON.stringify(constraints));
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log('[QRScanner] Got stream with tracks:', stream.getTracks().map(t => t.label));
          break;
        } catch (e: any) {
          console.log('[QRScanner] Constraint failed:', e.name);
          // If permission denied, don't try other constraints
          if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            throw e;
          }
        }
      }
      
      if (!stream) {
        throw new Error('Could not access any camera');
      }
      
      // Keep reference to stop later
      streamRef.current = stream;
      
      // Release this test stream before Html5Qrcode takes over
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      
      console.log('[QRScanner] Step 2: Creating scanner instance...');
      
      // STEP 2: Create scanner instance
      const scanner = new Html5Qrcode('qr-reader', {
        verbose: false,
        formatsToSupport: [0], // QR_CODE only
      });
      scannerRef.current = scanner;

      // STEP 3: Start scanner with permissive config
      console.log('[QRScanner] Step 3: Starting scanner...');
      
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          disableFlip: false,
        },
        async (decodedText) => {
          if (isProcessingRef.current) return;
          if (lastScannedRef.current === decodedText) return;
          
          isProcessingRef.current = true;
          lastScannedRef.current = decodedText;
          
          setScanStatus('scanning');
          setStatusMessage('Validating ticket...');
          
          try {
            await onScan(decodedText);
            setScanStatus('success');
            setStatusMessage('Check-in successful!');
          } catch (err: any) {
            setScanStatus('error');
            setStatusMessage(err.message || 'Check-in failed');
          }
          
          scanCooldownRef.current = setTimeout(() => {
            setScanStatus('idle');
            setStatusMessage('');
            isProcessingRef.current = false;
            setTimeout(() => {
              lastScannedRef.current = null;
            }, 5000);
          }, 2000);
        },
        () => {} // Ignore scan errors
      );

      // Try to enable continuous autofocus
      try {
        const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
        if (videoElement?.srcObject) {
          const videoStream = videoElement.srcObject as MediaStream;
          const track = videoStream.getVideoTracks()[0];
          const capabilities = track?.getCapabilities?.() as any;
          
          if (capabilities?.focusMode?.includes('continuous')) {
            await track.applyConstraints({ focusMode: 'continuous' } as any);
            console.log('[QRScanner] Autofocus enabled');
          }
        }
      } catch (focusErr) {
        // Ignore focus errors - non-critical
      }

      console.log('[QRScanner] Scanner started successfully!');
      setIsScanning(true);
      
    } catch (err: any) {
      console.error('[QRScanner] Failed to start:', err);
      const errorInfo = getCameraErrorInfo(err);
      setCameraError(errorInfo.type);
      setErrorDetails(errorInfo.message);
      
      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    } finally {
      setIsStarting(false);
    }
  }, [onScan, isCameraSupported, isSecureContext]);

  // Handle manual ticket verification
  const handleManualSubmit = async () => {
    if (!manualTicketId.trim()) return;
    
    setIsManualSubmitting(true);
    try {
      await onScan(manualTicketId.trim());
      setScanStatus('success');
      setStatusMessage('Check-in successful!');
      setManualTicketId('');
      
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 2000);
    } catch (err: any) {
      setScanStatus('error');
      setStatusMessage(err.message || 'Check-in failed');
      
      setTimeout(() => {
        setScanStatus('idle');
        setStatusMessage('');
      }, 3000);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Stop scanner when eventId changes
  useEffect(() => {
    stopScanner();
  }, [eventId, stopScanner]);

  return (
    <div className="space-y-4">
      {/* Browser compatibility warning */}
      {!isSecureContext && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Camera requires HTTPS. Please use manual ticket entry below.
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner viewport */}
      <div 
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden cursor-pointer"
        style={{ minHeight: isScanning ? '340px' : '200px' }}
        onClick={() => {
          if (!isScanning && !isStarting && needsUserGesture) {
            startScanner();
          }
        }}
      >
        <div id="qr-reader" className="w-full" />
        
        {/* Scan guide overlay when scanning */}
        {isScanning && scanStatus === 'idle' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[260px] h-[260px]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" />
            </div>
          </div>
        )}
        
        {/* Non-scanning state - tap to start */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-muted/50">
            {cameraError ? (
              <>
                <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
                <p className="text-sm text-destructive font-medium mb-1">Camera Error</p>
                <p className="text-xs text-muted-foreground mb-3 max-w-xs">{errorDetails}</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCameraError(null);
                      setErrorDetails('');
                      setNeedsUserGesture(true);
                    }}
                    disabled={isStarting}
                    className="gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowManualInput(true);
                    }}
                    className="gap-1"
                  >
                    <Keyboard className="w-4 h-4" />
                    Manual Entry
                  </Button>
                </div>
              </>
            ) : isStarting ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Starting camera...</p>
                <p className="text-xs text-muted-foreground mt-1">Please allow camera access when prompted</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3 animate-pulse">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <p className="text-base font-medium text-foreground mb-1">
                  Tap here to start camera
                </p>
                <p className="text-xs text-muted-foreground">
                  Position QR code within the frame
                </p>
              </>
            )}
          </div>
        )}

        {/* Status overlay */}
        {isScanning && scanStatus !== 'idle' && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${
            scanStatus === 'success' ? 'bg-green-600/95' : 
            scanStatus === 'error' ? 'bg-destructive/95' : 
            'bg-background/95'
          }`}>
            {scanStatus === 'scanning' && (
              <Loader2 className="w-16 h-16 animate-spin mb-3 text-primary" />
            )}
            {scanStatus === 'success' && (
              <CheckCircle className="w-20 h-20 mb-3 text-white animate-bounce" />
            )}
            {scanStatus === 'error' && (
              <XCircle className="w-20 h-20 mb-3 text-white" />
            )}
            <p className={`text-xl font-bold ${scanStatus !== 'scanning' ? 'text-white' : ''}`}>
              {statusMessage}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        {!isScanning ? (
          <>
            <Button 
              onClick={startScanner}
              disabled={isStarting || !isCameraSupported}
              size="lg"
              className="gap-2 rounded-full px-8"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  Start Camera
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowManualInput(!showManualInput)}
              size="lg"
              className="gap-2 rounded-full px-6"
            >
              <Keyboard className="w-5 h-5" />
              Manual Entry
            </Button>
          </>
        ) : (
          <Button 
            variant="outline"
            onClick={stopScanner}
            size="lg"
            className="gap-2 rounded-full px-8"
          >
            <CameraOff className="w-5 h-5" />
            Stop Camera
          </Button>
        )}
      </div>

      {/* Manual ticket entry */}
      {showManualInput && (
        <div className="p-4 border rounded-xl bg-muted/30 space-y-3">
          <Label htmlFor="manual-ticket" className="text-sm font-medium">
            Enter Ticket ID Manually
          </Label>
          <div className="flex gap-2">
            <Input
              id="manual-ticket"
              value={manualTicketId}
              onChange={(e) => setManualTicketId(e.target.value)}
              placeholder="Ticket ID or QR code content"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
            <Button
              onClick={handleManualSubmit}
              disabled={isManualSubmitting || !manualTicketId.trim()}
            >
              {isManualSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Verify'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask attendee for their ticket ID if QR scanning isn't working
          </p>
        </div>
      )}

      {/* Instructions */}
      {isScanning && scanStatus === 'idle' && (
        <div className="text-center text-xs text-muted-foreground space-y-1 animate-pulse">
          <p className="font-medium">Camera is active</p>
          <p>Point at QR code - detection is automatic</p>
        </div>
      )}
    </div>
  );
}
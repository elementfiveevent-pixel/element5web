import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScanUpiResult {
  success: boolean;
  upi_id?: string;
  error?: string;
}

export const useUpiScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  const scanUpiFromFile = async (
    file: File,
    userId: string
  ): Promise<string | null> => {
    if (!file) return null;

    setIsScanning(true);

    try {
      // Upload the file temporarily
      const ext = file.name.split(".").pop();
      const path = `${userId}/upi-qr-temp/${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("event-assets")
        .upload(path, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: "Upload Failed",
          description: "Could not upload QR image for scanning.",
          variant: "destructive",
        });
        return null;
      }

      // Call the edge function to scan the UPI QR
      const { data, error } = await supabase.functions.invoke<ScanUpiResult>("scan-upi", {
        body: { bucket: "event-assets", path },
      });

      if (error) {
        console.error("Scan error:", error);
        toast({
          title: "Scan Failed",
          description: "Could not scan QR code. Please enter UPI ID manually.",
          variant: "destructive",
        });
        return null;
      }

      if (data?.success && data?.upi_id) {
        toast({
          title: "UPI ID Detected",
          description: `Found: ${data.upi_id}`,
        });
        return data.upi_id;
      } else {
        toast({
          title: "No UPI ID Found",
          description: data?.error || "Could not extract UPI ID from QR. Please enter manually.",
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      console.error("UPI scan error:", err);
      toast({
        title: "Scan Error",
        description: "An error occurred while scanning. Please enter UPI ID manually.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  return { scanUpiFromFile, isScanning };
};

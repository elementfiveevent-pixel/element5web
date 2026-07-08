import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { syncToGoogleSheets, extractSpreadsheetId, isValidSpreadsheetUrl, getServiceAccountInfo } from "@/services/googleSheetsService";
import { FileSpreadsheet, RefreshCw, CheckCircle, Download, Copy, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

interface MobileExportSheetProps {
  eventId: string;
  eventTitle: string;
  trigger?: React.ReactNode;
}

interface FormField {
  id: string;
  label: string;
  field_type: string;
  field_order: number;
}

interface RegistrationData {
  registration_id: string;
  created_at: string;
  payment_status: string;
  custom_data: Record<string, unknown> | null;
  full_name: string | null;
  email: string | null;
  mobile_number: string | null;
  college_name: string | null;
}

export function MobileExportSheet({ eventId, eventTitle, trigger }: MobileExportSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch service account info
  const { data: serviceAccountInfo } = useQuery({
    queryKey: ["service-account-info"],
    queryFn: getServiceAccountInfo,
    staleTime: 1000 * 60 * 60,
  });

  // Load existing config
  const { data: config } = useQuery({
    queryKey: ["sheets-config", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_sheets_config")
        .select("*")
        .eq("event_id", eventId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch form fields
  const { data: formFields } = useQuery({
    queryKey: ["form-fields", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_form_fields")
        .select("id, label, field_type, field_order")
        .eq("event_id", eventId)
        .order("field_order", { ascending: true });
      
      if (error) throw error;
      return data as FormField[];
    },
    enabled: isOpen,
  });

  // Fetch registrations
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ["registrations-export", eventId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_registrations_with_profiles", {
        p_event_id: eventId,
      });
      
      if (error) throw error;
      return data as RegistrationData[];
    },
    enabled: isOpen,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!isValidSpreadsheetUrl(spreadsheetUrl)) {
        throw new Error("Invalid Google Sheets URL");
      }
      const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
      if (!spreadsheetId) {
        throw new Error("Could not extract spreadsheet ID");
      }
      
      // Save config
      await supabase
        .from("event_sheets_config")
        .upsert({
          event_id: eventId,
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
          auto_sync: autoSync,
        }, { onConflict: "event_id" });
      
      return syncToGoogleSheets(eventId, spreadsheetId, sheetName);
    },
    onSuccess: (data) => {
      toast({ title: "✅ Sync Complete!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["sheets-config", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    },
  });

  const downloadCSV = async () => {
    if (!registrations || registrations.length === 0) {
      toast({ title: "No Data", description: "No registrations to export", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    setExportProgress(10);

    try {
      // Build headers
      const fixedHeaders = ["Timestamp", "Registration ID", "Full Name", "Email", "Mobile", "College", "Payment Status", "Group Size", "Base Amount", "Add-ons Amount", "Total Amount", "Club Member", "Ticket Categories", "Attendees"];
      const dynamicHeaders = (formFields || []).map(f => f.label);
      const headers = [...fixedHeaders, ...dynamicHeaders];
      
      setExportProgress(30);
      
      const rows = registrations.map((reg) => {
        const customData = (reg.custom_data || {}) as Record<string, unknown>;
        
        // Ticket categories summary
        const ticketCats = Array.isArray(customData._ticket_categories)
          ? (customData._ticket_categories as Array<{category_name: string; quantity: number; total: number}>)
              .map(tc => `${tc.category_name} ×${tc.quantity} (₹${tc.total})`)
              .join("; ")
          : "";

        // Attendees summary
        const attendeesList = Array.isArray(customData._attendees)
          ? (customData._attendees as Array<{name: string; email: string; mobile: string}>)
              .map(a => `${a.name} | ${a.email} | ${a.mobile}`)
              .join("; ")
          : "";
        
        const fixedCols = [
          new Date(reg.created_at).toLocaleString(),
          reg.registration_id,
          reg.full_name || "",
          reg.email || "",
          reg.mobile_number || "",
          reg.college_name || "",
          reg.payment_status,
          String(customData._group_size || 1),
          String(customData._base_amount || ""),
          String(customData._addons_amount || ""),
          String(customData._total_amount || ""),
          customData._club_id ? "Yes" : "No",
          ticketCats,
          attendeesList,
        ];
        
        const dynamicCols = (formFields || []).map(field => {
          const value = customData[field.id] || customData[field.label] || customData[field.label.toLowerCase()] || "";
          if (Array.isArray(value)) return value.join(", ");
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
        });
        
        return [...fixedCols, ...dynamicCols];
      });

      setExportProgress(60);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      setExportProgress(80);

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${eventTitle.replace(/[^a-z0-9]/gi, "_")}_registrations.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportProgress(100);
      
      toast({
        title: "✅ CSV Downloaded",
        description: `Exported ${registrations.length} registrations`,
      });

      // Reset after a short delay
      setTimeout(() => {
        setExportProgress(0);
        setIsExporting(false);
      }, 1000);

    } catch (error) {
      toast({ title: "Export Failed", description: "Could not generate CSV", variant: "destructive" });
      setExportProgress(0);
      setIsExporting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Export
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Export Registrations
          </SheetTitle>
          <SheetDescription>
            Download CSV or sync to Google Sheets
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-8">
          {/* CSV Export Section */}
          <div className="p-4 rounded-xl border bg-card">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-500" />
              Quick CSV Export
            </h3>
            
            {isExporting && (
              <div className="mb-3">
                <Progress value={exportProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">Generating CSV...</p>
              </div>
            )}
            
            <Button 
              onClick={downloadCSV} 
              className="w-full gap-2" 
              variant="outline"
              disabled={isExporting || registrationsLoading}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {registrationsLoading 
                ? "Loading..." 
                : `Download CSV (${registrations?.length || 0} registrations)`
              }
            </Button>
          </div>

          {/* Google Sheets Section */}
          <div className="p-4 rounded-xl border bg-card space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
              Google Sheets Sync
            </h3>

            {serviceAccountInfo?.configured && serviceAccountInfo?.serviceAccountEmail && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs">
                  <p className="mb-2">Share your sheet with:</p>
                  <div className="flex items-center gap-2 bg-background/80 rounded px-2 py-1.5 border">
                    <code className="text-xs font-mono flex-1 truncate">
                      {serviceAccountInfo.serviceAccountEmail}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(serviceAccountInfo.serviceAccountEmail!);
                        setEmailCopied(true);
                        setTimeout(() => setEmailCopied(false), 2000);
                        toast({ title: "Copied!" });
                      }}
                    >
                      {emailCopied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="sheet-url" className="text-xs">Google Sheets URL</Label>
                <Input
                  id="sheet-url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sheet-name" className="text-xs">Sheet Tab Name (optional)</Label>
                <Input
                  id="sheet-name"
                  placeholder="Auto-detect first sheet"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="auto-sync" className="text-sm font-medium">Auto-Sync</Label>
                  <p className="text-xs text-muted-foreground">Sync new registrations automatically</p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>

              <Button
                onClick={() => syncMutation.mutate()}
                disabled={!spreadsheetUrl || syncMutation.isPending}
                className="w-full gap-2"
              >
                {syncMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Sync Now
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextarea from "@/components/common/RichTextarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchEventById } from "@/services/eventsService";
import { toDisplayUrl } from "@/lib/storageProxy";
import AuthModal from "@/components/auth/AuthModal";
import { UpsellManager } from "@/components/organizer/UpsellManager";
import { TicketCategoriesManager } from "@/components/organizer/TicketCategoriesManager";
import { DeleteEventDialog } from "@/components/organizer/DeleteEventDialog";
import { ArrowLeft, Save, Image, Loader2, Sparkles, Clock } from "lucide-react";
import { useUpiScanner } from "@/hooks/useUpiScanner";
import StateCitySelect from "@/components/common/StateCitySelect";
import { validateFileUpload } from "@/lib/fileValidation";

import MultiSelectPicker from "@/components/events/MultiSelectPicker";
import { parseMultiValue, joinMultiValue } from "@/constants/eventOptions";
const STATUSES = ["draft", "published", "cancelled", "completed"];

const EditEvent = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { scanUpiFromFile, isScanning } = useUpiScanner();
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    event_type: "",
    status: "draft",
    poster_ratio: "4:5" as "4:5" | "1:1" | "16:9",
    state: "",
    city: "",
    is_location_decided: false,
    venue_name: "",
    venue_address: "",
    maps_link: "",
    start_date: "",
    end_date: "",
    registration_end_date: "",
    description: "",
    terms_conditions: "",
    is_paid: false,
    price: 0,
    max_capacity: "",
    upi_vpa: "",
    enable_quick_register: true,
    allow_audience_members: false,
    artist_free_entry: false,
  });

  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);

  const handleQrFileChange = async (file: File | null) => {
    if (file) {
      const validationError = validateFileUpload(file, 'image');
      if (validationError) {
        toast({ title: "Invalid file", description: validationError, variant: "destructive" });
        return;
      }
    }
    setQrFile(file);
    if (file && user) {
      const upiId = await scanUpiFromFile(file, user.id);
      if (upiId) {
        setFormData(prev => ({ ...prev, upi_vpa: upiId }));
      }
    }
  };

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
  });

  // Convert DB datetime to local datetime-local input format
  const toLocalDatetime = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert local datetime-local input back to UTC ISO string for timestamptz columns
  const toUtcISOString = (localDatetime: string): string | null => {
    if (!localDatetime) return null;
    const d = new Date(localDatetime);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        category: event.category || "",
        event_type: event.event_type || "",
        status: event.status || "draft",
        poster_ratio: ((event as any).poster_ratio || "4:5") as "4:5" | "1:1" | "16:9",
        state: (event as any).state || "",
        city: (event as any).city || "",
        is_location_decided: event.is_location_decided || false,
        venue_name: event.venue_name || "",
        venue_address: event.venue_address || "",
        maps_link: event.maps_link || "",
        start_date: event.start_date ? toLocalDatetime(event.start_date) : "",
        end_date: event.end_date ? toLocalDatetime(event.end_date) : "",
        registration_end_date: (event as any).registration_end_date ? toLocalDatetime((event as any).registration_end_date) : "",
        description: event.description || "",
        terms_conditions: event.terms_conditions || "",
        is_paid: event.is_paid || false,
        price: event.price || 0,
        max_capacity: event.max_capacity?.toString() || "",
        upi_vpa: event.upi_vpa || "",
        enable_quick_register: (event as any).enable_quick_register !== false,
        allow_audience_members: (event as any).allow_audience_members || false,
        artist_free_entry: (event as any).artist_free_entry || false,
      });
    }
  }, [event]);

  const updateForm = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateEventMutation = useMutation({
    mutationFn: async () => {
      if (!user || !event) throw new Error("Not authorized");

      let flyerUrl = event.flyer_url;
      let upiQrUrl = event.upi_qr_url;

      // Upload new flyer if provided - store PATH only
      if (flyerFile) {
        const ext = flyerFile.name.split(".").pop();
        const path = `${user.id}/flyers/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("event-assets").upload(path, flyerFile);
        if (error) throw error;
        // Store path only - proxy will generate URLs on-demand
        flyerUrl = `event-assets:${path}`;
      }

      // Upload new UPI QR if provided - store PATH only
      if (qrFile && formData.is_paid) {
        const ext = qrFile.name.split(".").pop();
        const path = `${user.id}/upi-qr/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("event-assets").upload(path, qrFile);
        if (error) throw error;
        // Store path only - proxy will generate URLs on-demand
        upiQrUrl = `event-assets:${path}`;
      }

      const startDateIso = toUtcISOString(formData.start_date);
      if (!startDateIso) throw new Error("Please select a valid start date and time.");

      const { error } = await supabase
        .from("events")
        .update({
          title: formData.title,
          category: formData.category,
          event_type: formData.event_type,
          status: formData.status as "draft" | "published" | "cancelled" | "completed",
          poster_ratio: formData.poster_ratio,
          state: formData.state,
          city: formData.city,
          flyer_url: flyerUrl,
          is_location_decided: formData.is_location_decided,
          venue_name: formData.is_location_decided ? formData.venue_name : null,
          venue_address: formData.is_location_decided ? formData.venue_address : null,
          maps_link: formData.is_location_decided ? formData.maps_link : null,
          start_date: startDateIso,
          end_date: toUtcISOString(formData.end_date),
          registration_end_date: toUtcISOString(formData.registration_end_date),
          description: formData.description || null,
          terms_conditions: formData.terms_conditions || null,
          is_paid: formData.is_paid,
          price: formData.is_paid ? formData.price : 0,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity, 10) : null,
          upi_qr_url: formData.is_paid ? upiQrUrl : null,
          upi_vpa: formData.is_paid ? formData.upi_vpa : null,
          enable_quick_register: formData.enable_quick_register,
          allow_audience_members: formData.allow_audience_members,
          artist_free_entry: formData.artist_free_entry,
        })
        .eq("id", eventId!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Event Updated!", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["organizer-events"] });
      navigate("/organizer/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <Button onClick={() => setShowAuthModal(true)}>Login</Button>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </main>
      </div>
    );
  }

  if (!event || event.organizer_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authorized</h1>
          <p className="text-muted-foreground mb-6">You can only edit your own events.</p>
          <Button onClick={() => navigate("/organizer/dashboard")}>Back to Dashboard</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-3xl">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/organizer/dashboard")}>
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        <h1 className="font-display text-3xl font-bold mb-8">Edit Event</h1>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update event details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Event Name *</Label>
                <Input value={formData.title} onChange={(e) => updateForm("title", e.target.value)} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MultiSelectPicker
                  type="category"
                  selected={parseMultiValue(formData.category)}
                  onChange={(vals) => updateForm("category", joinMultiValue(vals))}
                />
                <MultiSelectPicker
                  type="event_type"
                  selected={parseMultiValue(formData.event_type)}
                  onChange={(vals) => updateForm("event_type", joinMultiValue(vals))}
                />
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => updateForm("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* State & City Selection */}
              <StateCitySelect
                state={formData.state}
                city={formData.city}
                onStateChange={(v) => updateForm("state", v)}
                onCityChange={(v) => updateForm("city", v)}
                required
              />

              <div className="space-y-2">
                <Label>Event Flyer</Label>
                {event.flyer_url && (
                  <img src={event.flyer_url} alt="Current flyer" className="w-32 h-20 object-contain rounded-lg mb-2" />
                )}
                <div className="border-2 border-dashed rounded-xl p-4 text-center">
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      const validationError = validateFileUpload(file, 'image');
                      if (validationError) {
                        toast({ title: "Invalid file", description: validationError, variant: "destructive" });
                        return;
                      }
                    }
                    setFlyerFile(file);
                  }} className="hidden" id="flyer" />
                  <label htmlFor="flyer" className="cursor-pointer flex flex-col items-center gap-2">
                    <Image className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{flyerFile ? flyerFile.name : "Upload new flyer"}</span>
                  </label>
                </div>
              </div>

              {/* Poster Aspect Ratio Selection */}
              <div className="space-y-2">
                <Label>Poster Aspect Ratio</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '4:5', label: '4:5', desc: 'Portrait' },
                    { value: '1:1', label: '1:1', desc: 'Square' },
                    { value: '16:9', label: '16:9', desc: 'Landscape' },
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => updateForm("poster_ratio", ratio.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        formData.poster_ratio === ratio.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="block font-medium">{ratio.label}</span>
                      <span className="text-xs text-muted-foreground">{ratio.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time *</Label>
                  <Input type="datetime-local" value={formData.start_date} onChange={(e) => updateForm("start_date", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date & Time</Label>
                  <Input type="datetime-local" value={formData.end_date} onChange={(e) => updateForm("end_date", e.target.value)} />
                </div>
              </div>

              {/* Registration End Date */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label className="font-medium">Registration Deadline (Optional)</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  If set, registrations will automatically close after this date. Leave empty to keep registration open until event starts.
                </p>
                <Input 
                  type="datetime-local" 
                  value={formData.registration_end_date} 
                  onChange={(e) => updateForm("registration_end_date", e.target.value)}
                />
                {formData.registration_end_date && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => updateForm("registration_end_date", "")}
                    className="text-muted-foreground"
                  >
                    Clear deadline
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <Label>Is location decided?</Label>
                <Switch checked={formData.is_location_decided} onCheckedChange={(c) => updateForm("is_location_decided", c)} />
              </div>

              {formData.is_location_decided && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Venue Name</Label>
                    <Input value={formData.venue_name} onChange={(e) => updateForm("venue_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={formData.venue_address} onChange={(e) => updateForm("venue_address", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Google Maps Link</Label>
                    <Input value={formData.maps_link} onChange={(e) => updateForm("maps_link", e.target.value)} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextarea
                  value={formData.description}
                  onChange={(val) => updateForm("description", val)}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <RichTextarea
                  value={formData.terms_conditions}
                  onChange={(val) => updateForm("terms_conditions", val)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ticketing */}
          <Card>
            <CardHeader>
              <CardTitle>Ticketing & Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <Label className="text-base">Paid Event</Label>
                  <p className="text-sm text-muted-foreground">Toggle on if this is a paid event</p>
                </div>
                <Switch checked={formData.is_paid} onCheckedChange={(c) => updateForm("is_paid", c)} />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <Label className="text-base">Enable Quick Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow users to register quickly with minimal steps</p>
                </div>
                <Switch 
                  checked={formData.enable_quick_register} 
                  onCheckedChange={(c) => updateForm("enable_quick_register", c)} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <Label className="text-base">Allow Audience Members</Label>
                  <p className="text-sm text-muted-foreground">Let registrants bring additional audience members with their ticket</p>
                </div>
                <Switch 
                  checked={formData.allow_audience_members} 
                  onCheckedChange={(c) => updateForm("allow_audience_members", c)} 
                />
              </div>

              {formData.allow_audience_members && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl ml-4 border-l-2 border-primary/30">
                  <div>
                    <Label className="text-base">Artist Free Entry</Label>
                    <p className="text-sm text-muted-foreground">Artist doesn't pay for their own ticket — only audience members are charged</p>
                  </div>
                  <Switch 
                    checked={formData.artist_free_entry} 
                    onCheckedChange={(c) => updateForm("artist_free_entry", c)} 
                  />
                </div>
              )}

              {formData.is_paid && (
                <>
                  <div className="space-y-2">
                    <Label>UPI QR Code (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Upload the <strong>original QR image</strong> from your payment app. Screenshots or WhatsApp images may not work.
                    </p>
                    {event.upi_qr_url && (
                      <img src={toDisplayUrl(event.upi_qr_url, { forceImage: true }) || undefined} alt="Current QR" className="w-24 h-24 object-contain rounded-lg mb-2" />
                    )}
                    <div className="border-2 border-dashed rounded-xl p-4 text-center">
                      <Input type="file" accept="image/*" onChange={(e) => handleQrFileChange(e.target.files?.[0] || null)} className="hidden" id="qr" />
                      <label htmlFor="qr" className="cursor-pointer flex flex-col items-center gap-2">
                        {isScanning ? (
                          <>
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-sm text-muted-foreground">Scanning QR for UPI ID...</span>
                          </>
                        ) : (
                          <>
                            <Image className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{qrFile ? qrFile.name : "Upload new QR"}</span>
                          </>
                        )}
                      </label>
                    </div>
                    {qrFile && !isScanning && (
                      <p className="text-xs text-muted-foreground">UPI ID will be auto-detected. If not detected, enter manually below.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>UPI VPA ID *</Label>
                    <p className="text-xs text-muted-foreground mb-1">
                      Enter your UPI ID manually if QR scan fails (e.g., yourname@paytm)
                    </p>
                    <Input 
                      value={formData.upi_vpa} 
                      onChange={(e) => updateForm("upi_vpa", e.target.value)} 
                      placeholder="yourname@upi"
                      className={formData.upi_vpa ? "border-green-500" : ""}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Max Capacity (optional)</Label>
                <Input type="number" value={formData.max_capacity} onChange={(e) => updateForm("max_capacity", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Upsells Section */}
          {event.is_paid && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Upsells & Offers
                </CardTitle>
                <CardDescription>Configure group discounts and add-ons</CardDescription>
              </CardHeader>
              <CardContent>
                <UpsellManager eventId={eventId!} isPaidEvent={true} />
              </CardContent>
            </Card>
          )}

          {/* Ticket Categories Section */}
          <TicketCategoriesManager eventId={eventId!} isPaidEvent={formData.is_paid} />
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this event</CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteEventDialog 
                eventId={eventId!} 
                eventTitle={event.title} 
                registrationsCount={event.registrations_count}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/organizer/dashboard")}>Cancel</Button>
            <Button onClick={() => updateEventMutation.mutate()} disabled={updateEventMutation.isPending}>
              {updateEventMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditEvent;
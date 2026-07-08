import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextarea from "@/components/common/RichTextarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validateFileUpload } from "@/lib/fileValidation";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { FormBuilder, type FormBuilderField } from "@/components/events/FormBuilder";
import ClubPricingSection, { type EventClubConfig } from "@/components/events/ClubPricingSection";
import { UpsellConfigSection, type DraftUpsell } from "@/components/events/UpsellConfigSection";
import TicketCategoryBuilder from "@/components/events/TicketCategoryBuilder";
import { createTicketCategories, type DraftTicketCategory } from "@/services/ticketCategoryService";
import { createFormFields } from "@/services/eventFormService";
import { addClubToEvent } from "@/services/clubService";
import { createEventUpsellsBulk, updateUpsellSettings } from "@/services/upsellService";
import { sendEventCreatedEmail } from "@/services/brevoEmailService";
import { ArrowLeft, ArrowRight, Check, Calendar, FileText, Ticket, CreditCard, Image, ClipboardList, Loader2, Sparkles } from "lucide-react";
import { useUpiScanner } from "@/hooks/useUpiScanner";
import StateCitySelect from "@/components/common/StateCitySelect";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = [
  { id: 1, title: "Basic Info", icon: Calendar },
  { id: 2, title: "Description", icon: FileText },
  { id: 3, title: "Custom Form", icon: ClipboardList },
  { id: 4, title: "Ticketing", icon: Ticket },
  { id: 5, title: "Upsells", icon: Sparkles },
  { id: 6, title: "Payment", icon: CreditCard },
];

import MultiSelectPicker from "@/components/events/MultiSelectPicker";
import { parseMultiValue, joinMultiValue } from "@/constants/eventOptions";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, isOrganizer } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { scanUpiFromFile, isScanning } = useUpiScanner();
  const { hasProfile, isLoading: checkingProfile, refetchHasProfile } = useOrganizerProfile();
  
  // Combined check: user has organizer profile OR is marked as organizer in auth context
  const canCreateEvents = hasProfile || isOrganizer;
  
  // Debug logging
  useEffect(() => {
    console.log('[CreateEvent] Auth state:', { 
      userId: user?.id, 
      hasProfile, 
      isOrganizer, 
      canCreateEvents,
      checkingProfile 
    });
  }, [user?.id, hasProfile, isOrganizer, canCreateEvents, checkingProfile]);
  
  // Show loading while checking profile
  if (checkingProfile) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Redirect to organizer onboarding if no profile (using combined check)
  if (user && !canCreateEvents) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Organizer Profile</CardTitle>
            <CardDescription>
              Before creating events, you need to set up your organizer profile. This only takes a minute!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your organizer profile helps attendees know who's hosting the event and builds trust in your brand.
            </p>
            <Button
              size="lg" 
              onClick={() => navigate('/organizer/onboarding?redirect=/organizer/create-event')}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Set Up Organizer Profile
            </Button>
            {/* Debug refresh button - helps if cache is stale */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await refetchHasProfile();
                toast({ title: "Refreshing...", description: "Checking your organizer status" });
              }}
              className="text-muted-foreground"
            >
              Already completed? Click to refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    event_type: "",
    flyer_url: "",
    poster_ratio: "4:5" as "4:5", // STRICT: Only 4:5 allowed
    state: "",
    city: "",
    is_location_decided: false,
    venue_name: "",
    venue_address: "",
    maps_link: "",
    start_date: "",
    end_date: "",
    description: "",
    terms_conditions: "",
    is_paid: false,
    price: 0,
    max_capacity: "",
    upi_qr_url: "",
    upi_vpa: "",
    enable_quick_register: true,
    allow_audience_members: false,
    artist_free_entry: false,
  });

  // Custom form fields
  const [customFields, setCustomFields] = useState<FormBuilderField[]>([]);

  // Club pricing configs
  const [clubConfigs, setClubConfigs] = useState<EventClubConfig[]>([]);

  // Upsell configs
  const [draftUpsells, setDraftUpsells] = useState<DraftUpsell[]>([]);
  const [upsellEnabled, setUpsellEnabled] = useState(false);
  const [ticketCategories, setTicketCategories] = useState<DraftTicketCategory[]>([]);

  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerError, setFlyerError] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
        updateForm("upi_vpa", upiId);
      }
    }
  };

  // Validate flyer aspect ratio (4:5)
  const validateFlyerAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const targetRatio = 4 / 5; // 0.8
        const tolerance = 0.1; // Allow 10% tolerance
        const isValid = Math.abs(aspectRatio - targetRatio) <= tolerance;
        URL.revokeObjectURL(img.src);
        resolve(isValid);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFlyerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFlyerFile(null);
      setFlyerError(null);
      return;
    }

    const validationError = validateFileUpload(file, 'image');
    if (validationError) {
      setFlyerError(validationError);
      setFlyerFile(null);
      e.target.value = '';
      return;
    }

    // STRICT: Validate aspect ratio - only allow 4:5
    const isValidRatio = await validateFlyerAspectRatio(file);
    if (!isValidRatio) {
      setFlyerError('Only 4:5 aspect ratio images are allowed for event flyers. Please crop or resize your image (e.g., 800x1000, 1080x1350, 1200x1500).');
      setFlyerFile(null);
      e.target.value = ''; // Reset input to reject the file
      toast({
        title: "Invalid aspect ratio",
        description: "Only 4:5 aspect ratio images are allowed. Please resize your image.",
        variant: "destructive",
      });
      return;
    }

    setFlyerError(null);
    setFlyerFile(file);
  };

  const updateForm = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      console.log("[CreateEvent] Starting event creation...");
      setUploading(true);

      let flyerUrl = formData.flyer_url;
      let upiQrUrl = formData.upi_qr_url;

      try {
        // Upload flyer - store PATH only, not full Supabase URL
        if (flyerFile) {
          console.log("[CreateEvent] Uploading flyer...");
          const ext = flyerFile.name.split(".").pop();
          const path = `${user.id}/flyers/${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("event-assets").upload(path, flyerFile);
          if (error) {
            console.error("[CreateEvent] Flyer upload error:", error);
            throw new Error(`Flyer upload failed: ${error.message}`);
          }
          // Store path only - proxy will generate URLs on-demand
          flyerUrl = `event-assets:${path}`;
          console.log("[CreateEvent] Flyer uploaded, path:", path);
        }

        // Upload UPI QR - store PATH only
        if (qrFile && formData.is_paid) {
          console.log("[CreateEvent] Uploading UPI QR...");
          const ext = qrFile.name.split(".").pop();
          const path = `${user.id}/upi-qr/${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("event-assets").upload(path, qrFile);
          if (error) {
            console.error("[CreateEvent] UPI QR upload error:", error);
            throw new Error(`UPI QR upload failed: ${error.message}`);
          }
          // Store path only - proxy will generate URLs on-demand
          upiQrUrl = `event-assets:${path}`;
          console.log("[CreateEvent] UPI QR uploaded, path:", path);
        }

        console.log("[CreateEvent] Inserting event into database...");
        const { data, error } = await supabase.from("events").insert({
          organizer_id: user.id,
          title: formData.title,
          category: formData.category,
          event_type: formData.event_type,
          flyer_url: flyerUrl || null,
          poster_ratio: formData.poster_ratio,
          state: formData.state,
          city: formData.city,
          is_location_decided: formData.is_location_decided,
          venue_name: formData.is_location_decided ? formData.venue_name : null,
          venue_address: formData.is_location_decided ? formData.venue_address : null,
          maps_link: formData.is_location_decided ? formData.maps_link : null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
          description: formData.description || null,
          terms_conditions: formData.terms_conditions || null,
          is_paid: formData.is_paid,
          price: formData.is_paid ? formData.price : 0,
          max_capacity: formData.max_capacity ? parseInt(formData.max_capacity) : null,
          upi_qr_url: formData.is_paid ? upiQrUrl : null,
          upi_vpa: formData.is_paid ? formData.upi_vpa : null,
          enable_quick_register: formData.enable_quick_register,
          allow_audience_members: formData.allow_audience_members,
          artist_free_entry: formData.artist_free_entry,
          status: "published",
        }).select().single();

        if (error) {
          console.error("[CreateEvent] Database insert error:", error);
          throw new Error(`Failed to create event: ${error.message}`);
        }
        console.log("[CreateEvent] Event created:", data.id);

        // Save custom form fields if any
        if (customFields.length > 0) {
          console.log("[CreateEvent] Saving custom form fields...");
          const fieldsToSave = customFields.map((field, index) => ({
            field_type: field.field_type,
            label: field.label,
            description: field.description,
            placeholder: field.placeholder,
            is_required: field.is_required,
            field_order: index,
            options: field.options,
            validation_rules: field.validation_rules,
            conditional_logic: field.conditional_logic,
          }));

          await createFormFields(data.id, fieldsToSave);
        }

        // Save club pricing configs if any
        if (clubConfigs.length > 0) {
          console.log("[CreateEvent] Saving club configs...");
          for (const config of clubConfigs) {
            await addClubToEvent(data.id, config.clubId, config.memberPrice, config.memberBenefits);
          }
        }

        // Save upsells if any (only for paid events)
        if (formData.is_paid && draftUpsells.length > 0) {
          console.log("[CreateEvent] Saving upsells...");
          await createEventUpsellsBulk(data.id, draftUpsells);
          await updateUpsellSettings(data.id, { upsell_enabled: upsellEnabled });
        }

        // Save ticket categories if any
        if (ticketCategories.length > 0) {
          console.log("[CreateEvent] Saving ticket categories...");
          await createTicketCategories(data.id, ticketCategories);
        }

        // Auto-assign organizer role to the user (silently, no UI interruption)
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "organizer")
          .maybeSingle();

        if (!existingRole) {
          console.log("[CreateEvent] Assigning organizer role...");
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: "organizer",
          });
        }

        setUploading(false);
        console.log("[CreateEvent] Success!");
        return data;
      } catch (err) {
        console.error("[CreateEvent] Caught error:", err);
        throw err;
      }
    },
    onSuccess: async (data) => {
      toast({ title: "Event Created!", description: "Your event is now live and will appear instantly for all users." });
      
      // Send event created email notification (fire and forget)
      if (user?.email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        const eventDate = new Date(formData.start_date).toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        sendEventCreatedEmail(
          user.email,
          profile?.full_name || 'Organizer',
          data.title,
          eventDate,
          data.id
        );
      }
      
      navigate(`/events/${data.id}`);
    },
    onError: (error: Error) => {
      setUploading(false);
      console.error("[CreateEvent] Mutation error:", error);
      toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
    },
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.title && formData.category && formData.event_type && formData.start_date && formData.state && formData.city;
      case 2: return formData.description.length >= 50 && formData.terms_conditions.length >= 10;
      case 3: return true; // Custom form is optional
      case 4: return true; // Ticketing config is always valid — pricing is set via ticket categories or payment step
      case 5: return true; // Upsells are optional
      case 6: return !formData.is_paid || (formData.upi_vpa || qrFile);
      default: return true;
    }
  };

  const getStepError = () => {
    if (currentStep === 2) {
      if (formData.description.length < 50) {
        return `Description must be at least 50 characters (${formData.description.length}/50)`;
      }
      if (formData.terms_conditions.length < 10) {
        return "Terms & Conditions are required";
      }
    }
    if (currentStep === 4 && formData.is_paid && formData.price <= 0 && ticketCategories.length === 0) {
      return "Please add at least one ticket category with a valid price";
    }
    return null;
  };

  const nextStep = () => currentStep < 6 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to create events.</p>
          <Button onClick={() => setShowAuthModal(true)}>Login</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-3xl">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/events")}>
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>

        <h1 className="font-display text-3xl font-bold mb-8">Create Event</h1>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center shrink-0">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= step.id ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
              }`}>
                {currentStep > step.id ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
              </div>
              <span className={`ml-2 hidden sm:block text-sm font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                {step.title}
              </span>
              {idx < STEPS.length - 1 && <div className={`w-6 sm:w-12 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Set up the basic details of your event"}
              {currentStep === 2 && "Add a description and any terms"}
              {currentStep === 3 && "Create custom registration form fields"}
              {currentStep === 4 && "Configure ticketing options"}
              {currentStep === 5 && "Set up group offers and add-ons"}
              {currentStep === 6 && "Set up payment collection"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input value={formData.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="e.g., Tech Hackathon 2024" />
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
                </div>

                {/* State & City Selection */}
                <StateCitySelect
                  state={formData.state}
                  city={formData.city}
                  onStateChange={(v) => updateForm("state", v)}
                  onCityChange={(v) => updateForm("city", v)}
                  required
                  stateError={!formData.state && formData.title ? "State is required" : undefined}
                  cityError={formData.state && !formData.city ? "City is required" : undefined}
                />

                <div className="space-y-2">
                  <Label>Event Flyer (4:5 aspect ratio only) *</Label>
                  <p className="text-xs text-muted-foreground">Upload portrait-style poster (800×1000, 1080×1350, etc.)</p>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center ${flyerError ? 'border-destructive' : ''}`}>
                    <Input type="file" accept="image/*" onChange={handleFlyerChange} className="hidden" id="flyer" />
                    <label htmlFor="flyer" className="cursor-pointer flex flex-col items-center gap-2">
                      <Image className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{flyerFile ? flyerFile.name : "Click to upload 4:5 flyer"}</span>
                    </label>
                  </div>
                  {flyerError && (
                    <p className="text-xs text-destructive">{flyerError}</p>
                  )}
                </div>

                {/* STRICT 4:5 only - aspect ratio selector removed */}

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

                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <Label>Is location decided?</Label>
                  <Switch checked={formData.is_location_decided} onCheckedChange={(c) => updateForm("is_location_decided", c)} />
                </div>

                {formData.is_location_decided && (
                  <div className="space-y-4 p-4 border rounded-xl">
                    <div className="space-y-2">
                      <Label>Venue Name</Label>
                      <Input value={formData.venue_name} onChange={(e) => updateForm("venue_name", e.target.value)} placeholder="e.g., Main Auditorium" />
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input value={formData.venue_address} onChange={(e) => updateForm("venue_address", e.target.value)} placeholder="Full address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Google Maps Link</Label>
                      <Input value={formData.maps_link} onChange={(e) => updateForm("maps_link", e.target.value)} placeholder="https://maps.google.com/..." />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 2: Description */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label>Description * <span className="text-muted-foreground text-xs">(min 50 characters)</span></Label>
                  <RichTextarea
                    value={formData.description}
                    onChange={(val) => updateForm("description", val)}
                    placeholder="Describe your event in detail..."
                    rows={8}
                    minLength={50}
                    showCharCount
                  />
                </div>
                <div className="space-y-2">
                  <Label>Terms & Conditions *</Label>
                  <RichTextarea
                    value={formData.terms_conditions}
                    onChange={(val) => updateForm("terms_conditions", val)}
                    placeholder="Event rules, refund policy, code of conduct..."
                    rows={4}
                  />
                  {formData.terms_conditions.length === 0 && (
                    <p className="text-xs text-destructive">Terms & Conditions are required</p>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Custom Form Builder */}
            {currentStep === 3 && (
              <FormBuilder 
                fields={customFields} 
                onChange={setCustomFields}
                eventTitle={formData.title || "Your Event"}
              />
            )}

            {/* Step 4: Ticketing */}
            {currentStep === 4 && (
              <>
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

                {formData.is_paid && (
                  <>
                    {/* Club Pricing Section */}
                    <ClubPricingSection
                      clubs={clubConfigs}
                      standardPrice={formData.price}
                      onChange={setClubConfigs}
                    />
                  </>
                )}

                <div className="space-y-2">
                  <Label>Max Capacity (optional)</Label>
                  <Input type="number" value={formData.max_capacity} onChange={(e) => updateForm("max_capacity", e.target.value)} placeholder="100" />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                </div>

                {/* Ticket Categories */}
                <TicketCategoryBuilder
                  categories={ticketCategories}
                  onChange={setTicketCategories}
                  isPaidEvent={formData.is_paid}
                />

                {/* Allow Audience Members toggle */}
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
              </>
            )}

            {/* Step 5: Upsells */}
            {currentStep === 5 && (
              <UpsellConfigSection
                upsells={draftUpsells}
                onChange={setDraftUpsells}
                upsellEnabled={upsellEnabled}
                onUpsellEnabledChange={setUpsellEnabled}
                isPaidEvent={formData.is_paid}
              />
            )}

            {/* Step 6: Payment */}
            {currentStep === 6 && (
              <>
                {!formData.is_paid ? (
                  <div className="text-center py-8">
                    <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">This is a free event</h3>
                    <p className="text-muted-foreground">No payment setup required</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Users will pay you directly via UPI. Upload your QR code and the UPI ID will be auto-detected.</p>
                    <div className="space-y-2">
                      <Label>UPI QR Code</Label>
                      <div className="border-2 border-dashed rounded-xl p-4 text-center relative">
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
                              <span className="text-sm text-muted-foreground">{qrFile ? qrFile.name : "Upload UPI QR image"}</span>
                            </>
                          )}
                        </label>
                      </div>
                      {qrFile && !isScanning && (
                        <p className="text-xs text-muted-foreground">UPI ID will be auto-detected from the QR code</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>UPI VPA ID {formData.upi_vpa && <span className="text-xs text-green-600">(auto-detected)</span>}</Label>
                      <Input value={formData.upi_vpa} onChange={(e) => updateForm("upi_vpa", e.target.value)} placeholder="yourname@upi" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}><ArrowLeft className="w-4 h-4 mr-2" /> Previous</Button>
              {currentStep < 6 ? (
                <Button onClick={nextStep} disabled={!canProceed()}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
              ) : (
                <Button onClick={() => createEventMutation.mutate()} disabled={!canProceed() || createEventMutation.isPending || uploading}>
                  {uploading || createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateEvent;

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { 
  createOrganizerProfile, 
  uploadOrganizerLogo,
  type CreateOrganizerProfileData 
} from "@/services/organizerService";
import { 
  User, Tag, Users, Building2, Heart, School, GraduationCap, 
  Tent, BarChart3, Plus, ArrowLeft, ArrowRight, Check, 
  Camera, Globe, Loader2, Sparkles, Trophy, ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";
import { validateFileUpload } from "@/lib/fileValidation";

// Step configurations
const STEPS = [
  { id: 0, title: "Profile", label: "Create Profile" },
  { id: 1, title: "Identity", label: "Your Identity" },
  { id: 2, title: "Events", label: "Event Types" },
  { id: 3, title: "Details", label: "Event Details" },
  { id: 4, title: "Goals", label: "Your Goals" },
];

const IDENTITY_OPTIONS = [
  { value: "individual", label: "Individual", icon: User },
  { value: "brand", label: "Brand", icon: Tag },
  { value: "community", label: "Community", icon: Users },
  { value: "company", label: "Company", icon: Building2 },
  { value: "nonprofit", label: "Nonprofit", icon: Heart },
  { value: "school", label: "School", icon: School },
  { value: "university", label: "University", icon: GraduationCap },
  { value: "event_company", label: "Event Company", icon: Tent },
  { value: "agency", label: "Agency", icon: BarChart3 },
  { value: "others", label: "Others", icon: Plus },
];

const EVENT_TYPE_OPTIONS = [
  "Workshops", "Music & Concerts", "Business & Networking", "Sports & Fitness",
  "Community & Social", "Health & Wellness", "Education & Learning", 
  "Festivals & Fairs", "Food & Drinks", "Arts & Culture", 
  "Technology & Innovation", "Travel & Adventure"
];

const FREQUENCY_OPTIONS = [
  { value: "one_time", label: "One-time event" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "seasonal", label: "Seasonal" },
  { value: "annual", label: "Annual" },
];

const SIZE_OPTIONS = [
  { value: "1-50", label: "1–50 people" },
  { value: "51-100", label: "51–100 people" },
  { value: "101-500", label: "101–500 people" },
  { value: "501-1000", label: "501–1000 people" },
  { value: "1000+", label: "1000+ people" },
];

const GOAL_OPTIONS = [
  "Sell more tickets", "Build my audience", "Increase revenue",
  "Increase brand awareness", "Build community", "Networking opportunities"
];

const DISCOVERY_OPTIONS = [
  "Google Search", "Instagram", "Facebook", "LinkedIn", "ChatGPT",
  "Friend / Colleague", "Online Advertisement", "Blog / Article", "Other"
];

interface FormData {
  logo: File | null;
  logoPreviewUrl: string;
  name: string;
  website: string;
  identityType: string | null;
  eventTypes: string[];
  eventFrequency: string | null;
  eventSize: string | null;
  primaryGoals: string[];
  discoverySource: string | null;
}

const OrganizerOnboarding = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user already has an organizer profile
  const { hasProfile, profile, isLoading: checkingProfile } = useOrganizerProfile();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    logo: null,
    logoPreviewUrl: "",
    name: "",
    website: "",
    identityType: null,
    eventTypes: [],
    eventFrequency: null,
    eventSize: null,
    primaryGoals: [],
    discoverySource: null,
  });
  
  // Redirect if user already has an organizer profile
  useEffect(() => {
    if (!checkingProfile && hasProfile && !showSuccess) {
      toast({
        title: "Profile already exists",
        description: "You already have an organizer profile. Redirecting...",
      });
      // Navigate to the redirect URL or organizer panel
      navigate(redirectUrl || "/organizer");
    }
  }, [checkingProfile, hasProfile, showSuccess, navigate, redirectUrl, toast]);
  
  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("organizer_onboarding_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed, logo: null }));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);
  
  // Save to localStorage
  useEffect(() => {
    const { logo, ...saveable } = formData;
    localStorage.setItem("organizer_onboarding_draft", JSON.stringify(saveable));
  }, [formData]);
  
  // Countdown for success screen
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSuccess && countdown === 0) {
      // Redirect to original page if specified, otherwise to organizer panel
      navigate(redirectUrl || "/organizer");
    }
  }, [showSuccess, countdown, navigate, redirectUrl]);
  
  // Show loading while checking for existing profile
  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-2 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const toggleEventType = (type: string) => {
    setFormData(prev => {
      const current = prev.eventTypes;
      if (current.includes(type)) {
        return { ...prev, eventTypes: current.filter(t => t !== type) };
      } else if (current.length < 5) {
        return { ...prev, eventTypes: [...current, type] };
      }
      return prev;
    });
  };
  
  const toggleGoal = (goal: string) => {
    setFormData(prev => {
      const current = prev.primaryGoals;
      if (current.includes(goal)) {
        return { ...prev, primaryGoals: current.filter(g => g !== goal) };
      }
      return { ...prev, primaryGoals: [...current, goal] };
    });
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFileUpload(file, 'image');
      if (validationError) {
        toast({
          title: "Invalid file",
          description: validationError,
          variant: "destructive",
        });
        return;
      }
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, logo: file, logoPreviewUrl: url }));
    }
  };
  
  const isStep0Valid = formData.name.trim().length >= 2;
  
  const canContinue = () => {
    if (currentStep === 0) return isStep0Valid;
    return true; // Other steps are optional
  };
  
  const handleContinue = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      let logoUrl: string | null = null;
      
      // Upload logo if provided
      if (formData.logo) {
        const { url, error: uploadError } = await uploadOrganizerLogo(user.id, formData.logo);
        if (uploadError) {
          toast({
            title: "Logo upload failed",
            description: uploadError.message,
            variant: "destructive",
          });
        } else {
          logoUrl = url;
        }
      }
      
      const profileData: CreateOrganizerProfileData = {
        name: formData.name.trim(),
        logo_url: logoUrl,
        website_url: formData.website.trim() || null,
        identity_type: formData.identityType,
        event_types: formData.eventTypes,
        event_frequency: formData.eventFrequency,
        average_event_size: formData.eventSize,
        primary_goals: formData.primaryGoals,
        discovery_source: formData.discoverySource,
      };
      
      const { profile, error } = await createOrganizerProfile(user.id, profileData);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Clear draft
      localStorage.removeItem("organizer_onboarding_draft");
      
      // Refresh auth context to pick up new organizer role
      await refreshProfile();
      
      // Invalidate organizer profile queries with specific user ID for precise cache busting
      await queryClient.invalidateQueries({ queryKey: ['hasOrganizerProfile', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['organizerProfile', user.id] });
      // Also invalidate without user ID for any general queries
      await queryClient.invalidateQueries({ queryKey: ['hasOrganizerProfile'] });
      await queryClient.invalidateQueries({ queryKey: ['organizerProfile'] });
      console.log('[OrganizerOnboarding] Profile created, cache invalidated for user:', user.id);
      
      // Show success with confetti
      setCreatedSlug(profile?.slug || null);
      setShowSuccess(true);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD54F', '#FFF9C4', '#FF6B6B', '#4ECDC4'],
      });
      
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Congratulations, you're all set!
          </h1>
          <p className="text-muted-foreground mb-8">
            You're now ready to host and grow your events with UniVoid.
          </p>
          
          <div className="space-y-3">
            {redirectUrl && (
              <Button 
                onClick={() => navigate(redirectUrl)}
                className="w-full"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Continue to Create Event
              </Button>
            )}
            {createdSlug && !redirectUrl && (
              <Button 
                onClick={() => navigate(`/o/${createdSlug}`)}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View My Organizer Profile
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => navigate(redirectUrl || "/organizer")}
              className="w-full"
              size="lg"
            >
              {redirectUrl ? "Go to Organizer Panel Instead" : "Go to Organizer Panel"}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Redirecting in {countdown}s...
          </p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-3">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`text-xs ${
                  index <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="hidden sm:block">{step.title}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 0: Create Profile */}
            {currentStep === 0 && (
              <>
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Create Your Organizer Page</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">
                    This will be your public identity on UniVoid
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="flex flex-col items-center">
                    <Label className="mb-3">Organizer Logo (Optional)</Label>
                    <label className="cursor-pointer group">
                      <div className={`w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${
                        formData.logoPreviewUrl ? 'border-primary' : 'border-muted-foreground/30 hover:border-primary/50'
                      }`}>
                        {formData.logoPreviewUrl ? (
                          <img 
                            src={formData.logoPreviewUrl} 
                            alt="Logo preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max 5MB · JPG, PNG, WebP
                    </p>
                  </div>
                  
                  {/* Organizer Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Organizer Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Your organization or brand name"
                      maxLength={100}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min 2 characters</span>
                      <span>{formData.name.length}/100</span>
                    </div>
                  </div>
                  
                  {/* Website */}
                  <div className="space-y-2">
                    <Label htmlFor="website">Website (Optional)</Label>
                    <div className="flex">
                      <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => updateField("website", e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="rounded-l-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </>
            )}
            
            {/* Step 1: Identity Type */}
            {currentStep === 1 && (
              <>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Which best describes you?</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">
                    Help us personalize your experience
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {IDENTITY_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = formData.identityType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField("identityType", isSelected ? null : option.value)}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium">{option.label}</span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </>
            )}
            
            {/* Step 2: Event Types */}
            {currentStep === 2 && (
              <>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">What type of events do you host?</CardTitle>
                  <p className="text-muted-foreground text-sm mt-2">
                    Select up to 5 categories
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPE_OPTIONS.map((type) => {
                      const isSelected = formData.eventTypes.includes(type);
                      const isDisabled = !isSelected && formData.eventTypes.length >= 5;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleEventType(type)}
                          disabled={isDisabled}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : isDisabled
                              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {type}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    {formData.eventTypes.length}/5 selected
                  </p>
                </CardContent>
              </>
            )}
            
            {/* Step 3: Frequency & Size */}
            {currentStep === 3 && (
              <>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Tell us about your events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">How often do you organize events?</Label>
                    <div className="flex flex-wrap gap-2">
                      {FREQUENCY_OPTIONS.map((option) => {
                        const isSelected = formData.eventFrequency === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField("eventFrequency", isSelected ? null : option.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-3 block">On average, how large are your events?</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {SIZE_OPTIONS.map((option) => {
                        const isSelected = formData.eventSize === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField("eventSize", isSelected ? null : option.value)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <span className="font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </>
            )}
            
            {/* Step 4: Goals & Discovery */}
            {currentStep === 4 && (
              <>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">Almost there!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">What's your primary goal on UniVoid?</Label>
                    <div className="flex flex-wrap gap-2">
                      {GOAL_OPTIONS.map((goal) => {
                        const isSelected = formData.primaryGoals.includes(goal);
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => toggleGoal(goal)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {goal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-3 block">How did you discover UniVoid?</Label>
                    <div className="flex flex-wrap gap-2">
                      {DISCOVERY_OPTIONS.map((source) => {
                        const isSelected = formData.discoverySource === source;
                        return (
                          <button
                            key={source}
                            type="button"
                            onClick={() => updateField("discoverySource", isSelected ? null : source)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {source}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Buttons */}
        <div className="px-6 pb-6 pt-4 flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && currentStep < STEPS.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            )}
            <Button 
              onClick={handleContinue}
              disabled={!canContinue() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Finish Setup
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OrganizerOnboarding;

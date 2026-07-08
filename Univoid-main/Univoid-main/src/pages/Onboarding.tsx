import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, X, Plus, Phone, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { CollegeSearchSelect } from "@/components/common/CollegeSearchSelect";
import { CollegeStateSelect, CollegeDistrictSelect } from "@/components/common/CollegeLocationSelects";
import { useOnboardingDraft } from "@/hooks/useOnboardingDraft";
import { useMobileValidation } from "@/hooks/useMobileValidation";

const DEGREE_OPTIONS = [
  "B.Tech",
  "B.E",
  "B.Sc",
  "B.Com",
  "B.A",
  "BBA",
  "BCA",
  "B.Pharm",
  "MBBS",
  "LLB",
  "B.Arch",
  "B.Des",
  "M.Tech",
  "M.E",
  "M.Sc",
  "M.Com",
  "M.A",
  "MBA",
  "MCA",
  "M.Pharm",
  "MD",
  "LLM",
  "Ph.D",
  "Diploma",
  "Other",
];

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
];

const INTEREST_OPTIONS = [
  "Hackathons",
  "Internships",
  "Startups",
  "Coding",
  "Design",
  "AI/ML",
  "Web Dev",
  "Mobile Dev",
  "Data Science",
  "Blockchain",
  "Gaming",
  "Research",
  "Finance",
  "Marketing",
  "Content Writing",
  "Public Speaking",
];

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customInterest, setCustomInterest] = useState("");
  const submissionLockRef = useRef(false); // Prevent double submission

  // Mobile validation hook
  const { 
    isChecking: isCheckingMobile, 
    isDuplicate: isMobileDuplicate, 
    isValidFormat: isValidMobileFormat,
    checkMobileExists,
    normalizeMobile
  } = useMobileValidation({ excludeUserId: user?.id });

  // Use the draft hook for form state persistence
  const {
    formData,
    updateField,
    updateFields,
    toggleInterest,
    addInterest,
    removeInterest,
    clearDraft,
    hasRestoredDraft,
  } = useOnboardingDraft(profile, user);

  // Check mobile number when it changes (debounced)
  useEffect(() => {
    const normalized = normalizeMobile(formData.mobile_number);
    if (normalized.length === 10) {
      const timer = setTimeout(() => {
        checkMobileExists(formData.mobile_number);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.mobile_number, checkMobileExists, normalizeMobile]);

  const progress = calculateProgress();

  function calculateProgress() {
    const fields = [
      formData.full_name,
      formData.mobile_number,
      formData.college_name,
      formData.degree,
      formData.branch,
      formData.current_year,
      formData.city,
      formData.state,
    ];
    const filledFields = fields.filter((f) => f && f.trim() !== "").length;
    const interestFilled = formData.interests.length > 0 ? 1 : 0;
    return ((filledFields + interestFilled) / 9) * 100;
  }

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed) {
      addInterest(trimmed);
      setCustomInterest("");
    }
  };

  const getDegreeValue = () => {
    if (formData.degree === "Other" && formData.customDegree) {
      return formData.customDegree;
    }
    return formData.degree;
  };

  const isFormValid = () => {
    const degreeValid = formData.degree !== "" && 
      (formData.degree !== "Other" || (formData.customDegree?.trim() || "") !== "");
    // Skip mobile validation if phone already saved in profile
    const mobileValid = profile?.mobile_number || 
      (isValidMobileFormat(formData.mobile_number) && !isMobileDuplicate);
    const mobileExists = profile?.mobile_number || formData.mobile_number.trim() !== "";
    return (
      formData.full_name.trim() !== "" &&
      mobileExists &&
      mobileValid &&
      formData.college_name.trim() !== "" &&
      degreeValid &&
      formData.branch.trim() !== "" &&
      formData.current_year !== "" &&
      formData.city.trim() !== "" &&
      formData.state.trim() !== "" &&
      formData.interests.length > 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Idempotent submission check - prevent double submission
    if (submissionLockRef.current || isSubmitting) {
      return;
    }

    if (!isFormValid()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill all fields before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    // Lock submission
    submissionLockRef.current = true;
    setIsSubmitting(true);

    try {
      const finalDegree = formData.degree === "Other" ? (formData.customDegree?.trim() || "") : formData.degree;
      
      // Determine profile type upgrade
      // If user was quick registration, upgrade to full
      const currentProfileType = profile?.profile_type || 'full';
      const isUpgrade = currentProfileType === 'quick';
      
      // Build update payload - only include mobile if it's a new value
      const updatePayload: Record<string, unknown> = {
        full_name: formData.full_name,
        college_name: formData.college_name,
        degree: finalDegree,
        branch: formData.branch,
        course_stream: formData.branch, // Keep backward compat
        current_year: parseInt(formData.current_year),
        year_semester: `Year ${formData.current_year}`, // Keep backward compat
        city: formData.city,
        state: formData.state,
        interests: formData.interests,
        profile_complete: true,
        profile_type: 'full', // Upgrade to full profile
        onboarding_status: 'complete', // Mark onboarding complete
      };
      
      // Only update mobile_number if user doesn't already have one
      // This prevents unique constraint errors
      if (!profile?.mobile_number && formData.mobile_number) {
        updatePayload.mobile_number = formData.mobile_number.replace(/\s/g, '');
      }
      
      const { error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", user.id);

      if (error) throw error;

      // Clear the draft after successful submission
      clearDraft();

      toast({
        title: isUpgrade ? "Profile Upgraded! 🎉" : "Welcome to UniVoid! 🎉",
        description: isUpgrade 
          ? "Your profile is now complete. Enjoy all platform features!"
          : "Your profile is all set. Let's explore!",
      });

      // Refresh profile in context
      if (refreshProfile) {
        await refreshProfile();
      }

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      submissionLockRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {Math.round(progress)}% Complete
            </p>
            {hasRestoredDraft && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <RefreshCw className="w-3 h-3" />
                <span>Draft restored</span>
              </div>
            )}
          </div>
        </div>

        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Tell us about yourself to personalize your experience
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identity Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Identity</h3>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile Number *</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                    <Phone className="w-4 h-4 text-muted-foreground mr-1" />
                    <span className="text-sm text-muted-foreground">+91</span>
                  </div>
                  <Input
                    id="mobile_number"
                    type="tel"
                    value={formData.mobile_number}
                    onChange={(e) => {
                      // Only allow digits - disabled if phone already exists
                      if (profile?.mobile_number) return;
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updateField('mobile_number', value);
                    }}
                    placeholder="10-digit mobile number"
                    className="rounded-l-none"
                    maxLength={10}
                    required
                    disabled={!!profile?.mobile_number}
                  />
                </div>
                {profile?.mobile_number && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Phone number already saved
                  </p>
                )}
                {!profile?.mobile_number && formData.mobile_number && !isValidMobileFormat(formData.mobile_number) && (
                  <p className="text-xs text-destructive">
                    Please enter a valid 10-digit Indian mobile number
                  </p>
                )}
                {!profile?.mobile_number && formData.mobile_number && isValidMobileFormat(formData.mobile_number) && isMobileDuplicate && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    This mobile number is already in use. Please enter a different number.
                  </p>
                )}
                {isCheckingMobile && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking availability...
                  </p>
                )}
              </div>
            </div>

            {/* Academic Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Academic</h3>

              {/* State Selection for College - Uses colleges database */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <CollegeStateSelect
                    value={formData.state}
                    onValueChange={(state) => {
                      updateFields({
                        state: state,
                        state_id: state,
                        city: "",
                        city_id: "",
                        college_id: "",
                        college_name: "",
                      });
                    }}
                    required
                    error={!formData.state ? undefined : undefined}
                  />
                </div>
                <div className="relative">
                  <CollegeDistrictSelect
                    value={formData.city}
                    onValueChange={(city) => {
                      updateFields({
                        city: city,
                        city_id: city,
                        college_id: "",
                        college_name: "",
                      });
                    }}
                    stateFilter={formData.state}
                  />
                </div>
              </div>

              {/* College Selection - Filtered by State, uses colleges database */}
              <CollegeSearchSelect
                label="College/University"
                placeholder="Search your college..."
                value={formData.college_id}
                displayValue={formData.college_name}
                stateFilter={formData.state}
                districtFilter={formData.city || null}
                onSelect={(item) =>
                  updateFields({
                    college_id: item.id,
                    college_name: item.name,
                  })
                }
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree *</Label>
                  <Select
                    value={formData.degree}
                    onValueChange={(value) => {
                      updateField('degree', value);
                      if (value !== "Other") updateField('customDegree', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {DEGREE_OPTIONS.map((deg) => (
                        <SelectItem key={deg} value={deg}>
                          {deg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.degree === "Other" && (
                    <Input
                      value={formData.customDegree || ''}
                      onChange={(e) => updateField('customDegree', e.target.value)}
                      placeholder="Enter your degree..."
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Current Year *</Label>
                  <Select
                    value={formData.current_year}
                    onValueChange={(value) => updateField('current_year', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((yr) => (
                        <SelectItem key={yr.value} value={yr.value}>
                          {yr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SearchableSelect
                label="Branch/Stream"
                tableName="lookup_branches"
                placeholder="Search your branch..."
                value={formData.branch_id}
                displayValue={formData.branch}
                onSelect={(item) =>
                  updateFields({
                    branch_id: item.id,
                    branch: item.name,
                  })
                }
                required
              />
            </div>

            {/* Interests Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Interests *
              </h3>
              <p className="text-xs text-muted-foreground">
                Select at least one interest or add your own
              </p>
              
              {/* Selected Interests */}
              {formData.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-xl">
                  {formData.interests.map((interest) => (
                    <Badge 
                      key={interest} 
                      variant="default" 
                      className="gap-1 pr-1 bg-primary text-primary-foreground"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Predefined Interest Options */}
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.filter(i => !formData.interests.includes(i)).map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all bg-card text-foreground border-border hover:border-primary/50"
                  >
                    + {interest}
                  </button>
                ))}
              </div>
              
              {/* Add Custom Interest */}
              <div className="flex gap-2">
                <Input
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="Add your own interest..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomInterest();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddCustomInterest}
                  disabled={!customInterest.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;

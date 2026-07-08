import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, Camera, User, X, Plus, AlertCircle, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationPreferences } from "@/components/dashboard/NotificationPreferences";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { useMobileValidation } from "@/hooks/useMobileValidation";
import { validateFileUpload } from "@/lib/fileValidation";

const DEGREE_OPTIONS = [
  "B.Tech", "B.E", "B.Sc", "B.Com", "B.A", "BBA", "BCA", "B.Pharm", "MBBS", "LLB",
  "B.Arch", "B.Des", "M.Tech", "M.E", "M.Sc", "M.Com", "M.A", "MBA", "MCA",
  "M.Pharm", "MD", "LLM", "Ph.D", "Diploma", "Other",
];

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
];

const INTEREST_OPTIONS = [
  "Hackathons", "Internships", "Startups", "Coding", "Design", "AI/ML",
  "Web Dev", "Mobile Dev", "Data Science", "Blockchain", "Gaming", "Research",
  "Finance", "Marketing", "Content Writing", "Public Speaking",
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, uploadProfilePhoto, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customDegree, setCustomDegree] = useState("");
  const [customInterest, setCustomInterest] = useState("");
  
  // Mobile validation
  const { 
    isChecking: isCheckingMobile, 
    isDuplicate: isMobileDuplicate, 
    isValidFormat: isValidMobileFormat,
    checkMobileExists,
    normalizeMobile
  } = useMobileValidation({ excludeUserId: user?.id });
  
  const [form, setForm] = useState({
    full_name: "",
    college_name: "",
    college_id: "",
    degree: "",
    branch: "",
    branch_id: "",
    current_year: "",
    mobile_number: "",
    interests: [] as string[],
  });

  // Hydrate form from profile data
  useEffect(() => {
    if (profile) {
      const savedDegree = profile.degree || "";
      const isCustomDegree = savedDegree && !DEGREE_OPTIONS.includes(savedDegree);
      
      setForm({
        full_name: profile.full_name || "",
        college_name: profile.college_name || "",
        college_id: "",
        degree: isCustomDegree ? "Other" : savedDegree,
        branch: profile.branch || profile.course_stream || "",
        branch_id: "",
        current_year: profile.current_year?.toString() || "",
        mobile_number: profile.mobile_number || "",
        interests: profile.interests || [],
      });
      
      if (isCustomDegree) {
        setCustomDegree(savedDegree);
      }
      
      setPreviewUrl(profile.profile_photo_url || null);
    }
  }, [profile]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFileUpload(file, 'image');
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      const { url, error } = await uploadProfilePhoto(file);
      
      if (error) throw error;
      
      if (url) {
        setPreviewUrl(url);
        toast.success("Photo updated!");
      }
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photo");
      setPreviewUrl(profile?.profile_photo_url || null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !form.interests.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        interests: [...prev.interests, trimmed],
      }));
      setCustomInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Check for duplicate mobile before saving
    if (form.mobile_number && isValidMobileFormat(form.mobile_number)) {
      const exists = await checkMobileExists(form.mobile_number);
      if (exists) {
        toast.error("This mobile number is already in use");
        return;
      }
    }

    setIsSaving(true);
    try {
      const finalDegree = form.degree === "Other" ? customDegree.trim() : form.degree;
      const cleanMobile = normalizeMobile(form.mobile_number);
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          college_name: form.college_name.trim() || null,
          degree: finalDegree || null,
          branch: form.branch.trim() || null,
          course_stream: form.branch.trim() || null,
          current_year: form.current_year ? parseInt(form.current_year) : null,
          year_semester: form.current_year ? `Year ${form.current_year}` : null,
          mobile_number: cleanMobile || null,
          interests: form.interests.length > 0 ? form.interests : null,
        })
        .eq("id", user?.id);

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          toast.error("This mobile number is already in use");
          return;
        }
        throw error;
      }

      await refreshProfile();
      toast.success("Profile updated successfully!");
      navigate("/profile");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <main className="flex-1 py-8">
      <div className="container-wide max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/profile")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Profile
        </Button>

        <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col items-center">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={handlePhotoClick}
                  >
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-4 border-primary/20"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-accent rounded-full flex items-center justify-center border-4 border-primary/20">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Click to change photo</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                {/* Name */}
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Your full name"
                    className="mt-1"
                    required
                  />
                </div>

                {/* College */}
                <SearchableSelect
                  label="College / University"
                  tableName="lookup_universities"
                  placeholder="Search for your college..."
                  value={form.college_id}
                  displayValue={form.college_name}
                  onSelect={(item) => setForm(prev => ({ 
                    ...prev, 
                    college_id: item.id,
                    college_name: item.name 
                  }))}
                />

                {/* Degree */}
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Select
                    value={form.degree}
                    onValueChange={(value) => {
                      setForm(prev => ({ ...prev, degree: value }));
                      if (value !== "Other") setCustomDegree("");
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
                  {form.degree === "Other" && (
                    <Input
                      value={customDegree}
                      onChange={(e) => setCustomDegree(e.target.value)}
                      placeholder="Enter your degree..."
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Branch */}
                <SearchableSelect
                  label="Branch / Stream"
                  tableName="lookup_branches"
                  placeholder="Search for your branch..."
                  value={form.branch_id}
                  displayValue={form.branch}
                  onSelect={(item) => setForm(prev => ({ 
                    ...prev, 
                    branch_id: item.id,
                    branch: item.name 
                  }))}
                />

                {/* Year */}
                <div className="space-y-2">
                  <Label>Current Year</Label>
                  <Select
                    value={form.current_year}
                    onValueChange={(value) => setForm(prev => ({ ...prev, current_year: value }))}
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

                {/* Mobile */}
                <div className="space-y-2">
                  <Label htmlFor="mobile_number">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                      <Phone className="w-4 h-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">+91</span>
                    </div>
                    <Input
                      id="mobile_number"
                      type="tel"
                      value={form.mobile_number}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm(prev => ({ ...prev, mobile_number: value }));
                        if (value.length === 10) {
                          checkMobileExists(value);
                        }
                      }}
                      placeholder="10-digit number"
                      className="rounded-l-none"
                      maxLength={10}
                    />
                  </div>
                  {form.mobile_number && !isValidMobileFormat(form.mobile_number) && form.mobile_number.length > 0 && (
                    <p className="text-xs text-destructive">
                      Please enter a valid 10-digit Indian mobile number
                    </p>
                  )}
                  {form.mobile_number && isValidMobileFormat(form.mobile_number) && isMobileDuplicate && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      This mobile number is already in use
                    </p>
                  )}
                  {isCheckingMobile && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking availability...
                    </p>
                  )}
                </div>

                {/* Interests */}
                <div className="space-y-3">
                  <Label>Interests</Label>
                  
                  {form.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-xl">
                      {form.interests.map((interest) => (
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
                  
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_OPTIONS.filter(i => !form.interests.includes(i)).slice(0, 10).map((interest) => (
                      <Badge 
                        key={interest} 
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent text-xs"
                        onClick={() => toggleInterest(interest)}
                      >
                        + {interest}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      placeholder="Add your own interest..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomInterest();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addCustomInterest}
                      disabled={!customInterest.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSaving || isMobileDuplicate || isCheckingMobile}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <div className="mt-6">
          <NotificationPreferences />
        </div>
      </div>
    </main>
  );
};

export default EditProfile;
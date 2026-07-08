import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { 
  updateOrganizerProfile, 
  uploadOrganizerLogo,
  type CreateOrganizerProfileData 
} from "@/services/organizerService";
import { 
  Camera, Globe, Loader2, ArrowLeft, Save, ExternalLink, Sparkles
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toDisplayUrl } from "@/lib/storageProxy";
import { validateFileUpload } from "@/lib/fileValidation";

const EditOrganizerProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { hasProfile, profile, isLoading: checkingProfile } = useOrganizerProfile();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  
  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setWebsite(profile.website_url || "");
      // Convert stored path to display URL for preview
      setLogoPreviewUrl(toDisplayUrl(profile.logo_url, { forceImage: true }) || "");
    }
  }, [profile]);
  
  // Redirect if no organizer profile
  useEffect(() => {
    if (!checkingProfile && !hasProfile) {
      toast({
        title: "No profile found",
        description: "You need to complete organizer onboarding first.",
        variant: "destructive",
      });
      navigate("/organizer/onboarding");
    }
  }, [checkingProfile, hasProfile, navigate, toast]);
  
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
      setLogoFile(file);
      setLogoPreviewUrl(url);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    if (name.trim().length < 2) {
      toast({
        title: "Invalid name",
        description: "Organizer name must be at least 2 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let logoUrl: string | null = profile.logo_url;
      
      // Upload new logo if provided
      if (logoFile) {
        const { url, error: uploadError } = await uploadOrganizerLogo(user.id, logoFile);
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
      
      const updateData: Partial<CreateOrganizerProfileData> = {
        name: name.trim(),
        logo_url: logoUrl,
        website_url: website.trim() || null,
      };
      
      const { error } = await updateOrganizerProfile(profile.id, updateData);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: ['organizerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['hasOrganizerProfile'] });
      
      toast({
        title: "Profile updated!",
        description: "Your organizer profile has been saved.",
      });
      
      navigate("/organizer");
      
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
  
  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!hasProfile || !profile) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/organizer")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Organizer Profile</h1>
            <p className="text-sm text-muted-foreground">
              Update your public organizer information
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                This information will be visible on your public organizer page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex flex-col items-center">
                <Label className="mb-3">Organizer Logo</Label>
                <label className="cursor-pointer group">
                  <Avatar className="w-28 h-28 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors">
                    <AvatarImage src={logoPreviewUrl || undefined} alt="Logo" />
                    <AvatarFallback className="bg-muted">
                      <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to change • Max 5MB • JPG, PNG, WebP
                </p>
              </div>
              
              {/* Organizer Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Organizer Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your organization or brand name"
                  maxLength={100}
                  required
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min 2 characters</span>
                  <span>{name.length}/100</span>
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
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              {/* Public Profile Link */}
              {profile.slug && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <Label className="text-sm text-muted-foreground">Your Public Profile</Label>
                  <a 
                    href={`/o/${profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline mt-1"
                  >
                    univoid.lovable.app/o/{profile.slug}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/organizer")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditOrganizerProfile;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  User, 
  Trash2, 
  Eye, 
  EyeOff,
  Loader2,
  AlertTriangle,
  RotateCcw,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationPreferences } from "@/components/dashboard/NotificationPreferences";
import { useOnboardingTour } from "@/components/onboarding/OnboardingTour";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FloatingDoodles } from "@/components/common/FloatingDoodles";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading, signOut } = useAuth();
  const { restartTour } = useOnboardingTour();
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showOnLeaderboard: true,
    showActivityStatus: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // PDF viewer preference from localStorage
  const [useGoogleViewer, setUseGoogleViewer] = useState(() => {
    try {
      return localStorage.getItem('pdf-viewer-preference') === 'google';
    } catch {
      return false;
    }
  });

  const handlePdfViewerChange = (useGoogle: boolean) => {
    setUseGoogleViewer(useGoogle);
    try {
      localStorage.setItem('pdf-viewer-preference', useGoogle ? 'google' : 'native');
    } catch (e) {
      console.warn('Failed to save PDF viewer preference:', e);
    }
    toast.success(`PDF viewer set to ${useGoogle ? 'Google Docs' : 'Native browser'}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sketch paper-texture">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const handlePrivacyChange = (key: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    toast.success("Privacy settings updated");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Call the edge function to permanently delete all user data
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete account");
      }

      toast.success("Account permanently deleted. All your data has been removed.");
      await signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-8 relative overflow-hidden">
      <FloatingDoodles density="medium" />
      
      <div className="container-wide max-w-3xl relative z-10">
        <Button variant="ghost" size="sm" className="mb-6 border-2 border-sketch-border shadow-sketch-sm hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all rounded-xl" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-1" strokeWidth={2} />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and privacy
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 border-2 border-sketch-border shadow-sketch-sm rounded-xl bg-card">
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:shadow-sketch-sm data-[state=active]:border-2 data-[state=active]:border-sketch-border">
              <Bell className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:shadow-sketch-sm data-[state=active]:border-2 data-[state=active]:border-sketch-border">
              <Shield className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-secondary data-[state=active]:shadow-sketch-sm data-[state=active]:border-2 data-[state=active]:border-sketch-border">
              <User className="w-4 h-4" strokeWidth={2} />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <NotificationPreferences />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="card-sketch-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" strokeWidth={2} />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your information and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-sketch border-2 border-sketch-border shadow-sketch-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-secondary border-2 border-sketch-border">
                      <Eye className="h-4 w-4 text-foreground" strokeWidth={2} />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="font-medium">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to view your profile page
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.showProfile}
                    onCheckedChange={(checked) => handlePrivacyChange('showProfile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-sketch border-2 border-sketch-border shadow-sketch-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-secondary border-2 border-sketch-border">
                      <User className="h-4 w-4 text-foreground" strokeWidth={2} />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="font-medium">Show on Leaderboard</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your name on the public leaderboard
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.showOnLeaderboard}
                    onCheckedChange={(checked) => handlePrivacyChange('showOnLeaderboard', checked)}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-sketch border-2 border-sketch-border shadow-sketch-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-secondary border-2 border-sketch-border">
                      <EyeOff className="h-4 w-4 text-foreground" strokeWidth={2} />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="font-medium">Activity Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Show when you're online to other users
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings.showActivityStatus}
                    onCheckedChange={(checked) => handlePrivacyChange('showActivityStatus', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* PDF Viewer Preferences */}
            <Card className="card-sketch-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" strokeWidth={2} />
                  Document Viewer
                </CardTitle>
                <CardDescription>
                  Choose how PDFs and documents are displayed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-sketch border-2 border-sketch-border shadow-sketch-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-secondary border-2 border-sketch-border">
                      <FileText className="h-4 w-4 text-foreground" strokeWidth={2} />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="font-medium">Use Google Docs Viewer</Label>
                      <p className="text-sm text-muted-foreground">
                        Use Google Docs to preview PDFs (more compatible, but requires internet)
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={useGoogleViewer}
                    onCheckedChange={handlePdfViewerChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="card-sketch-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" strokeWidth={2} />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your account details and management options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={user.email || ''} disabled className="bg-sketch" />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support for assistance.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <div className="flex gap-2">
                      <Input value={profile?.full_name || ''} disabled className="bg-sketch" />
                      <Button variant="outline" onClick={() => navigate('/edit-profile')} className="border-2 border-sketch-border shadow-sketch-sm hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <Input 
                      value={profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Unknown'
                      } 
                      disabled 
                      className="bg-sketch" 
                    />
                  </div>
                </div>

                {/* Restart Tour */}
                <Separator className="border-sketch-border" />
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-sketch border-2 border-sketch-border shadow-sketch-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-secondary border-2 border-sketch-border">
                      <RotateCcw className="h-4 w-4 text-foreground" strokeWidth={2} />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="font-medium">Onboarding Tour</Label>
                      <p className="text-sm text-muted-foreground">
                        Restart the guided tour to learn about all features
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={restartTour} className="border-2 border-sketch-border shadow-sketch-sm hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
                    <RotateCcw className="w-4 h-4 mr-2" strokeWidth={2} />
                    Restart
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-2 border-destructive/50 shadow-sketch-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions. Please proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div>
                    <p className="font-medium text-destructive">Delete Account Permanently</p>
                    <p className="text-sm text-muted-foreground">
                      This action is permanent. All your data will be deleted and cannot be recovered.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Permanently Delete Account?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p className="font-medium text-foreground">This action is irreversible.</p>
                          <p>All your data will be permanently deleted including:</p>
                          <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                            <li>Your profile and XP history</li>
                            <li>All events you created</li>
                            <li>All event registrations</li>
                            <li>Materials you shared</li>
                            <li>Books you listed</li>
                            <li>Projects and tasks</li>
                          </ul>
                          <p className="font-medium text-destructive mt-3">This cannot be undone.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
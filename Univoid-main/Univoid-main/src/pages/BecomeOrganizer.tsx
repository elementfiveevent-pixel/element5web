import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import { validateFileUpload } from "@/lib/fileValidation";
import { Sparkles, Upload, Clock, CheckCircle, XCircle, Calendar, Users, Ticket, ArrowLeft } from "lucide-react";

const BecomeOrganizer = () => {
  const navigate = useNavigate();
  const { user, isOrganizer } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [uploading, setUploading] = useState(false);

  // Check existing application - explicit column selection
  const APPLICATION_COLUMNS = 'id, user_id, proof_url, reason, status, created_at, updated_at, reviewed_at, reviewed_by';
  
  const { data: existingApplication, isLoading } = useQuery({
    queryKey: ["organizer-application", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizer_applications")
        .select(APPLICATION_COLUMNS)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user || !proofFile) throw new Error("Missing data");
      setUploading(true);

      // Upload proof file
      const ext = proofFile.name.split(".").pop();
      const path = `organizer-proofs/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("event-assets")
        .upload(path, proofFile);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("event-assets")
        .getPublicUrl(path);

      // Submit application
      const { data, error } = await supabase
        .from("organizer_applications")
        .insert({
          user_id: user.id,
          proof_url: publicUrl,
          reason: reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      setUploading(false);
      return data;
    },
    onSuccess: () => {
      toast({ 
        title: "Application Submitted!", 
        description: "We'll review your application and get back to you soon." 
      });
    },
    onError: (error: Error) => {
      setUploading(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Become an Event Organizer</h1>
          <p className="text-muted-foreground mb-6">Login to apply for organizer privileges</p>
          <Button onClick={() => setShowAuthModal(true)}>Login to Continue</Button>
        </main>
      </div>
    );
  }

  if (isOrganizer) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 container mx-auto px-4 py-20 text-center max-w-lg">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">You're Already an Organizer!</h1>
          <p className="text-muted-foreground mb-6">You have access to create and manage events.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/organizer/dashboard")}>Go to Dashboard</Button>
            <Button variant="outline" onClick={() => navigate("/organizer/create-event")}>Create Event</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8 max-w-2xl">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/events")}>
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Become an Event Organizer</h1>
          <p className="text-muted-foreground">
            Host hackathons, workshops, and campus events on UniVoid
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="text-center p-4">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Create Events</p>
          </Card>
          <Card className="text-center p-4">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Manage Registrations</p>
          </Card>
          <Card className="text-center p-4">
            <Ticket className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Digital Ticketing</p>
          </Card>
        </div>

        {/* Application Status or Form */}
        {isLoading ? (
          <Card className="animate-pulse h-64" />
        ) : existingApplication ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Application Status
                {existingApplication.status === "pending" && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                    <Clock className="w-3 h-3 mr-1" /> Pending
                  </Badge>
                )}
                {existingApplication.status === "approved" && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" /> Approved
                  </Badge>
                )}
                {existingApplication.status === "rejected" && (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" /> Rejected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {existingApplication.status === "pending" && "Your application is being reviewed by our team."}
                {existingApplication.status === "approved" && "Congratulations! You can now create events."}
                {existingApplication.status === "rejected" && "Your application was not approved. You can contact support for more details."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingApplication.status === "approved" && (
                <Button onClick={() => navigate("/organizer/dashboard")} className="w-full">
                  Go to Organizer Dashboard
                </Button>
              )}
              {existingApplication.status === "pending" && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(existingApplication.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Apply for Organizer Access</CardTitle>
              <CardDescription>
                Submit proof that you're affiliated with a college or organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Proof Document *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload your college ID, club membership certificate, or organization letter
                </p>
                <div className="border-2 border-dashed rounded-xl p-6 text-center">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const validationError = validateFileUpload(file, 'any'); // We allow image or pdf
                        if (validationError) {
                          toast({ title: "Invalid file", description: validationError, variant: "destructive" });
                          return;
                        }
                        setProofFile(file);
                      }
                    }}
                    className="hidden"
                    id="proof-file"
                  />
                  <label htmlFor="proof-file" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {proofFile ? proofFile.name : "Click to upload"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, or PDF up to 5MB
                    </span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Why do you want to become an organizer? (Optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us about the events you want to organize..."
                  rows={4}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => submitMutation.mutate()}
                disabled={!proofFile || submitMutation.isPending || uploading}
              >
                {uploading || submitMutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BecomeOrganizer;
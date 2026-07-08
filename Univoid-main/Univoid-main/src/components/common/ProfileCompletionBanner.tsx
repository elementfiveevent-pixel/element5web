import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

const DISMISSED_KEY = 'profile_completion_banner_dismissed';

const ProfileCompletionBanner = () => {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISSED_KEY);
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  // Don't show if:
  // - No profile
  // - Banner was dismissed
  // - Profile is complete (onboarding_status = 'complete')
  // - User is not a quick registration user (profile_type !== 'quick')
  if (!profile || dismissed) {
    return null;
  }

  // Show for ANY user whose profile is not marked complete
  const isIncomplete = profile.onboarding_status !== 'complete' && profile.profile_complete !== true;
  
  if (!isIncomplete) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Complete your profile
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add your college details and interests to unlock all UniVoid features
            </p>
            <Link to="/onboarding" className="inline-block mt-3">
              <Button size="sm" className="gap-1.5">
                Complete Profile
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 flex-shrink-0 -mt-1 -mr-1"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionBanner;

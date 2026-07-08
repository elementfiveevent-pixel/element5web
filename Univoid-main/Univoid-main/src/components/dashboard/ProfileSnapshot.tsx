import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Edit } from "lucide-react";
import { Profile } from "@/types/database";

interface ProfileSnapshotProps {
  profile: Profile | null;
}

const ProfileSnapshot = ({ profile }: ProfileSnapshotProps) => {
  // Show "Complete profile" prompt if profile is null OR profile_complete is false
  const isProfileIncomplete = !profile || !profile.profile_complete;

  if (isProfileIncomplete) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base sm:text-lg text-foreground">
                  {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Welcome'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Complete your profile to get started
                </p>
              </div>
            </div>
            <Link to="/onboarding" className="flex-shrink-0">
              <Button size="sm" className="w-full sm:w-auto">
                Complete Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayInterests = profile.interests?.slice(0, 3) || [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={profile.full_name || 'User'}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base sm:text-lg text-foreground truncate">
                {profile.full_name || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {[profile.degree, profile.branch, profile.current_year ? `Year ${profile.current_year}` : null]
                  .filter(Boolean)
                  .join(' • ') || 'Student'}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {profile.college_name || 'University'}
                  {profile.city && `, ${profile.city}`}
                </span>
              </div>

              {/* Interest Tags */}
              {displayInterests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {displayInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-2.5 py-0.5 bg-secondary text-xs font-medium rounded-full text-foreground"
                    >
                      {interest}
                    </span>
                  ))}
                  {profile.interests && profile.interests.length > 3 && (
                    <span className="px-2.5 py-0.5 bg-secondary text-xs font-medium rounded-full text-muted-foreground">
                      +{profile.interests.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <Link to="/profile/edit" className="flex-shrink-0">
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <Edit className="w-3 h-3" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSnapshot;

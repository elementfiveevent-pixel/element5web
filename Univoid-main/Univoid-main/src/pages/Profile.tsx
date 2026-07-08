import { useParams, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Trophy, FileText, Newspaper, BookOpen, ArrowLeft, Loader2, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FloatingDoodles } from "@/components/common/FloatingDoodles";

interface ProfileData {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  total_xp: number;
  college_name?: string | null;
  course_stream?: string | null;
  year_semester?: string | null;
}

interface ContributionStats {
  materials: number;
  news: number;
  books: number;
}

const Profile = () => {
  const { userId } = useParams();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [publicProfile, setPublicProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ContributionStats>({ materials: 0, news: 0, books: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = isOwnProfile ? user?.id : userId;

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, profile_photo_url, total_xp, college_name, course_stream, year_semester')
          .eq('id', targetUserId)
          .maybeSingle();

        if (profileData) {
          setPublicProfile(profileData);
        }

        const [materialsRes, newsRes, booksRes] = await Promise.all([
          supabase.from('materials').select('id', { count: 'exact', head: true }).eq('created_by', targetUserId),
          supabase.from('news').select('id', { count: 'exact', head: true }).eq('created_by', targetUserId),
          supabase.from('books').select('id', { count: 'exact', head: true }).eq('created_by', targetUserId),
        ]);

        setStats({
          materials: materialsRes.count ?? 0,
          news: newsRes.count ?? 0,
          books: booksRes.count ?? 0,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUserId]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sketch paper-texture">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isOwnProfile && !user) {
    return <Navigate to="/" replace />;
  }

  const displayProfile = isOwnProfile ? profile : publicProfile;
  const xp = displayProfile?.total_xp ?? 0;
  const level = Math.floor(xp / 250) + 1;

  const statItems = [
    { label: "Materials", value: stats.materials, icon: FileText },
    { label: "News", value: stats.news, icon: Newspaper },
    { label: "Books", value: stats.books, icon: BookOpen },
  ];

  if (!displayProfile) {
    return (
      <div className="py-8 relative">
        <FloatingDoodles density="low" />
        <div className="container-wide max-w-2xl text-center py-16 relative z-10">
          <p className="text-muted-foreground">Profile not found.</p>
          <Link to="/leaderboard">
            <Button variant="outline" className="mt-4 border-2 border-sketch-border shadow-sketch-sm hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
              <ArrowLeft className="w-4 h-4 mr-1" strokeWidth={2} />
              Back to Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 relative overflow-hidden">
      <FloatingDoodles density="medium" />
      
      <div className="container-wide max-w-2xl relative z-10">
        <Link to="/leaderboard">
          <Button variant="ghost" size="sm" className="mb-6 border-2 border-sketch-border shadow-sketch-sm hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" strokeWidth={2} />
            Back to Leaderboard
          </Button>
        </Link>

        <Card className="card-sketch-hover">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              {displayProfile?.profile_photo_url ? (
                <img 
                  src={displayProfile.profile_photo_url} 
                  alt={displayProfile.full_name}
                  className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-sketch-border shadow-sketch-sm"
                  loading="lazy"
                />
              ) : (
                <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-4 border-2 border-sketch-border shadow-sketch-sm">
                  <User className="w-12 h-12 text-foreground" strokeWidth={2} />
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-foreground mb-1">{displayProfile?.full_name ?? 'User'}</h1>
              <p className="text-muted-foreground">Level {level}</p>
              
              {/* Edit Button */}
              {isOwnProfile && (
                <Link to="/profile/edit">
                  <Button variant="outline" size="sm" className="mt-4 gap-2 border-2 border-sketch-border shadow-sketch-sm hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all rounded-xl">
                    <Pencil className="w-4 h-4" strokeWidth={2} />
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>

            {/* Profile Info */}
            {publicProfile && (publicProfile.college_name || publicProfile.course_stream) && (
              <div className="text-center text-sm text-muted-foreground mb-8 space-y-1">
                {publicProfile.college_name && <p>{publicProfile.college_name}</p>}
                {publicProfile.course_stream && publicProfile.year_semester && (
                  <p>{publicProfile.course_stream} • {publicProfile.year_semester}</p>
                )}
              </div>
            )}

            {/* XP and Rank */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-2 border-2 border-sketch-border shadow-sketch-sm">
                  <Trophy className="w-7 h-7 text-foreground" strokeWidth={2} />
                </div>
                <p className="text-xl font-bold text-foreground">Lvl {level}</p>
                <p className="text-xs text-muted-foreground">Current Level</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-2 border-2 border-sketch-border shadow-sketch-sm">
                  <span className="text-lg font-bold text-foreground">XP</span>
                </div>
                <p className="text-xl font-bold text-foreground">{xp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
            </div>

            {/* Contribution Stats */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 text-center">Contributions</h2>
              <div className="grid grid-cols-3 gap-4">
                {statItems.map((stat) => (
                  <div key={stat.label} className="text-center p-4 bg-sketch rounded-xl border-2 border-sketch-border shadow-sketch-sm hover:shadow-sketch hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all cursor-default">
                    <stat.icon className="w-5 h-5 text-foreground mx-auto mb-2" strokeWidth={2} />
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
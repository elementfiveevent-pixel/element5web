import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import ProfileSnapshot from "@/components/dashboard/ProfileSnapshot";
import ProfileCompletionBanner from "@/components/common/ProfileCompletionBanner";
import QuickStatsGrid from "@/components/dashboard/QuickStatsGrid";
import RecommendationsSection from "@/components/dashboard/RecommendationsSection";
import UserContentManager from "@/components/dashboard/UserContentManager";
import { UserVolunteerInvites, VolunteerDashboard } from "@/components/volunteers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Trophy,
  ArrowRight,
  Crown,
  Medal,
  Award,
  Upload,
  BookOpen,
  Calendar,
  Plus,
  UserCheck,
} from "lucide-react";

const Dashboard = () => {
  const { user, profile, isLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useDashboardStats(user?.id);
  const { leaderboard } = useLeaderboard(5);

  // Redirect to home if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs font-medium text-muted-foreground">#{rank}</span>;
  };

  const quickActions = [
    { label: "Upload Material", icon: Upload, href: "/upload-material", color: "bg-blue-500/10 text-blue-500" },
    { label: "List Book", icon: BookOpen, href: "/sell-book", color: "bg-green-500/10 text-green-500" },
    { label: "Create Event", icon: Calendar, href: "/organizer/create-event", color: "bg-purple-500/10 text-purple-500" },
    { label: "Create Project", icon: Plus, href: "/projects/create", color: "bg-orange-500/10 text-orange-500" },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Profile Completion Card - Only for quick users */}
      <ProfileCompletionBanner />

      {/* Profile Snapshot */}
      <ProfileSnapshot profile={profile} />

      {/* Quick Stats */}
      <QuickStatsGrid
        xp={profile?.total_xp || 0}
        rank={stats.globalRank}
        eventsRegistered={0}
        materialsUploaded={stats.materialsCount}
        isLoading={statsLoading}
      />

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.href}>
              <Card className="hover:shadow-md transition-all group cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className={`w-11 h-11 rounded-xl mb-2.5 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground text-center">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Volunteer Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Volunteer Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="invites">
                <TabsList className="mb-4">
                  <TabsTrigger value="invites">Invitations</TabsTrigger>
                  <TabsTrigger value="events">My Events</TabsTrigger>
                </TabsList>
                <TabsContent value="invites">
                  <UserVolunteerInvites />
                </TabsContent>
                <TabsContent value="events">
                  <VolunteerDashboard />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <RecommendationsSection profile={profile} />

          {/* User Content Manager */}
          <UserContentManager userId={user?.id || ''} />
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-6">
          {/* Leaderboard Preview */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Leaderboard
                </CardTitle>
                <Link to="/leaderboard" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="space-y-2">
                {leaderboard.length > 0 ? leaderboard.slice(0, 5).map((leader, index) => (
                  <div 
                    key={leader.id} 
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                      user?.id === leader.id 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'bg-secondary/50'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-background">
                      {getRankIcon(index + 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {leader.full_name}
                        {user?.id === leader.id && <span className="text-xs text-primary ml-1">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Level {leader.level}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary">{leader.total_xp} XP</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Be the first to earn XP!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Explore Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Explore</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              <Link to="/materials">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <BookOpen className="w-4 h-4" />
                  Browse Materials
                </Button>
              </Link>
              <Link to="/books">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <BookOpen className="w-4 h-4" />
                  Book Exchange
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  Upcoming Events
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

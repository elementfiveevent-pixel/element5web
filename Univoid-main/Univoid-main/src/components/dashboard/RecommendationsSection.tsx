import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Sparkles, Code, Briefcase, Lightbulb, Calendar, Cpu, Palette, TrendingUp, Beaker, Building, Mic, Folder } from "lucide-react";
import { Profile } from "@/types/database";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface RecommendationsSectionProps {
  profile: Profile | null;
}

// Degree-based recommendation mappings
const DEGREE_RECOMMENDATIONS: Record<string, { title: string; description: string; icon: any; href: string; color: string; bgColor: string }[]> = {
  "B.Tech": [
    { title: "Tech Hackathons", description: "Build innovative solutions and win prizes", icon: Code, href: "/events?category=hackathon", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Coding Contests", description: "Compete with top programmers", icon: Cpu, href: "/events?category=competition", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  ],
  "M.Tech": [
    { title: "Research Symposiums", description: "Present and learn cutting-edge research", icon: Beaker, href: "/events?category=seminar", color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { title: "Industry Connect", description: "Network with tech leaders", icon: Building, href: "/events?category=workshop", color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
  ],
  "MBA": [
    { title: "Case Competitions", description: "Solve real business challenges", icon: TrendingUp, href: "/events?category=competition", color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Leadership Talks", description: "Learn from industry leaders", icon: Mic, href: "/events?category=seminar", color: "text-amber-500", bgColor: "bg-amber-500/10" },
  ],
  "BBA": [
    { title: "Business Plan Contests", description: "Pitch your startup ideas", icon: Lightbulb, href: "/events?category=competition", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    { title: "Marketing Workshops", description: "Master modern marketing", icon: TrendingUp, href: "/events?category=workshop", color: "text-pink-500", bgColor: "bg-pink-500/10" },
  ],
  "B.Sc": [
    { title: "Science Exhibitions", description: "Showcase your experiments", icon: Beaker, href: "/events?category=exhibition", color: "text-teal-500", bgColor: "bg-teal-500/10" },
    { title: "Research Projects", description: "Collaborate on research", icon: Folder, href: "/projects", color: "text-violet-500", bgColor: "bg-violet-500/10" },
  ],
  "BCA": [
    { title: "App Dev Challenges", description: "Build mobile & web apps", icon: Code, href: "/events?category=hackathon", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Tech Projects", description: "Join or create tech projects", icon: Folder, href: "/projects", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  ],
  "B.A": [
    { title: "Cultural Fests", description: "Celebrate arts and culture", icon: Palette, href: "/events?category=cultural", color: "text-rose-500", bgColor: "bg-rose-500/10" },
    { title: "Debate Competitions", description: "Sharpen your oratory skills", icon: Mic, href: "/events?category=competition", color: "text-amber-500", bgColor: "bg-amber-500/10" },
  ],
  "B.Com": [
    { title: "Finance Quizzes", description: "Test your financial knowledge", icon: TrendingUp, href: "/events?category=competition", color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "CA/CFA Prep Workshops", description: "Prepare for professional exams", icon: Building, href: "/events?category=workshop", color: "text-slate-500", bgColor: "bg-slate-500/10" },
  ],
};

// Interest-based recommendations
const INTEREST_RECOMMENDATIONS: Record<string, { title: string; description: string; icon: any; href: string; color: string; bgColor: string }> = {
  "Hackathons": { title: "Hackathon Central", description: "Find upcoming hackathons", icon: Code, href: "/events?category=hackathon", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  "Startups": { title: "Startup Ecosystem", description: "Connect with founders & VCs", icon: Lightbulb, href: "/events?category=workshop", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  "Internships": { title: "Career Launchpad", description: "Find opportunities", icon: Briefcase, href: "/projects", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  "AI/ML": { title: "AI/ML Projects", description: "Collaborate on AI projects", icon: Cpu, href: "/projects", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  "Design": { title: "Design Community", description: "UI/UX workshops & challenges", icon: Palette, href: "/events?category=workshop", color: "text-pink-500", bgColor: "bg-pink-500/10" },
  "Coding": { title: "Code Competitions", description: "Competitive programming events", icon: Code, href: "/events?category=competition", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  "Research": { title: "Research Opportunities", description: "Academic research programs", icon: Beaker, href: "/events?category=seminar", color: "text-violet-500", bgColor: "bg-violet-500/10" },
};

const RecommendationsSection = ({ profile }: RecommendationsSectionProps) => {
  const userCity = profile?.city?.toLowerCase() || "";

  // Fetch upcoming events in user's city
  const { data: localEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["local-events", userCity],
    queryFn: async () => {
      if (!userCity) return [];
      
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_date, venue_name, category")
        .eq("status", "published")
        .gte("start_date", new Date().toISOString())
        .or(`venue_name.ilike.%${userCity}%,venue_address.ilike.%${userCity}%`)
        .order("start_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userCity,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate personalized recommendations
  const getRecommendations = () => {
    const recommendations: { title: string; description: string; icon: any; href: string; color: string; bgColor: string }[] = [];
    const degree = profile?.degree || "";
    const interests = profile?.interests || [];

    // Add degree-based recommendations
    const degreeRecs = DEGREE_RECOMMENDATIONS[degree];
    if (degreeRecs) {
      recommendations.push(...degreeRecs);
    }

    // Add interest-based recommendations (avoid duplicates)
    interests.forEach((interest) => {
      const rec = INTEREST_RECOMMENDATIONS[interest];
      if (rec && !recommendations.some((r) => r.title === rec.title)) {
        recommendations.push(rec);
      }
    });

    // Default recommendations if none matched
    if (recommendations.length === 0) {
      recommendations.push(
        { title: "Explore Events", description: "Discover workshops, hackathons, and more", icon: Calendar, href: "/events", color: "text-blue-500", bgColor: "bg-blue-500/10" },
        { title: "Find Projects", description: "Collaborate and build together", icon: Folder, href: "/projects", color: "text-purple-500", bgColor: "bg-purple-500/10" }
      );
    }

    return recommendations.slice(0, 4);
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Personalized Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Recommended for you
            {profile?.degree && (
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Based on {profile.degree}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec, index) => (
              <Link
                key={index}
                to={rec.href}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/50 transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${rec.bgColor} group-hover:scale-110 transition-transform`}
                >
                  <rec.icon className={`w-5 h-5 ${rec.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{rec.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {rec.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Local Events Section */}
      {userCity && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Events in {profile?.city}
              </CardTitle>
              <Link to="/events" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {eventsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : localEvents && localEvents.length > 0 ? (
              <div className="space-y-3">
                {localEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-all group"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary">
                      <span className="text-xs font-bold">
                        {format(new Date(event.start_date), "MMM")}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {format(new Date(event.start_date), "d")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.venue_name || "Online"}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No upcoming events in {profile?.city}
                </p>
                <Link to="/events">
                  <Button variant="outline" size="sm" className="mt-3">
                    Browse All Events
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendationsSection;

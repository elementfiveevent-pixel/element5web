import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";
import { 
  getOrganizerProfileBySlug,
  getOrganizerProfileById,
  getOrganizerEvents,
  toggleFollowOrganizer,
  isFollowingOrganizer,
  type OrganizerProfile as OrganizerProfileType
} from "@/services/organizerService";
import { EventCard } from "@/components/events/EventCard";
import { 
  Globe, Users, Calendar, MapPin, BadgeCheck, 
  UserPlus, UserMinus, ExternalLink, Loader2
} from "lucide-react";
import SEOHead from "@/components/common/SEOHead";
import { toDisplayUrl } from "@/lib/storageProxy";

const OrganizerProfile = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Fetch organizer profile
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ['organizerProfile', slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;
      
      // Try slug first, then ID
      let profile = await getOrganizerProfileBySlug(slugOrId);
      if (!profile) {
        profile = await getOrganizerProfileById(slugOrId);
      }
      return profile;
    },
    enabled: !!slugOrId,
  });
  
  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['organizerEvents', profile?.id],
    queryFn: () => getOrganizerEvents(profile!.id, user?.id || ''),
    enabled: !!profile?.id,
  });
  
  // Check if following
  const { data: isFollowing } = useQuery({
    queryKey: ['isFollowing', profile?.id, user?.id],
    queryFn: () => isFollowingOrganizer(profile!.id, user!.id),
    enabled: !!profile?.id && !!user?.id,
  });
  
  // Follow mutation
  const followMutation = useMutation({
    mutationFn: () => toggleFollowOrganizer(profile!.id),
    onSuccess: (nowFollowing) => {
      queryClient.invalidateQueries({ queryKey: ['isFollowing', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['organizerProfile', slugOrId] });
      toast({
        title: nowFollowing ? "Following!" : "Unfollowed",
        description: nowFollowing 
          ? `You'll be notified about new events from ${profile?.name}`
          : `You've unfollowed ${profile?.name}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Skeleton className="w-32 h-32 rounded-full" />
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Organizer Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The organizer profile you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/events">Browse Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const identityLabel = profile.identity_type 
    ? profile.identity_type.charAt(0).toUpperCase() + profile.identity_type.slice(1).replace('_', ' ')
    : null;
  
  return (
    <>
      <SEOHead
        title={`${profile.name} | UniVoid Organizer`}
        description={`Discover events by ${profile.name} on UniVoid. ${profile.event_types?.slice(0, 3).join(', ') || 'Events'}`}
      />
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={toDisplayUrl(profile.logo_url, { forceImage: true }) || undefined} alt={profile.name} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                    {profile.is_verified && (
                      <BadgeCheck className="w-6 h-6 text-amber-500" />
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-2">@{profile.slug}</p>
                  
                  {profile.website_url && (
                    <a 
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline mb-3"
                    >
                      <Globe className="w-4 h-4" />
                      {profile.website_url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  
                  <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {profile.follower_count} followers
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {profile.events_count} events
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* Show Follow button for all users */}
                  {user && user.id !== profile.user_id ? (
                    <Button
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                      variant={isFollowing ? "outline" : "default"}
                    >
                      {followMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  ) : !user && (
                    <Button
                      onClick={() => setShowAuthModal(true)}
                      variant="default"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* About Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {identityLabel && (
                  <Badge variant="secondary">{identityLabel}</Badge>
                )}
                {profile.event_types?.map((type) => (
                  <Badge key={type} variant="outline">{type}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Events Tabs */}
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="upcoming">
                Upcoming Events ({events?.upcoming?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Events ({events?.past?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-6">
              {eventsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                  ))}
                </div>
              ) : events?.upcoming?.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming events</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events?.upcoming?.map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="mt-6">
              {eventsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                  ))}
                </div>
              ) : events?.past?.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No past events yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events?.past?.map((event: any) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Auth Modal for Follow */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default OrganizerProfile;

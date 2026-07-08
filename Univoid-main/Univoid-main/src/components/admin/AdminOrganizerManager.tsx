import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  getAllOrganizers, 
  setOrganizerVerified,
  type OrganizerProfile 
} from "@/services/organizerService";
import { 
  BadgeCheck, Search, Users, Calendar, ExternalLink, Loader2 
} from "lucide-react";
import { Link } from "react-router-dom";

const AdminOrganizerManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: organizers = [], isLoading } = useQuery({
    queryKey: ['admin-organizers'],
    queryFn: () => getAllOrganizers(100),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
  
  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => 
      setOrganizerVerified(id, verified),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizers'] });
      toast({
        title: variables.verified ? "Organizer Verified" : "Verification Removed",
        description: variables.verified 
          ? "The organizer now has a verified badge." 
          : "The verified badge has been removed.",
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
  
  // Helper to check if organizer is new (created in last 7 days)
  const isNewOrganizer = (createdAt: string) => {
    const created = new Date(createdAt);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return created > sevenDaysAgo;
  };
  
  // Count new organizers
  const newOrganizersCount = organizers.filter(o => isNewOrganizer(o.created_at)).length;
  
  const filteredOrganizers = organizers.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search organizers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{organizers.length}</p>
              <p className="text-xs text-muted-foreground">Total Organizers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BadgeCheck className="w-8 h-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">
                {organizers.filter(o => o.is_verified).length}
              </p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </CardContent>
        </Card>
        {newOrganizersCount > 0 && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 col-span-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-sm">🆕</span>
              </div>
              <div>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {newOrganizersCount} new organizer{newOrganizersCount > 1 ? 's' : ''} this week
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">Review and verify new profiles</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Organizer List */}
      {filteredOrganizers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {searchQuery ? "No organizers match your search" : "No organizers yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrganizers.map((org) => (
            <Card key={org.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={org.logo_url || undefined} alt={org.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {org.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{org.name}</h3>
                      {org.is_verified && (
                        <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      {isNewOrganizer(org.created_at) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{org.slug}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {org.follower_count} followers
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {org.events_count} events
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/o/${org.slug}`}
                      target="_blank"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        Verified
                      </span>
                      {verifyMutation.isPending && 
                        verifyMutation.variables?.id === org.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={org.is_verified}
                          onCheckedChange={(checked) => 
                            verifyMutation.mutate({ id: org.id, verified: checked })
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrganizerManager;

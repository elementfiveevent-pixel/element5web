import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { 
  LayoutDashboard, 
  Calendar, 
  ScanLine, 
  Settings,
  ChevronLeft,
  LogOut,
  Home,
  Plus,
  Pencil,
  BadgeCheck
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toDisplayUrl } from "@/lib/storageProxy";
import { format } from "date-fns";
import type { Event } from "@/services/eventsService";

interface OrganizerSidebarProps {
  selectedEventId?: string | null;
  eventTitle?: string;
  events?: Event[];
  onEventSelect?: (eventId: string) => void;
  onBackToOverview?: () => void;
}

export function OrganizerSidebar({ 
  selectedEventId, 
  eventTitle,
  events = [],
  onEventSelect,
  onBackToOverview
}: OrganizerSidebarProps) {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { profile: organizerProfile } = useOrganizerProfile();

  const isActive = (href: string, exact = false) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card h-dvh sticky top-0 shrink-0 overflow-hidden">
      {/* Header with Organizer Branding */}
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 group mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">U</span>
          </div>
          <span className="font-display font-bold text-lg">UniVoid</span>
        </Link>
        
        {/* Organizer Profile Card */}
        {organizerProfile && (
          <div className="bg-muted/50 rounded-lg p-3 mt-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-background">
                <AvatarImage src={toDisplayUrl(organizerProfile.logo_url, { forceImage: true }) || undefined} alt={organizerProfile.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {organizerProfile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate">{organizerProfile.name}</p>
                  {organizerProfile.is_verified && (
                    <BadgeCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Organizer</p>
              </div>
            </div>
            <Link to="/organizer/edit-profile">
              <Button variant="ghost" size="sm" className="w-full mt-2 gap-1.5 text-xs">
                <Pencil className="w-3 h-3" />
                Edit Profile
              </Button>
            </Link>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {/* Back to Overview when event selected */}
          {selectedEventId && onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors w-full"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Overview
            </button>
          )}

          {/* Overview Mode Navigation */}
          {!selectedEventId && (
            <>
              <PrefetchLink
                to="/organizer"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive("/organizer", true)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </PrefetchLink>

              <Link to="/organizer/create-event">
                <Button variant="outline" className="w-full mt-2 gap-2">
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              </Link>
            </>
          )}

          {/* Event Management Mode - Quick Actions Only */}
          {selectedEventId && (
            <div className="space-y-1 pt-2">
              <p className="text-xs font-medium text-muted-foreground px-3 py-1">Quick Actions</p>
              <PrefetchLink
                to={`/organizer/check-in/${selectedEventId}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ScanLine className="w-4 h-4" />
                Check-in Scanner
              </PrefetchLink>
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <PrefetchLink
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Home className="w-4 h-4" />
          User Dashboard
        </PrefetchLink>
        
        <PrefetchLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </PrefetchLink>

        <Separator className="my-2" />

        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_photo_url || undefined} />
            <AvatarFallback className="text-xs">
              {profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || "Organizer"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}

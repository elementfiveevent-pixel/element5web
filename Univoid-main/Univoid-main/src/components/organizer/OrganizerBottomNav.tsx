import { useLocation, useNavigate } from "react-router-dom";
import { PrefetchLink } from "@/components/common/PrefetchLink";
import { LayoutDashboard, Calendar, ScanLine, Users, MoreHorizontal, ChevronLeft, Home, Settings, BarChart3, Pencil, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useOrganizerProfile } from "@/hooks/useOrganizerProfile";
import { toDisplayUrl } from "@/lib/storageProxy";

interface OrganizerBottomNavProps {
  showBackButton?: boolean;
  backPath?: string;
  selectedEventId?: string;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export function OrganizerBottomNav({ 
  showBackButton = false, 
  backPath = "/organizer",
  selectedEventId,
  onTabChange,
  activeTab = "registrations"
}: OrganizerBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  const { profile: organizerProfile } = useOrganizerProfile();

  // Only show on organizer pages and mobile
  if (!location.pathname.startsWith("/organizer")) {
    return null;
  }

  // Check if we're on the main organizer dashboard
  const isOnDashboard = location.pathname === "/organizer";
  const isOnCheckIn = location.pathname.startsWith("/organizer/check-in");
  const isOnCreateEvent = location.pathname === "/organizer/create-event";
  const isOnEditEvent = location.pathname.startsWith("/organizer/edit-event");

  // Navigation items - all use absolute paths
  const navItems = [
    { 
      id: "dashboard",
      href: "/organizer", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      isActive: isOnDashboard && !selectedEventId
    },
    { 
      id: "events",
      href: "/organizer", 
      label: "Events", 
      icon: Calendar,
      isActive: isOnDashboard && !!selectedEventId,
      onClick: () => {
        if (onTabChange) {
          onTabChange("registrations");
        }
        if (!isOnDashboard) {
          navigate("/organizer");
        }
      }
    },
    { 
      id: "scan",
      href: selectedEventId ? `/organizer/check-in/${selectedEventId}` : "/organizer", 
      label: "Scan", 
      icon: ScanLine, 
      highlight: true,
      isActive: isOnCheckIn,
      disabled: !selectedEventId
    },
    { 
      id: "volunteers",
      href: "/organizer", 
      label: "Volunteers", 
      icon: Users,
      isActive: isOnDashboard && activeTab === "volunteers",
      onClick: () => {
        if (onTabChange && selectedEventId) {
          onTabChange("volunteers");
        }
        if (!isOnDashboard) {
          navigate("/organizer");
        }
      }
    },
  ];

  // More menu items - all absolute paths
  const moreItems = [
    { href: "/dashboard", label: "User Dashboard", icon: LayoutDashboard },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/", label: "Home", icon: Home },
  ];

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (item.onClick) {
      e.preventDefault();
      item.onClick();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border safe-area-pb">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 h-auto"
            onClick={() => navigate(backPath)}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Back</span>
          </Button>
        )}
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isDisabled = item.disabled;
          
          // For items with onClick handlers, use a button instead of link
          if (item.onClick && !isDisabled) {
            return (
              <button
                key={item.id}
                onClick={(e) => handleNavClick(item, e)}
                disabled={isDisabled}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 active:scale-95",
                  isDisabled && "opacity-50 pointer-events-none"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                    item.highlight && "bg-primary text-primary-foreground shadow-lg",
                    item.isActive && !item.highlight && "bg-foreground text-background shadow-md",
                    !item.isActive && !item.highlight && "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium",
                  item.isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                )}>{item.label}</span>
              </button>
            );
          }
          
          return (
            <PrefetchLink
              key={item.id}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-200 active:scale-95",
                isDisabled && "opacity-50 pointer-events-none"
              )}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                  item.highlight && "bg-primary text-primary-foreground shadow-lg",
                  item.isActive && !item.highlight && "bg-foreground text-background shadow-md",
                  !item.isActive && !item.highlight && "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                item.isActive ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>{item.label}</span>
            </PrefetchLink>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            
            {/* Organizer Profile Card for Mobile */}
            {organizerProfile && (
              <div className="bg-muted/50 rounded-lg p-3 mt-4 mb-2">
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 gap-1.5 text-xs"
                  onClick={() => {
                    navigate("/organizer/edit-profile");
                    setMoreOpen(false);
                  }}
                >
                  <Pencil className="w-3 h-3" />
                  Edit Profile
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 py-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="outline"
                    className="h-14 justify-start gap-3"
                    onClick={() => {
                      navigate(item.href);
                      setMoreOpen(false);
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

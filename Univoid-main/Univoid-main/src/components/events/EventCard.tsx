import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, IndianRupee, BadgeCheck } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@/services/eventsService";
import { getOrganizerProfileByUserId } from "@/services/organizerService";
import { fetchTicketCategories } from "@/services/ticketCategoryService";
import { toDisplayUrl } from "@/lib/storageProxy";

interface EventCardProps {
  event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
  // Fetch organizer profile for the event
  const { data: organizer } = useQuery({
    queryKey: ['organizer-profile', event.organizer_id],
    queryFn: () => getOrganizerProfileByUserId(event.organizer_id),
    enabled: !!event.organizer_id,
    staleTime: 1000 * 60 * 10, // Cache for 10 mins
  });
  
  // Fetch ticket categories to show category-based pricing
  const { data: ticketCategories = [] } = useQuery({
    queryKey: ['ticket-categories-card', event.id],
    queryFn: () => fetchTicketCategories(event.id),
    enabled: !!event.id && event.is_paid,
    staleTime: 1000 * 60 * 10,
  });

  const isEventPast = isPast(new Date(event.start_date));
  const daysUntil = differenceInDays(new Date(event.start_date), new Date());
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      tech: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      cultural: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      sports: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      academic: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    };
    return colors[category.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  // Use slug for SEO-friendly URLs, fallback to ID
  const eventUrl = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;

  return (
    <Link to={eventUrl} className="block h-full">
      <Card className="group h-full overflow-hidden hover:shadow-soft-lg hover:-translate-y-1.5 transition-all duration-300 cursor-pointer border-border">
        {/* Flyer Image - Respects poster_ratio from DB */}
        <div 
          className="relative overflow-hidden bg-muted"
          style={{ 
            aspectRatio: (event as any).poster_ratio === '1:1' ? '1/1' : 
                         (event as any).poster_ratio === '16:9' ? '16/9' : '4/5'
          }}
        >
          {event.flyer_url ? (
            <img
              src={toDisplayUrl(event.flyer_url, { forceImage: true }) || undefined}
              alt={event.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
              <Calendar className="w-16 h-16 text-primary/50" />
            </div>
          )}
          
          {/* Subtle black gradient overlay at bottom for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
          
          {/* Price Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={event.is_paid ? "default" : "secondary"}
              className="text-sm font-semibold shadow-soft"
            >
              {event.is_paid ? (
                <span className="flex items-center gap-0.5">
                  <IndianRupee className="w-3 h-3" />
                  {ticketCategories.length > 0 
                    ? (Math.min(...ticketCategories.map(c => c.price)) === Math.max(...ticketCategories.map(c => c.price))
                      ? ticketCategories[0].price
                      : `${Math.min(...ticketCategories.map(c => c.price))}+`)
                    : event.price}
                </span>
              ) : (
                "Free"
              )}
            </Badge>
          </div>

          {/* Status badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isEventPast && (
              <Badge variant="destructive" className="shadow-soft">
                Ended
              </Badge>
            )}
            {!isEventPast && daysUntil <= 3 && daysUntil >= 0 && (
              <Badge className="bg-orange-500 text-white shadow-soft animate-pulse">
                {daysUntil === 0 ? "Today!" : `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`}
              </Badge>
            )}
          </div>

          {/* Bottom overlay with event details - Locality style */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-end justify-between gap-2">
              {/* Left side: Title, Location, Date */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Event Title */}
                <h3 className="font-display font-bold text-white text-lg line-clamp-2 drop-shadow-md">
                  {event.title}
                </h3>
                {/* Venue / Location */}
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate drop-shadow-sm">
                    {event.city && event.state 
                      ? `${event.city}, ${event.state}`
                      : event.is_location_decided 
                        ? event.venue_name || "Venue TBA" 
                        : "Location TBA"}
                  </span>
                </div>
                {/* Event Date & Time */}
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="drop-shadow-sm">
                    {format(new Date(event.start_date), "dd MMM yyyy · h:mm a")}
                    {event.end_date && ` – ${format(new Date(event.end_date), "h:mm a")}`}
                  </span>
                </div>
              </div>

              {/* Right side: Organizer Logo + Name */}
              {organizer && (
                <Link 
                  to={`/o/${organizer.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex flex-col items-center gap-1 flex-shrink-0 group/org"
                >
                  <Avatar className="w-10 h-10 border-2 border-white/30 shadow-md">
                    <AvatarImage src={toDisplayUrl(organizer.logo_url, { forceImage: true }) || undefined} alt={organizer.name} />
                    <AvatarFallback className="text-xs bg-white/20 text-white">
                      {organizer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs text-white/80 group-hover/org:text-white transition-colors max-w-[60px] truncate drop-shadow-sm">
                      {organizer.name}
                    </span>
                    {organizer.is_verified && (
                      <BadgeCheck className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default EventCard;

import { useState, useMemo, useEffect } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";

import { EventCard } from "@/components/events/EventCard";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventFilters } from "@/components/events/EventFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchEvents, Event } from "@/services/eventsService";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/common/SEOHead";
import AuthModal from "@/components/auth/AuthModal";

interface LayoutContext {
  onAuthClick?: () => void;
}

const Events = () => {
  const { user } = useAuth();
  const context = useOutletContext<LayoutContext>();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(urlCategory || "all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic SEO based on category filter
  const seoData = useMemo(() => {
    if (urlCategory && urlCategory !== 'all') {
      return {
        title: `${urlCategory} Events for Students | UniVoid`,
        description: `Discover ${urlCategory.toLowerCase()} events, workshops, and hackathons for students. Register now and participate in exciting opportunities.`,
        keywords: [urlCategory, 'student events', 'hackathons', 'workshops', 'college events', 'UniVoid'],
      };
    }
    return {
      title: 'Student Events - Hackathons, Workshops & Fests | UniVoid',
      description: 'Discover hackathons, workshops, cultural fests, and student events. Register for tech events, coding competitions, and more.',
      keywords: ['student events', 'hackathons', 'workshops', 'college fests', 'tech events', 'UniVoid'],
    };
  }, [urlCategory]);

  // Fetch events with filters - use useQuery for better caching
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchEvents({
        category: category !== "all" ? category : undefined,
        is_paid: priceFilter === "all" ? undefined : priceFilter === "paid",
        search: search || undefined,
        state: stateFilter !== "all" ? stateFilter : undefined,
        city: cityFilter !== "all" ? cityFilter : undefined,
      });
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [category, priceFilter, search, stateFilter, cityFilter]);

  // REMOVED: Focus refetch was causing unnecessary slow reloads

  // Real-time subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('events-page-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'events' },
        (payload: any) => {
          if (payload.eventType === 'INSERT' && payload.new?.status === 'published') {
            setEvents(prev => {
              if (prev.some(e => e.id === payload.new.id)) return prev;
              const newEvent = payload.new as Event;
              return [...prev, newEvent].sort((a, b) => 
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
              );
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Event;
            setEvents(prev => {
              // If status changed to published, add it
              if (updated.status === 'published' && !prev.some(e => e.id === updated.id)) {
                return [...prev, updated].sort((a, b) => 
                  new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                );
              }
              // If no longer published, remove
              if (updated.status !== 'published') {
                return prev.filter(e => e.id !== updated.id);
              }
              // Otherwise update
              return prev.map(e => e.id === updated.id ? { ...e, ...updated } : e);
            });
          } else if (payload.eventType === 'DELETE') {
            setEvents(prev => prev.filter(e => e.id !== payload.old?.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setPriceFilter("all");
    setStateFilter("all");
    setCityFilter("all");
  };

  const { upcomingEvents, pastEvents } = useMemo(() => {
    if (!events) return { upcomingEvents: [], pastEvents: [] };
    const now = new Date();
    return {
      upcomingEvents: events.filter(e => new Date(e.start_date) >= now),
      pastEvents: events.filter(e => new Date(e.start_date) < now),
    };
  }, [events]);

  return (
    <div className="page-enter">
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        url="/events"
        keywords={seoData.keywords}
      />
      <main className="py-10 md:py-14">
        <div className="container-wide">
          {/* Header */}
          <div className="mb-6 md:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-xl md:text-3xl text-foreground">
                    Events
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Discover hackathons, workshops, cultural fests & more
                  </p>
                </div>
              </div>

              {user ? (
                <Link to="/organizer/create-event">
                  <Button className="rounded-full gap-2 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    Create Event
                  </Button>
                </Link>
              ) : (
                <Button className="rounded-full gap-2 w-full sm:w-auto" onClick={() => {
                  if (context?.onAuthClick) {
                    context.onAuthClick();
                  } else {
                    setShowAuthModal(true);
                  }
                }}>
                  <Plus className="w-4 h-4" />
                  Create Event
                </Button>
              )}
            </div>
          </div>

          <EventFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            priceFilter={priceFilter}
            onPriceFilterChange={setPriceFilter}
            state={stateFilter}
            onStateChange={setStateFilter}
            city={cityFilter}
            onCityChange={setCityFilter}
            onClear={clearFilters}
          />

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && upcomingEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="font-display text-xl font-semibold">Upcoming Events</h2>
              <Badge variant="secondary">{upcomingEvents.length}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch staggered-grid-fast">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {!isLoading && events?.length === 0 && (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="w-16 h-16 text-muted-foreground/50" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">Check back later for upcoming events!</p>
          </div>
        )}
        </div>
      </main>

      
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Events;

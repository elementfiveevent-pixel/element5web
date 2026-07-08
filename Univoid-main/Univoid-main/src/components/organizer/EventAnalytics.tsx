import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Users, TicketCheck, TrendingUp, Calendar, Eye, Clock, ShoppingCart, UserCheck } from "lucide-react";
import { format, subDays, parseISO, startOfDay, eachDayOfInterval } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface EventAnalyticsProps {
  eventId: string;
}

interface RegistrationTrend {
  date: string;
  count: number;
  cumulative: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
  color: string;
}

interface CheckoutLead {
  user_id: string;
  full_name: string;
  email: string;
  visited_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
  used: "#3b82f6",
};

export function EventAnalytics({ eventId }: EventAnalyticsProps) {
  // Fetch registrations for analytics
  const { data: registrations } = useQuery({
    queryKey: ["event-registrations-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, created_at, payment_status")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tickets for check-in analytics
  const { data: tickets } = useQuery({
    queryKey: ["event-tickets-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_tickets")
        .select("id, is_used, used_at, created_at")
        .eq("event_id", eventId);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch event details
  const { data: event } = useQuery({
    queryKey: ["event-analytics-detail", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("title, start_date, views_count, registrations_count")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch checkout analytics
  const { data: checkoutAnalytics } = useQuery({
    queryKey: ["event-checkout-analytics", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_event_checkout_analytics", { p_event_id: eventId });

      if (error) throw error;
      // RPC returns array, get first item
      const result = Array.isArray(data) ? data[0] : data;
      return result as unknown as {
        total_checkout_views: number;
        unique_users: number;
        anonymous_views: number;
        checkout_leads: CheckoutLead[];
      } | null;
    },
  });

  // Calculate registration trends
  const registrationTrends: RegistrationTrend[] = (() => {
    if (!registrations || registrations.length === 0) return [];

    const firstReg = parseISO(registrations[0].created_at);
    const lastReg = parseISO(registrations[registrations.length - 1].created_at);
    const dateRange = eachDayOfInterval({ start: firstReg, end: lastReg });

    let cumulative = 0;
    return dateRange.map(date => {
      const dayStart = startOfDay(date);
      const dayCount = registrations.filter(r => {
        const regDate = startOfDay(parseISO(r.created_at));
        return regDate.getTime() === dayStart.getTime();
      }).length;
      cumulative += dayCount;
      return {
        date: format(date, "MMM d"),
        count: dayCount,
        cumulative,
      };
    });
  })();

  // Status breakdown
  const statusBreakdown: StatusBreakdown[] = (() => {
    if (!registrations) return [];
    
    const counts: Record<string, number> = {};
    registrations.forEach(r => {
      counts[r.payment_status] = (counts[r.payment_status] || 0) + 1;
    });

    return Object.entries(counts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      color: STATUS_COLORS[status] || "#6b7280",
    }));
  })();

  // Check-in analytics
  const checkInStats = {
    total: tickets?.length || 0,
    checkedIn: tickets?.filter(t => t.is_used).length || 0,
    rate: tickets?.length ? Math.round((tickets.filter(t => t.is_used).length / tickets.length) * 100) : 0,
  };

  // Hourly check-in distribution
  const checkInByHour = (() => {
    if (!tickets) return [];
    
    const hours: Record<number, number> = {};
    tickets.filter(t => t.is_used && t.used_at).forEach(t => {
      const hour = parseISO(t.used_at!).getHours();
      hours[hour] = (hours[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      count: hours[i] || 0,
    })).filter(h => h.count > 0 || (h.hour >= "08:00" && h.hour <= "22:00"));
  })();

  // Conversion metrics
  const checkoutViews = checkoutAnalytics?.total_checkout_views || 0;
  const metrics = {
    totalViews: event?.views_count || 0,
    checkoutViews,
    checkoutUniqueUsers: checkoutAnalytics?.unique_users || 0,
    totalRegistrations: registrations?.length || 0,
    approvedRegistrations: registrations?.filter(r => r.payment_status === "approved").length || 0,
    conversionRate: event?.views_count && registrations?.length 
      ? ((registrations.length / event.views_count) * 100).toFixed(1) 
      : "0",
    checkoutToRegRate: checkoutViews && registrations?.length
      ? ((registrations.length / checkoutViews) * 100).toFixed(1)
      : "0",
    approvalRate: registrations?.length 
      ? ((registrations.filter(r => r.payment_status === "approved").length / registrations.length) * 100).toFixed(0) 
      : "0",
  };

  // Checkout leads (users who visited checkout but didn't register)
  const checkoutLeads: CheckoutLead[] = (() => {
    if (!checkoutAnalytics?.checkout_leads || !registrations) return [];
    const registeredUserIds = new Set(registrations.map(() => null)); // we don't have user_id in regs here
    // Show all checkout leads - organizer can cross-reference
    return (checkoutAnalytics.checkout_leads || []).filter(
      (lead: CheckoutLead) => lead.user_id && lead.full_name !== 'Anonymous'
    );
  })();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.checkoutViews}</p>
                <p className="text-xs text-muted-foreground">Checkout Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.checkoutUniqueUsers}</p>
                <p className="text-xs text-muted-foreground">Checkout Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalRegistrations}</p>
                <p className="text-xs text-muted-foreground">Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TicketCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{checkInStats.checkedIn}</p>
                <p className="text-xs text-muted-foreground">Checked In ({checkInStats.rate}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                <p className="text-xs text-muted-foreground">View → Register</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registration Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registration Trends</CardTitle>
            <CardDescription>Daily registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            {registrationTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px" 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)" 
                    name="Total"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--chart-2))" 
                    fill="hsl(var(--chart-2) / 0.2)" 
                    name="Daily"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No registration data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registration Status</CardTitle>
            <CardDescription>Breakdown by approval status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {statusBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-sm">{item.status}</span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check-in Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Check-in Distribution</CardTitle>
            <CardDescription>When attendees checked in</CardDescription>
          </CardHeader>
          <CardContent>
            {checkInByHour.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={checkInByHour}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px" 
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Check-ins" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No check-in data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conversion Funnel</CardTitle>
            <CardDescription>From views to attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Page Views</span>
                  <span className="text-sm text-muted-foreground">{metrics.totalViews.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: "100%" }} />
                </div>
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Checkout Opened</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.checkoutViews} ({metrics.totalViews ? ((metrics.checkoutViews / metrics.totalViews) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500" 
                    style={{ width: `${metrics.totalViews ? Math.min(100, (metrics.checkoutViews / metrics.totalViews) * 100) : 0}%` }} 
                  />
                </div>
              </div>
              
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Registrations</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.totalRegistrations} ({metrics.conversionRate}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500" 
                    style={{ width: `${Math.min(100, parseFloat(metrics.conversionRate) * 10)}%` }} 
                  />
                </div>
              </div>
              
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Approved</span>
                  <span className="text-sm text-muted-foreground">
                    {metrics.approvedRegistrations} ({metrics.approvalRate}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${metrics.approvalRate}%` }} 
                  />
                </div>
              </div>
              
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Attended</span>
                  <span className="text-sm text-muted-foreground">
                    {checkInStats.checkedIn} ({checkInStats.rate}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500" 
                    style={{ width: `${checkInStats.rate}%` }} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Leads */}
      {checkoutLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Checkout Leads</CardTitle>
            <CardDescription>Users who opened the registration form — potential conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {checkoutLeads.map((lead, i) => (
                <div key={`${lead.user_id}-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {lead.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{lead.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(lead.visited_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

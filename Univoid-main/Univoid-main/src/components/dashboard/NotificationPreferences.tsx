import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, MapPin, Heart, Calendar, BookOpen, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationPrefs {
  event_alerts: boolean;
  weekly_digest: boolean;
  interest_based_alerts: boolean;
  location_based_alerts: boolean;
}

export const NotificationPreferences = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    event_alerts: true,
    weekly_digest: true,
    interest_based_alerts: true,
    location_based_alerts: true,
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPrefs({
          event_alerts: data.event_alerts ?? true,
          weekly_digest: data.weekly_digest ?? true,
          interest_based_alerts: data.interest_based_alerts ?? true,
          location_based_alerts: data.location_based_alerts ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPrefs, value: boolean) => {
    setSaving(true);
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);

    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: user!.id,
          ...newPrefs,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      toast.success('Preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      // Revert on error
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const preferences = [
    {
      key: 'event_alerts' as const,
      label: 'Event Alerts',
      description: 'Get notified about new events and registrations',
      icon: Calendar,
    },
    {
      key: 'interest_based_alerts' as const,
      label: 'Interest-Based Alerts',
      description: `Events matching your interests${profile?.interests?.length ? `: ${profile.interests.slice(0, 3).join(', ')}` : ''}`,
      icon: Heart,
    },
    {
      key: 'location_based_alerts' as const,
      label: 'Location-Based Alerts',
      description: `Events happening in ${profile?.city || 'your city'}`,
      icon: MapPin,
    },
    {
      key: 'weekly_digest' as const,
      label: 'Weekly Digest',
      description: 'A weekly summary of opportunities and updates',
      icon: Mail,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive alerts for events and opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferences.map((pref) => (
          <div
            key={pref.key}
            className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <pref.icon className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor={pref.key} className="font-medium cursor-pointer">
                  {pref.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {pref.description}
                </p>
              </div>
            </div>
            <Switch
              id={pref.key}
              checked={prefs[pref.key]}
              onCheckedChange={(checked) => updatePreference(pref.key, checked)}
              disabled={saving}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { 
  Bell, Check, Trash2, Calendar, BookOpen, Info, AlertCircle, 
  FolderKanban, ListTodo, ChevronDown, ArrowLeft, Volume2, VolumeX, BellRing, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushPermissionDialog } from './PushPermissionDialog';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

type NotificationCategory = 'all' | 'event' | 'project' | 'task' | 'system';

const NOTIFICATION_LIMIT = 20;

const categoryConfig: Record<NotificationCategory, { label: string; icon: React.ReactNode }> = {
  all: { label: 'All', icon: <Bell className="h-3.5 w-3.5" /> },
  event: { label: 'Events', icon: <Calendar className="h-3.5 w-3.5" /> },
  project: { label: 'Projects', icon: <FolderKanban className="h-3.5 w-3.5" /> },
  task: { label: 'Tasks', icon: <ListTodo className="h-3.5 w-3.5" /> },
  system: { label: 'System', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

// List of admin-only routes that should redirect to dashboard for non-admins
const ADMIN_ROUTES = ['/admin'];

// List of organizer-only routes that should redirect to dashboard for non-organizers
const ORGANIZER_ROUTES = ['/organizer'];
const NotificationItem = memo(({ 
  notification, 
  onMarkAsRead, 
  onDelete, 
  onClose,
  getIcon,
  isAdminOrAssistant,
  isOrganizer
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void; 
  onDelete: (id: string) => void;
  onClose: () => void;
  getIcon: (type: string) => React.ReactNode;
  isAdminOrAssistant: boolean;
  isOrganizer: boolean;
}) => {
  // Sanitize notification link - prevent non-admins/non-organizers from accessing protected routes
  const getSafeLink = (link: string | null): string => {
    if (!link) return '/dashboard';
    
    // Check admin routes - allow both admins and admin assistants
    if (ADMIN_ROUTES.some(route => link.startsWith(route)) && !isAdminOrAssistant) {
      return '/dashboard';
    }
    
    // Check organizer routes
    if (ORGANIZER_ROUTES.some(route => link.startsWith(route)) && !isOrganizer) {
      return '/dashboard';
    }
    
    return link;
  };

  const safeLink = getSafeLink(notification.link);

  return (
    <div
      className={cn(
        'p-3 hover:bg-muted/50 transition-colors relative group gpu-accelerated',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          {safeLink ? (
            <Link
              to={safeLink}
              onClick={() => {
                onMarkAsRead(notification.id);
                onClose();
              }}
              className="block"
            >
              <p className="text-sm font-semibold truncate hover:text-primary transition-colors">
                {notification.title}
              </p>
            </Link>
          ) : (
            <p className="text-sm font-semibold truncate">
              {notification.title}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(notification.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {!notification.is_read && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r" />
      )}
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

const CategoryFilter = memo(({ 
  activeCategory, 
  onCategoryChange,
  categoryCounts 
}: { 
  activeCategory: NotificationCategory; 
  onCategoryChange: (category: NotificationCategory) => void;
  categoryCounts: Record<NotificationCategory, number>;
}) => (
  <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto scrollbar-hide">
    {(Object.keys(categoryConfig) as NotificationCategory[]).map((category) => (
      <Button
        key={category}
        variant={activeCategory === category ? 'secondary' : 'ghost'}
        size="sm"
        className={cn(
          'h-7 px-2.5 text-xs shrink-0 gap-1.5 transition-colors',
          activeCategory === category && 'bg-primary/10 text-primary'
        )}
        onClick={() => onCategoryChange(category)}
      >
        {categoryConfig[category].icon}
        {categoryConfig[category].label}
        {category !== 'all' && categoryCounts[category] > 0 && (
          <span className="ml-0.5 text-[10px] bg-muted rounded-full px-1.5 py-0.5">
            {categoryCounts[category]}
          </span>
        )}
      </Button>
    ))}
  </div>
));

CategoryFilter.displayName = 'CategoryFilter';

const NotificationSettings = memo(({
  isSoundEnabled,
  toggleSound,
  isPushEnabled,
  isPushSupported,
  togglePush
}: {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isPushEnabled: boolean;
  isPushSupported: boolean;
  togglePush: () => void;
}) => (
  <div className="px-3 py-2 border-b border-border space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        <span>Sound</span>
      </div>
      <Switch 
        checked={isSoundEnabled} 
        onCheckedChange={toggleSound}
        className="scale-75"
      />
    </div>
    {isPushSupported && (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BellRing className="h-3.5 w-3.5" />
          <span>Push alerts</span>
        </div>
        <Switch 
          checked={isPushEnabled} 
          onCheckedChange={togglePush}
          className="scale-75"
        />
      </div>
    )}
  </div>
));

NotificationSettings.displayName = 'NotificationSettings';

export const NotificationCenter = () => {
  const { user, isAdminOrAssistant, isOrganizer } = useAuth();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const lastNotificationIdRef = useRef<string | null>(null);

  // Sound and push notification hooks
  const { playNotificationSound, isSoundEnabled, toggleSound } = useNotificationSound();
  const { 
    isSupported: isPushSupported, 
    isEnabled: isPushEnabled, 
    togglePushNotifications, 
    showNotification,
    showPermissionDialog,
    closePermissionDialog,
    requestBrowserPermission
  } = usePushNotifications();

  const fetchNotifications = useCallback(async (reset = false) => {
    if (!user) return;

    const currentOffset = reset ? 0 : offset;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + NOTIFICATION_LIMIT - 1);

    if (!error && data) {
      if (reset) {
        setNotifications(data);
        setOffset(data.length);
        if (data.length > 0) {
          lastNotificationIdRef.current = data[0].id;
        }
      } else {
        setNotifications(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      }
      setHasMore(data.length === NOTIFICATION_LIMIT);
    }
  }, [user, offset]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error && count !== null) {
      setUnreadCount(count);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Fetch after first paint using requestIdleCallback
    const fetchData = () => {
      fetchNotifications(true);
      fetchUnreadCount();
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(fetchData);
    } else {
      setTimeout(fetchData, 100);
    }

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Play sound for new notification
          playNotificationSound();
          
          // Show push notification if in background
          showNotification({
            title: newNotification.title,
            body: newNotification.message,
            link: newNotification.link || '/'
          });
          
          // Update state
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications(true);
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications(true);
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, fetchUnreadCount, playNotificationSound, showNotification]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchNotifications(false);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    const notification = notifications.find((n) => n.id === id);
    
    await supabase.from('notifications').delete().eq('id', id);

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notification && !notification.is_read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, [notifications]);

  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-4 w-4 text-primary" />;
      case 'scholarship':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'project':
        return <FolderKanban className="h-4 w-4 text-violet-500" />;
      case 'task':
        return <ListTodo className="h-4 w-4 text-amber-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'volunteer_invite':
        return <UserPlus className="h-4 w-4 text-emerald-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setShowSettings(false);
  }, []);

  // Filter notifications by category
  const filteredNotifications = activeCategory === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeCategory);

  // Calculate category counts for unread
  const categoryCounts = notifications.reduce((acc, n) => {
    if (!n.is_read) {
      const type = n.type as NotificationCategory;
      if (type in acc) {
        acc[type]++;
      }
    }
    return acc;
  }, { all: 0, event: 0, project: 0, task: 0, system: 0 } as Record<NotificationCategory, number>);
  categoryCounts.all = unreadCount;

  if (!user) return null;

  const notificationContent = (
    <>
      {showSettings && (
        <NotificationSettings
          isSoundEnabled={isSoundEnabled}
          toggleSound={toggleSound}
          isPushEnabled={isPushEnabled}
          isPushSupported={isPushSupported}
          togglePush={togglePushNotifications}
        />
      )}

      <CategoryFilter 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory}
        categoryCounts={categoryCounts}
      />

      <ScrollArea className={cn("flex-1 min-h-0", isMobile ? "h-[calc(100dvh-220px)]" : "max-h-80")}>
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-1 text-center px-4">
              {activeCategory === 'all' 
                ? "We'll notify you about events, projects & tasks"
                : `No ${categoryConfig[activeCategory].label.toLowerCase()} notifications`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onClose={handleClose}
                getIcon={getIcon}
                isAdminOrAssistant={isAdminOrAssistant}
                isOrganizer={isOrganizer}
              />
            ))}
            {hasMore && activeCategory === 'all' && (
              <div className="p-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Load more
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t border-border mt-auto flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => setShowSettings(!showSettings)}
        >
          {isSoundEnabled ? <Volume2 className="h-3 w-3 mr-1" /> : <VolumeX className="h-3 w-3 mr-1" />}
          {showSettings ? 'Hide settings' : 'Settings'}
        </Button>
        <Link to="/edit-profile" onClick={handleClose} className="flex-1">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Preferences
          </Button>
        </Link>
      </div>
    </>
  );

  // Mobile: Full screen sheet
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-secondary"
          onClick={() => setOpen(true)}
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent 
            side="right" 
            className="w-full sm:max-w-full p-0 flex flex-col"
          >
            <SheetHeader className="px-4 py-3 border-b border-border flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleClose}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <SheetTitle className="text-base font-bold">Notifications</SheetTitle>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </SheetHeader>
            {notificationContent}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          id="notification-bell"
          className="relative h-10 w-10 rounded-full hover:bg-secondary"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 rounded-2xl border border-border-strong/10 shadow-soft-lg flex flex-col max-h-[80vh] overflow-hidden"
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        {notificationContent}
      </PopoverContent>
      
      {/* Push Permission Dialog */}
      <PushPermissionDialog
        open={showPermissionDialog}
        onOpenChange={closePermissionDialog}
        onAllow={requestBrowserPermission}
      />
    </Popover>
  );
};

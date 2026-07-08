import { useCallback, useEffect, useState } from 'react';

const PUSH_ENABLED_KEY = 'push_notifications_enabled';
const PERMISSION_ASKED_KEY = 'push_permission_asked';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  link?: string;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
  });
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Check support and register service worker
  useEffect(() => {
    const init = async () => {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
      }

      setIsSupported(true);
      setPermission(Notification.permission);

      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('[Push] Service worker registered:', registration.scope);
          setSwRegistration(registration);
        } catch (error) {
          console.error('[Push] Service worker registration failed:', error);
        }
      }
    };

    init();
  }, []);

  // Check if permission was already asked
  const hasAskedPermission = useCallback(() => {
    return localStorage.getItem(PERMISSION_ASKED_KEY) === 'true';
  }, []);

  // Mark permission as asked
  const markPermissionAsked = useCallback(() => {
    localStorage.setItem(PERMISSION_ASKED_KEY, 'true');
  }, []);

  // Request browser permission - called after user accepts custom dialog
  const requestBrowserPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    // Don't re-prompt if already denied
    if (Notification.permission === 'denied') {
      console.log('[Push] Permission was previously denied by user');
      return false;
    }

    try {
      markPermissionAsked();
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(PUSH_ENABLED_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return false;
    }
  }, [isSupported, markPermissionAsked]);

  // Open custom permission dialog - this is what components should call
  const openPermissionDialog = useCallback(() => {
    if (!isSupported) return;
    
    // If already granted, just enable
    if (Notification.permission === 'granted') {
      setIsEnabled(true);
      localStorage.setItem(PUSH_ENABLED_KEY, 'true');
      return;
    }
    
    // If denied, don't show dialog
    if (Notification.permission === 'denied') {
      console.log('[Push] Permission was previously denied');
      return;
    }
    
    setShowPermissionDialog(true);
  }, [isSupported]);

  // Close permission dialog
  const closePermissionDialog = useCallback(() => {
    setShowPermissionDialog(false);
  }, []);

  // Show notification via service worker (works in background)
  const showNotification = useCallback(async (payload: PushNotificationPayload) => {
    if (!isEnabled || permission !== 'granted') return;

    // Check if page is visible - if so, don't show browser notification
    if (document.visibilityState === 'visible') {
      return; // In-app notification will handle it
    }

    try {
      if (swRegistration) {
        // Send to service worker for background notification
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          payload
        });
      } else {
        // Fallback to direct notification API
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.png',
          tag: 'univoid-notification-' + Date.now()
        });
      }
    } catch (error) {
      console.error('[Push] Failed to show notification:', error);
    }
  }, [isEnabled, permission, swRegistration]);

  // Toggle push notifications - shows custom dialog first
  const togglePushNotifications = useCallback(async () => {
    if (isEnabled) {
      setIsEnabled(false);
      localStorage.setItem(PUSH_ENABLED_KEY, 'false');
    } else {
      // If permission already granted, just enable
      if (Notification.permission === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(PUSH_ENABLED_KEY, 'true');
      } else {
        // Show custom dialog first
        openPermissionDialog();
      }
    }
  }, [isEnabled, openPermissionDialog]);

  return {
    isSupported,
    isEnabled,
    permission,
    showPermissionDialog,
    openPermissionDialog,
    closePermissionDialog,
    requestBrowserPermission,
    showNotification,
    togglePushNotifications
  };
};

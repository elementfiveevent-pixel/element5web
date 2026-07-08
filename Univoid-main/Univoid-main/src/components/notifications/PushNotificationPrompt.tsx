import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushPermissionDialog } from './PushPermissionDialog';
import { supabase } from '@/integrations/supabase/client';

const PROMPT_DELAY_MS = 3000; // Show after 3 seconds
const PROMPT_DISMISSED_KEY = 'push_prompt_dismissed';
const PROMPT_COOLDOWN_DAYS = 7; // Re-ask after 7 days if not granted

export const PushNotificationPrompt = () => {
  const { user, profile } = useAuth();
  const {
    isSupported,
    permission,
    showPermissionDialog,
    openPermissionDialog,
    closePermissionDialog,
    requestBrowserPermission,
  } = usePushNotifications();
  
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    // Only run for logged-in users with complete profiles
    if (!user || !profile?.profile_complete) return;
    
    // Not supported
    if (!isSupported) return;
    
    // Already granted - save subscription
    if (permission === 'granted') {
      saveSubscription();
      return;
    }
    
    // Already denied - don't prompt
    if (permission === 'denied') return;
    
    // Check if we should prompt
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < PROMPT_COOLDOWN_DAYS) {
        return; // Still in cooldown
      }
    }
    
    // Prompt after delay
    const timer = setTimeout(() => {
      setShouldPrompt(true);
      openPermissionDialog();
    }, PROMPT_DELAY_MS);
    
    return () => clearTimeout(timer);
  }, [user, profile, isSupported, permission, openPermissionDialog]);

  // Save push subscription to database
  const saveSubscription = async () => {
    if (!user || !('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const pushManager = (registration as any).pushManager;
      if (!pushManager) return;
      let subscription = await pushManager.getSubscription();
      
      if (!subscription) {
        // Get VAPID public key from environment
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.log('[Push] VAPID public key not configured');
          return;
        }
        
        // Subscribe to push
        subscription = await pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }
      
      if (subscription) {
        const subscriptionJson = subscription.toJSON();
        
        // Save to database
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
        
        console.log('[Push] Subscription saved successfully');
      }
    } catch (error) {
      console.error('[Push] Failed to save subscription:', error);
    }
  };

  const handleAllow = async (): Promise<boolean> => {
    const granted = await requestBrowserPermission();
    if (granted) {
      await saveSubscription();
    }
    return granted;
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, new Date().toISOString());
    closePermissionDialog();
  };

  if (!shouldPrompt && !showPermissionDialog) return null;

  return (
    <PushPermissionDialog
      open={showPermissionDialog}
      onOpenChange={(open) => {
        if (!open) handleDismiss();
      }}
      onAllow={handleAllow}
    />
  );
};

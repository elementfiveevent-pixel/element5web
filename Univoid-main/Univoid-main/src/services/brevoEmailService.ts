/**
 * Brevo Email Service
 * Handles all transactional email sending via Brevo SMTP
 * All emails are sent server-side through edge functions
 */

import { supabase } from '@/integrations/supabase/client';

type EmailType = 
  | "login_notification"
  | "event_created"
  | "event_registration"
  | "partner_request"
  | "area_request";

interface SendEmailOptions {
  type: EmailType;
  recipientEmail: string;
  recipientName?: string;
  data: Record<string, unknown>;
}

/**
 * Send an email via Brevo SMTP (through edge function)
 * This is a fire-and-forget operation - failures are logged but don't block the UI
 */
export async function sendBrevoEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[BrevoEmail] Sending ${options.type} email to ${options.recipientEmail}`);
    
    const { data, error } = await supabase.functions.invoke('send-brevo-email', {
      body: {
        type: options.type,
        recipientEmail: options.recipientEmail,
        recipientName: options.recipientName,
        data: options.data,
      },
    });

    if (error) {
      console.error('[BrevoEmail] Edge function error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      console.error('[BrevoEmail] Email send failed:', data?.error);
      return { success: false, error: data?.error || 'Unknown error' };
    }

    console.log(`[BrevoEmail] Email sent successfully: ${options.type}`);
    return { success: true };
  } catch (error: any) {
    console.error('[BrevoEmail] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send login notification email
 */
export async function sendLoginNotificationEmail(
  email: string,
  userName: string
): Promise<void> {
  // Fire and forget - don't await in calling code if not needed
  sendBrevoEmail({
    type: 'login_notification',
    recipientEmail: email,
    recipientName: userName,
    data: { userName },
  }).catch(console.error);
}

/**
 * Send event created notification to organizer
 */
export async function sendEventCreatedEmail(
  organizerEmail: string,
  organizerName: string,
  eventName: string,
  eventDate: string,
  eventId: string
): Promise<void> {
  sendBrevoEmail({
    type: 'event_created',
    recipientEmail: organizerEmail,
    recipientName: organizerName,
    data: {
      organizerName,
      eventName,
      eventDate,
      eventId,
    },
  }).catch(console.error);
}

/**
 * Send event registration confirmation email
 */
export async function sendEventRegistrationEmail(
  userEmail: string,
  userName: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  isPaid: boolean
): Promise<void> {
  sendBrevoEmail({
    type: 'event_registration',
    recipientEmail: userEmail,
    recipientName: userName,
    data: {
      userName,
      eventName,
      eventDate,
      eventLocation,
      isPaid,
    },
  }).catch(console.error);
}

/**
 * Send project partner request email
 */
export async function sendPartnerRequestEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  senderEmail: string,
  projectName: string,
  message?: string
): Promise<void> {
  sendBrevoEmail({
    type: 'partner_request',
    recipientEmail,
    recipientName,
    data: {
      recipientName,
      senderName,
      senderEmail,
      projectName,
      message: message || '',
    },
  }).catch(console.error);
}

/**
 * Send area request email
 */
export async function sendAreaRequestEmail(
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  senderEmail: string,
  projectName?: string,
  message?: string
): Promise<void> {
  sendBrevoEmail({
    type: 'area_request',
    recipientEmail,
    recipientName,
    data: {
      recipientName,
      senderName,
      senderEmail,
      projectName: projectName || '',
      message: message || '',
    },
  }).catch(console.error);
}

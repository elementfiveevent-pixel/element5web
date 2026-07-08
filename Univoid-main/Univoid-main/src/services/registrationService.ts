import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { allowRequest } from "@/lib/rateLimiter";
import { TICKET_STATUS, getInitialPaymentStatus, type TicketStatus } from "@/constants/ticketStatus";

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID
 */
function isValidUUID(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value);
}

/**
 * User-friendly error messages mapping
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Registration errors
  EVENT_NOT_FOUND: "This event doesn't exist or has been removed.",
  EVENT_NOT_PUBLISHED: "This event is not accepting registrations yet.",
  EVENT_FULL: "Sorry, this event is full. No spots available.",
  CONCURRENT_REQUEST: "High traffic detected. Please try again in a moment.",
  ALREADY_REGISTERED: "You're already registered for this event!",
  REGISTRATION_REJECTED: "Your registration for this event was rejected. You cannot re-apply.",
  INVALID_INPUT: "Invalid event or user ID. Please refresh and try again.",

  // Network errors
  NETWORK_ERROR: "Connection lost. Please check your internet and try again.",
  TIMEOUT: "Request timed out. Your registration may still be processing.",

  // Generic errors
  UNKNOWN: "Something went wrong. Please try again in a moment.",

  // Rate limiting
  RATE_LIMITED: "Too many attempts. Please wait a minute before trying again.",
};

export interface RegistrationResult {
  success: boolean;
  registration_id?: string;
  already_registered?: boolean;
  payment_status?: string;
  message: string;
  error?: string;
}

export interface RegistrationRequest {
  event_id: string;
  user_id: string;
  custom_data?: Record<string, unknown>;
  payment_screenshot_url?: string;
  group_size?: number;
  is_group_booking?: boolean;
  // Payment amount fields (extracted from custom_data or passed directly)
  base_amount?: number;
  addons_amount?: number;
  total_amount?: number;
}

/**
 * Retry with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 50
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on these errors
      const errorMessage = lastError.message.toLowerCase();
      if (
        errorMessage.includes('already registered') ||
        errorMessage.includes('unique') ||
        errorMessage.includes('full') ||
        errorMessage.includes('not found')
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Upload payment screenshot with retry
 */
export async function uploadPaymentScreenshot(
  file: File,
  userId: string,
  eventId: string
): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/payments/${eventId}/${Date.now()}.${fileExt}`;

  return withRetry(async () => {
    const { error: uploadError } = await supabase.storage
      .from("event-assets")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Store path only - proxy will generate URLs on-demand (hides Supabase infrastructure)
    const storedPath = `event-assets:${fileName}`;

    return storedPath;
  });
}

/**
 * Register for event with atomic operation (race-condition safe)
 * Uses database function for atomic seat check + registration
 */
export async function registerForEventAtomic(
  request: RegistrationRequest
): Promise<RegistrationResult> {
  // Server-side rate limiting using in-memory token bucket
  if (!allowRequest(request.user_id, 10, 60000)) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: ERROR_MESSAGES.RATE_LIMITED,
    };
  }

  // Validate UUIDs before making RPC call
  if (!isValidUUID(request.event_id) || !isValidUUID(request.user_id)) {
    console.error('Invalid UUID:', { event_id: request.event_id, user_id: request.user_id });
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: ERROR_MESSAGES.INVALID_INPUT,
    };
  }

  try {
    // Try RPC first
    const result = await withRetry(async () => {
      const { data, error } = await supabase.rpc('register_for_event_atomic', {
        p_event_id: request.event_id,
        p_user_id: request.user_id,
        p_custom_data: request.custom_data as Json || null,
        p_payment_screenshot_url: request.payment_screenshot_url || null,
        p_group_size: request.group_size || 1,
        p_is_group_booking: request.is_group_booking || false,
      });

      if (error) {
        // If RPC function not found, use fallback
        if (error.message.includes('not found') || error.code === 'PGRST202') {
          throw new Error('RPC_NOT_FOUND');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          throw new Error('NETWORK_ERROR');
        }
        throw error;
      }

      return data as unknown as RegistrationResult;
    }, 1); // Only 1 retry for RPC

    // Map error codes to user-friendly messages
    if (!result.success && result.error) {
      result.message = ERROR_MESSAGES[result.error] || ERROR_MESSAGES.UNKNOWN;
    }

    return result;
  } catch (error) {
    const err = error as Error;
    
    // If RPC not found, use direct insert fallback
    if (err.message === 'RPC_NOT_FOUND') {
      return await registerForEventFallback(request);
    }

    const errorCode = err.message in ERROR_MESSAGES ? err.message : 'UNKNOWN';

    return {
      success: false,
      error: errorCode,
      message: ERROR_MESSAGES[errorCode],
    };
  }
}

/**
 * Fallback registration using direct database operations
 * Used when RPC function is not available (PostgREST cache issue)
 */
async function registerForEventFallback(
  request: RegistrationRequest
): Promise<RegistrationResult> {
  try {
    // Check if already registered FIRST for idempotency
    const { data: existingReg } = await supabase
      .from('event_registrations')
      .select('id, payment_status')
      .eq('event_id', request.event_id)
      .eq('user_id', request.user_id)
      .maybeSingle();

    if (existingReg) {
      // Block re-registration if previously rejected
      if (existingReg.payment_status === 'rejected') {
        return {
          success: false,
          error: 'REGISTRATION_REJECTED',
          message: ERROR_MESSAGES.REGISTRATION_REJECTED,
        };
      }
      // Already registered - return success (idempotent)
      return {
        success: true,
        registration_id: existingReg.id,
        already_registered: true,
        payment_status: existingReg.payment_status,
        message: "You're already registered for this event!",
      };
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, max_capacity, registrations_count, is_paid, status, registration_end_date')
      .eq('id', request.event_id)
      .single();

    if (eventError || !event) {
      return {
        success: false,
        error: 'EVENT_NOT_FOUND',
        message: ERROR_MESSAGES.EVENT_NOT_FOUND,
      };
    }

    if (event.status !== 'published') {
      return {
        success: false,
        error: 'EVENT_NOT_PUBLISHED',
        message: ERROR_MESSAGES.EVENT_NOT_PUBLISHED,
      };
    }

    // Check capacity
    const groupSize = request.group_size || 1;
    if (event.max_capacity && (event.registrations_count + groupSize) > event.max_capacity) {
      return {
        success: false,
        error: 'EVENT_FULL',
        message: ERROR_MESSAGES.EVENT_FULL,
      };
    }

    // Determine payment status based on event type
    // FREE events are auto-approved, PAID events start as pending
    const paymentStatus = getInitialPaymentStatus(event.is_paid);

    // Extract payment amounts from custom_data or request parameters
    const customData = request.custom_data || {};
    const baseAmount = request.base_amount ?? 
      (typeof customData._base_amount === 'number' ? customData._base_amount : null) ??
      (typeof customData._applied_price === 'number' ? customData._applied_price : null) ??
      (typeof customData._amount === 'number' ? customData._amount : null);
    
    const addonsAmount = request.addons_amount ?? 
      (typeof customData._addons_amount === 'number' ? customData._addons_amount : null);
    
    const totalAmount = request.total_amount ?? 
      (typeof customData._total_amount === 'number' ? customData._total_amount : null);

    // Create registration with proper ENUM value - use upsert pattern for idempotency
    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .upsert({
        event_id: request.event_id,
        user_id: request.user_id,
        custom_data: request.custom_data as Json || null,
        payment_screenshot_url: request.payment_screenshot_url || null,
        payment_status: paymentStatus as TicketStatus,
        group_size: request.group_size || 1,
        is_group_booking: request.is_group_booking || false,
        // Save payment amounts to actual DB columns for accurate reporting
        base_amount: baseAmount,
        addons_amount: addonsAmount ?? 0,
        total_amount: totalAmount,
      }, {
        onConflict: 'event_id,user_id',
        ignoreDuplicates: true,
      })
      .select('id')
      .maybeSingle();

    // If upsert returned no data, check for existing registration
    if (!registration) {
      const { data: existingReg } = await supabase
        .from('event_registrations')
        .select('id, payment_status')
        .eq('event_id', request.event_id)
        .eq('user_id', request.user_id)
        .single();

      if (existingReg) {
        return {
          success: true,
          registration_id: existingReg.id,
          already_registered: true,
          payment_status: existingReg.payment_status,
          message: "You're already registered for this event!",
        };
      }
    }

    if (regError) {
      // Handle unique violation (already registered) - return success
      if (regError.code === '23505') {
        const { data: existingReg } = await supabase
          .from('event_registrations')
          .select('id, payment_status')
          .eq('event_id', request.event_id)
          .eq('user_id', request.user_id)
          .single();

        return {
          success: true,
          registration_id: existingReg?.id,
          already_registered: true,
          payment_status: existingReg?.payment_status,
          message: "You're already registered for this event!",
        };
      }
      throw regError;
    }

    // For free events, create ticket
    if (!event.is_paid && registration) {
      await supabase
        .from('event_tickets')
        .upsert({
          event_id: request.event_id,
          user_id: request.user_id,
          registration_id: registration.id,
          qr_code: crypto.randomUUID() + crypto.randomUUID().replace(/-/g, ''),
          is_used: false,
          is_group_booking: request.is_group_booking || false,
          group_size: request.group_size || 1,
        }, {
          onConflict: 'registration_id',
          ignoreDuplicates: true,
        });
    }

    return {
      success: true,
      registration_id: registration?.id,
      already_registered: false,
      payment_status: paymentStatus,
      message: event.is_paid 
        ? 'Registration submitted! Payment pending verification.'
        : 'Registration confirmed! Your ticket is ready.',
    };
  } catch (error) {
    // Log detailed error for debugging
    const err = error as Error;
    console.error('Registration fallback error:', {
      message: err.message,
      stack: err.stack,
      request: { event_id: request.event_id, user_id: request.user_id }
    });
    
    // Check for unique constraint errors and treat as success
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      const { data: existingReg } = await supabase
        .from('event_registrations')
        .select('id, payment_status')
        .eq('event_id', request.event_id)
        .eq('user_id', request.user_id)
        .maybeSingle();
      
      if (existingReg) {
        return {
          success: true,
          registration_id: existingReg.id,
          already_registered: true,
          payment_status: existingReg.payment_status,
          message: "You're already registered for this event!",
        };
      }
    }
    
    // Return specific error if available
    const errorMessage = err.message?.includes('violates') 
      ? 'Database constraint error. Please try again.'
      : err.message || ERROR_MESSAGES.UNKNOWN;
    
    return {
      success: false,
      error: 'UNKNOWN',
      message: errorMessage,
    };
  }
}

/**
 * Check existing registration (with caching hints for React Query)
 */
export async function checkExistingRegistration(
  eventId: string,
  userId: string
): Promise<{ registered: boolean; status?: string; registrationId?: string }> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, payment_status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      registered: true,
      status: data.payment_status,
      registrationId: data.id,
    };
  }

  return { registered: false };
}

/**
 * Get real-time seat availability
 */
export async function getEventCapacity(eventId: string): Promise<{
  currentCount: number;
  maxCapacity: number | null;
  isFull: boolean;
  spotsRemaining: number | null;
}> {
  const { data, error } = await supabase
    .from('events')
    .select('registrations_count, max_capacity')
    .eq('id', eventId)
    .single();

  if (error) throw error;

  const currentCount = data.registrations_count;
  const maxCapacity = data.max_capacity;
  const isFull = maxCapacity !== null && currentCount >= maxCapacity;
  const spotsRemaining = maxCapacity !== null ? maxCapacity - currentCount : null;

  return { currentCount, maxCapacity, isFull, spotsRemaining };
}

/**
 * Get user-friendly error message for any error
 */
export function getUserFriendlyError(error: unknown): string {
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('failed to fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.TIMEOUT;
    }
    if (message.includes('unique') || message.includes('already registered')) {
      return ERROR_MESSAGES.ALREADY_REGISTERED;
    }
    if (message.includes('full') || message.includes('capacity')) {
      return ERROR_MESSAGES.EVENT_FULL;
    }

    // Check if message matches an error code
    const upperMessage = error.message.toUpperCase();
    if (upperMessage in ERROR_MESSAGES) {
      return ERROR_MESSAGES[upperMessage];
    }

    return error.message;
  }

  return ERROR_MESSAGES.UNKNOWN;
}

import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

type ErrorLevel = 'error' | 'warn' | 'info';

interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  pageRoute?: string;
  componentName?: string;
  metadata?: Record<string, unknown>;
}

// Queue for batching errors (prevents flooding the database)
let errorQueue: ErrorLogData[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL = 3000; // 3 seconds
const MAX_QUEUE_SIZE = 10;
const REQUEST_TIMEOUT = 5000; // 5 second timeout for requests

/**
 * Safely get user ID without throwing - returns null on any error
 */
const safeGetUserId = async (): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const { data } = await supabase.auth.getUser();
    clearTimeout(timeoutId);
    return data?.user?.id || null;
  } catch {
    return null;
  }
};

/**
 * Flush the error queue to the database with full error protection
 * NEVER throws - all errors are caught and ignored
 */
const flushErrorQueue = async (): Promise<void> => {
  if (errorQueue.length === 0) return;
  
  const errorsToLog = [...errorQueue];
  errorQueue = [];
  flushTimeout = null;
  
  try {
    const userId = await safeGetUserId();
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    const pageRoute = typeof window !== 'undefined' ? window.location.pathname : null;
    
    const records = errorsToLog.map(data => ({
      user_id: userId,
      error_type: data.errorType,
      error_message: data.errorMessage?.substring(0, 2000) || 'Unknown error', // Limit message length
      error_stack: data.errorStack?.substring(0, 5000) || null,
      page_route: data.pageRoute || pageRoute,
      component_name: data.componentName || null,
      metadata: (data.metadata as Json) || null,
      user_agent: userAgent,
    }));
    
    // Use Promise.race with timeout to prevent hanging
    const insertPromise = supabase.from('error_logs').insert(records);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), REQUEST_TIMEOUT)
    );
    
    await Promise.race([insertPromise, timeoutPromise]);
  } catch {
    // Silently fail - NEVER throw during error logging
    // This handles:
    // - 401 Unauthorized (RLS blocking)
    // - Network errors
    // - Timeouts
    // - Any other failures
  }
};

/**
 * Schedule a flush of the error queue
 */
const scheduleFlush = (): void => {
  if (flushTimeout) return;
  
  if (errorQueue.length >= MAX_QUEUE_SIZE) {
    // Fire and forget - don't await
    flushErrorQueue().catch(() => {});
  } else {
    flushTimeout = setTimeout(() => {
      flushErrorQueue().catch(() => {});
    }, FLUSH_INTERVAL);
  }
};

/**
 * Log an error to the database (batched)
 * SAFE: Never throws, never blocks UI
 */
export const logError = async (data: ErrorLogData): Promise<void> => {
  try {
    errorQueue.push(data);
    scheduleFlush();
  } catch {
    // Completely silent - error logging must never crash the app
  }
};

/**
 * Immediately log an error (bypasses queue for critical errors)
 * SAFE: Never throws, has timeout protection
 */
export const logErrorImmediate = async (data: ErrorLogData): Promise<void> => {
  try {
    const userId = await safeGetUserId();
    
    const insertPromise = supabase.from('error_logs').insert([{
      user_id: userId,
      error_type: data.errorType,
      error_message: data.errorMessage?.substring(0, 2000) || 'Unknown error',
      error_stack: data.errorStack?.substring(0, 5000) || null,
      page_route: data.pageRoute || (typeof window !== 'undefined' ? window.location.pathname : null),
      component_name: data.componentName || null,
      metadata: (data.metadata as Json) || null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }]);
    
    // Timeout protection
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), REQUEST_TIMEOUT)
    );
    
    await Promise.race([insertPromise, timeoutPromise]);
  } catch {
    // Silently fail - handles 401, network errors, timeouts, etc.
  }
};

/**
 * Create a logger instance for a specific component/service
 */
export const createLogger = (componentName: string) => {
  const log = (level: ErrorLevel, message: string, error?: Error | unknown, metadata?: Record<string, unknown>) => {
    try {
      const errorObj = error instanceof Error ? error : null;
      
      // Fire and forget - don't await, don't block
      logError({
        errorType: `${componentName}_${level}`,
        errorMessage: message,
        errorStack: errorObj?.stack,
        componentName,
        metadata: {
          ...metadata,
          originalError: errorObj ? undefined : String(error),
        },
      }).catch(() => {});
    } catch {
      // Silent fail
    }
  };
  
  return {
    error: (message: string, error?: Error | unknown, metadata?: Record<string, unknown>) => 
      log('error', message, error, metadata),
    warn: (message: string, error?: Error | unknown, metadata?: Record<string, unknown>) => 
      log('warn', message, error, metadata),
    info: (message: string, metadata?: Record<string, unknown>) => 
      log('info', message, undefined, metadata),
  };
};

/**
 * Pre-configured loggers for common services
 */
export const authLogger = createLogger('AuthContext');
export const materialsLogger = createLogger('MaterialsService');
export const eventsLogger = createLogger('EventsService');

/**
 * Legacy function for admin page errors
 */
export const logAdminError = async (
  errorMessage: string,
  error?: Error,
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    await logErrorImmediate({
      errorType: 'admin_page_error',
      errorMessage,
      errorStack: error?.stack,
      pageRoute: '/admin',
      componentName: 'Admin',
      metadata,
    });
  } catch {
    // Silent fail
  }
};

/**
 * Global error handler for uncaught errors
 * SAFE: All handlers are wrapped in try-catch
 */
export const setupGlobalErrorHandler = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    window.addEventListener('error', (event) => {
      try {
        logError({
          errorType: 'uncaught_error',
          errorMessage: event.message || 'Unknown error',
          errorStack: event.error?.stack,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        }).catch(() => {});
      } catch {
        // Silent fail
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      try {
        const error = event.reason;
        logError({
          errorType: 'unhandled_promise_rejection',
          errorMessage: error?.message || String(error) || 'Unknown rejection',
          errorStack: error?.stack,
        }).catch(() => {});
      } catch {
        // Silent fail
      }
    });
  } catch {
    // Silent fail - global handler setup must never crash
  }
};

// Flush any remaining errors before page unload
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('beforeunload', () => {
      try {
        if (errorQueue.length > 0) {
          // Use sendBeacon for reliability during page unload
          const payload = JSON.stringify(errorQueue);
          navigator.sendBeacon?.('/api/log-errors', payload);
        }
      } catch {
        // Silent fail
      }
    });
  } catch {
    // Silent fail
  }
}

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './useDebounce';

interface UseMobileValidationOptions {
  excludeUserId?: string;
}

export const useMobileValidation = (options: UseMobileValidationOptions = {}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const normalizeMobile = useCallback((mobile: string): string => {
    // Remove all non-digit characters and trim
    return mobile.replace(/\D/g, '').trim();
  }, []);

  const isValidFormat = useCallback((mobile: string): boolean => {
    const normalized = normalizeMobile(mobile);
    // Indian mobile number: 10 digits starting with 6-9
    return /^[6-9]\d{9}$/.test(normalized);
  }, [normalizeMobile]);

  const checkMobileExists = useCallback(async (mobile: string): Promise<boolean> => {
    const normalized = normalizeMobile(mobile);
    
    // Skip if not valid format or empty
    if (!normalized || normalized.length !== 10) {
      setIsDuplicate(false);
      return false;
    }

    // Skip if already checked this number
    if (normalized === lastChecked) {
      return isDuplicate;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_mobile_exists', {
        p_mobile: normalized,
        p_exclude_user_id: options.excludeUserId || null
      });

      if (error) {
        console.error('Error checking mobile:', error);
        setIsDuplicate(false);
        return false;
      }

      const exists = data === true;
      setIsDuplicate(exists);
      setLastChecked(normalized);
      return exists;
    } catch (err) {
      console.error('Mobile check failed:', err);
      setIsDuplicate(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [normalizeMobile, options.excludeUserId, lastChecked, isDuplicate]);

  const reset = useCallback(() => {
    setIsDuplicate(false);
    setLastChecked(null);
    setIsChecking(false);
  }, []);

  return {
    isChecking,
    isDuplicate,
    isValidFormat,
    normalizeMobile,
    checkMobileExists,
    reset
  };
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'onboarding_draft';
const AUTO_SAVE_DELAY = 3000; // 3 seconds

export interface OnboardingFormData {
  full_name: string;
  mobile_number: string;
  college_name: string;
  college_id: string;
  is_custom_college: boolean;
  degree: string;
  branch: string;
  branch_id: string;
  current_year: string;
  city: string;
  city_id: string;
  state: string;
  state_id: string;
  interests: string[];
  customDegree?: string;
}

const getDefaultFormData = (profile?: any, user?: any): OnboardingFormData => ({
  full_name: profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "",
  mobile_number: profile?.mobile_number || "",
  college_name: profile?.college_name || "",
  college_id: "",
  is_custom_college: false,
  degree: "",
  branch: profile?.course_stream || "",
  branch_id: "",
  current_year: "",
  city: profile?.city || "",
  city_id: profile?.city || "",
  state: profile?.state || "",
  state_id: profile?.state || "",
  interests: [],
  customDegree: "",
});

export function useOnboardingDraft(profile?: any, user?: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<OnboardingFormData>(() => getDefaultFormData(profile, user));
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        // Check if draft has meaningful data
        const hasData = parsed.full_name || parsed.college_name || parsed.degree || 
                        parsed.city || parsed.interests?.length > 0;
        
        if (hasData) {
          // Merge with profile data (profile data takes precedence for identity fields)
          setFormData({
            ...parsed,
            full_name: profile?.full_name || parsed.full_name || "",
            mobile_number: profile?.mobile_number || parsed.mobile_number || "",
          });
          setHasRestoredDraft(true);
          toast({
            title: "Progress Restored",
            description: "We restored your previous progress.",
          });
        }
      }
    } catch (error) {
      console.error('Failed to restore draft:', error);
    }
    isFirstRender.current = false;
  }, []);

  // Update form data when profile changes (for identity fields only)
  useEffect(() => {
    if (profile && isFirstRender.current === false) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || prev.full_name,
        mobile_number: profile.mobile_number || prev.mobile_number,
      }));
    }
  }, [profile?.full_name, profile?.mobile_number]);

  // Auto-save to localStorage with debounce
  const saveDraft = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [formData]);

  // Debounced auto-save on form changes
  useEffect(() => {
    if (isFirstRender.current) return;
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft();
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, saveDraft]);

  // Clear draft after successful submission
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Update a single field
  const updateField = useCallback(<K extends keyof OnboardingFormData>(
    field: K,
    value: OnboardingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update multiple fields
  const updateFields = useCallback((updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle interest
  const toggleInterest = useCallback((interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  }, []);

  // Add custom interest
  const addInterest = useCallback((interest: string) => {
    const trimmed = interest.trim();
    if (trimmed && !formData.interests.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, trimmed],
      }));
    }
  }, [formData.interests]);

  // Remove interest
  const removeInterest = useCallback((interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest),
    }));
  }, []);

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    toggleInterest,
    addInterest,
    removeInterest,
    clearDraft,
    hasRestoredDraft,
  };
}

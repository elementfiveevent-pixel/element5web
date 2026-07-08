import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { hasOrganizerProfile, getOrganizerProfile, type OrganizerProfile } from "@/services/organizerService";

export function useOrganizerProfile() {
  const { user, isOrganizer } = useAuth();
  const queryClient = useQueryClient();
  
  // Check if user has organizer profile
  const { data: hasProfile, isLoading: checkingProfile, refetch: refetchHasProfile } = useQuery({
    queryKey: ['hasOrganizerProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const result = await hasOrganizerProfile(user.id);
      console.log('[useOrganizerProfile] hasProfile check:', result, 'for user:', user.id);
      return result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Reduced to 2 minutes for faster updates
    gcTime: 1000 * 60 * 10,
    // Refetch when window regains focus to catch recent changes
    refetchOnWindowFocus: true,
  });
  
  // Fetch full profile if user has one (or is already marked as organizer in AuthContext)
  const { data: profile, isLoading: loadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['organizerProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const result = await getOrganizerProfile(user.id);
      console.log('[useOrganizerProfile] profile fetch:', result?.name || 'null');
      return result;
    },
    // Enable if hasProfile is true OR if user is already marked as organizer
    enabled: !!user?.id && (hasProfile === true || isOrganizer === true),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
  });
  
  // Invalidate and refetch profile data
  const invalidateProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['hasOrganizerProfile', user?.id] });
    await queryClient.invalidateQueries({ queryKey: ['organizerProfile', user?.id] });
    await refetchHasProfile();
    await refetchProfile();
  };
  
  return {
    hasProfile: hasProfile ?? isOrganizer ?? false,
    profile: profile ?? null,
    isLoading: checkingProfile || loadingProfile,
    checkingProfile,
    loadingProfile,
    invalidateProfile,
    refetchHasProfile,
    refetchProfile,
  };
}

export function useRequireOrganizerProfile() {
  const { hasProfile, isLoading, invalidateProfile } = useOrganizerProfile();
  
  return {
    hasProfile,
    isLoading,
    shouldRedirectToOnboarding: !isLoading && !hasProfile,
    invalidateProfile,
  };
}

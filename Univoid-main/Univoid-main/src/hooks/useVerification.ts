import { useAuth } from '@/contexts/AuthContext';

export interface VerificationStatus {
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  canUpload: boolean;
  canDownload: boolean;
  canContact: boolean;
}

export function useVerification(): VerificationStatus {
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return {
      isVerified: false,
      emailVerified: false,
      phoneVerified: false,
      canUpload: false,
      canDownload: false,
      canContact: false,
    };
  }

  // OAuth users (Google, etc.) are trusted and verified by default
  // Check BOTH app_metadata.provider AND identities array for reliability
  const provider = user.app_metadata?.provider;
  const isOAuthUser = (provider && provider !== 'email') || 
    (user.identities?.some((identity: any) => identity.provider && identity.provider !== 'email'));
  
  // Check if email is confirmed via Supabase auth
  const supabaseEmailConfirmed = user.email_confirmed_at !== null;
  
  // User is verified if: OAuth provider OR email confirmed OR phone verified
  const emailVerified = isOAuthUser || supabaseEmailConfirmed || (profile as any).email_verified === true;
  const phoneVerified = (profile as any).phone_verified === true;
  
  const isVerified = emailVerified || phoneVerified;

  return {
    isVerified,
    emailVerified,
    phoneVerified,
    canUpload: isVerified,
    canDownload: isVerified,
    canContact: isVerified,
  };
}

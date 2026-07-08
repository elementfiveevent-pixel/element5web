import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EngagementState {
  views: number;
  downloads: number;
  likes: number;
  shares: number;
  hasLiked: boolean;
}

export function useMaterialEngagement(materialId: string, initialState?: Partial<EngagementState>) {
  const { user } = useAuth();
  const [state, setState] = useState<EngagementState>({
    views: initialState?.views || 0,
    downloads: initialState?.downloads || 0,
    likes: initialState?.likes || 0,
    shares: initialState?.shares || 0,
    hasLiked: initialState?.hasLiked || false,
  });
  const [isLiking, setIsLiking] = useState(false);

  // Check if user has liked on mount
  useEffect(() => {
    if (user && materialId) {
      checkUserLike();
    }
  }, [user, materialId]);

  const checkUserLike = async () => {
    if (!user) return;
    
    const { data } = await supabase.rpc('user_has_liked_material', {
      p_material_id: materialId,
    });
    
    if (data !== null) {
      setState(prev => ({ ...prev, hasLiked: data }));
    }
  };

  const incrementViews = useCallback(async () => {
    try {
      await supabase.rpc('increment_material_views', { material_id: materialId });
      setState(prev => ({ ...prev, views: prev.views + 1 }));
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  }, [materialId]);

  const incrementDownloads = useCallback(async () => {
    if (!user) return;
    
    try {
      await supabase.rpc('increment_material_downloads', { material_id: materialId });
      setState(prev => ({ ...prev, downloads: prev.downloads + 1 }));
    } catch (error) {
      console.error('Failed to increment downloads:', error);
    }
  }, [materialId, user]);

  const toggleLike = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to like materials');
      return false;
    }

    if (isLiking) return state.hasLiked;
    
    setIsLiking(true);
    
    try {
      const { data: newLikeState, error } = await supabase.rpc('toggle_material_like', {
        p_material_id: materialId,
      });
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        hasLiked: newLikeState,
        likes: newLikeState ? prev.likes + 1 : Math.max(0, prev.likes - 1),
      }));
      
      return newLikeState;
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
      return state.hasLiked;
    } finally {
      setIsLiking(false);
    }
  }, [materialId, user, isLiking, state.hasLiked]);

  const incrementShares = useCallback(async () => {
    try {
      await supabase.rpc('increment_material_shares', { material_id: materialId });
      setState(prev => ({ ...prev, shares: prev.shares + 1 }));
    } catch (error) {
      console.error('Failed to increment shares:', error);
    }
  }, [materialId]);

  return {
    ...state,
    isLiking,
    incrementViews,
    incrementDownloads,
    toggleLike,
    incrementShares,
    updateState: setState,
  };
}
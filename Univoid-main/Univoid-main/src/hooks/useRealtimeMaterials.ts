import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Material } from '@/types/database';
import { getMaterialsPaginated } from '@/services/paginatedService';
import { CACHE_TTL } from './useOptimizedFetch';

// Global cache for materials
const materialsCache = {
  data: [] as Material[],
  timestamp: 0,
  hasMore: true,
};

interface UseRealtimeMaterialsResult {
  materials: Material[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  addOptimistic: (material: Partial<Material>) => void;
  refetch: () => Promise<void>;
}

/**
 * Real-time materials hook with optimistic updates
 * No refresh needed - materials appear instantly
 */
export function useRealtimeMaterials(
  batchSize: number = 15,
  filters?: {
    search?: string;
    course?: string;
    branch?: string;
    subject?: string;
    language?: string;
    college?: string;
  }
): UseRealtimeMaterialsResult {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Check if using filters (filters invalidate cache)
  const hasFilters = filters && Object.values(filters).some(v => v);

  const fetchMaterials = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    // Use cache for initial load without filters
    if (!hasFilters && pageNum === 0 && !append) {
      const cacheValid = Date.now() - materialsCache.timestamp < CACHE_TTL.LONG;
      if (cacheValid && materialsCache.data.length > 0) {
        if (isMounted.current) {
          setMaterials(materialsCache.data);
          setHasMore(materialsCache.hasMore);
          setIsLoading(false);
        }
        return;
      }
    }

    try {
      const result = await getMaterialsPaginated(pageNum, batchSize, filters);
      
      if (isMounted.current) {
        if (append) {
          setMaterials(prev => [...prev, ...result.data]);
        } else {
          setMaterials(result.data);
          // Update cache
          if (!hasFilters) {
            materialsCache.data = result.data;
            materialsCache.timestamp = Date.now();
            materialsCache.hasMore = result.hasMore;
          }
        }
        setHasMore(result.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [batchSize, filters, hasFilters]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    await fetchMaterials(page + 1, true);
  }, [hasMore, isLoading, page, fetchMaterials]);

  // Optimistic add for uploads
  const addOptimistic = useCallback((material: Partial<Material>) => {
    const optimisticMaterial: Material = {
      id: `temp-${Date.now()}`,
      title: material.title || 'Uploading...',
      description: material.description || '',
      file_url: '',
      file_type: material.file_type || 'pdf',
      file_size: material.file_size || 0,
      created_by: material.created_by || '',
      status: 'pending',
      views_count: 0,
      downloads_count: 0,
      likes_count: 0,
      shares_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      contributor_name: 'You',
      ...material,
    } as Material;

    setMaterials(prev => [optimisticMaterial, ...prev]);
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    materialsCache.timestamp = 0; // Invalidate cache
    await fetchMaterials(0, false);
  }, [fetchMaterials]);

  useEffect(() => {
    isMounted.current = true;
    fetchMaterials();

    // Real-time subscription for materials changes
    channelRef.current = supabase
      .channel('materials-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'materials' },
        (payload) => {
          const newMaterial = payload.new as Material;
          // Only add approved materials to public view
          if (newMaterial.status === 'approved') {
            setMaterials(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMaterial.id)) return prev;
              return [newMaterial, ...prev];
            });
            // Update cache
            materialsCache.data = [newMaterial, ...materialsCache.data];
            materialsCache.timestamp = Date.now();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'materials' },
        (payload) => {
          const updated = payload.new as Material;
          
          if (updated.status === 'approved') {
            // Material is approved - add if not in list, update if already there
            setMaterials(prev => {
              if (prev.some(m => m.id === updated.id)) {
                return prev.map(m => m.id === updated.id ? { ...m, ...updated } : m);
              }
              return [updated, ...prev];
            });
            // Update cache
            if (!materialsCache.data.some(m => m.id === updated.id)) {
              materialsCache.data = [updated, ...materialsCache.data];
            } else {
              materialsCache.data = materialsCache.data.map(m =>
                m.id === updated.id ? { ...m, ...updated } : m
              );
            }
          } else if (updated.status === 'rejected' || updated.status === 'pending') {
            // Only remove if status is EXPLICITLY set to rejected/pending
            setMaterials(prev => prev.filter(m => m.id !== updated.id));
            materialsCache.data = materialsCache.data.filter(m => m.id !== updated.id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'materials' },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMaterials(prev => prev.filter(m => m.id !== deleted.id));
          materialsCache.data = materialsCache.data.filter(m => m.id !== deleted.id);
        }
      )
      .subscribe();

    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchMaterials]);

  return { materials, isLoading, hasMore, loadMore, addOptimistic, refetch };
}

// Clear materials cache globally
export function clearMaterialsCache() {
  materialsCache.data = [];
  materialsCache.timestamp = 0;
  materialsCache.hasMore = true;
}

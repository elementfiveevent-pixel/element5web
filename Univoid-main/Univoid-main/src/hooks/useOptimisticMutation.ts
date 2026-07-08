import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface OptimisticMutationOptions<T, R> {
  mutationFn: (data: T) => Promise<R>;
  onOptimisticUpdate?: (data: T) => void;
  onSuccess?: (result: R, data: T) => void;
  onError?: (error: Error, data: T) => void;
  onRollback?: (data: T) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface OptimisticMutationResult<T, R> {
  mutate: (data: T) => Promise<R | null>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for optimistic mutations with automatic rollback
 * Updates UI immediately, rolls back on error
 */
export function useOptimisticMutation<T, R = unknown>(
  options: OptimisticMutationOptions<T, R>
): OptimisticMutationResult<T, R> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: T): Promise<R | null> => {
    setIsLoading(true);
    setError(null);

    // Apply optimistic update immediately
    try {
      options.onOptimisticUpdate?.(data);
    } catch (e) {
      console.error('Optimistic update failed:', e);
    }

    try {
      const result = await options.mutationFn(data);
      
      options.onSuccess?.(result, data);
      
      if (options.successMessage) {
        toast.success(options.successMessage);
      }
      
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      // Rollback on error
      options.onRollback?.(data);
      options.onError?.(error, data);
      
      if (options.errorMessage) {
        toast.error(options.errorMessage);
      } else {
        toast.error(error.message || 'Operation failed');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  return { mutate, isLoading, error };
}

/**
 * Helper to create optimistic list updates
 */
export function createOptimisticListUpdate<T extends { id: string }>(
  setList: React.Dispatch<React.SetStateAction<T[]>>
) {
  return {
    add: (item: T) => {
      setList(prev => [item, ...prev]);
    },
    update: (id: string, updates: Partial<T>) => {
      setList(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    },
    remove: (id: string) => {
      setList(prev => prev.filter(item => item.id !== id));
    },
    // For rollback - restore original item
    restore: (originalItem: T) => {
      setList(prev => {
        const exists = prev.some(item => item.id === originalItem.id);
        if (exists) {
          return prev.map(item => 
            item.id === originalItem.id ? originalItem : item
          );
        }
        return [originalItem, ...prev];
      });
    },
  };
}

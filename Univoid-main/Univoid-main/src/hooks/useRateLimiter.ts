import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseRateLimiterOptions {
    key: string;
    limit: number; // Number of attempts allowed
    window: number; // Time window in milliseconds
    message?: string;
}

export function useRateLimiter({ key, limit, window, message }: UseRateLimiterOptions) {
    const { toast } = useToast();
    const [attempts, setAttempts] = useState<number>(() => {
        const stored = sessionStorage.getItem(`rl_${key}`);
        if (stored) {
            const { count, startTime } = JSON.parse(stored);
            if (Date.now() - startTime < window) {
                return count;
            }
        }
        return 0;
    });

    const checkLimit = useCallback((): boolean => {
        const now = Date.now();
        const stored = sessionStorage.getItem(`rl_${key}`);
        let currentAttempts = 0;
        let startTime = now;

        if (stored) {
            const data = JSON.parse(stored);
            if (now - data.startTime < window) {
                currentAttempts = data.count;
                startTime = data.startTime;
            }
        }

        if (currentAttempts >= limit) {
            const remainingTime = Math.ceil((window - (now - startTime)) / 1000);
            toast({
                title: "Too many attempts",
                description: message || `Please wait ${remainingTime} seconds before trying again.`,
                variant: "destructive",
            });
            return false;
        }

        const newAttempts = currentAttempts + 1;
        setAttempts(newAttempts);
        sessionStorage.setItem(`rl_${key}`, JSON.stringify({ count: newAttempts, startTime }));
        return true;
    }, [key, limit, window, message, toast]);

    const resetLimit = useCallback(() => {
        sessionStorage.removeItem(`rl_${key}`);
        setAttempts(0);
    }, [key]);

    return { checkLimit, resetLimit, attempts };
}

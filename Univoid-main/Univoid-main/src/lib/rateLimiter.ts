// src/lib/rateLimiter.ts
// Simple in-memory token bucket rate limiter for Supabase Edge Functions.
// Note: In production, replace with a distributed store (e.g., Redis) for consistency across instances.

interface Bucket {
    tokens: number;
    lastRefill: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Returns true if the request is allowed, false otherwise.
 * @param key Unique identifier for the user (e.g., user ID or IP).
 * @param limit Maximum number of requests per window.
 * @param windowMs Time window in milliseconds.
 */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const bucket = buckets.get(key) ?? { tokens: limit, lastRefill: now };
    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    const refillTokens = Math.floor((elapsed / windowMs) * limit);
    if (refillTokens > 0) {
        bucket.tokens = Math.min(limit, bucket.tokens + refillTokens);
        bucket.lastRefill = now;
    }
    if (bucket.tokens > 0) {
        bucket.tokens -= 1;
        buckets.set(key, bucket);
        return true;
    }
    // No tokens left
    buckets.set(key, bucket);
    return false;
}

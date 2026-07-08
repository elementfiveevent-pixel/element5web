import { Link, LinkProps } from "react-router-dom";
import { useCallback, useEffect, useRef, memo } from "react";

// Network Information API types
interface NetworkInformation {
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  saveData?: boolean;
  downlink?: number;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

// Check if prefetching should be allowed based on network conditions
const shouldPrefetch = (): boolean => {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return true; // No API support, allow prefetching
  
  // Disable on data saver mode
  if (connection.saveData) return false;
  
  // Disable on slow connections (2g or slower)
  if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
    return false;
  }
  
  // Disable if downlink is very low (less than 0.5 Mbps)
  if (connection.downlink !== undefined && connection.downlink < 0.5) {
    return false;
  }
  
  return true;
};

// Map routes to their lazy import functions
const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Index"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/materials": () => import("@/pages/Materials"),
  "/events": () => import("@/pages/Events"),
  "/projects": () => import("@/pages/Projects"),
  "/books": () => import("@/pages/Books"),
  "/leaderboard": () => import("@/pages/Leaderboard"),
  "/profile": () => import("@/pages/Profile"),
  "/settings": () => import("@/pages/Settings"),
  "/my-events": () => import("@/pages/MyTickets"),
  "/upload-material": () => import("@/pages/UploadMaterial"),
  "/sell-book": () => import("@/pages/ListBook"),
  "/projects/create": () => import("@/pages/CreateProject"),
  "/become-organizer": () => import("@/pages/BecomeOrganizer"),
  "/contact": () => import("@/pages/Contact"),
};

// Track what's already been preloaded
const preloadedRoutes = new Set<string>();

// Shared IntersectionObserver for all PrefetchLinks
let sharedObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, string>();

const getSharedObserver = () => {
  if (!sharedObserver && typeof IntersectionObserver !== "undefined") {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        // Skip if network conditions are poor
        if (!shouldPrefetch()) return;
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const path = observedElements.get(entry.target);
            if (path && routePreloaders[path] && !preloadedRoutes.has(path)) {
              preloadedRoutes.add(path);
              // Use requestIdleCallback for non-blocking preload
              if ("requestIdleCallback" in window) {
                (window as any).requestIdleCallback(
                  () => routePreloaders[path]?.(),
                  { timeout: 2000 }
                );
              } else {
                setTimeout(() => routePreloaders[path]?.(), 100);
              }
            }
            // Unobserve after preloading
            sharedObserver?.unobserve(entry.target);
            observedElements.delete(entry.target);
          }
        });
      },
      {
        // Start prefetching when link is 200px from viewport
        rootMargin: "200px",
        threshold: 0,
      }
    );
  }
  return sharedObserver;
};

/**
 * PrefetchLink - Link component that preloads the destination page
 * - On intersection: preloads when link comes into view
 * - On hover/focus: immediate preload for instant navigation
 */
export const PrefetchLink = memo(function PrefetchLink({
  to,
  children,
  onMouseEnter,
  onFocus,
  ...props
}: LinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  // Extract base path for preloading
  const getBasePath = useCallback(() => {
    const path = typeof to === "string" ? to : to.pathname || "";
    return path.split("/").slice(0, 2).join("/") || path;
  }, [to]);

  // Set up intersection observer
  useEffect(() => {
    const element = linkRef.current;
    const basePath = getBasePath();
    const observer = getSharedObserver();

    if (element && observer && routePreloaders[basePath] && !preloadedRoutes.has(basePath)) {
      observedElements.set(element, basePath);
      observer.observe(element);

      return () => {
        observer.unobserve(element);
        observedElements.delete(element);
      };
    }
  }, [getBasePath]);

  const prefetch = useCallback(() => {
    // Skip if network conditions are poor
    if (!shouldPrefetch()) return;
    
    const basePath = getBasePath();
    
    if (routePreloaders[basePath] && !preloadedRoutes.has(basePath)) {
      preloadedRoutes.add(basePath);
      routePreloaders[basePath]?.();
    }
  }, [getBasePath]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      prefetch();
      onMouseEnter?.(e);
    },
    [prefetch, onMouseEnter]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      prefetch();
      onFocus?.(e);
    },
    [prefetch, onFocus]
  );

  return (
    <Link
      ref={linkRef}
      to={to}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
});

export default PrefetchLink;

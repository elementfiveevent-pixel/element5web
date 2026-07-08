import { useState, useEffect, useMemo } from 'react';

interface DeviceCapability {
  isLowEnd: boolean;
  isMidRange: boolean;
  isHighEnd: boolean;
  shouldReduceMotion: boolean;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  connectionType: string | null;
  isSlowConnection: boolean;
}

/**
 * Detect device capabilities for adaptive performance optimization
 * - Detects low-end devices without removing animations
 * - Adjusts JS workload, not visual quality
 */
export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>(() => getInitialCapability());

  useEffect(() => {
    // Update on connection change
    const connection = (navigator as any).connection;
    
    const updateConnection = () => {
      setCapability(prev => ({
        ...prev,
        connectionType: connection?.effectiveType || null,
        isSlowConnection: ['slow-2g', '2g', '3g'].includes(connection?.effectiveType || ''),
      }));
    };

    if (connection) {
      connection.addEventListener('change', updateConnection);
      return () => connection.removeEventListener('change', updateConnection);
    }
  }, []);

  return capability;
}

function getInitialCapability(): DeviceCapability {
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || null;
  const connection = (navigator as any).connection;
  const connectionType = connection?.effectiveType || null;
  
  // Determine device tier
  const isLowEnd = 
    hardwareConcurrency <= 4 || 
    (deviceMemory !== null && deviceMemory <= 4) ||
    ['slow-2g', '2g'].includes(connectionType || '');
    
  const isHighEnd = 
    hardwareConcurrency >= 8 && 
    (deviceMemory === null || deviceMemory >= 8);
    
  const isMidRange = !isLowEnd && !isHighEnd;

  // Check for reduced motion preference (CSS handles this, we just detect)
  const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isSlowConnection = ['slow-2g', '2g', '3g'].includes(connectionType || '');

  return {
    isLowEnd,
    isMidRange,
    isHighEnd,
    shouldReduceMotion,
    hardwareConcurrency,
    deviceMemory,
    connectionType,
    isSlowConnection,
  };
}

/**
 * Get recommended batch size based on device capability
 */
export function useOptimalBatchSize(
  defaultSize: number = 15,
  minSize: number = 6,
  maxSize: number = 24
): number {
  const { isLowEnd, isHighEnd } = useDeviceCapability();
  
  return useMemo(() => {
    if (isLowEnd) return minSize;
    if (isHighEnd) return maxSize;
    return defaultSize;
  }, [isLowEnd, isHighEnd, defaultSize, minSize, maxSize]);
}

/**
 * Schedule non-critical work during idle time
 */
export function scheduleIdleWork(callback: () => void, timeout: number = 1000): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 16); // Next frame fallback
  }
}

/**
 * Defer work to after first content paint
 */
export function deferAfterPaint(callback: () => void): void {
  requestAnimationFrame(() => {
    // Double RAF ensures we're past the paint
    requestAnimationFrame(callback);
  });
}

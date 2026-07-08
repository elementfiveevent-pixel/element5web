import { useCallback, useRef, useEffect, useState } from 'react';

const NOTIFICATION_SOUND_KEY = 'notification_sound_enabled';

// Generate a subtle notification sound using Web Audio API
const createNotificationSound = (): AudioContext | null => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return null;
    return new AudioContext();
  } catch {
    return null;
  }
};

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SOUND_KEY, String(isSoundEnabled));
  }, [isSoundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (!isSoundEnabled) return;

    try {
      // Initialize audio context on first use (must be after user interaction)
      if (!audioContextRef.current) {
        audioContextRef.current = createNotificationSound();
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;

      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Create a pleasant, subtle two-tone chime
      const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        // Smooth envelope for natural sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play a pleasant two-note chime (D5 and A5)
      playTone(587.33, now, 0.15, 0.08); // D5
      playTone(880, now + 0.08, 0.2, 0.06); // A5
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, [isSoundEnabled]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => !prev);
  }, []);

  return {
    playNotificationSound,
    isSoundEnabled,
    toggleSound,
    setIsSoundEnabled
  };
};

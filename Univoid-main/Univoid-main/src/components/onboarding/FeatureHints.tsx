import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HintConfig {
  id: string;
  element: string;
  label: string;
  delay: number;
  duration: number;
}

// Key features to highlight with hints
const featureHints: HintConfig[] = [
  { id: "materials", element: "#mobile-nav-materials, #nav-materials", label: "Study Materials", delay: 0, duration: 5000 },
  { id: "scholarships", element: "#mobile-nav-scholarships, #nav-scholarships", label: "Scholarships", delay: 1000, duration: 5000 },
  { id: "events", element: "#mobile-nav-events, #nav-events", label: "Events", delay: 2000, duration: 5000 },
];

// Inject pulse animation styles
const injectPulseStyles = () => {
  const styleId = "feature-hint-styles";
  if (document.getElementById(styleId)) return;

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes feature-pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 hsl(var(--primary) / 0.7);
      }
      50% {
        box-shadow: 0 0 0 8px hsl(var(--primary) / 0);
      }
    }
    
    @keyframes feature-glow {
      0%, 100% {
        filter: brightness(1);
      }
      50% {
        filter: brightness(1.2);
      }
    }
    
    .feature-hint-pulse {
      animation: feature-pulse 1.5s ease-in-out infinite, feature-glow 1.5s ease-in-out infinite;
      position: relative;
      z-index: 10;
    }
    
    .feature-hint-pulse::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: inherit;
      border: 2px solid hsl(var(--primary));
      opacity: 0.5;
      animation: feature-pulse 1.5s ease-in-out infinite;
      pointer-events: none;
    }
    
    .feature-hint-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 9999px;
      white-space: nowrap;
      z-index: 11;
      animation: fade-in 0.3s ease-out;
      box-shadow: 0 2px 8px hsl(var(--primary) / 0.4);
    }
    
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

export function FeatureHints() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [activeHints, setActiveHints] = useState<Set<string>>(new Set());

  const shouldShowHints = useCallback(() => {
    if (!user) return false;
    
    // Check if tour was completed
    const tourSeen = localStorage.getItem(`onboarding_tour_seen_${user.id}`);
    if (tourSeen === "true") return false;
    
    // Check if hints were already shown
    const hintsShown = localStorage.getItem(`feature_hints_shown_${user.id}`);
    if (hintsShown === "true") return false;
    
    // Check if profile is complete (user finished onboarding)
    if (!profile?.profile_complete) return false;
    
    return true;
  }, [user, profile]);

  const markHintsAsShown = useCallback(() => {
    if (!user) return;
    localStorage.setItem(`feature_hints_shown_${user.id}`, "true");
  }, [user]);

  const applyHintToElement = useCallback((selector: string, show: boolean) => {
    // Handle multiple selectors separated by comma
    const selectors = selector.split(",").map(s => s.trim());
    
    selectors.forEach(sel => {
      const element = document.querySelector(sel);
      if (element) {
        if (show) {
          element.classList.add("feature-hint-pulse");
        } else {
          element.classList.remove("feature-hint-pulse");
        }
      }
    });
  }, []);

  useEffect(() => {
    // Only show hints on dashboard
    if (location.pathname !== "/dashboard") return;
    if (!shouldShowHints()) return;

    injectPulseStyles();

    const timers: NodeJS.Timeout[] = [];
    
    // Stagger the hint animations
    featureHints.forEach((hint) => {
      // Show hint after delay
      const showTimer = setTimeout(() => {
        applyHintToElement(hint.element, true);
        setActiveHints(prev => new Set(prev).add(hint.id));
      }, hint.delay + 2000); // Extra 2s initial delay
      
      // Hide hint after duration
      const hideTimer = setTimeout(() => {
        applyHintToElement(hint.element, false);
        setActiveHints(prev => {
          const next = new Set(prev);
          next.delete(hint.id);
          return next;
        });
      }, hint.delay + hint.duration + 2000);
      
      timers.push(showTimer, hideTimer);
    });

    // Mark hints as shown after all hints complete
    const totalDuration = Math.max(...featureHints.map(h => h.delay + h.duration)) + 2500;
    const completeTimer = setTimeout(() => {
      markHintsAsShown();
    }, totalDuration);
    timers.push(completeTimer);

    // Cleanup on user interaction
    const handleInteraction = () => {
      featureHints.forEach(hint => {
        applyHintToElement(hint.element, false);
      });
      setActiveHints(new Set());
      markHintsAsShown();
      
      // Clean up timers
      timers.forEach(clearTimeout);
      
      // Remove listeners
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };

    // Dismiss hints on any interaction after a short delay
    const interactionTimer = setTimeout(() => {
      document.addEventListener("click", handleInteraction, { once: true });
      document.addEventListener("touchstart", handleInteraction, { once: true });
    }, 3000);
    timers.push(interactionTimer);

    return () => {
      timers.forEach(clearTimeout);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      
      // Clean up pulse classes
      featureHints.forEach(hint => {
        applyHintToElement(hint.element, false);
      });
    };
  }, [location.pathname, shouldShowHints, applyHintToElement, markHintsAsShown]);

  // Show floating tooltip when hints are active
  if (activeHints.size === 0 || location.pathname !== "/dashboard") {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 md:bottom-8 animate-fade-in">
      <div className="bg-card/95 backdrop-blur-xl border border-primary/20 rounded-2xl px-4 py-2 shadow-lg">
        <p className="text-xs font-medium text-center text-muted-foreground">
          <span className="text-primary">✨</span> Tap any glowing feature to explore
        </p>
      </div>
    </div>
  );
}

// Hook to manually trigger hints
export function useFeatureHints() {
  const { user } = useAuth();

  const resetHints = useCallback(() => {
    if (!user) return;
    localStorage.removeItem(`feature_hints_shown_${user.id}`);
  }, [user]);

  const showHintsAgain = useCallback(() => {
    if (!user) return;
    // Also need to clear tour seen to show hints
    localStorage.removeItem(`onboarding_tour_seen_${user.id}`);
    localStorage.removeItem(`feature_hints_shown_${user.id}`);
    window.location.reload();
  }, [user]);

  return { resetHints, showHintsAgain };
}

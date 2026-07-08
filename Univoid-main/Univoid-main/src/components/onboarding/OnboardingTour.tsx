import { useEffect, useCallback, useRef } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

// Check if device is mobile
const isMobileDevice = () => {
  return window.innerWidth < 768;
};

// Desktop tour steps
const desktopTourSteps: DriveStep[] = [
  {
    element: "#nav-materials",
    popover: {
      title: "Resource Library",
      description: "Download notes and study materials shared by peers.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#nav-scholarships",
    popover: {
      title: "Fund Your Studies",
      description: "Exclusive India-only scholarships curated for your profile.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#nav-events",
    popover: {
      title: "Campus Life",
      description: "Register for hackathons, fests, and grab your tickets.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#nav-projects",
    popover: {
      title: "Project Lab",
      description: "Collaborate on innovations. Find teammates or join existing builds.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#nav-books",
    popover: {
      title: "Book Exchange",
      description: "Buy, sell, or swap books with students on your campus.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#nav-leaderboard",
    popover: {
      title: "Rankings",
      description: "See top contributors and climb the leaderboard!",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#notification-bell",
    popover: {
      title: "Real-time Alerts",
      description: "Never miss a scholarship deadline or event update.",
      side: "bottom",
      align: "end",
    },
  },
];

// Mobile tour steps (targeting bottom nav)
const mobileTourSteps: DriveStep[] = [
  {
    element: "#mobile-nav-dashboard",
    popover: {
      title: "Your Dashboard",
      description: "Track your activity, XP progress, and latest updates here.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#mobile-nav-materials",
    popover: {
      title: "Study Materials",
      description: "Download notes and resources shared by peers.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#mobile-nav-scholarships",
    popover: {
      title: "Scholarships",
      description: "Find scholarships curated for Indian students.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#mobile-nav-events",
    popover: {
      title: "Events",
      description: "Register for hackathons, fests, and campus events.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#mobile-nav-profile",
    popover: {
      title: "Your Profile",
      description: "View and edit your profile, skills, and badges.",
      side: "top",
      align: "center",
    },
  },
  {
    popover: {
      title: "Explore More!",
      description: "Use the menu (☰) to access Projects, Tasks, Books, News and Leaderboard. Enjoy UniVoid! 🎉",
    },
  },
];

export function OnboardingTour() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const hasStartedRef = useRef(false);

  const markTourAsSeen = useCallback(async () => {
    if (!user) return;
    
    try {
      localStorage.setItem(`onboarding_tour_seen_${user.id}`, "true");
    } catch (error) {
      console.error("Failed to mark tour as seen:", error);
    }
  }, [user]);

  const startTour = useCallback(() => {
    const isMobile = isMobileDevice();
    const steps = isMobile ? mobileTourSteps : desktopTourSteps;
    
    // Filter out steps whose elements don't exist
    const validSteps = steps.filter((step) => {
      if (!step.element) return true;
      return document.querySelector(step.element as string) !== null;
    });

    if (validSteps.length === 0) return;

    const driverInstance = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: validSteps,
      progressText: "{{current}} / {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Done",
      popoverClass: "univoid-tour-popover",
      overlayColor: "rgba(0, 0, 0, 0.75)",
      stagePadding: isMobile ? 4 : 8,
      stageRadius: 12,
      animate: true,
      allowClose: true,
      onDestroyStarted: () => {
        markTourAsSeen();
        driverRef.current?.destroy();
      },
      onDestroyed: () => {
        hasStartedRef.current = false;
      },
    });

    driverRef.current = driverInstance;
    driverInstance.drive();
  }, [markTourAsSeen]);

  useEffect(() => {
    // Only run on dashboard
    if (location.pathname !== "/dashboard") return;
    
    // Need user and profile
    if (!user || !profile) return;
    
    // Check if profile is complete
    if (!profile.profile_complete) return;
    
    // Check if tour was already seen
    const tourSeen = localStorage.getItem(`onboarding_tour_seen_${user.id}`);
    if (tourSeen === "true") return;
    
    // Don't start twice
    if (hasStartedRef.current) return;
    
    // Give the DOM time to render all elements (longer delay for mobile)
    const delay = isMobileDevice() ? 1500 : 1000;
    const timer = setTimeout(() => {
      hasStartedRef.current = true;
      startTour();
    }, delay);

    return () => {
      clearTimeout(timer);
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, [user, profile, location.pathname, startTour]);

  return null;
}

// Function to manually trigger tour (for Settings page)
export function useOnboardingTour() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const restartTour = useCallback(() => {
    if (!user) return;
    
    // Clear the tour seen flag
    localStorage.removeItem(`onboarding_tour_seen_${user.id}`);
    
    // Navigate to dashboard and start tour
    navigate("/dashboard");
    
    // The tour will auto-start on dashboard
    window.location.reload();
  }, [user, navigate]);

  return { restartTour };
}

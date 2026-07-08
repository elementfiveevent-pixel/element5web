import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fade-up" | "fade-left" | "fade-right" | "scale";
}

export const AnimatedSection = ({
  children,
  className,
  delay = 0,
  animation = "fade-up",
}: AnimatedSectionProps) => {
  const { ref, isVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "0px",
    freezeOnceVisible: true,
  });

  const animationStyles = {
    "fade-up": {
      initial: "opacity-0 translate-y-8",
      visible: "opacity-100 translate-y-0",
    },
    "fade-left": {
      initial: "opacity-0 -translate-x-8",
      visible: "opacity-100 translate-x-0",
    },
    "fade-right": {
      initial: "opacity-0 translate-x-8",
      visible: "opacity-100 translate-x-0",
    },
    "scale": {
      initial: "opacity-0 scale-95",
      visible: "opacity-100 scale-100",
    },
  };

  const styles = animationStyles[animation];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? styles.visible : styles.initial,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

import { useEffect, useState, useRef, forwardRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCounter = forwardRef<HTMLSpanElement, AnimatedCounterProps>(
  ({ value, duration = 1500, className = '' }, ref) => {
    const [displayValue, setDisplayValue] = useState(0);
    const previousValue = useRef(0);
    const animationRef = useRef<number>();

    useEffect(() => {
      const startValue = previousValue.current;
      const endValue = value;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
        
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          previousValue.current = endValue;
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [value, duration]);

    return (
      <span ref={ref} className={className}>
        {displayValue.toLocaleString()}
      </span>
    );
  }
);

AnimatedCounter.displayName = 'AnimatedCounter';

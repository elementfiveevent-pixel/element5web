import { cn } from "@/lib/utils";

interface DoodleProps {
  className?: string;
}

export const DoodleStar = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 50 50" fill="none">
    <path 
      d="M25 5 L28 20 L45 22 L30 30 L33 47 L25 35 L17 47 L20 30 L5 22 L22 20 Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      strokeDasharray="3 2"
    />
  </svg>
);

export const DoodleCircle = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 50 50" fill="none">
    <circle 
      cx="25" 
      cy="25" 
      r="20" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeDasharray="4 3"
    />
    <circle 
      cx="25" 
      cy="25" 
      r="8" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeDasharray="2 2"
    />
  </svg>
);

export const DoodleSquiggle = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 100 30" fill="none">
    <path 
      d="M5 15 Q 15 5, 25 15 T 45 15 T 65 15 T 85 15 T 95 15" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const DoodleArrow = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 60 40" fill="none">
    <path 
      d="M5 20 Q 20 18, 35 20 T 50 20" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <path 
      d="M42 12 L 55 20 L 42 28" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export const DoodleBook = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 50 50" fill="none">
    <path 
      d="M10 8 L10 42 Q 25 38, 40 42 L40 8 Q 25 12, 10 8" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M25 10 L25 40" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeDasharray="3 2"
    />
    <path 
      d="M14 16 L22 16 M14 22 L22 22 M14 28 L20 28" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
    />
  </svg>
);

export const DoodleLightbulb = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 50 60" fill="none">
    <path 
      d="M25 5 Q 40 5, 42 20 Q 44 30, 35 38 L35 45 L15 45 L15 38 Q 6 30, 8 20 Q 10 5, 25 5" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M18 50 L32 50 M20 55 L30 55" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <path 
      d="M20 2 L22 8 M30 2 L28 8 M38 8 L34 13 M12 8 L16 13" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
    />
  </svg>
);

export const DoodleRocket = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 50 60" fill="none">
    <path 
      d="M25 5 Q 35 15, 35 35 L30 45 L25 42 L20 45 L15 35 Q 15 15, 25 5" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="25" cy="22" r="5" stroke="currentColor" strokeWidth="1" />
    <path 
      d="M20 50 L22 45 M25 52 L25 47 M30 50 L28 45" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);

export const DoodleHeart = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 50 50" fill="none">
    <path 
      d="M25 45 Q 5 30, 5 18 Q 5 8, 15 8 Q 22 8, 25 15 Q 28 8, 35 8 Q 45 8, 45 18 Q 45 30, 25 45" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DoodlePencil = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 60 60" fill="none">
    <path 
      d="M45 5 L55 15 L20 50 L8 52 L10 40 Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M40 10 L50 20" 
      stroke="currentColor" 
      strokeWidth="1" 
    />
    <path 
      d="M15 45 L17 47" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
    />
  </svg>
);

export const DoodleChat = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 50 50" fill="none">
    <path 
      d="M8 10 L42 10 Q 45 10, 45 14 L45 32 Q 45 36, 42 36 L20 36 L12 45 L12 36 L8 36 Q 5 36, 5 32 L5 14 Q 5 10, 8 10" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M12 18 L35 18 M12 24 L30 24 M12 30 L25 30" 
      stroke="currentColor" 
      strokeWidth="1" 
      strokeLinecap="round"
      strokeDasharray="2 2"
    />
  </svg>
);

export const DoodleGradCap = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 60 50" fill="none">
    <path 
      d="M5 20 L30 8 L55 20 L30 32 Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M15 24 L15 38 Q 30 45, 45 38 L45 24" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M55 20 L55 35" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <circle cx="55" cy="38" r="3" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const DoodleUnderline = ({ className }: DoodleProps) => (
  <svg className={cn("text-foreground/10", className)} viewBox="0 0 120 20" fill="none">
    <path 
      d="M5 10 Q 30 5, 60 12 T 115 8" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round"
    />
  </svg>
);

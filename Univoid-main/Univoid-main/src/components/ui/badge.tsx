import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-all duration-150",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background",
        secondary: "bg-secondary text-secondary-foreground border border-border-strong/10",
        outline: "border-2 border-border-strong/20 bg-card text-foreground",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
        purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };

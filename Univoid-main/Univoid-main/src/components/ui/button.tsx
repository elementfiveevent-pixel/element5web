import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-border select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sketch hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-sketch-lg active:translate-x-0 active:translate-y-0 active:shadow-sketch-sm",
        destructive: "bg-destructive text-destructive-foreground shadow-sketch hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-sketch-lg active:translate-x-0 active:translate-y-0 active:shadow-sketch-sm",
        outline: "bg-card hover:bg-secondary hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-sketch-sm hover:shadow-sketch active:translate-x-0 active:translate-y-0",
        secondary: "bg-secondary text-secondary-foreground shadow-sketch-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-sketch active:translate-x-0 active:translate-y-0",
        ghost: "border-0 hover:bg-secondary hover:text-secondary-foreground active:bg-secondary/80",
        link: "border-0 text-foreground underline-offset-4 hover:underline",
        sketch: "bg-card text-foreground shadow-sketch hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-sketch-lg active:translate-x-0 active:translate-y-0 active:shadow-sketch-sm",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

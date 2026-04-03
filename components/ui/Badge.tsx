import { type HTMLAttributes, forwardRef } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "error";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-surface-container-high text-on-surface",
      primary: "bg-primary/10 text-primary font-bold",
      secondary: "bg-secondary/10 text-secondary font-bold",
      success: "bg-emerald-100 text-emerald-700 font-bold",
      warning: "bg-amber-100 text-amber-700 font-bold",
      error: "bg-red-100 text-red-700 font-bold",
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

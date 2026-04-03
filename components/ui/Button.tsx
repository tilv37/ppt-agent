import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-primary/30 scale-95 active:scale-90",
      secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors",
      ghost: "bg-transparent text-on-surface hover:bg-surface-container-low",
      danger: "bg-error text-on-error shadow-lg shadow-error/15 hover:bg-error/90",
    };

    const sizes = {
      sm: "px-3 py-2 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

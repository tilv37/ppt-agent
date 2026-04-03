import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-semibold text-on-surface mb-3">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-xl border bg-surface-container-lowest px-4 py-3 shadow-sm
            text-on-surface placeholder:text-on-surface-variant
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-error" : "border-outline-variant/15"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-on-surface-variant">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

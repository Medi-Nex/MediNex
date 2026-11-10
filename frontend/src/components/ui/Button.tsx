import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none";

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs font-semibold",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-medinex-teal text-white hover:bg-medinex-teal-hover focus-visible:ring-medinex-teal shadow-sm",
      secondary:
        "bg-medinex-mint/30 text-medinex-deep hover:bg-medinex-mint/50 focus-visible:ring-medinex-teal",
      outline:
        "border border-medinex-border bg-white text-medinex-text hover:bg-slate-50 focus-visible:ring-medinex-teal",
      ghost:
        "bg-transparent text-medinex-text hover:bg-slate-100 focus-visible:ring-medinex-teal",
      dark:
        "bg-medinex-dark text-white hover:bg-medinex-deep border border-emerald-900 focus-visible:ring-medinex-mint",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

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
      "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 select-none";

    const sizeStyles = {
      sm: "min-h-[36px] px-3.5 py-1.5 text-xs font-semibold",
      md: "min-h-[42px] px-4 py-2 text-sm",
      lg: "min-h-[48px] px-6 py-3 text-base font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-medinex-teal text-white hover:bg-medinex-teal-hover focus-visible:ring-medinex-teal shadow-sm hover:shadow-md",
      secondary:
        "bg-medinex-mint/30 text-medinex-deep hover:bg-medinex-mint/50 focus-visible:ring-medinex-teal",
      outline:
        "border border-medinex-border bg-white text-medinex-text hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-medinex-teal shadow-subtle",
      ghost:
        "bg-transparent text-medinex-text hover:bg-slate-100 focus-visible:ring-medinex-teal",
      dark:
        "bg-medinex-dark/90 text-white hover:bg-medinex-deep border border-emerald-800/80 focus-visible:ring-medinex-mint shadow-sm",
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

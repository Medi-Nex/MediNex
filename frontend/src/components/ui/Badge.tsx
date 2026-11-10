import React from "react";
import clsx from "clsx";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "teal" | "mint" | "outline" | "warning" | "neutral" | "placeholder";
  size?: "sm" | "md";
}

export function Badge({
  variant = "teal",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-full tracking-wide";
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };
  const variantStyles = {
    teal: "bg-medinex-teal/10 text-medinex-teal border border-medinex-teal/20",
    mint: "bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 font-semibold",
    outline: "border border-medinex-border text-medinex-muted bg-white",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
    placeholder: "bg-amber-500/10 text-amber-600 border border-amber-500/30 font-semibold",
  };

  return (
    <span
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({ className, hoverEffect = false, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white border border-medinex-border/90 rounded-2xl shadow-subtle overflow-hidden",
        hoverEffect &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated hover:border-medinex-teal/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("p-4 sm:p-6 border-b border-medinex-border/60", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("p-4 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/75 border-t border-medinex-border/60", className)}
      {...props}
    >
      {children}
    </div>
  );
}

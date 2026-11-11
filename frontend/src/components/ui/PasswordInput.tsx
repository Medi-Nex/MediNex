"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showLockIcon?: boolean;
  variant?: "auth" | "settings";
}

/**
 * Reusable password input with an accessible show/hide eye toggle button.
 */
export function PasswordInput({
  showLockIcon = true,
  variant = "auth",
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const variantClasses =
    variant === "settings"
      ? "py-2 bg-white border border-medinex-border rounded-xl focus:outline-none focus:border-medinex-teal"
      : "py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-medinex-teal";

  return (
    <div className="relative">
      {showLockIcon && (
        <Lock
          className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
      )}
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={`w-full text-xs ${showLockIcon ? "pl-9" : "pl-3"} pr-10 ${variantClasses} ${className}`.trim()}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? "Hide password" : "Show password"}
        title={showPassword ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-medinex-teal focus:outline-none focus:text-medinex-teal transition-colors"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

"use client";

import { clsx } from "clsx";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "icon";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";

    const variants = {
      primary: "bg-[#00a0d1] hover:bg-[#0088b8] text-white focus:ring-[#00a0d1]",
      secondary: "bg-[#2d2d2d] hover:bg-[#383838] text-white border border-white/10 focus:ring-white/20",
      ghost: "bg-transparent hover:bg-white/10 text-white focus:ring-white/20",
      danger: "bg-[#e74c3c] hover:bg-[#c0392b] text-white focus:ring-[#e74c3c]",
      icon: "bg-[#2d2d2d] hover:bg-[#383838] text-white border border-white/10 rounded-full focus:ring-white/20",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], variant !== "icon" ? sizes[size] : "p-2", className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

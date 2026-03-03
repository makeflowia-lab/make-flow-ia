"use client";

import { clsx } from "clsx";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-[#b3b3b3]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6e6e]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              "w-full bg-[#2d2d2d] border border-white/10 rounded-lg text-white placeholder:text-[#6e6e6e]",
              "px-3 py-2.5 text-sm outline-none transition-all",
              "focus:border-[#00a0d1] focus:ring-1 focus:ring-[#00a0d1]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-[#e74c3c] focus:border-[#e74c3c] focus:ring-[#e74c3c]",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#e74c3c]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

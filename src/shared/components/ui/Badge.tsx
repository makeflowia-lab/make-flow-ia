import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "active" | "scheduled" | "ended" | "success" | "warning";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-[#2d2d2d] text-[#b3b3b3]",
    active: "bg-[#27ae60]/20 text-[#27ae60] border border-[#27ae60]/30",
    scheduled: "bg-[#00a0d1]/20 text-[#00a0d1] border border-[#00a0d1]/30",
    ended: "bg-[#6e6e6e]/20 text-[#6e6e6e] border border-[#6e6e6e]/30",
    success: "bg-[#27ae60]/20 text-[#27ae60]",
    warning: "bg-[#f39c12]/20 text-[#f39c12]",
  };

  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}

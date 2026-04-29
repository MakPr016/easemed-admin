"use client";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "buyer" | "seller" | "hospital" | "vendor" | "";
  className?: string;
}

const sizeClasses = {
  sm: "w-[22px] h-[22px] text-[10px] rounded-[4px]",
  md: "w-7 h-7 text-[11px] rounded-md",
  lg: "w-10 h-10 text-sm rounded-lg",
  xl: "w-14 h-14 text-lg rounded-xl",
};

const variantClasses = {
  buyer: "bg-primary/10 text-primary",
  seller: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hospital: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  vendor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  "": "bg-muted text-muted-foreground",
};

export function Avatar({ name = "", size = "md", variant = "", className }: AvatarProps) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "??";
  return (
    <div className={cn(
      "inline-grid place-items-center font-semibold shrink-0 select-none",
      sizeClasses[size],
      variantClasses[variant],
      className,
    )}>
      {initials}
    </div>
  );
}

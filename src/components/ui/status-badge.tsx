"use client";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { cls: string; dot?: boolean }> = {
  active:       { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", dot: true },
  verified:     { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", dot: true },
  approved:     { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", dot: true },
  completed:    { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", dot: true },
  resolved:     { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", dot: true },
  pending:      { cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", dot: true },
  submitted:    { cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", dot: true },
  manual_override: { cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", dot: true },
  in_progress:  { cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", dot: true },
  open:         { cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", dot: true },
  suspended:    { cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", dot: true },
  failed:       { cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", dot: true },
  rejected:     { cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", dot: true },
  escalated:    { cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400", dot: true },
  inactive:     { cls: "bg-muted text-muted-foreground", dot: true },
  not_submitted:{ cls: "bg-muted text-muted-foreground", dot: true },
  draft:        { cls: "bg-muted text-muted-foreground", dot: true },
};

interface StatusBadgeProps { status: string; label?: string; size?: "lg" | ""; }

export function StatusBadge({ status, label, size }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] || { cls: "bg-muted text-muted-foreground", dot: true };
  const text = label || (status || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded font-medium border border-transparent whitespace-nowrap",
      size === "lg" ? "h-5.5 px-2 text-[11.5px]" : "h-5 px-1.75 text-[11px]",
      cfg.cls,
    )}>
      {cfg.dot && <span className="w-1.25 h-1.25 rounded-full bg-current shrink-0" />}
      {text}
    </span>
  );
}

export function TypeBadge({ type }: { type: "buyer" | "seller" | "hospital" | "vendor" }) {
  const isPrimary = type === "buyer" || type === "hospital";
  return (
    <span className={cn(
      "inline-flex items-center h-5 px-1.75 rounded text-[11px] font-medium whitespace-nowrap",
      isPrimary
        ? "bg-primary/10 text-primary"
        : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    )}>
      {type}
    </span>
  );
}

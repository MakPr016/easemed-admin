export const fmtMoney = (n: number, compact = false) => {
  if (compact && Math.abs(n) >= 1000) {
    return "$" + new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  }
  return new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
};
export const fmtNum = (n: number) => new Intl.NumberFormat("en").format(n);
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
export const fmtDateShort = (iso: string) => new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit", hour12: false });
export const relTime = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return fmtDateShort(iso);
};

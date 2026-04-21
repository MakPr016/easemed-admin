"use client";
import Link from "next/link";
import { Download, TrendingUp, TrendingDown, AlertTriangle, ExternalLink } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { CLIENTS, MONTHLY_ACTIVITY } from "@/lib/data";
import { fmtNum, fmtDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

type HealthAxis = {
  key: string;
  label: string;
  value: number;
  status: string;
};

// ─── KPI card ─────────────────────────────────────────
function Kpi({ label, value, delta, up, sub, href }: {
  label: string; value: string | number; delta?: number; up?: boolean; sub?: string; href?: string;
}) {
  const isNeg = delta != null && delta < 0;
  const arrowUp = up || (!isNeg && delta != null);
  const inner = (
    <>
      <p className="text-[11.5px] font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        {label}
        {href && <ExternalLink size={11} className="ml-auto text-muted-foreground/60" />}
      </p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
        {typeof value === "number" ? fmtNum(value) : value}
        {delta != null && (
          <span className={cn("inline-flex items-center gap-0.5 text-[11.5px] ml-2 font-mono", arrowUp ? "text-primary" : "text-destructive")}>
            {arrowUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </p>
      {sub && <p className="mt-2 text-[11.5px] text-muted-foreground">{sub}</p>}
    </>
  );
  const cls = "p-4 bg-card border border-border rounded-xl relative hover:border-border/80 transition-colors";
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

// ─── Dashboard page ───────────────────────────────────
export default function DashboardPage() {
  const clients = CLIENTS;
  const totalClients = clients.length;
  const activeBuyers = clients.filter(c => c.type === "buyer" && c.status === "active").length;
  const activeSellers = clients.filter(c => c.type === "seller" && c.status === "active").length;
  const pending = clients.filter(c => c.status === "pending").length;
  const sellers = clients.filter(c => c.type === "seller");

  const statusCounts = [
    { name: "Active",    value: clients.filter(c => c.status === "active").length,    fill: "var(--chart-1)", key: "active" },
    { name: "Pending",   value: clients.filter(c => c.status === "pending").length,   fill: "var(--chart-3)", key: "pending" },
    { name: "Suspended", value: clients.filter(c => c.status === "suspended").length, fill: "var(--chart-4)", key: "suspended" },
    { name: "Inactive",  value: clients.filter(c => c.status === "inactive").length,  fill: "var(--chart-5)", key: "inactive" },
  ];

  const recent = [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const today = Date.now();
  const alerts = clients.filter(c => {
    const exp = new Date(c.documentExpiry).getTime();
    return exp < today || c.kycStatus === "failed" || c.disputeCount > 5;
  }).slice(0, 5);

  const verified = clients.filter(c => c.kycStatus === "verified").length;
  const withDisputes = clients.filter(c => c.disputeCount > 0).length;
  const disputeFree = totalClients - withDisputes;
  const validDocs = clients.filter(c => new Date(c.documentExpiry).getTime() > today).length;
  const buyers = clients.filter(c => c.type === "buyer");
  const avgUtil = buyers.reduce((s, c) => s + (c.creditLimit ? c.currentBalance / c.creditLimit : 0), 0) / buyers.length;
  const avgSellerRating = sellers.reduce((s, c) => s + (c.rating || 0), 0) / Math.max(sellers.length, 1);
  const approvalSpeed = Math.max(0, Math.round((1 - pending / Math.max(totalClients, 1)) * 100));
  const creditHealth = Math.max(0, Math.round((1 - avgUtil) * 100));

  const healthAxes: HealthAxis[] = [
    { key: "kyc", label: "KYC Compliance", value: Math.round((verified / Math.max(totalClients, 1)) * 100), status: "Monitor" },
    { key: "seller", label: "Seller Rating", value: Math.round((avgSellerRating / 5) * 100), status: "Strong" },
    { key: "credit", label: "Credit Health", value: creditHealth, status: creditHealth < 60 ? "Action needed" : "Monitor" },
    { key: "docs", label: "Doc Validity", value: Math.round((validDocs / Math.max(totalClients, 1)) * 100), status: "Monitor" },
    { key: "speed", label: "Approval Speed", value: approvalSpeed, status: approvalSpeed < 60 ? "Action needed" : "Monitor" },
    { key: "disputes", label: "Low Disputes", value: Math.round((disputeFree / Math.max(totalClients, 1)) * 100), status: disputeFree < totalClients * 0.85 ? "Action needed" : "Strong" },
  ];

  const overallHealth = Math.round(healthAxes.reduce((s, item) => s + item.value, 0) / healthAxes.length);
  const healthLevel = overallHealth >= 80 ? "Strong" : overallHealth >= 65 ? "Monitor" : "At risk";

  const radarSize = 240;
  const radarCenter = radarSize / 2;
  const radarOuter = 76;
  const radarTicks = [0.25, 0.5, 0.75, 1];
  const radarPoints = healthAxes.map((axis, idx) => {
    const angle = -Math.PI / 2 + (idx * Math.PI * 2) / healthAxes.length;
    const norm = axis.value / 100;
    return {
      ...axis,
      angle,
      x: radarCenter + Math.cos(angle) * radarOuter * norm,
      y: radarCenter + Math.sin(angle) * radarOuter * norm,
      axisX: radarCenter + Math.cos(angle) * radarOuter,
      axisY: radarCenter + Math.sin(angle) * radarOuter,
      labelX: radarCenter + Math.cos(angle) * (radarOuter + 20),
      labelY: radarCenter + Math.sin(angle) * (radarOuter + 20),
    };
  });
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  const total = MONTHLY_ACTIVITY.reduce((s, d) => s + d.buyers + d.sellers, 0);
  const peak = [...MONTHLY_ACTIVITY].sort((a, b) => (b.buyers + b.sellers) - (a.buyers + a.sellers))[0];
  const last = MONTHLY_ACTIVITY[MONTHLY_ACTIVITY.length - 1];
  const prev = MONTHLY_ACTIVITY[MONTHLY_ACTIVITY.length - 2];
  const growth = ((last.buyers + last.sellers) - (prev.buyers + prev.sellers)) / (prev.buyers + prev.sellers) * 100;

  const tooltipStyle = {
    contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11, boxShadow: "var(--shadow-md)" },
    labelStyle: { fontWeight: 600, marginBottom: 3, color: "var(--foreground)" },
    itemStyle: { color: "var(--foreground)" },
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-7 py-5 pb-4 border-b border-border bg-card flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Operational snapshot across all clients and activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex p-0.5 bg-muted rounded-md">
            {["7d", "30d", "90d", "YTD"].map((t, i) => (
              <button key={t} className={cn("px-2.5 py-1 text-xs font-medium rounded", i === 1 ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>{t}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export</Button>
        </div>
      </div>

      <div className="p-7 flex flex-col gap-4">
        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <Kpi label="Total Clients"      value={totalClients}  delta={4.2}  up  sub="vs. previous 30 days" />
          <Kpi label="Active Buyers"      value={activeBuyers}  delta={2.8}  up  sub="vs. previous 30 days" />
          <Kpi label="Active Sellers"     value={activeSellers} delta={-1.4}     sub="vs. previous 30 days" />
          <Kpi label="Pending Approvals"  value={pending}       delta={3}    up  sub="Awaiting review · 2 overdue" href="/approvals" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">

          {/* Platform Activity */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[13px] font-semibold">Platform Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">New registrations by type · last 12 months</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { k: "Total",  v: String(total) },
                  { k: "Peak",   v: `${peak.month} · ${peak.buyers + peak.sellers}` },
                  { k: "Growth", v: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`, color: growth >= 0 ? "var(--primary)" : "var(--destructive)" },
                ].map(p => (
                  <span key={p.k} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted border border-border text-[11.5px] text-muted-foreground">
                    <span>{p.k}</span>
                    <span className="font-medium text-foreground font-mono" style={p.color ? { color: p.color } : {}}>{p.v}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3.5 mb-2.5 text-[11.5px]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--chart-1)" }} />Buyers</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--chart-2)" }} />Sellers</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={MONTHLY_ACTIVITY} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="buyers-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--chart-1)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sellers-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--chart-2)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 10.5, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="buyers"  name="Buyers"  stroke="var(--chart-1)" fill="url(#buyers-fill)"  strokeWidth={2} dot={false} activeDot={{ r: 3.5, stroke: "var(--chart-1)", fill: "var(--card)", strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="sellers" name="Sellers" stroke="var(--chart-2)" fill="url(#sellers-fill)" strokeWidth={2} dot={false} activeDot={{ r: 3.5, stroke: "var(--chart-2)", fill: "var(--card)", strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Client Status */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border">
              <h3 className="text-[13px] font-semibold">Client Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Click a row to filter</p>
            </div>
            <div className="p-4 flex flex-col items-center gap-4">
              <div className="relative" style={{ width: 160, height: 160 }}>
                <PieChart width={160} height={160}>
                  <Pie data={statusCounts} dataKey="value" cx={76} cy={76} innerRadius={52} outerRadius={76} paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" />
                  <Tooltip {...tooltipStyle} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[22px] font-bold tracking-tight">{totalClients}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Clients</span>
                </div>
              </div>
              <div className="w-full flex flex-col gap-0.5">
                {statusCounts.map((s) => {
                  const pct = (s.value / totalClients * 100).toFixed(1);
                  const deltas: Record<string, string> = { active: "+3 this month", pending: "+1 this month", suspended: "—", inactive: "—" };
                  return (
                    <Link key={s.key} href={`/clients?status=${s.key}`} className="flex items-center gap-1.5 px-1.5 py-2 rounded text-xs border-t border-border first:border-0 hover:bg-muted">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.fill }} />
                      <span className="text-muted-foreground flex-1">{s.name}</span>
                      <span className="font-mono font-semibold text-foreground">{s.value}</span>
                      <span className="font-mono text-muted-foreground text-[10.5px] w-10 text-right">{pct}%</span>
                      <span className={cn("font-mono text-[10.5px] w-20 text-right", deltas[s.key]?.startsWith("+") ? "text-primary" : "text-muted-foreground")}>{deltas[s.key]}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Platform Health */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border flex flex-col lg:flex-row items-start lg:items-end justify-between gap-3">
            <div>
              <h3 className="text-[13px] font-medium">Platform Health Score</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Composite score across 6 compliance and performance axes</p>
            </div>
            <div className="flex items-baseline gap-2 shrink-0">
              <div className="font-mono text-[28px] sm:text-[34px] leading-none font-medium tracking-tight">{overallHealth}</div>
              <span className="text-[15px] text-muted-foreground">/100</span>
              <span
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-normal",
                  healthLevel === "Strong" && "bg-primary/10 text-primary",
                  healthLevel === "Monitor" && "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
                  healthLevel === "At risk" && "bg-destructive/10 text-destructive",
                )}
              >
                {healthLevel}
              </span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 xl:grid-cols-[0.95fr_1.35fr] gap-4 items-center">
            <div className="flex items-center justify-center">
              <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="w-full max-w-60 sm:max-w-72">
                {radarTicks.map((tick, i) => {
                  const points = healthAxes
                    .map((_, idx) => {
                      const angle = -Math.PI / 2 + (idx * Math.PI * 2) / healthAxes.length;
                      const x = radarCenter + Math.cos(angle) * radarOuter * tick;
                      const y = radarCenter + Math.sin(angle) * radarOuter * tick;
                      return `${x},${y}`;
                    })
                    .join(" ");
                  return <polygon key={i} points={points} fill="none" stroke="var(--border)" strokeDasharray="4 4" opacity={0.6} />;
                })}
                {radarPoints.map((p) => (
                  <line key={`${p.key}-axis`} x1={radarCenter} y1={radarCenter} x2={p.axisX} y2={p.axisY} stroke="var(--border)" opacity={0.45} />
                ))}
                <path d={radarPath} fill="var(--chart-1)" fillOpacity={0.12} stroke="var(--chart-2)" strokeWidth={2} />
                {radarPoints.map((p) => (
                  <circle key={`${p.key}-dot`} cx={p.x} cy={p.y} r={5} fill="var(--card)" stroke="var(--chart-2)" strokeWidth={3} />
                ))}
                {radarPoints.map((p) => (
                  <g key={`${p.key}-label`} className="hidden xl:block">
                    <text
                      x={p.labelX}
                      y={p.labelY - 2}
                      textAnchor={p.labelX > radarCenter + 6 ? "start" : p.labelX < radarCenter - 6 ? "end" : "middle"}
                      fontSize="10"
                      fill="var(--muted-foreground)"
                      fontWeight="600"
                    >
                      {p.label}
                    </text>
                    <text
                      x={p.labelX}
                      y={p.labelY + 12}
                      textAnchor={p.labelX > radarCenter + 6 ? "start" : p.labelX < radarCenter - 6 ? "end" : "middle"}
                      fontSize="10"
                      fill="var(--foreground)"
                      fontFamily="var(--font-mono)"
                    >
                      {p.value}%
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {healthAxes.map((axis) => {
                const scoreTone = axis.value >= 80 ? "text-primary" : axis.value >= 60 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
                return (
                  <div key={axis.key} className="border border-border rounded-lg bg-muted/45 px-3 py-2.5 flex items-center justify-between gap-2 min-h-[78px]">
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-normal truncate">{axis.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{axis.status}</div>
                    </div>
                    <div className={cn("font-mono text-[24px] leading-none font-medium shrink-0", scoreTone)}>{axis.value}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
          {/* Recent Registrations */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold">Recent Registrations</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Newest clients in the system</p>
              </div>
              <Link href="/clients"><Button variant="ghost" size="sm" className="gap-1 text-xs">View all</Button></Link>
            </div>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {["Company", "Type", "Date", "Status", ""].map(h => (
                    <th key={h} className="text-left px-3 h-9 text-[11.5px] font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-3 h-9">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} size="sm" variant={c.type} />
                        <Link href={`/clients/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link>
                      </div>
                    </td>
                    <td className="px-3"><TypeBadge type={c.type} /></td>
                    <td className="px-3 font-mono text-muted-foreground text-[11px]">{fmtDateShort(c.createdAt)}</td>
                    <td className="px-3"><StatusBadge status={c.status} /></td>
                    <td className="px-3">
                      <Link href={`/clients/${c.id}`}><Button variant="outline" size="xs">Review</Button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alerts */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-destructive" />Alerts
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{alerts.length} accounts need attention</p>
              </div>
              <Button variant="ghost" size="sm">Triage all</Button>
            </div>
            <div>
              {alerts.map(c => {
                const expired = new Date(c.documentExpiry).getTime() < today;
                const reason = expired ? "Documents expired" : c.kycStatus === "failed" ? "KYC failed" : "High dispute count";
                return (
                  <div key={c.id} className="flex items-center gap-2.5 px-4 py-3 border-t border-border first:border-0">
                    <div className={cn("w-7 h-7 rounded-md grid place-items-center shrink-0", expired ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-medium">{c.name}</p>
                      <p className="text-[11.5px] text-muted-foreground">{reason}{c.disputeCount > 0 ? ` · ${c.disputeCount} disputes` : ""}</p>
                    </div>
                    <Link href={`/clients/${c.id}`}><Button variant="outline" size="xs">Resolve</Button></Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

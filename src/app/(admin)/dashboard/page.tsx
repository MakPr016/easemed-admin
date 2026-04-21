"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Download, TrendingUp, TrendingDown, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { CLIENTS, MONTHLY_ACTIVITY } from "@/lib/data";
import { fmtNum, fmtDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

// ─── Area Chart ──────────────────────────────────────
function AreaChart({ data, height = 220 }: { data: typeof MONTHLY_ACTIVITY; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 800, H = height, PL = 34, PR = 12, PT = 10, PB = 24;
  const iW = W - PL - PR, iH = H - PT - PB;
  const max = Math.max(...data.flatMap(d => [d.buyers, d.sellers])) * 1.15;
  const x = (i: number) => PL + (i / (data.length - 1)) * iW;
  const y = (v: number) => PT + iH - (v / max) * iH;
  const buyersPts = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.buyers)}`).join(" ");
  const sellersPts = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.sellers)}`).join(" ");
  const buyersArea = `${buyersPts} L ${x(data.length-1)} ${PT+iH} L ${x(0)} ${PT+iH} Z`;
  const sellersArea = `${sellersPts} L ${x(data.length-1)} ${PT+iH} L ${x(0)} ${PT+iH} Z`;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * W;
    const i = Math.round((px - PL) / iW * (data.length - 1));
    if (i >= 0 && i < data.length) setHover(i);
  };

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {[0,1,2,3,4].map(i => {
        const gy = PT + (i / 4) * iH;
        const val = Math.round(max - (i / 4) * max);
        return (
          <g key={i}>
            <line x1={PL} x2={W-PR} y1={gy} y2={gy} stroke="var(--border)" strokeDasharray={i === 4 ? "0" : "3 3"} />
            <text x={PL-6} y={gy+3} fontSize="10" textAnchor="end" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => i % 2 === 0 && (
        <text key={i} x={x(i)} y={H-6} fontSize="10.5" textAnchor="middle" fill="var(--muted-foreground)">{d.month}</text>
      ))}
      <path d={buyersArea} fill="var(--graph-buyers)" opacity="0.07" />
      <path d={buyersPts} fill="none" stroke="var(--graph-buyers)" strokeWidth="2" />
      <path d={sellersArea} fill="var(--graph-sellers)" opacity="0.07" />
      <path d={sellersPts} fill="none" stroke="var(--graph-sellers)" strokeWidth="2" />
      {hover !== null && (
        <>
          <line x1={x(hover)} x2={x(hover)} y1={PT} y2={PT+iH} stroke="var(--border)" strokeDasharray="3 3" />
          <circle cx={x(hover)} cy={y(data[hover].buyers)} r="3.5" fill="var(--card)" stroke="var(--graph-buyers)" strokeWidth="2" />
          <circle cx={x(hover)} cy={y(data[hover].sellers)} r="3.5" fill="var(--card)" stroke="var(--graph-sellers)" strokeWidth="2" />
          <foreignObject x={Math.min(x(hover)+10, W-155)} y={PT+8} width="145" height="72">
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 8px", fontSize: 11, boxShadow: "var(--shadow-md)" }}>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>{data[hover].month}</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "var(--muted-foreground)" }}><span style={{ display: "inline-block", width: 7, height: 7, background: "var(--graph-buyers)", borderRadius: 1, marginRight: 5 }} />Buyers</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{data[hover].buyers}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ color: "var(--muted-foreground)" }}><span style={{ display: "inline-block", width: 7, height: 7, background: "var(--graph-sellers)", borderRadius: 1, marginRight: 5 }} />Sellers</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{data[hover].sellers}</span>
              </div>
            </div>
          </foreignObject>
        </>
      )}
    </svg>
  );
}

// ─── Donut ────────────────────────────────────────────
function DonutChart({ data, size = 160 }: { data: { name: string; value: number; color: string; key: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = size / 2 - 2, cx = size / 2, cy = size / 2;
  let a0 = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {data.map((d, i) => {
        const a1 = a0 + (d.value / total) * Math.PI * 2;
        const large = (a1 - a0) > Math.PI ? 1 : 0;
        const x0 = cx + Math.cos(a0) * R, y0 = cy + Math.sin(a0) * R;
        const x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
        const rI = R * 0.66;
        const x0i = cx + Math.cos(a1) * rI, y0i = cy + Math.sin(a1) * rI;
        const x1i = cx + Math.cos(a0) * rI, y1i = cy + Math.sin(a0) * rI;
        const path = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x0i} ${y0i} A ${rI} ${rI} 0 ${large} 0 ${x1i} ${y1i} Z`;
        const el = <path key={i} d={path} fill={d.color} style={{ transition: "opacity .12s" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")} />;
        a0 = a1;
        return el;
      })}
    </svg>
  );
}

// ─── KPI card ─────────────────────────────────────────
function Kpi({ label, value, delta, up, sub, href }: { label: string; value: string | number; delta?: number; up?: boolean; sub?: string; href?: string }) {
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
          <span className={cn("inline-flex items-center gap-0.5 text-[11.5px] ml-2 font-mono", arrowUp ? "text-emerald-600" : "text-destructive")}>
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

  const statusCounts = [
    { name: "Active", value: clients.filter(c => c.status === "active").length, color: "var(--graph-11)", key: "active" },
    { name: "Pending", value: clients.filter(c => c.status === "pending").length, color: "var(--graph-5)", key: "pending" },
    { name: "Suspended", value: clients.filter(c => c.status === "suspended").length, color: "var(--graph-7)", key: "suspended" },
    { name: "Inactive", value: clients.filter(c => c.status === "inactive").length, color: "var(--graph-8)", key: "inactive" },
  ];

  const recent = [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const today = Date.now();
  const alerts = clients.filter(c => {
    const exp = new Date(c.documentExpiry).getTime();
    return exp < today || c.kycStatus === "failed" || c.disputeCount > 5;
  }).slice(0, 5);

  // Platform health stats
  const verified = clients.filter(c => c.kycStatus === "verified").length;
  const withDisputes = clients.filter(c => c.disputeCount > 0).length;
  const validDocs = clients.filter(c => new Date(c.documentExpiry).getTime() > today).length;
  const buyers = clients.filter(c => c.type === "buyer");
  const avgUtil = buyers.reduce((s, c) => s + (c.creditLimit ? c.currentBalance / c.creditLimit : 0), 0) / buyers.length;
  const healthStats = [
    { label: "KYC Verified", value: verified, total: totalClients, pct: Math.round(verified / totalClients * 100) },
    { label: "Valid Docs", value: validDocs, total: totalClients, pct: Math.round(validDocs / totalClients * 100) },
    { label: "No Disputes", value: totalClients - withDisputes, total: totalClients, pct: Math.round((totalClients - withDisputes) / totalClients * 100) },
    { label: "Credit Headroom", value: null, total: null, pct: Math.round((1 - avgUtil) * 100) },
  ];

  const total = MONTHLY_ACTIVITY.reduce((s, d) => s + d.buyers + d.sellers, 0);
  const peak = [...MONTHLY_ACTIVITY].sort((a, b) => (b.buyers + b.sellers) - (a.buyers + a.sellers))[0];
  const last = MONTHLY_ACTIVITY[MONTHLY_ACTIVITY.length - 1];
  const prev = MONTHLY_ACTIVITY[MONTHLY_ACTIVITY.length - 2];
  const growth = ((last.buyers + last.sellers) - (prev.buyers + prev.sellers)) / (prev.buyers + prev.sellers) * 100;

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
        <div className="grid grid-cols-4 gap-3">
          <Kpi label="Total Clients" value={totalClients} delta={4.2} up sub="vs. previous 30 days" />
          <Kpi label="Active Buyers" value={activeBuyers} delta={2.8} up sub="vs. previous 30 days" />
          <Kpi label="Active Sellers" value={activeSellers} delta={-1.4} sub="vs. previous 30 days" />
          <Kpi label="Pending Approvals" value={pending} delta={3} up sub="Awaiting review · 2 overdue" href="/approvals" />
        </div>

        {/* Charts row */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
          {/* Platform Activity */}
          <div className="bg-card border border-border rounded-xl overflow-hidden border-l-[3px] border-l-primary">
            <div className="px-4 py-3.5 border-b border-border flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[13px] font-semibold">Platform Activity</h3>
                <p className="text-xs text-muted-foreground mt-0.5">New registrations by type · last 12 months</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { k: "Total", v: String(total) },
                  { k: "Peak", v: `${peak.month} · ${peak.buyers + peak.sellers}` },
                  { k: "Growth", v: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`, color: growth >= 0 ? "var(--success-color)" : "var(--destructive)" },
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
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--graph-buyers)" }} />Buyers</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--graph-sellers)" }} />Sellers</span>
              </div>
              <AreaChart data={MONTHLY_ACTIVITY} height={200} />
            </div>
          </div>

          {/* Client Status donut */}
          <div className="bg-card border border-border rounded-xl overflow-hidden border-l-[3px]" style={{ borderLeftColor: "oklch(0.58 0.14 155)" }}>
            <div className="px-4 py-3.5 border-b border-border">
              <h3 className="text-[13px] font-semibold">Client Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Click a row to filter</p>
            </div>
            <div className="p-4 flex flex-col items-center gap-4">
              <div className="relative w-40 h-40">
                <DonutChart data={statusCounts} size={160} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[22px] font-bold tracking-tight">{totalClients}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Clients</span>
                </div>
              </div>
              <div className="w-full flex flex-col gap-0.5">
                {statusCounts.map((s, i) => {
                  const pct = (s.value / totalClients * 100).toFixed(1);
                  const deltas: Record<string, string> = { active: "+3 this month", pending: "+1 this month", suspended: "—", inactive: "—" };
                  return (
                    <Link key={s.key} href={`/clients?status=${s.key}`} className="flex items-center gap-1.5 px-1.5 py-2 rounded text-xs border-t border-border first:border-0 hover:bg-muted">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} />
                      <span className="text-muted-foreground flex-1">{s.name}</span>
                      <span className="font-mono font-semibold text-foreground">{s.value}</span>
                      <span className="font-mono text-muted-foreground text-[10.5px] w-10 text-right">{pct}%</span>
                      <span className={cn("font-mono text-[10.5px] w-20 text-right", deltas[s.key]?.startsWith("+") ? "text-emerald-600" : "text-muted-foreground")}>{deltas[s.key]}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Platform Health */}
          <div className="bg-card border border-border rounded-xl overflow-hidden border-l-[3px]" style={{ borderLeftColor: "oklch(0.60 0.14 230)" }}>
            <div className="px-4 py-3.5 border-b border-border">
              <h3 className="text-[13px] font-semibold">Platform Health</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Compliance & risk indicators</p>
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              {healthStats.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <span className={cn("font-mono text-xs font-semibold", s.pct >= 80 ? "text-emerald-600" : s.pct >= 60 ? "text-amber-600" : "text-destructive")}>
                      {s.value !== null ? `${s.value} / ${s.total}` : `${s.pct}%`}
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div style={{ width: `${s.pct}%` }} className={cn("h-full rounded-full transition-all", s.pct >= 80 ? "bg-emerald-500" : s.pct >= 60 ? "bg-amber-500" : "bg-destructive")} />
                  </div>
                </div>
              ))}
              <div className="mt-1.5 px-3 py-2.5 bg-muted rounded-lg flex justify-between items-center">
                <span className="text-[11.5px] text-muted-foreground">Overall Score</span>
                <span className="text-lg font-bold tracking-tight text-primary">
                  {Math.round(healthStats.reduce((s, st) => s + st.pct, 0) / healthStats.length)}
                  <span className="text-[11px] text-muted-foreground font-normal ml-0.5">/100</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-4">
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
          <div className="bg-card border border-border rounded-xl overflow-hidden border-l-[3px] border-l-destructive">
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
                    <div className={cn("w-7 h-7 rounded-md grid place-items-center shrink-0", expired ? "bg-amber-50 text-amber-600" : "bg-red-50 text-destructive")}>
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

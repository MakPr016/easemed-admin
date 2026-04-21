"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, Plus, MoreHorizontal, ChevronLeft, ChevronRight, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { CLIENTS } from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const GRAPH_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-2)", "var(--chart-3)"];

function BarChartLabeled({ data, avg }: { data: { label: string; value: number; aboveAvg: boolean }[]; avg: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760;
  const leftLabel = 96;
  const rightPad = 14;
  const chartTop = 16;
  const barH = 30;
  const barGap = 10;
  const H = chartTop + data.length * (barH + barGap) + 10;
  const max = Math.max(...data.map(d => d.value), avg * 1.12);
  const drawW = W - leftLabel - rightPad;
  const hoverRow = hover != null ? data[hover] : null;
  const hoverBarW = hoverRow ? (hoverRow.value / max) * drawW : 0;
  const hoverX = Math.min(W - 180, leftLabel + hoverBarW + 12);
  const hoverY = hover != null ? chartTop + hover * (barH + barGap) + barH / 2 - 20 : 0;

  return (
    <div>
      <div className="mb-2">
        <h4 className="text-[16px] font-semibold">Bar Chart - Mixed</h4>
        <p className="text-[13px] text-muted-foreground mt-0.5">January - June 2024</p>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
          {data.map((d, i) => {
            const y = chartTop + i * (barH + barGap);
            const bw = (d.value / max) * drawW;
            const fill = GRAPH_COLORS[i % GRAPH_COLORS.length];
            return (
              <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <text x={leftLabel - 12} y={y + barH / 2 + 5} textAnchor="end" fill="var(--muted-foreground)" fontSize="11.5" fontWeight="500">
                  {d.label}
                </text>
                <rect
                  x={leftLabel}
                  y={y}
                  width={bw}
                  height={barH}
                  rx="7"
                  fill={fill}
                  opacity={hover === i || hover == null ? 1 : 0.74}
                  style={{ transition: "opacity .14s" }}
                />
              </g>
            );
          })}
        </svg>
        {hoverRow && (
          <div
            className="absolute z-10 px-2.5 py-1.5 rounded-md border border-border bg-card shadow-md flex items-center gap-2"
            style={{ left: `${(hoverX / W) * 100}%`, top: `${(hoverY / H) * 100}%` }}
          >
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: GRAPH_COLORS[(hover ?? 0) % GRAPH_COLORS.length] }} />
            <span className="text-[11.5px] text-muted-foreground">Visitors</span>
            <span className="text-[11.5px] font-mono font-semibold text-foreground">{Math.round(hoverRow.value / 1000)}</span>
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <p className="text-[11.5px] font-semibold flex items-center gap-1">
          Trending up by 5.2% this month <TrendingUp size={13} />
        </p>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">Showing total visitors for the last 6 months</p>
      </div>
    </div>
  );
}

function DonutChartBare({ data, size = 160 }: { data: { value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = size / 2 - 2;
  const cx = size / 2, cy = size / 2;
  let a0 = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {data.map((d, i) => {
        const a1 = a0 + (d.value / total) * Math.PI * 2;
        const large = (a1 - a0) > Math.PI ? 1 : 0;
        const x0 = cx + Math.cos(a0) * R, y0 = cy + Math.sin(a0) * R;
        const x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
        const rInner = R * 0.66;
        const x0i = cx + Math.cos(a1) * rInner, y0i = cy + Math.sin(a1) * rInner;
        const x1i = cx + Math.cos(a0) * rInner, y1i = cy + Math.sin(a0) * rInner;
        const path = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x0i} ${y0i} A ${rInner} ${rInner} 0 ${large} 0 ${x1i} ${y1i} Z`;
        const el = (
          <path key={i} d={path} fill={d.color}
            style={{ transition: "opacity .12s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          />
        );
        a0 = a1;
        return el;
      })}
    </svg>
  );
}

function Stars({ value = 0 }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" width="12" height="12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
            className={i <= full ? "fill-amber-400 stroke-amber-400" : "fill-none stroke-muted-foreground"} />
        </svg>
      ))}
    </span>
  );
}

export default function SellersPage() {
  const [tab, setTab] = useState<"all" | "new">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const allSellers = useMemo(() => CLIENTS.filter(c => c.type === "seller"), []);
  const pendingSellers = useMemo(() => allSellers.filter(c => c.status === "pending" || c.kycStatus === "not_submitted"), [allSellers]);

  const totalRev = useMemo(() => allSellers.reduce((s, c) => s + c.revenue, 0), [allSellers]);
  const avgRev = totalRev / Math.max(allSellers.length, 1);
  const lowCompliance = allSellers.filter(c => c.compliance && c.compliance < 60).length;

  const topFive = useMemo(() => [...allSellers].sort((a, b) => b.revenue - a.revenue).slice(0, 5), [allSellers]);
  const topEarner = topFive[0];
  const mostOrders = useMemo(() => [...allSellers].sort((a, b) => b.orders - a.orders)[0], [allSellers]);
  const fastest = useMemo(() => [...allSellers].sort((a, b) => (b.rating || 0) - (a.rating || 0))[1] || topFive[1], [allSellers, topFive]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSellers.forEach(c => c.categories.forEach(cat => { counts[cat] = (counts[cat] || 0) + 1; }));
    return counts;
  }, [allSellers]);

  const catList = useMemo(() => {
    const catRev: Record<string, number> = {};
    allSellers.forEach(c => c.categories.forEach(cat => { catRev[cat] = (catRev[cat] || 0) + c.revenue / Math.max(c.categories.length, 1); }));
    return Object.entries(catRev)
      .sort((a, b) => b[1] - a[1])
      .map(([name, rev], i) => ({ name, value: catCounts[name] || 0, revenue: rev, color: GRAPH_COLORS[i % 7] }));
  }, [allSellers, catCounts]);

  const catTotal = catList.reduce((s, c) => s + c.revenue, 0);
  const topCat = catList[0]?.name || "—";

  const baseRows = tab === "all" ? allSellers : pendingSellers;
  const rows = useMemo(() => {
    if (!search) return baseRows;
    const q = search.toLowerCase();
    return baseRows.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [baseRows, search]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mb-1">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/clients" className="hover:text-foreground transition-colors">Clients</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Sellers</span>
          </div>
          <h1 className="text-[18px] font-semibold tracking-tight">Sellers</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            {allSellers.length} sellers · {fmtMoney(totalRev, true)} total revenue
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export</Button>
          <Button size="sm" className="gap-1.5"><Plus size={13} />Add Seller</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {[{ id: "all", label: "All Sellers", count: allSellers.length }, { id: "new", label: "New Applications", count: pendingSellers.length }].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id as "all" | "new"); setPage(1); }}
              className={cn("px-4 py-2.5 text-[12.5px] font-medium border-b-2 -mb-px transition-colors flex items-center gap-2", tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {t.label}
              <span className={cn("text-[10.5px] px-1.5 py-px rounded-full font-mono", tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
          {/* Top Sellers by Revenue */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[13px] font-semibold">Top Sellers by Revenue</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  ["Total", fmtMoney(totalRev, true)],
                  ["vs last", "↑ 8.4%"],
                  ["Avg/seller", fmtMoney(avgRev, true)],
                  ["Top category", topCat],
                ].map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-[11px]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={cn("font-medium", k === "vs last" ? "text-emerald-600 dark:text-emerald-400 font-mono" : "font-mono")}>{v}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 pt-3 pb-1">
              <BarChartLabeled
                data={topFive.map(c => ({ label: c.name.length > 12 ? c.name.slice(0, 11) + "…" : c.name, value: c.revenue, aboveAvg: c.revenue >= avgRev }))}
                avg={avgRev}
              />
            </div>
            <div className="grid border-t border-border" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {[
                ["Top earner", topEarner?.name || "—", fmtMoney(topEarner?.revenue || 0, true)],
                ["Most orders", mostOrders?.name || "—", `${mostOrders?.orders || 0} orders`],
                ["Fastest growing", fastest?.name || "—", "+24.3%"],
              ].map(([k, n, v], i) => (
                <div key={i} className={cn("px-4 py-3", i > 0 && "border-l border-border")}>
                  <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground font-medium">{k}</div>
                  <div className="text-[12.5px] font-medium mt-1 truncate">{n}</div>
                  <div className="text-[11.5px] text-muted-foreground font-mono mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Mix */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[13px] font-semibold">Category Mix</h3>
              <p className="text-[11.5px] text-muted-foreground">Revenue distribution across categories</p>
            </div>
            <div className="p-4 grid gap-4" style={{ gridTemplateColumns: "auto 1fr", alignItems: "center" }}>
              <div className="relative" style={{ width: 160, height: 160 }}>
                <DonutChartBare data={catList} size={160} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-0.5">
                  <div className="text-[20px] font-semibold tracking-tight">{allSellers.length}</div>
                  <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground">Sellers</div>
                  <div className="font-mono text-[12px] font-medium mt-1">{fmtMoney(totalRev, true)}</div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {catList.slice(0, 6).map(c => (
                  <div key={c.name} className="grid gap-2 items-center text-[12px]" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: c.color }} />
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 bg-muted px-1 rounded">{c.value}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(c.revenue / catTotal) * 100}%`, background: c.color }} />
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-medium min-w-14 text-right">{fmtMoney(c.revenue, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Compliance alert */}
        {lowCompliance > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1 text-[12.5px]">
              <b>{lowCompliance} sellers</b> have compliance score below 60% — review recommended
            </div>
            <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-700 text-[12px]" onClick={() => setTab("all")}>
              Review all
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-1.5 h-[30px] px-2.5 rounded border border-border bg-background flex-1 max-w-[280px]">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search sellers…"
                className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <select className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none w-[160px]">
              <option>All categories</option>
              {catList.map(c => <option key={c.name}>{c.name}</option>)}
            </select>
            <select className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none w-[160px]">
              <option>All compliance</option>
              <option>High (≥80%)</option>
              <option>Medium (60–79%)</option>
              <option>Low (&lt;60%)</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Country</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Categories</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Orders</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Rating</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Compliance</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map(c => {
                  const comp = c.compliance || 0;
                  const cv = comp > 80 ? "text-emerald-600 dark:text-emerald-400" : comp > 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.name} size="sm" variant="seller" />
                          <div>
                            <Link href={`/clients/${c.id}`} className="font-medium hover:text-primary transition-colors">{c.name}</Link>
                            <div className="text-[11px] text-muted-foreground">{c.contact.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        <span className="font-mono text-[10.5px] mr-1.5">{c.countryCode}</span>{c.country}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {c.categories.slice(0, 2).map(cat => (
                            <span key={cat} className="px-1.5 py-0.5 rounded bg-muted text-[10.5px]">{cat}</span>
                          ))}
                          {c.categories.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10.5px]">+{c.categories.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{c.orders}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{fmtMoney(c.revenue, true)}</td>
                      <td className="px-3 py-2.5">
                        {c.rating ? (
                          <div className="flex items-center gap-1.5">
                            <Stars value={c.rating} />
                            <span className="font-mono text-[11px]">{c.rating.toFixed(1)}</span>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {c.compliance ? (
                          <span className={cn("font-mono text-[12px] font-medium", cv)}>{c.compliance}%</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-2 py-2.5">
                        <button className="w-7 h-7 grid place-items-center rounded text-muted-foreground hover:bg-muted transition-colors">
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[12px] text-muted-foreground">
            <span>Showing <b className="text-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)}</b> of <b className="text-foreground">{rows.length}</b></span>
            <div className="flex items-center gap-2">
              <button className={cn("w-7 h-7 grid place-items-center rounded border border-border hover:bg-muted transition-colors", page === 1 && "opacity-40 pointer-events-none")} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={13} />
              </button>
              <span className="font-mono text-[11.5px]">{page} / {totalPages}</span>
              <button className={cn("w-7 h-7 grid place-items-center rounded border border-border hover:bg-muted transition-colors", page >= totalPages && "opacity-40 pointer-events-none")} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

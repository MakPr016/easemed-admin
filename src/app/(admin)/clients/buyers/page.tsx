"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, Plus, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { CLIENTS } from "@/lib/data";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function TierCard({ label, sub, count, total, hue }: { label: string; sub: string; count: number; total: number; hue: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3.5 cursor-pointer hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12.5px] font-semibold">{label}</div>
          <div className="text-[11px] text-muted-foreground">{sub}</div>
        </div>
        <span className="w-1.5 h-9 rounded-full flex-shrink-0" style={{ background: hue }} />
      </div>
      <div className="text-[22px] font-semibold mt-2.5 tracking-tight tabular-nums">
        {count}<span className="text-[12px] text-muted-foreground font-normal ml-1.5">buyers</span>
      </div>
      <div className="text-[11.5px] text-muted-foreground font-mono mt-0.5">{fmtMoney(total, true)} total</div>
    </div>
  );
}

function Stars({ value = 0 }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" width="12" height="12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" className={i <= full ? "fill-amber-400 stroke-amber-400" : "fill-none stroke-muted-foreground"} />
        </svg>
      ))}
    </span>
  );
}

export default function BuyersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [page, setPage] = useState(1);

  const allBuyers = useMemo(() => CLIENTS.filter(c => c.type === "buyer"), []);

  const tiers = useMemo(() => ({
    enterprise: allBuyers.filter(c => c.totalSpend >= 500000),
    mid: allBuyers.filter(c => c.totalSpend >= 50000 && c.totalSpend < 500000),
    smb: allBuyers.filter(c => c.totalSpend < 50000),
  }), [allBuyers]);

  const topBuyers = useMemo(() => [...allBuyers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5), [allBuyers]);
  const deltas = [12.4, 8.0, 3.2, -2.1, 1.4];

  const rows = useMemo(() => {
    return allBuyers.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (industryFilter && c.industry !== industryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allBuyers, search, statusFilter, industryFilter]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const industries = [...new Set(allBuyers.map(c => c.industry))].sort();

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
            <span className="text-foreground font-medium">Buyers</span>
          </div>
          <h1 className="text-[18px] font-semibold tracking-tight">Buyers</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">
            {allBuyers.length} buyers · {fmtMoney(allBuyers.reduce((s, c) => s + c.totalSpend, 0), true)} total spend
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export</Button>
          <Button size="sm" className="gap-1.5"><Plus size={13} />Add Buyer</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-4">
        {/* Tier cards */}
        <div className="grid grid-cols-3 gap-3">
          <TierCard label="Enterprise" sub=">$500k spend" count={tiers.enterprise.length} total={tiers.enterprise.reduce((s, c) => s + c.totalSpend, 0)} hue="var(--primary)" />
          <TierCard label="Mid-Market" sub="$50k–$500k" count={tiers.mid.length} total={tiers.mid.reduce((s, c) => s + c.totalSpend, 0)} hue="oklch(0.65 0.14 210)" />
          <TierCard label="SMB" sub="<$50k" count={tiers.smb.length} total={tiers.smb.reduce((s, c) => s + c.totalSpend, 0)} hue="oklch(0.7 0.1 180)" />
        </div>

        {/* Top Buyers Leaderboard */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="text-[13px] font-semibold">Top Buyers · This Month</h3>
              <p className="text-[11.5px] text-muted-foreground">Ranked by spend, with change vs last month</p>
            </div>
            <Link href="/clients?type=buyer&sort=spend">
              <Button variant="ghost" size="sm" className="gap-1 text-[12px]">View all <ChevronRight size={12} /></Button>
            </Link>
          </div>
          <div className="buyers-leaderboard divide-y divide-border">
            {topBuyers.map((c, i) => {
              const delta = deltas[i];
              const up = delta >= 0;
              return (
                <Link key={c.id} href={`/clients/${c.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <span className="font-mono text-[11px] text-muted-foreground w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Avatar name={c.name} size="sm" variant="buyer" />
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-medium truncate">{c.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{c.industry}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-[12.5px] font-medium">{fmtMoney(c.totalSpend, true)}</span>
                    <span className={cn("font-mono text-[11.5px]", up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                      {up ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-wrap">
            <div className="flex items-center gap-1.5 h-[30px] px-2.5 rounded border border-border bg-background flex-1 max-w-[280px]">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search buyers…"
                className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none w-[140px]">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={industryFilter} onChange={e => { setIndustryFilter(e.target.value); setPage(1); }} className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none w-[160px]">
              <option value="">All industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Contact</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Country</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Orders</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Total Spend</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground w-44">Credit Utilization</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">KYC</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map(c => {
                  const util = c.creditLimit ? c.currentBalance / c.creditLimit : 0;
                  const over = util > 0.8;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.name} size="sm" variant="buyer" />
                          <div>
                            <Link href={`/clients/${c.id}`} className="font-medium hover:text-primary transition-colors">{c.name}</Link>
                            <div className="text-[11px] text-muted-foreground">{c.industry}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[160px] truncate">{c.contact.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        <span className="font-mono text-[10.5px] mr-1.5">{c.countryCode}</span>{c.country}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{c.orders}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{fmtMoney(c.totalSpend, true)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : "bg-primary")}
                              style={{ width: `${Math.min(util * 100, 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10.5px] text-muted-foreground w-8 text-right">{Math.round(util * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.kycStatus} /></td>
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

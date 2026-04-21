"use client";
import { useState } from "react";
import { Search, Download, FileText, X, Check, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { CLIENTS } from "@/lib/data";
import { fmtDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/data";

function Kpi({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg px-5 py-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="text-[24px] font-bold tracking-tight font-mono leading-none">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1.5">{sub}</div>}
    </div>
  );
}

const DOC_NAMES = ["Certificate of Incorporation", "Tax Registration", "Insurance Certificate", "Beneficial Ownership", "Audited Financials"];

export default function ApprovalsPage() {
  const pending = CLIENTS.filter(c => c.status === "pending");
  const [reviewing, setReviewing] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());

  const rows = pending.filter(c => {
    if (typeFilter && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    }
    return true;
  }).filter(c => !approved.has(c.id) && !rejected.has(c.id));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Pending Approvals</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{pending.length} clients awaiting review · 2 overdue</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4 flex flex-col gap-4">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-3">
          <Kpi label="Awaiting Review" value={rows.length} />
          <Kpi label="Approved Today" value={7} sub="↑ 16.7% vs yesterday" />
          <Kpi label="Rejected Today" value={2} sub="↓ 28.6% vs yesterday" />
          <Kpi label="Avg Review Time" value="38h" />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-wrap">
            <div className="flex items-center gap-1.5 h-[30px] px-2.5 rounded border border-border bg-background flex-1 max-w-[280px]">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search pending…"
                className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none w-[140px]">
              <option value="">All types</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
            <select className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none w-[160px]">
              <option>All reviewers</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Submitted</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Days Waiting</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">KYC</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Docs</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Reviewer</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.slice(0, 12).map(c => {
                  const submitted = c.submittedAt || c.createdAt;
                  const days = Math.floor((Date.now() - new Date(submitted).getTime()) / 86400000);
                  const overdue = days > 3;
                  const docCount = 3 + (c.id.charCodeAt(c.id.length - 1) % 3);
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => setReviewing(c)}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.name} size="sm" variant={c.type} />
                          <span className="font-medium hover:text-primary">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><TypeBadge type={c.type} /></td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{fmtDateShort(submitted)}</td>
                      <td className={cn("px-3 py-2.5 text-right font-mono", overdue ? "text-red-600 dark:text-red-400" : "")}>
                        {days}d{overdue && " ⚠"}
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.kycStatus} /></td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[11px]">{docCount}/5</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {c.assignedManager ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={c.assignedManager.name} size="sm" />
                            <span className="text-muted-foreground">{c.assignedManager.name.split(" ")[0]}</span>
                          </div>
                        ) : <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px] px-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-950/30"
                            onClick={() => setApproved(s => new Set([...s, c.id]))}
                          >Approve</Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[11px] px-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950/30"
                            onClick={() => setRejected(s => new Set([...s, c.id]))}
                          >Reject</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">No pending approvals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Sheet */}
      {reviewing && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setReviewing(null)} />
          <div className="fixed right-0 top-0 h-full w-[440px] max-w-full bg-card border-l border-border z-50 flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar name={reviewing.name} size="md" variant={reviewing.type} />
                <div>
                  <h3 className="text-[15px] font-semibold">{reviewing.name}</h3>
                  <div className="font-mono text-[11px] text-muted-foreground">{reviewing.id}</div>
                </div>
              </div>
              <button onClick={() => setReviewing(null)} className="w-8 h-8 grid place-items-center rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Client info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[["Type", <TypeBadge key="t" type={reviewing.type} />], ["Country", reviewing.country], ["Industry", reviewing.industry], ["Contact", reviewing.contact.name], ["Email", reviewing.contact.email], ["KYC Status", <StatusBadge key="k" status={reviewing.kycStatus} />]].map(([k, v]) => (
                  <div key={String(k)}>
                    <div className="text-[10.5px] text-muted-foreground uppercase tracking-wider mb-0.5">{k}</div>
                    <div className="text-[12.5px] font-medium">{v}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-[12.5px] font-semibold mb-3">Documents Uploaded</h4>
                <div className="flex flex-col gap-2">
                  {DOC_NAMES.slice(0, 4).map(name => (
                    <div key={name} className="flex items-center gap-2.5 px-3 py-2 border border-border rounded-lg">
                      <FileText size={13} className="text-muted-foreground shrink-0" />
                      <span className="flex-1 text-[12.5px]">{name}</span>
                      <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">View</Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-[12.5px] font-semibold mb-3">Decision</h4>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[12px] font-medium mb-1">Rejection reason (if rejecting)</label>
                    <select className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">—</option>
                      <option>Incomplete documents</option>
                      <option>Failed KYC</option>
                      <option>Duplicate account</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium mb-1">Comment (required)</label>
                    <textarea className="w-full min-h-20 px-3 py-2 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y" placeholder="Explain your decision..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border px-5 py-3.5 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setReviewing(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => { setRejected(s => new Set([...s, reviewing.id])); setReviewing(null); }}>Reject</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setApproved(s => new Set([...s, reviewing.id])); setReviewing(null); }}>
                <Check size={13} className="mr-1" />Approve
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

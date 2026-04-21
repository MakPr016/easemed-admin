"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Archive, ScrollText, FileText, Upload, Send, MapPin, MoreHorizontal, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { CLIENTS, TRANSACTIONS, AUDIT_LOG } from "@/lib/data";
import { fmtMoney, fmtDate, fmtDateShort, relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABS = [
  ["overview", "Overview"],
  ["transactions", "Transactions"],
  ["documents", "Documents"],
  ["compliance", "Compliance"],
  ["activity", "Activity Log"],
  ["notes", "Notes"],
] as const;

type Tab = typeof TABS[number][0];

const DOCS = [
  { name: "Certificate of Incorporation", uploadedAt: "2026-01-14", expires: "2029-01-14", status: "verified" },
  { name: "Tax Registration", uploadedAt: "2026-01-14", expires: "2027-01-14", status: "verified" },
  { name: "Insurance Certificate", uploadedAt: "2025-10-02", expires: "2026-06-15", status: "pending" },
  { name: "Audited Financials 2024", uploadedAt: "2026-02-11", expires: null, status: "verified" },
  { name: "ISO 9001 Certificate", uploadedAt: "2025-08-01", expires: "2026-03-20", status: "expired" },
  { name: "Beneficial Ownership", uploadedAt: "2026-01-20", expires: null, status: "pending" },
];

const NOTES = [
  { a: "Sarah Chen", d: "2026-04-18T10:00", t: "Client requested Q2 credit review — scheduled call for next Tue. They want to bump the line from $1.5M to $2.5M citing new factory builds in Hamburg." },
  { a: "Marcus Okafor", d: "2026-03-12T14:22", t: "Resolved invoice dispute #INV-44821 — confirmed duplicate charge, issued $4,280 credit back to account." },
  { a: "Priya Sharma", d: "2026-02-22T09:15", t: "KYC re-verification completed. No sanctions hits. All UBO documents on file." },
];

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-border rounded-lg px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-[13px] font-medium truncate", mono && "font-mono")}>{value}</div>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] || "";
  const client = CLIENTS.find(c => c.id === id) || CLIENTS[0];
  const [tab, setTab] = useState<Tab>("overview");

  const isBuyer = client.type === "buyer";
  const txns = TRANSACTIONS.filter(t => t.buyerId === client.id || t.sellerId === client.id);
  const totalIn = txns.filter(t => t.type === "payment").reduce((s, t) => s + t.amount, 0);
  const totalOut = txns.filter(t => t.type === "refund" || t.type === "fee").reduce((s, t) => s + t.amount, 0);
  const util = isBuyer && client.creditLimit > 0 ? Math.round(client.currentBalance / client.creditLimit * 100) : null;
  const activity = AUDIT_LOG.filter(l => l.entityId === client.id).concat(AUDIT_LOG.slice(0, 8)).slice(0, 12);

  const txnBadge = (type: string) => type === "payment" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : type === "refund" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : type === "fee" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

  return (
    <div className="flex flex-col h-full">
      {/* Hero */}
      <div className="px-6 py-4 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={client.name} size="xl" variant={client.type} />
            <div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mb-1">
                <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                <span>/</span>
                <Link href="/clients" className="hover:text-foreground">Clients</Link>
                <span>/</span>
                <span className="font-mono text-foreground">{client.id}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-[20px] font-semibold tracking-tight">{client.name}</h1>
                <TypeBadge type={client.type} />
                <StatusBadge status={client.status} />
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  ["Joined", fmtDate(client.createdAt)],
                  ["Country", client.country],
                  ["Industry", client.industry],
                  ["Manager", client.assignedManager.name],
                ].map(([k, v]) => (
                  <span key={k} className="inline-flex items-center gap-1.5 text-[11.5px] px-2 py-1 rounded bg-muted">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Button variant="outline" size="sm" className="gap-1.5"><Pencil size={13} />Edit Profile</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Archive size={13} />{client.status === "suspended" ? "Reactivate" : "Suspend"}</Button>
            <Link href={`/audit-log?entity=${client.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5"><ScrollText size={13} />Audit Log</Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-border -mb-px">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn("px-4 py-2 text-[12.5px] font-medium border-b-2 -mb-px transition-colors", tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-auto px-6 py-4">

        {tab === "overview" && (
          <div className="flex flex-col gap-4">
            {/* KPI strip */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: isBuyer ? "Total Orders" : "Orders Fulfilled", value: String(client.orders), mono: true, color: null, sub: null },
                { label: isBuyer ? "Lifetime Spend" : "Lifetime Revenue", value: fmtMoney(isBuyer ? client.totalSpend : client.revenue, true), mono: true, color: null, sub: null },
                isBuyer
                  ? { label: "Credit Utilization", value: `${util}%`, mono: true, sub: `${fmtMoney(client.currentBalance, true)} of ${fmtMoney(client.creditLimit, true)}`, color: (util || 0) > 80 ? "text-red-600 dark:text-red-400" : (util || 0) > 55 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400" }
                  : { label: "Avg Rating", value: client.rating ? `${client.rating.toFixed(1)} ★` : "—", mono: false, sub: client.compliance ? `Compliance ${client.compliance}%` : null, color: null },
                { label: "Risk Score", value: String(client.riskScore), mono: true, sub: "out of 100", color: client.riskScore > 70 ? "text-red-600 dark:text-red-400" : client.riskScore > 40 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400" },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-lg px-5 py-4">
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{s.label}</div>
                  <div className={cn("text-[24px] font-bold tracking-tight leading-none", s.mono && "font-mono", s.color)}>{s.value}</div>
                  {s.sub && <div className="text-[11px] text-muted-foreground mt-1.5">{s.sub}</div>}
                </div>
              ))}
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
              {/* Left column */}
              <div className="flex flex-col gap-4">
                {/* Contact Info */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold">Contact Information</h3>
                    <span className="text-[11.5px] text-muted-foreground">Primary business contact details</span>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-2.5">
                    <InfoCell label="Contact Name" value={client.contact.name} />
                    <InfoCell label="Job Title" value={client.contact.title} />
                    <InfoCell label="Country" value={client.country} />
                    <InfoCell label="Email Address" value={client.contact.email} />
                    <InfoCell label="Phone Number" value={client.contact.phone} mono />
                    <InfoCell label="City" value={client.address.city} />
                  </div>
                  <div className="px-4 py-3 border-t border-border flex items-start gap-2 text-[13px] text-muted-foreground">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span>{client.address.street}, {client.address.city} {client.address.postalCode}, {client.country}</span>
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold">Business Details</h3>
                    <span className="text-[11.5px] text-muted-foreground">{isBuyer ? "Procurement & credit information" : "Seller profile & payout setup"}</span>
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-2.5">
                    {(isBuyer ? [
                      ["Payment Terms", client.paymentTerms, false],
                      ["Credit Limit", fmtMoney(client.creditLimit), true],
                      ["Outstanding Balance", fmtMoney(client.currentBalance), true],
                      ["Utilization", `${util}%`, true],
                      ["Total Orders", String(client.orders), true],
                      ["Lifetime Spend", fmtMoney(client.totalSpend), true],
                    ] : [
                      ["Payout Schedule", client.payoutSchedule, false],
                      ["Bank Account", "•••• •••• 4821", true],
                      ["Avg Rating", client.rating ? client.rating.toFixed(2) : "—", true],
                      ["Compliance Score", client.compliance ? `${client.compliance}%` : "—", true],
                      ["Orders Fulfilled", String(client.orders), true],
                      ["Lifetime Revenue", fmtMoney(client.revenue), true],
                    ] as [string, string, boolean][]).map(([label, val, mono]) => (
                      <InfoCell key={String(label)} label={String(label)} value={String(val)} mono={mono as boolean} />
                    ))}
                  </div>
                  {isBuyer && util !== null && (
                    <div className="px-4 pb-4">
                      <div className="text-[11px] text-muted-foreground mb-1.5">Credit line usage</div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", util > 80 ? "bg-destructive" : util > 55 ? "bg-amber-500" : "bg-primary")}
                          style={{ width: `${Math.min(util, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10.5px] text-muted-foreground font-mono">
                        <span>{fmtMoney(client.currentBalance)} used</span>
                        <span>{fmtMoney(client.creditLimit)} limit</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Transactions mini */}
                {txns.length > 0 && (
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div>
                        <h3 className="text-[13px] font-semibold">Recent Transactions</h3>
                        <p className="text-[11.5px] text-muted-foreground">Last {Math.min(txns.length, 5)} of {txns.length}</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setTab("transactions")}>View all</Button>
                    </div>
                    <table className="w-full text-[12.5px]">
                      <thead><tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">ID</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                      </tr></thead>
                      <tbody className="divide-y divide-border">
                        {txns.slice(0, 5).map(t => (
                          <tr key={t.id} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{t.id}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">{fmtDateShort(t.createdAt)}</td>
                            <td className="px-3 py-2"><span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", txnBadge(t.type))}>{t.type}</span></td>
                            <td className="px-3 py-2 text-right font-mono">{fmtMoney(t.amount)}</td>
                            <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <div className="flex flex-col gap-4">
                {/* Assigned Manager */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold">Assigned Manager</h3></div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar name={client.assignedManager.name} size="lg" />
                      <div>
                        <div className="text-[13.5px] font-semibold">{client.assignedManager.name}</div>
                        <div className="text-[11.5px] text-muted-foreground mt-0.5">{client.assignedManager.email}</div>
                        <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10.5px] font-medium">Account Manager</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full justify-center gap-1.5 text-[12.5px]"><Send size={12} />Send message</Button>
                  </div>
                </div>

                {/* Account Health */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold">Account Health</h3></div>
                  <div className="px-4 py-3 flex flex-col gap-2.5">
                    {[
                      ["KYC Status", <StatusBadge key="kyc" status={client.kycStatus} />],
                      ["Account Status", <StatusBadge key="acc" status={client.status} />],
                      ["Open Disputes", <span key="dis" className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", client.disputeCount > 5 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : client.disputeCount > 2 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400")}>{client.disputeCount}</span>],
                      ["Risk Score", <span key="risk" className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", client.riskScore > 70 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : client.riskScore > 40 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400")}>{client.riskScore} / 100</span>],
                      ["Doc Expiry", <span key="doc" className="font-mono text-[12px] text-muted-foreground">{fmtDate(client.documentExpiry)}</span>],
                    ].map(([label, el], i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-[12px] text-muted-foreground">{label}</span>
                        {el}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold">Quick Actions</h3></div>
                  <div className="px-4 py-3 flex flex-col gap-1.5">
                    <Button variant="outline" size="sm" className="justify-start gap-1.5 text-[12.5px]" onClick={() => setTab("documents")}><FileText size={12} />View Documents</Button>
                    <Button variant="outline" size="sm" className="justify-start gap-1.5 text-[12.5px]" onClick={() => setTab("compliance")}><Check size={12} />Compliance Review</Button>
                    <Button variant="outline" size="sm" className="justify-start gap-1.5 text-[12.5px]"><Pencil size={12} />Edit Profile</Button>
                    <Button variant="outline" size="sm" className="justify-start gap-1.5 text-[12.5px] text-destructive border-destructive/30 hover:bg-destructive/10"><Archive size={12} />{client.status === "suspended" ? "Reactivate Account" : "Suspend Account"}</Button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold">Recent Activity</h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setTab("activity")}>See all</Button>
                  </div>
                  <div className="divide-y divide-border">
                    {activity.slice(0, 4).map((l, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-4 py-2.5">
                        <span className={cn("px-1.5 py-0.5 rounded text-[10.5px] font-medium mt-0.5 shrink-0", l.action === "Create" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : l.action === "Approve" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : l.action === "Reject" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground")}>{l.action}</span>
                        <div>
                          <div className="text-[12px] font-medium">{l.actor}</div>
                          <div className="text-[11px] text-muted-foreground">{relTime(l.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "transactions" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="sm" className="text-[12.5px]">Last 90 days</Button>
              <select className="h-8 px-2.5 rounded border border-border bg-card text-[12.5px] focus:outline-none w-[140px]">
                <option>All types</option>
                <option>payment</option><option>refund</option><option>fee</option><option>payout</option>
              </select>
              <select className="h-8 px-2.5 rounded border border-border bg-card text-[12.5px] focus:outline-none w-[140px]">
                <option>All statuses</option>
              </select>
              <div className="ml-auto flex items-center gap-5 text-[12px]">
                <div><span className="text-muted-foreground">Total In </span><b className="font-mono">{fmtMoney(totalIn, true)}</b></div>
                <div><span className="text-muted-foreground">Total Out </span><b className="font-mono">{fmtMoney(totalOut, true)}</b></div>
                <div><span className="text-muted-foreground">Net </span><b className="font-mono text-emerald-600 dark:text-emerald-400">{fmtMoney(totalIn - totalOut, true)}</b></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-[12.5px]">
                <thead><tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Txn ID</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Linked Party</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {(txns.length > 0 ? txns : TRANSACTIONS).slice(0, 10).map(t => (
                    <tr key={t.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-mono text-[11.5px]">{t.id}</td>
                      <td className="px-3 py-2.5 font-mono text-muted-foreground">{fmtDateShort(t.createdAt)}</td>
                      <td className="px-3 py-2.5"><span className={cn("px-1.5 py-0.5 rounded text-[11px] font-medium", txnBadge(t.type))}>{t.type}</span></td>
                      <td className="px-3 py-2.5 text-right font-mono">{fmtMoney(t.amount)}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{t.linkedParty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "documents" && (
          <div className="grid grid-cols-3 gap-3">
            {DOCS.map((d, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-3.5">
                <div className="flex items-start gap-3 mb-2.5">
                  <div className="w-8 h-8 rounded-md bg-muted grid place-items-center text-muted-foreground shrink-0">
                    <FileText size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-medium truncate">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">Uploaded {fmtDateShort(d.uploadedAt)}</div>
                  </div>
                  <StatusBadge status={d.status === "expired" ? "failed" : d.status === "verified" ? "verified" : "pending"} />
                </div>
                {d.expires && <div className="text-[11px] text-muted-foreground mb-2.5">Expires {fmtDate(d.expires)}</div>}
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">View</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[11px] px-2">Re-request</Button>
                  {d.status !== "verified" && <Button size="sm" className="h-6 text-[11px] px-2">Verify</Button>}
                </div>
              </div>
            ))}
            <button className="bg-card border border-dashed border-border rounded-lg p-3.5 flex items-center justify-center gap-2 text-[12.5px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors min-h-20">
              <Upload size={15} />Upload document
            </button>
          </div>
        )}

        {tab === "compliance" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold">KYC Timeline</h3></div>
              <div className="p-4 flex flex-col gap-0">
                {[
                  ["done", "Submitted", "Feb 14, 2026 · Documents uploaded"],
                  ["done", "Under Review", `Feb 15, 2026 · Assigned to ${client.assignedManager.name}`],
                  [client.kycStatus === "verified" ? "done" : "active", client.kycStatus === "verified" ? "Approved" : "Compliance Check", client.kycStatus === "verified" ? "Feb 22, 2026" : "Awaiting AML screening"],
                ].map(([state, title, sub], i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1", state === "done" ? "border-primary bg-primary" : state === "active" ? "border-primary bg-card" : "border-muted-foreground/30 bg-card")}>
                        {state === "done" && <Check size={10} className="text-primary-foreground" />}
                        {state === "active" && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      {i < 2 && <div className={cn("w-px flex-1 my-1", state === "done" ? "bg-primary" : "bg-border")} style={{ minHeight: 20 }} />}
                    </div>
                    <div className="pb-4">
                      <div className="text-[12.5px] font-medium">{title}</div>
                      <div className="text-[11.5px] text-muted-foreground mt-0.5">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold">Risk Score</h3></div>
              <div className="p-4">
                <div className="text-[36px] font-bold tracking-tight leading-none font-mono">
                  {client.riskScore}<span className="text-[14px] text-muted-foreground font-normal ml-2">/100</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mt-3">
                  <div className={cn("h-full rounded-full", client.riskScore > 70 ? "bg-destructive" : client.riskScore > 40 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${client.riskScore}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[["Sanctions Check", "pass"], ["AML Flag", "pass"], ["PEP Status", client.riskScore > 50 ? "flag" : "pass"], ["Adverse Media", "pass"]].map(([l, s]) => (
                    <div key={l} className="flex items-center justify-between px-2.5 py-1.5 border border-border rounded-md">
                      <span className="text-[12px] text-muted-foreground">{l}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10.5px] font-medium", s === "pass" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700")}>
                        {s === "pass" ? "Pass" : "Review"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden col-span-2">
              <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold">Compliance Notes</h3></div>
              <div className="p-4">
                <textarea className="w-full min-h-24 px-3 py-2 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y"
                  defaultValue="Initial review completed 2026-02-22. Verified incorporation docs + UBO structure against Land Registry. No sanctions hits. Annual review scheduled for Feb 2027."
                />
                <div className="flex justify-end mt-2">
                  <Button size="sm">Save Notes</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "activity" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-[13px] font-semibold">Activity Log</h3>
              <select className="h-8 px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none w-[160px]">
                <option>All event types</option>
              </select>
            </div>
            <div className="max-h-[520px] overflow-y-auto divide-y divide-border">
              {activity.map((l, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30">
                  <span className={cn("px-1.5 py-0.5 rounded text-[10.5px] font-medium mt-0.5 shrink-0", l.action === "Create" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : l.action === "Approve" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : l.action === "Reject" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-muted text-muted-foreground")}>{l.action}</span>
                  <div className="flex-1">
                    <div className="text-[12.5px]">
                      {l.actor} {l.action.toLowerCase()}d {l.entity.toLowerCase()} <span className="font-mono text-muted-foreground">{l.entityId}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{relTime(l.timestamp)} · from {l.ipAddress}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><h3 className="text-[13px] font-semibold">Admin Notes</h3></div>
            <div className="p-4">
              <textarea className="w-full min-h-20 px-3 py-2 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y"
                placeholder="Add a note about this client..."
                rows={3}
              />
              <div className="flex justify-end mt-2 mb-4">
                <Button size="sm">Add Note</Button>
              </div>
              <div className="border-t border-border divide-y divide-border">
                {NOTES.map((n, i) => (
                  <div key={i} className="flex items-start gap-3 py-3">
                    <Avatar name={n.a} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12.5px] font-medium">{n.a}</span>
                        <span className="text-[11px] text-muted-foreground">{fmtDate(n.d)}</span>
                      </div>
                      <p className="text-[12.5px] leading-relaxed">{n.t}</p>
                    </div>
                    <button className="w-7 h-7 grid place-items-center rounded text-muted-foreground hover:bg-muted transition-colors shrink-0">
                      <MoreHorizontal size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

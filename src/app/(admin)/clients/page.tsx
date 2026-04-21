"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, Plus, MoreHorizontal, Eye, Pencil, Archive, Trash2, SlidersHorizontal, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { CLIENTS, INDUSTRIES, MANAGERS } from "@/lib/data";
import { fmtDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/data";

const PAGE_SIZE = 14;

function ClientDrawer({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: () => void }) {
  const [type, setType] = useState<"buyer" | "seller">("buyer");
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] max-w-full bg-card border-l border-border z-50 flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-[15px] font-semibold">Add New Client</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Complete the form to register a client.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <section>
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Basic Information</h4>
            <div className="mb-3">
              <label className="block text-[12px] font-medium mb-1.5">Client Type</label>
              <div className="flex gap-2">
                {(["buyer", "seller"] as const).map(t => (
                  <button key={t} onClick={() => setType(t)} className={cn("h-8 px-4 rounded border text-[12.5px] font-medium capitalize transition-colors", type === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/50 text-muted-foreground hover:bg-muted")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["Company Name *", "Northwind Industrial"], ["Industry *", ""], ["Country *", ""], ["Registration Number", "HRB 123456"], ["Tax ID", "DE 123 456 789"], ["Website", "https://"]].map(([label, placeholder]) => (
                <div key={label}>
                  <label className="block text-[12px] font-medium mb-1">{label}</label>
                  {label === "Industry *" ? (
                    <select className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  ) : label === "Country *" ? (
                    <select className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Select country</option>
                    </select>
                  ) : (
                    <input className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" placeholder={placeholder} />
                  )}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Primary Contact</h4>
            <div className="grid grid-cols-2 gap-3">
              {[["Full Name *", "Jane Smith"], ["Title", "CFO"], ["Email *", "jane@company.com"], ["Phone", "+1 555 000 0000"]].map(([label, placeholder]) => (
                <div key={label}>
                  <label className="block text-[12px] font-medium mb-1">{label}</label>
                  <input className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" placeholder={placeholder} />
                </div>
              ))}
            </div>
          </section>
          <section>
            <h4 className="text-[12.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Assignment</h4>
            <div>
              <label className="block text-[12px] font-medium mb-1">Assigned Manager</label>
              <select className="w-full h-8 px-2.5 rounded border border-border bg-background text-[13px] focus:outline-none focus:ring-1 focus:ring-primary">
                {MANAGERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </section>
        </div>
        <div className="border-t border-border px-5 py-3.5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onSave}>Save Draft</Button>
        </div>
      </div>
    </>
  );
}

function ConfirmDialog({ open, title, body, confirmLabel, variant, onCancel, onConfirm }: {
  open: boolean; title?: string; body?: string; confirmLabel?: string; variant?: string; onCancel: () => void; onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-card border border-border rounded-xl shadow-xl z-50 p-6">
        <h3 className="text-[15px] font-semibold mb-2">{title}</h3>
        <p className="text-[13px] text-muted-foreground mb-5">{body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" variant={variant === "danger" ? "destructive" : "default"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenuRow, setOpenMenuRow] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ title: string; body: string; variant: string; label: string } | null>(null);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    return CLIENTS.filter(c => {
      if (typeFilter && c.type !== typeFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (industryFilter && c.industry !== industryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.contact.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter, typeFilter, industryFilter]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggle = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const allOn = pageRows.length > 0 && pageRows.every(r => selected.has(r.id));
  const someOn = selected.size > 0 && !allOn;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border bg-card">
        <div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mb-1">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Clients</span>
          </div>
          <h1 className="text-[18px] font-semibold tracking-tight">All Clients</h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{rows.length} of {CLIENTS.length} clients shown</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export CSV</Button>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}><Plus size={13} />Add Client</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border bg-card flex-wrap">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none focus:ring-1 focus:ring-primary w-[120px]">
          <option value="">All types</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none focus:ring-1 focus:ring-primary w-[140px]">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={industryFilter} onChange={e => { setIndustryFilter(e.target.value); setPage(1); }} className="h-[30px] px-2.5 rounded border border-border bg-background text-[12.5px] focus:outline-none focus:ring-1 focus:ring-primary w-[160px]">
          <option value="">All industries</option>
          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <div className="flex items-center gap-1.5 flex-1 max-w-[320px] h-[30px] px-2.5 rounded border border-border bg-background">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, ID, email…"
            className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 ml-auto"><SlidersHorizontal size={13} />More</Button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-primary/5 border-b border-primary/20">
          <span className="text-[12.5px] font-medium text-primary">{selected.size} client{selected.size > 1 ? "s" : ""} selected</span>
          <span className="flex-1" />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirm({ title: "Approve selected clients?", body: `This will mark ${selected.size} clients as active.`, variant: "accent", label: "Approve all" })}>Approve</Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setConfirm({ title: "Suspend selected clients?", body: `This will suspend ${selected.size} accounts.`, variant: "danger", label: "Suspend all" })}>Suspend</Button>
          <Button size="sm" variant="outline" className="h-7 text-xs">Export selected</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-9 px-3 py-2.5 text-left">
                    <span
                      className={cn("w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors", allOn ? "bg-primary border-primary" : someOn ? "bg-primary/40 border-primary" : "border-border hover:border-primary/50")}
                      onClick={() => setSelected(allOn ? new Set() : new Set(pageRows.map(r => r.id)))}
                    >
                      {allOn && <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5" /></svg>}
                      {someOn && <span className="w-2 h-0.5 bg-white rounded" />}
                    </span>
                  </th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Industry</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Country</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Registered</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">KYC</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Manager</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageRows.map(c => (
                  <tr key={c.id} className={cn("hover:bg-muted/30 transition-colors", selected.has(c.id) && "bg-primary/5")}>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn("w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors", selected.has(c.id) ? "bg-primary border-primary" : "border-border hover:border-primary/50")}
                        onClick={() => toggle(c.id)}
                      >
                        {selected.has(c.id) && <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5" /></svg>}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.name} size="sm" variant={c.type} />
                        <div>
                          <Link href={`/clients/${c.id}`} className="font-medium hover:text-primary transition-colors">{c.name}</Link>
                          <div className="text-[10.5px] text-muted-foreground font-mono">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><TypeBadge type={c.type} /></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.industry}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      <span className="font-mono text-[10.5px] mr-1.5">{c.countryCode}</span>{c.country.split(" ")[0]}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground">{fmtDateShort(c.createdAt)}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.kycStatus} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={c.assignedManager.name} size="sm" />
                        <span className="text-muted-foreground">{c.assignedManager.name.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 relative">
                      <button
                        className="w-7 h-7 grid place-items-center rounded text-muted-foreground hover:bg-muted transition-colors"
                        onClick={() => setOpenMenuRow(openMenuRow === c.id ? null : c.id)}
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      {openMenuRow === c.id && (
                        <div className="absolute right-2 top-9 w-44 bg-card border border-border rounded-lg shadow-lg p-1 z-20" onMouseLeave={() => setOpenMenuRow(null)}>
                          <Link href={`/clients/${c.id}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted" onClick={() => setOpenMenuRow(null)}>
                            <Eye size={13} className="text-muted-foreground" />View profile
                          </Link>
                          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted text-left" onClick={() => { setAddOpen(true); setOpenMenuRow(null); }}>
                            <Pencil size={13} className="text-muted-foreground" />Edit
                          </button>
                          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-muted text-left">
                            <Archive size={13} className="text-muted-foreground" />{c.status === "suspended" ? "Reactivate" : "Suspend"}
                          </button>
                          <div className="h-px bg-border my-1" />
                          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[12.5px] hover:bg-destructive/10 text-destructive text-left">
                            <Trash2 size={13} />Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[12px] text-muted-foreground">
            <span>Showing <b className="text-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)}</b> of <b className="text-foreground">{rows.length}</b></span>
            <div className="flex items-center gap-2">
              <button className={cn("w-7 h-7 grid place-items-center rounded border border-border hover:bg-muted transition-colors", page === 1 && "opacity-40 pointer-events-none")} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={13} />
              </button>
              <span className="font-mono text-[11.5px]">Page {page} of {totalPages}</span>
              <button className={cn("w-7 h-7 grid place-items-center rounded border border-border hover:bg-muted transition-colors", page === totalPages && "opacity-40 pointer-events-none")} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ClientDrawer open={addOpen} onClose={() => setAddOpen(false)} onSave={() => setAddOpen(false)} />
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        confirmLabel={confirm?.label}
        variant={confirm?.variant}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { setConfirm(null); setSelected(new Set()); }}
      />
    </div>
  );
}

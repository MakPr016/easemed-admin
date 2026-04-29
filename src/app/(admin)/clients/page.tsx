"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { loadHospitals, loadVendors, type AdminEntity } from "@/lib/admin-data";
import { fmtDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function entityStatus(entity: AdminEntity) {
  return entity.verificationStatus ?? (entity.isVerified ? 'verified' : 'pending')
}

export default function ClientsPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [page, setPage] = useState(1)
  const [entities, setEntities] = useState<AdminEntity[]>([])

  useEffect(() => {
    let alive = true

    Promise.all([loadHospitals(), loadVendors()])
      .then(([hospitals, vendors]) => {
        if (alive) setEntities([...hospitals.hospitals, ...vendors.vendors])
      })
      .catch(() => {
        if (alive) setEntities([])
      })

    return () => {
      alive = false
    }
  }, [])

  const rows = useMemo(() => entities.filter((entity) => {
    if (typeFilter && entity.type !== typeFilter) return false
    if (statusFilter && entityStatus(entity) !== statusFilter) return false
    if (!search) return true

    const query = search.toLowerCase()
    return [entity.name, entity.id, entity.contactEmail ?? '', entity.contactPerson ?? '', entity.city ?? '', entity.country ?? '']
      .some((value) => value.toLowerCase().includes(query))
  }), [entities, search, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
            <span>/</span>
            <span className="font-medium text-foreground">Entities</span>
          </div>
          <h1 className="text-[18px] font-semibold tracking-tight">All Entities</h1>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{rows.length} live records from Supabase</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-6 py-2.5">
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="h-7.5 w-35 rounded border border-border bg-background px-2.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All types</option>
          <option value="hospital">Hospitals</option>
          <option value="vendor">Vendors</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="h-7.5 w-37.5 rounded border border-border bg-background px-2.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="manual_override">Manual override</option>
        </select>
        <div className="flex h-7.5 max-w-80 flex-1 items-center gap-1.5 rounded border border-border bg-background px-2.5">
          <Search size={13} className="shrink-0 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, email, city…" className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Registered</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((entity) => (
                <tr key={entity.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={entity.name} size="sm" variant={entity.type} />
                      <div>
                        <Link href={`/clients/${entity.id}`} className="font-medium transition-colors hover:text-primary">{entity.name}</Link>
                        <div className="font-mono text-[10.5px] text-muted-foreground">{entity.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><TypeBadge type={entity.type} /></td>
                  <td className="px-3 py-2.5 text-muted-foreground">{[entity.city, entity.country].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    <div className="truncate">{entity.contactPerson || entity.contactEmail || '—'}</div>
                    <div className="truncate text-[11px]">{entity.contactEmail || entity.contactPhone || 'No contact email'}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{fmtDateShort(entity.createdAt)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={entityStatus(entity)} /></td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">No entities match the current filters.</td></tr>
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">
            <span>Showing <b className="text-foreground">{rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)}</b> of <b className="text-foreground">{rows.length}</b></span>
            <div className="flex items-center gap-2">
              <button className={cn("grid h-7 w-7 place-items-center rounded border border-border transition-colors hover:bg-muted", page === 1 && "pointer-events-none opacity-40")} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={13} /></button>
              <span className="font-mono text-[11.5px]">Page {safePage} of {totalPages}</span>
              <button className={cn("grid h-7 w-7 place-items-center rounded border border-border transition-colors hover:bg-muted", page === totalPages && "pointer-events-none opacity-40")} onClick={() => setPage((value) => value + 1)}><ChevronRight size={13} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
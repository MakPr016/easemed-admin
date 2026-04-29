"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { loadHospitals, loadVendors, submitVerificationAction, type AdminEntity } from "@/lib/admin-data";
import { fmtDateShort } from "@/lib/format";

function entityStatus(entity: AdminEntity) {
  return entity.verificationStatus ?? (entity.isVerified ? 'verified' : 'pending')
}

export default function ApprovalsPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [entities, setEntities] = useState<AdminEntity[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([loadHospitals(), loadVendors()])
      .then(([hospitals, vendors]) => {
        if (!alive) return
        setEntities([...hospitals.hospitals, ...vendors.vendors])
      })
      .catch(() => {
        if (!alive) return
        setEntities([])
      })

    return () => { alive = false }
  }, [])

  const rows = useMemo(() => entities.filter((entity) => {
    if (entityStatus(entity) !== 'pending') return false
    if (typeFilter && entity.type !== typeFilter) return false
    if (!search) return true
    const query = search.toLowerCase()
    return [entity.name, entity.id, entity.contactEmail ?? '', entity.city ?? '', entity.country ?? ''].some((value) => value.toLowerCase().includes(query))
  }), [entities, search, typeFilter])

  async function handleDecision(entity: AdminEntity, status: 'verified' | 'rejected') {
    setBusyId(entity.id)
    try {
      await submitVerificationAction({
        entityType: entity.type,
        entityId: entity.id,
        status,
        entity: {
          id: entity.id,
          user_id: entity.userId,
          hospital_name: entity.name,
          vendor_name: entity.name,
          created_at: entity.createdAt,
        },
      })
      setEntities((current) => current.map((currentEntity) => currentEntity.id === entity.id ? { ...currentEntity, verificationStatus: status, isVerified: status === 'verified' } : currentEntity))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Pending Approvals</h1>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">Review hospitals and vendors waiting in Supabase.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-6 py-2.5">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-7.5 w-35 rounded border border-border bg-background px-2.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="">All types</option>
          <option value="hospital">Hospitals</option>
          <option value="vendor">Vendors</option>
        </select>
        <div className="flex h-7.5 max-w-80 flex-1 items-center gap-1.5 rounded border border-border bg-background px-2.5">
          <Search size={13} className="shrink-0 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pending entities…" className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Entity</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Location</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Submitted</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((entity) => (
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
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{fmtDateShort(entity.createdAt)}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={entityStatus(entity)} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Button disabled={busyId === entity.id} size="sm" variant="outline" className="h-7 text-[11px] px-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => handleDecision(entity, 'verified')}>
                        <Check size={12} />Approve
                      </Button>
                      <Button disabled={busyId === entity.id} size="sm" variant="outline" className="h-7 text-[11px] px-2 text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleDecision(entity, 'rejected')}>
                        <X size={12} />Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">No pending entities found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
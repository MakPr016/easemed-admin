"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Building2, Download, FileCheck2, FileClock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { TypeBadge } from "@/components/ui/status-badge";
import { loadOverview, type OverviewResponse } from "@/lib/admin-data";
import { fmtDateShort } from "@/lib/format";

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
          <p className="mt-1 text-[11.5px] text-muted-foreground">{sub}</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">{icon}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null)

  useEffect(() => {
    let alive = true

    loadOverview()
      .then((data) => {
        if (alive) setOverview(data)
      })
      .catch(() => {
        if (alive) setOverview(null)
      })

    return () => {
      alive = false
    }
  }, [])

  const totalHospitals = overview?.totalHospitals ?? 0
  const totalVendors = overview?.totalVendors ?? 0
  const verifiedHospitals = overview?.verifiedHospitals ?? 0
  const verifiedVendors = overview?.verifiedVendors ?? 0
  const pendingHospitals = overview?.pendingHospitals ?? 0
  const pendingVendors = overview?.pendingVendors ?? 0

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-end justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">Live snapshot of hospitals, vendors, and verification activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Download size={13} />Export</Button>
        </div>
      </div>

      <div className="grid gap-4 p-6 lg:grid-cols-4">
        <StatCard label="Hospitals" value={totalHospitals} sub={`${verifiedHospitals} verified · ${pendingHospitals} pending`} icon={<Building2 size={16} />} />
        <StatCard label="Vendors" value={totalVendors} sub={`${verifiedVendors} verified · ${pendingVendors} pending`} icon={<Users size={16} />} />
        <StatCard label="Verified Total" value={verifiedHospitals + verifiedVendors} sub="Across all live entities" icon={<FileCheck2 size={16} />} />
        <StatCard label="Pending Review" value={pendingHospitals + pendingVendors} sub="Needs admin action" icon={<FileClock size={16} />} />
      </div>

      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <div>
              <h3 className="text-[13px] font-semibold">Recent Signups</h3>
              <p className="text-[11.5px] text-muted-foreground">Latest records created in Supabase</p>
            </div>
            <Link href="/clients">
              <Button variant="ghost" size="sm" className="gap-1 text-[12px]">View all <ArrowUpRight size={12} /></Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {(overview?.recentSignups ?? []).map((item) => (
              <div key={`${item.type}-${item.name}-${item.date}`} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={item.name} size="sm" variant={item.type === 'Hospital' ? 'hospital' : 'vendor'} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12.5px] font-medium">{item.name}</span>
                    <TypeBadge type={item.type === 'Hospital' ? 'hospital' : 'vendor'} />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{item.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11.5px] text-foreground">{fmtDateShort(item.date)}</div>
                </div>
              </div>
            ))}
            {(overview?.recentSignups?.length ?? 0) === 0 && (
              <div className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">No recent signups found.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3.5">
            <h3 className="text-[13px] font-semibold">Quick Links</h3>
            <p className="text-[11.5px] text-muted-foreground">Jump to the live admin workflows</p>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <Link href="/approvals"><Button className="w-full justify-start gap-2" variant="outline">Review approvals</Button></Link>
            <Link href="/clients"><Button className="w-full justify-start gap-2" variant="outline">Browse all entities</Button></Link>
            <Link href="/clients/buyers"><Button className="w-full justify-start gap-2" variant="outline">Open hospitals</Button></Link>
            <Link href="/clients/sellers"><Button className="w-full justify-start gap-2" variant="outline">Open vendors</Button></Link>
          </div>
        </div>
      </div>
    </div>
  )
}

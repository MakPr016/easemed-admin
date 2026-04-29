"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight, Calendar, Download, Globe, Loader2, Mail, MapPin, Phone, RefreshCw, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge, TypeBadge } from "@/components/ui/status-badge";
import { loadEntityStatistics, loadHospitals, loadVendorStatistics, loadVendors, type AdminEntity, type HospitalStatisticsResponse, type VendorStatisticsResponse } from "@/lib/admin-data";
import { fmtDateShort, fmtMoney } from "@/lib/format";
import { OnboardingDataView } from "@/components/admin/onboarding-data-view";
import { VerificationModal } from "@/components/admin/verification-modal";
import { useToast } from "@/components/ui/toast";

function entityStatus(entity: AdminEntity) {
  return entity.verificationStatus ?? (entity.isVerified ? 'verified' : 'pending')
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

function formatFieldValue(value: unknown) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function normalizeSeries(rows: Array<{ label: string; value: number; note?: string }>) {
  const max = rows.reduce((best, row) => Math.max(best, row.value), 0)
  return rows.map((row) => ({
    ...row,
    width: max > 0 ? Math.max(8, Math.round((row.value / max) * 100)) : 8,
  }))
}

function MiniBarChart({
  title,
  rows,
}: {
  title: string
  rows: Array<{ label: string; value: number; note?: string }>
}) {
  const series = normalizeSeries(rows)

  return (
    <div className="rounded-lg border border-border p-3">
      <h4 className="text-[12.5px] font-semibold">{title}</h4>
      {series.length === 0 ? (
        <p className="mt-2 text-[12px] text-muted-foreground">No data available.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {series.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-[11.5px]">
                <span className="truncate text-muted-foreground">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div className="h-2 rounded bg-foreground/70" style={{ width: `${row.width}%` }} />
              </div>
              {row.note && <div className="text-[11px] text-muted-foreground">{row.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function KeyValueGrid({
  title,
  values,
}: {
  title: string
  values: Record<string, unknown>
}) {
  const entries = Object.entries(values)

  return (
    <div>
      <h5 className="font-medium">{title}</h5>
      {entries.length === 0 ? (
        <p className="text-muted-foreground">No structured fields.</p>
      ) : (
        <div className="mt-1 overflow-x-auto rounded border border-border">
          <table className="min-w-full text-[11.5px]">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Field</th>
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-t border-border align-top">
                  <td className="px-2 py-1.5 font-mono">{key}</td>
                  <td className="px-2 py-1.5 break-all">{formatFieldValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-[11.5px] text-muted-foreground">{sub}</div>
    </div>
  )
}

export default function EntityDetailPage() {
  const params = useParams()
  const toast = useToast()
  const id = typeof params.id === "string" ? params.id : params.id?.[0] || ""
  const [entity, setEntity] = useState<AdminEntity | null>(null)
  const [entityLoaded, setEntityLoaded] = useState(false)
  const [hospitalStats, setHospitalStats] = useState<HospitalStatisticsResponse | null>(null)
  const [vendorStats, setVendorStats] = useState<VendorStatisticsResponse | null>(null)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    let alive = true

    Promise.all([loadHospitals(), loadVendors()])
      .then(([hospitals, vendors]) => {
        if (!alive) return

        const allEntities = [...hospitals.hospitals, ...vendors.vendors]
        const current = allEntities.find((row) => row.id === id || row.userId === id) ?? null
        setEntity(current)
        setEntityLoaded(true)

        if (current?.type === 'hospital') {
          loadEntityStatistics(current.id)
            .then((stats) => {
              if (alive) setHospitalStats(stats)
            })
            .catch(() => {
              if (alive) setHospitalStats(null)
            })
          setVendorStats(null)
        } else if (current?.type === 'vendor') {
          loadVendorStatistics(current.id)
            .then((stats) => {
              if (alive) setVendorStats(stats)
            })
            .catch(() => {
              if (alive) setVendorStats(null)
            })
          setHospitalStats(null)
        } else {
          setHospitalStats(null)
          setVendorStats(null)
        }
      })
      .catch(() => {
        if (!alive) return
        setEntity(null)
        setEntityLoaded(true)
        setHospitalStats(null)
        setVendorStats(null)
      })

    return () => {
      alive = false
    }
  }, [id, refreshKey])

  const hospitalTimeline = hospitalStats?.recentTimeline ?? []
  const hospitalSummary = hospitalStats?.summary
  const vendorTimeline = vendorStats?.recentTimeline ?? []
  const vendorSummary = vendorStats?.summary
  const rfqActivity = hospitalStats?.rfqs ?? []
  const verificationHistory = hospitalStats?.verificationHistory ?? []
  const purchaseOrders = hospitalStats?.purchaseOrders ?? []
  const conversations = hospitalStats?.conversations ?? []
  const hospitalRfqByStatusRows = Object.entries(hospitalStats?.rfqByStatus ?? {}).map(([label, value]) => ({
    label,
    value: typeof value === 'number' ? value : 0,
  }))
  const hospitalOrdersByStatusRows = (hospitalStats?.ordersByStatus ?? []).map((row) => ({
    label: row.status,
    value: row.count,
    note: fmtMoney(row.totalAmount, true),
  }))
  const hospitalMonthlyRows = (hospitalStats?.monthlyActivity ?? []).map((row) => ({
    label: row.label,
    value: row.rfqs + row.orders,
    note: `RFQs ${row.rfqs} | Orders ${row.orders}`,
  }))
  const vendorRfqActivity = vendorStats?.rfqs ?? []
  const vendorVerificationHistory = vendorStats?.verificationHistory ?? []
  const vendorPurchaseOrders = vendorStats?.purchaseOrders ?? []
  const vendorConversations = vendorStats?.conversations ?? []
  const vendorQuotesByStatusRows = (vendorStats?.quotationsByStatus ?? []).map((row) => ({
    label: row.status,
    value: row.count,
    note: fmtMoney(row.totalAmount, true),
  }))
  const vendorOrdersByStatusRows = (vendorStats?.ordersByStatus ?? []).map((row) => ({
    label: row.status,
    value: row.count,
    note: fmtMoney(row.totalAmount, true),
  }))
  const vendorMonthlyRows = (vendorStats?.monthlyActivity ?? []).map((row) => ({
    label: row.label,
    value: row.quotations + row.orders,
    note: `Quotes ${row.quotations} | Orders ${row.orders}`,
  }))

  const contactRows = useMemo(() => entity ? [
    ['Contact person', entity.contactPerson || '—'],
    ['Email', entity.contactEmail || '—'],
    ['Phone', entity.contactPhone || '—'],
    ['Location', [entity.city, entity.country].filter(Boolean).join(', ') || '—'],
    ['Registered', fmtDateShort(entity.createdAt)],
  ] : [], [entity])

  const onboardingData = useMemo(() => entity ? {
    id: entity.id,
    user_id: entity.userId,
    entity_type: entity.type,
    name: entity.name,
    verification_status: entity.verificationStatus,
    verification_source: entity.verificationSource,
    created_at: entity.createdAt,
    country: entity.country,
    city: entity.city,
    contact_email: entity.contactEmail,
    contact_phone: entity.contactPhone,
    contact_person: entity.contactPerson,
    registration_number: entity.registrationNumber,
    company_registration: entity.companyRegistration,
    tags: entity.tags,
    is_verified: entity.isVerified,
    hospital_statistics: entity.type === 'hospital' && hospitalStats ? {
      summary: hospitalStats.summary,
      rfq_by_status: hospitalStats.rfqByStatus,
      orders_by_status: hospitalStats.ordersByStatus,
      top_vendors: hospitalStats.topVendors,
      monthly_activity: hospitalStats.monthlyActivity,
      recent_timeline: hospitalStats.recentTimeline,
      notifications: hospitalStats.notifications,
    } : undefined,
    vendor_statistics: entity.type === 'vendor' && vendorStats ? {
      summary: vendorStats.summary,
      quotations_by_status: vendorStats.quotationsByStatus,
      orders_by_status: vendorStats.ordersByStatus,
      monthly_activity: vendorStats.monthlyActivity,
      recent_timeline: vendorStats.recentTimeline,
    } : undefined,
  } : {}, [entity, hospitalStats, vendorStats])

  const downloadPdf = async () => {
    if (!entity || exportingPdf) return

    setExportingPdf(true)
    try {
      const response = await fetch('/api/admin/export-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          entityType: entity.type,
          entityId: entity.id,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string }
        throw new Error(payload.error || 'Failed to download PDF')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition')
      const match = disposition?.match(/filename="([^"]+)"/)
      const fileName = match?.[1] ?? `${entity.type}-${entity.id}.pdf`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast('PDF download started')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to download PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  if (!entityLoaded) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading entity…</div>
  }

  if (!entity) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Entity not found.</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={entity.name} size="xl" variant={entity.type} />
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                <span>/</span>
                <Link href="/clients" className="hover:text-foreground">Entities</Link>
                <span>/</span>
                <span className="font-mono text-foreground">{entity.id}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-semibold tracking-tight">{entity.name}</h1>
                <TypeBadge type={entity.type} />
                <StatusBadge status={entityStatus(entity)} />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {entity.tags.map((tag) => <span key={tag} className="rounded bg-muted px-2 py-1 text-[11.5px] text-muted-foreground">{tag}</span>)}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><RefreshCw size={13} />Refresh</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setVerificationOpen(true)}>
              <ShieldCheck size={13} />
              {entityStatus(entity) === 'verified' ? 'Verified' : 'Complete verification'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPdf} disabled={exportingPdf}>
              {exportingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-4 lg:grid-cols-4">
        <MetricCard label="Status" value={entityStatus(entity)} sub="Current verification state" />
        <MetricCard label="Entity Type" value={entity.type} sub="Live record from Supabase" />
        <MetricCard label="Created" value={fmtDateShort(entity.createdAt)} sub="Original signup date" />
        <MetricCard label="Source" value={entity.verificationSource ?? 'profile'} sub="Latest verification source" />
      </div>

      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3.5">
            <h3 className="text-[13px] font-semibold">Profile</h3>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {contactRows.map(([label, value]) => (
              <div key={label as string} className="rounded-lg border border-border p-3">
                <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground">{label as string}</div>
                <div className="mt-1.5 text-[12.5px] font-medium">{value as string}</div>
              </div>
            ))}
            {entity.registrationNumber && (
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground">Registration</div>
                <div className="mt-1.5 font-mono text-[12.5px] font-medium">{entity.registrationNumber}</div>
              </div>
            )}
            {entity.companyRegistration && (
              <div className="rounded-lg border border-border p-3">
                <div className="text-[10.5px] uppercase tracking-widest text-muted-foreground">Company Registration</div>
                <div className="mt-1.5 font-mono text-[12.5px] font-medium">{entity.companyRegistration}</div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3.5">
            <h3 className="text-[13px] font-semibold">Verification Summary</h3>
          </div>
          <div className="space-y-3 p-4 text-[12.5px]">
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Verification status</span><StatusBadge status={entityStatus(entity)} /></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Contact email</span><span className="font-medium">{entity.contactEmail || '—'}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Contact phone</span><span className="font-medium">{entity.contactPhone || '—'}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Location</span><span className="font-medium">{[entity.city, entity.country].filter(Boolean).join(', ') || '—'}</span></div>
            <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Source</span><span className="font-medium">{entity.verificationSource ?? 'profile'}</span></div>
          </div>
        </div>

        {entity.type === 'hospital' && hospitalSummary && (
          <div className="lg:col-span-2 rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3.5">
              <h3 className="text-[13px] font-semibold">Hospital Statistics</h3>
              <p className="text-[11.5px] text-muted-foreground">Pulled from the hospital statistics route</p>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-4">
              <MetricCard label="RFQs" value={hospitalSummary.totalRfqs} sub={`${hospitalSummary.quotePerRfq} quotes / RFQ`} />
              <MetricCard label="Quotations" value={hospitalSummary.totalQuotations} sub="Total quotations" />
              <MetricCard label="Orders" value={hospitalSummary.totalOrders} sub={fmtMoney(hospitalSummary.totalSpend, true)} />
              <MetricCard label="Conversations" value={hospitalSummary.totalConversations} sub={`${hospitalSummary.activeConversations} active`} />
            </div>
            <div className="grid gap-3 px-4 pb-4 md:grid-cols-3">
              <MiniBarChart title="RFQs by Status" rows={hospitalRfqByStatusRows} />
              <MiniBarChart title="Orders by Status" rows={hospitalOrdersByStatusRows} />
              <MiniBarChart title="Monthly Activity" rows={hospitalMonthlyRows} />
            </div>
            <div className="border-t border-border px-4 py-3.5">
              <h4 className="text-[12.5px] font-semibold">Top Vendors (Tabular)</h4>
              <div className="mt-2 overflow-x-auto rounded border border-border">
                <table className="min-w-full text-[12px]">
                  <thead className="bg-muted/60">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Vendor</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Orders</th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(hospitalStats?.topVendors ?? []).map((vendor) => (
                      <tr key={`${vendor.vendorName}-${vendor.orders}`} className="border-t border-border">
                        <td className="px-2 py-1.5">{vendor.vendorName}</td>
                        <td className="px-2 py-1.5">{vendor.orders}</td>
                        <td className="px-2 py-1.5">{fmtMoney(vendor.amount, true)}</td>
                      </tr>
                    ))}
                    {(hospitalStats?.topVendors ?? []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-2 py-2 text-center text-muted-foreground">No vendor statistics available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-t border-border px-4 py-3.5">
              <h4 className="text-[12.5px] font-semibold">Recent Timeline</h4>
              <div className="mt-3 divide-y divide-border">
                {hospitalTimeline.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div>
                      <div className="text-[12.5px] font-medium">{item.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{item.subtitle || 'No extra details'}</div>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">{fmtDateShort(item.created_at)}</div>
                  </div>
                ))}
                {hospitalTimeline.length === 0 && <div className="py-6 text-center text-[12.5px] text-muted-foreground">No activity records found.</div>}
              </div>
            </div>
          </div>
        )}

        {entity.type === 'vendor' && vendorSummary && (
          <div className="lg:col-span-2 rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3.5">
              <h3 className="text-[13px] font-semibold">Vendor Statistics</h3>
              <p className="text-[11.5px] text-muted-foreground">Pulled from the vendor statistics route</p>
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-4">
              <MetricCard label="Quotations" value={vendorSummary.totalQuotations} sub={`${vendorSummary.awardedQuotes} awarded`} />
              <MetricCard label="Orders" value={vendorSummary.totalOrders} sub={fmtMoney(vendorSummary.totalRevenue, true)} />
              <MetricCard label="Conversations" value={vendorSummary.totalConversations} sub={`${vendorSummary.activeConversations} active`} />
              <MetricCard label="Quote->Order" value={vendorSummary.quotationToOrderRate} sub="Conversion rate" />
            </div>
            <div className="grid gap-3 px-4 pb-4 md:grid-cols-3">
              <MiniBarChart title="Quotes by Status" rows={vendorQuotesByStatusRows} />
              <MiniBarChart title="Orders by Status" rows={vendorOrdersByStatusRows} />
              <MiniBarChart title="Monthly Activity" rows={vendorMonthlyRows} />
            </div>
            <div className="border-t border-border px-4 py-3.5">
              <h4 className="text-[12.5px] font-semibold">Recent Timeline</h4>
              <div className="mt-3 divide-y divide-border">
                {vendorTimeline.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div>
                      <div className="text-[12.5px] font-medium">{item.title}</div>
                      <div className="text-[11.5px] text-muted-foreground">{item.subtitle || 'No extra details'}</div>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">{fmtDateShort(item.created_at)}</div>
                  </div>
                ))}
                {vendorTimeline.length === 0 && <div className="py-6 text-center text-[12.5px] text-muted-foreground">No activity records found.</div>}
              </div>
            </div>
          </div>
        )}

        {entity.type === 'hospital' && (
          <div className="lg:col-span-2 rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3.5">
              <h3 className="text-[13px] font-semibold">Detailed Buyer Activity Logs</h3>
              <p className="text-[11.5px] text-muted-foreground">RFQ lifecycle, line items, quotations, approvals, rejections, and related interactions.</p>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-border p-3">
                <h4 className="text-[12.5px] font-semibold">Verification Decisions</h4>
                {verificationHistory.length === 0 ? (
                  <p className="mt-2 text-[12px] text-muted-foreground">No verification records found.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {verificationHistory.map((entry) => (
                      <div key={entry.id} className="rounded border border-border p-2 text-[12px]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge status={entry.status ?? 'pending'} />
                          <span className="text-muted-foreground">{formatDateTime(entry.verified_at ?? entry.created_at)}</span>
                        </div>
                        {entry.admin_notes && <p className="mt-1 text-muted-foreground">{entry.admin_notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border p-3">
                <h4 className="text-[12.5px] font-semibold">RFQ Activity</h4>
                {rfqActivity.length === 0 ? (
                  <p className="mt-2 text-[12px] text-muted-foreground">No RFQs found for this buyer.</p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {rfqActivity.map((rfq) => (
                      <details key={rfq.id} className="rounded border border-border p-3">
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="font-medium">{rfq.title}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">{rfq.id}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={rfq.status} />
                              <span className="text-[11.5px] text-muted-foreground">Created {formatDateTime(rfq.created_at)}</span>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-3 space-y-3 text-[12px]">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Updated:</span> {formatDateTime(rfq.updated_at)}</div>
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Deadline:</span> {formatDateTime(rfq.deadline)}</div>
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Line Items:</span> {rfq.itemCount}</div>
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Quotes/Orders:</span> {rfq.quoteCount}/{rfq.orderCount}</div>
                          </div>

                          <div>
                            <h5 className="font-medium">Line Items</h5>
                            {rfq.lineItems.length === 0 ? (
                              <p className="text-muted-foreground">No line items.</p>
                            ) : (
                              <div className="mt-1 space-y-2">
                                {rfq.lineItems.map((item) => (
                                  <div key={item.id} className="rounded border border-border p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span>#{item.lineItemId} {item.componentName ?? item.itemType ?? 'Unspecified Item'}</span>
                                      <span className="text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                                    </div>
                                    <div className="mt-2">
                                      <KeyValueGrid title="Item Attributes" values={item.fields ?? {}} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h5 className="font-medium">Quotations</h5>
                            {rfq.quotations.length === 0 ? (
                              <p className="text-muted-foreground">No quotations submitted.</p>
                            ) : (
                              <div className="mt-1 space-y-2">
                                {rfq.quotations.map((quote) => (
                                  <div key={quote.id} className="rounded border border-border p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-mono">{quote.id}</span>
                                      <StatusBadge status={quote.status ?? 'pending'} />
                                    </div>
                                    <div className="mt-1 text-muted-foreground">
                                      Amount: {quote.totalAmount ?? 0} | Submitted: {formatDateTime(quote.submittedAt ?? quote.createdAt)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h5 className="font-medium">Orders</h5>
                            {rfq.orders.length === 0 ? (
                              <p className="text-muted-foreground">No purchase orders linked to this RFQ.</p>
                            ) : (
                              <div className="mt-1 space-y-2">
                                {rfq.orders.map((order) => (
                                  <div key={order.id} className="rounded border border-border p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-mono">{order.id}</span>
                                      <StatusBadge status={order.status ?? 'pending'} />
                                    </div>
                                    <div className="mt-1 text-muted-foreground">
                                      Amount: {order.totalAmount ?? 0} | Order Date: {formatDateTime(order.orderDate ?? order.createdAt)} | Delivery: {formatDateTime(order.deliveryDate)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border p-3">
                <h4 className="text-[12.5px] font-semibold">All Buyer Conversations & Orders</h4>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <h5 className="font-medium">Conversations ({conversations.length})</h5>
                    <div className="mt-1 max-h-56 space-y-2 overflow-auto pr-1">
                      {conversations.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground">No conversations.</p>
                      ) : (
                        conversations.map((conversation) => (
                          <div key={conversation.id} className="rounded border border-border p-2 text-[12px]">
                            <div className="font-mono">{conversation.id}</div>
                            <div className="text-muted-foreground">RFQ: {conversation.rfq_id}</div>
                            <div className="text-muted-foreground">Vendor: {conversation.vendor_id}</div>
                            <div className="text-muted-foreground">Status: {conversation.eligibility_status}</div>
                            <div className="text-muted-foreground">{formatDateTime(conversation.created_at)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium">Purchase Orders ({purchaseOrders.length})</h5>
                    <div className="mt-1 max-h-56 space-y-2 overflow-auto pr-1">
                      {purchaseOrders.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground">No purchase orders.</p>
                      ) : (
                        purchaseOrders.map((order) => (
                          <div key={order.id} className="rounded border border-border p-2 text-[12px]">
                            <div className="font-mono">{order.id}</div>
                            <div className="text-muted-foreground">RFQ: {order.rfq_id ?? '—'}</div>
                            <div className="text-muted-foreground">Vendor: {order.vendor_id ?? '—'}</div>
                            <div className="text-muted-foreground">Amount: {order.total_amount ?? 0}</div>
                            <div className="text-muted-foreground">Status: {order.status ?? 'pending'} | Payment: {order.payment_status ?? '—'}</div>
                            <div className="text-muted-foreground">{formatDateTime(order.order_date ?? order.created_at)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {entity.type === 'vendor' && (
          <div className="lg:col-span-2 rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3.5">
              <h3 className="text-[13px] font-semibold">Detailed Seller Activity Logs</h3>
              <p className="text-[11.5px] text-muted-foreground">Quotation lifecycle, RFQ line items, order outcomes, and buyer interactions.</p>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-border p-3">
                <h4 className="text-[12.5px] font-semibold">Verification Decisions</h4>
                {vendorVerificationHistory.length === 0 ? (
                  <p className="mt-2 text-[12px] text-muted-foreground">No verification records found.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {vendorVerificationHistory.map((entry) => (
                      <div key={entry.id} className="rounded border border-border p-2 text-[12px]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <StatusBadge status={entry.status ?? 'pending'} />
                          <span className="text-muted-foreground">{formatDateTime(entry.verified_at ?? entry.created_at)}</span>
                        </div>
                        {entry.admin_notes && <p className="mt-1 text-muted-foreground">{entry.admin_notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border p-3">
                <h4 className="text-[12.5px] font-semibold">RFQs Participated</h4>
                {vendorRfqActivity.length === 0 ? (
                  <p className="mt-2 text-[12px] text-muted-foreground">No RFQ activity found for this seller.</p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {vendorRfqActivity.map((rfq) => (
                      <details key={rfq.id} className="rounded border border-border p-3">
                        <summary className="cursor-pointer list-none">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="font-medium">{rfq.title}</div>
                              <div className="font-mono text-[11px] text-muted-foreground">{rfq.id}</div>
                              <div className="text-[11.5px] text-muted-foreground">Buyer: {rfq.hospitalName ?? rfq.hospitalId}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={rfq.status} />
                              <span className="text-[11.5px] text-muted-foreground">Created {formatDateTime(rfq.created_at)}</span>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-3 space-y-3 text-[12px]">
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Updated:</span> {formatDateTime(rfq.updated_at)}</div>
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Deadline:</span> {formatDateTime(rfq.deadline)}</div>
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Line Items:</span> {rfq.itemCount}</div>
                            <div className="rounded border border-border p-2"><span className="text-muted-foreground">Quotes/Orders:</span> {rfq.quoteCount}/{rfq.orderCount}</div>
                          </div>

                          <div>
                            <h5 className="font-medium">Line Items</h5>
                            {rfq.lineItems.length === 0 ? (
                              <p className="text-muted-foreground">No line items.</p>
                            ) : (
                              <div className="mt-1 space-y-2">
                                {rfq.lineItems.map((item) => (
                                  <div key={item.id} className="rounded border border-border p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span>#{item.lineItemId} {item.componentName ?? item.itemType ?? 'Unspecified Item'}</span>
                                      <span className="text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                                    </div>
                                    <div className="mt-2">
                                      <KeyValueGrid title="Item Attributes" values={item.fields ?? {}} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h5 className="font-medium">My Quotations</h5>
                            {rfq.quotations.length === 0 ? (
                              <p className="text-muted-foreground">No quotations submitted.</p>
                            ) : (
                              <div className="mt-1 space-y-2">
                                {rfq.quotations.map((quote) => (
                                  <div key={quote.id} className="rounded border border-border p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-mono">{quote.id}</span>
                                      <StatusBadge status={quote.status ?? 'pending'} />
                                    </div>
                                    <div className="mt-1 text-muted-foreground">
                                      Amount: {quote.totalAmount ?? 0} | Submitted: {formatDateTime(quote.submittedAt ?? quote.createdAt)} | Valid Until: {formatDateTime(quote.validUntil)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <h5 className="font-medium">Orders Won</h5>
                            {rfq.orders.length === 0 ? (
                              <p className="text-muted-foreground">No purchase orders linked to this RFQ.</p>
                            ) : (
                              <div className="mt-1 space-y-2">
                                {rfq.orders.map((order) => (
                                  <div key={order.id} className="rounded border border-border p-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-mono">{order.id}</span>
                                      <StatusBadge status={order.status ?? 'pending'} />
                                    </div>
                                    <div className="mt-1 text-muted-foreground">
                                      Amount: {order.totalAmount ?? 0} | Order Date: {formatDateTime(order.orderDate ?? order.createdAt)} | Delivery: {formatDateTime(order.deliveryDate)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border p-3">
                <h4 className="text-[12.5px] font-semibold">All Seller Conversations & Orders</h4>
                <div className="mt-2 grid gap-3 md:grid-cols-2">
                  <div>
                    <h5 className="font-medium">Conversations ({vendorConversations.length})</h5>
                    <div className="mt-1 max-h-56 space-y-2 overflow-auto pr-1">
                      {vendorConversations.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground">No conversations.</p>
                      ) : (
                        vendorConversations.map((conversation) => (
                          <div key={conversation.id} className="rounded border border-border p-2 text-[12px]">
                            <div className="font-mono">{conversation.id}</div>
                            <div className="text-muted-foreground">RFQ: {conversation.rfq_id}</div>
                            <div className="text-muted-foreground">Buyer: {conversation.hospital_id}</div>
                            <div className="text-muted-foreground">Status: {conversation.eligibility_status}</div>
                            <div className="text-muted-foreground">{formatDateTime(conversation.created_at)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium">Purchase Orders ({vendorPurchaseOrders.length})</h5>
                    <div className="mt-1 max-h-56 space-y-2 overflow-auto pr-1">
                      {vendorPurchaseOrders.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground">No purchase orders.</p>
                      ) : (
                        vendorPurchaseOrders.map((order) => (
                          <div key={order.id} className="rounded border border-border p-2 text-[12px]">
                            <div className="font-mono">{order.id}</div>
                            <div className="text-muted-foreground">RFQ: {order.rfq_id ?? '—'}</div>
                            <div className="text-muted-foreground">Buyer: {order.hospital_id ?? '—'}</div>
                            <div className="text-muted-foreground">Amount: {order.total_amount ?? 0}</div>
                            <div className="text-muted-foreground">Status: {order.status ?? 'pending'} | Payment: {order.payment_status ?? '—'}</div>
                            <div className="text-muted-foreground">{formatDateTime(order.order_date ?? order.created_at)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3.5">
            <h3 className="text-[13px] font-semibold">Related Actions</h3>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            <Link href="/approvals"><Button variant="outline" size="sm" className="gap-1.5"><ArrowUpRight size={12} />Go to approvals</Button></Link>
            <Link href={entity.type === 'hospital' ? '/clients/buyers' : '/clients/sellers'}><Button variant="outline" size="sm" className="gap-1.5"><Globe size={12} />Open list</Button></Link>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPdf} disabled={exportingPdf}>
              {exportingPdf ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Export PDF
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Mail size={12} />Email contact</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Phone size={12} />Call contact</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><MapPin size={12} />Location</Button>
            <Button variant="outline" size="sm" className="gap-1.5"><Calendar size={12} />Registered {fmtDateShort(entity.createdAt)}</Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <OnboardingDataView data={onboardingData} />
        </div>
      </div>

      {entity && (
        <VerificationModal
          open={verificationOpen}
          onClose={() => setVerificationOpen(false)}
          entity={entity}
          onVerified={() => setRefreshKey((value) => value + 1)}
        />
      )}
    </div>
  )
}
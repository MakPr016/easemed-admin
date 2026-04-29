"use client"

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { CheckCircle2, Building2, Loader2, ShieldCheck, Store, XCircle } from 'lucide-react'
import type { AdminEntity } from '@/lib/admin-data'

type VerificationStatus = 'verified' | 'rejected' | 'manual_override'

interface VerificationHistoryEntry {
  id: string
  verification_type: string
  status: string
  admin_notes: string | null
  admin_id: string | null
  verified_at: string | null
  created_at: string
  registration_verified: boolean | null
}

interface VerificationModalProps {
  open: boolean
  onClose: () => void
  entity: AdminEntity
  onVerified: () => void
}

function formatDisplayDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

export function VerificationModal({ open, onClose, entity, onVerified }: VerificationModalProps) {
  const supabase = createClient()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryEntry[]>([])
  const [verifiedRegNumber, setVerifiedRegNumber] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('verified')
  const [adminNotes, setAdminNotes] = useState('')
  const [documentVerified, setDocumentVerified] = useState('')

  const type = entity.type

  useEffect(() => {
    if (!open) return

    setVerifiedRegNumber(entity.registrationNumber ?? entity.companyRegistration ?? '')
    setVerificationStatus('verified')
    setAdminNotes('')
    setDocumentVerified('')
  }, [open, entity.companyRegistration, entity.registrationNumber])

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      const table = type === 'hospital' ? 'hospital_verifications' : 'vendor_verifications'
      const field = type === 'hospital' ? 'hospital_id' : 'vendor_id'

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(field, entity.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to load verification history:', error)
        setVerificationHistory([])
      } else {
        setVerificationHistory((data ?? []) as VerificationHistoryEntry[])
      }

      setLoading(false)
    }

    if (open) {
      void fetchHistory()
    }
  }, [entity.id, open, supabase, type])

  const entityDetails = useMemo(() => {
    if (type === 'hospital') {
      return [
        { label: 'Hospital Name', value: entity.name },
        { label: 'Registration Number', value: entity.registrationNumber ?? '—' },
        { label: 'Country', value: entity.country ?? '—' },
        { label: 'City', value: entity.city ?? '—' },
        { label: 'Contact Person', value: entity.contactPerson ?? '—' },
        { label: 'Contact Email', value: entity.contactEmail ?? '—' },
        { label: 'Contact Phone', value: entity.contactPhone ?? '—' },
        { label: 'Registered On', value: formatDisplayDate(entity.createdAt) },
      ]
    }

    return [
      { label: 'Vendor Name', value: entity.name },
      { label: 'Company Registration', value: entity.companyRegistration ?? '—' },
      { label: 'Country', value: entity.country ?? '—' },
      { label: 'City', value: entity.city ?? '—' },
      { label: 'Contact Person', value: entity.contactPerson ?? '—' },
      { label: 'Contact Email', value: entity.contactEmail ?? '—' },
      { label: 'Contact Phone', value: entity.contactPhone ?? '—' },
      { label: 'Vendor Type', value: entity.tags.length > 0 ? entity.tags.join(', ') : '—' },
      { label: 'Registered On', value: formatDisplayDate(entity.createdAt) },
    ]
  }, [entity, type])

  const handleSubmit = async () => {
    if (verificationStatus === 'rejected' && !adminNotes.trim()) {
      toast('Notes are required when rejecting an application')
      return
    }

    setSubmitting(true)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const adminId = authData.user?.id

      const extraNotes = [
        adminNotes.trim(),
        verifiedRegNumber ? `Verified registration: ${verifiedRegNumber}` : '',
        documentVerified ? `Document verified: ${documentVerified}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const response = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: type,
          entityId: entity.id,
          status: verificationStatus,
          adminNotes: extraNotes,
          adminId,
        }),
      })

      const payload = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update verification status')
      }

      toast(
        verificationStatus === 'verified'
          ? `${type === 'hospital' ? 'Hospital' : 'Vendor'} verified successfully`
          : verificationStatus === 'rejected'
          ? `${type === 'hospital' ? 'Hospital' : 'Vendor'} rejected`
          : `${type === 'hospital' ? 'Hospital' : 'Vendor'} approved with manual override`,
      )

      onVerified()
      onClose()
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to update verification status')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            {type === 'hospital' ? <Building2 className="h-5 w-5 text-[#1f3a61]" /> : <Store className="h-5 w-5 text-[#1f3a61]" />}
            <h2 className="text-[15px] font-semibold tracking-tight">
              {type === 'hospital' ? 'Hospital' : 'Vendor'} Verification
            </h2>
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Review account details, inspect past verification history, and finalize the decision.
          </p>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded-lg border border-border bg-[#f4f7fb] p-4 dark:bg-[#1a3050]">
            <h3 className="mb-3 text-sm font-semibold text-[#1f3a61] dark:text-[#c5d5e4]">Account Details</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {entityDetails.map((item) => (
                <div key={item.label} className="rounded-sm border border-[#d4dce8] bg-white p-3 dark:border-[#334a76] dark:bg-[#132845]">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#7999b9]">{item.label}</div>
                  <div className="mt-1 text-sm font-medium text-[#1f3a61] dark:text-[#c5d5e4]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {!loading && verificationHistory.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[#1f3a61] dark:text-[#c5d5e4]">Verification History</h3>
              <div className="space-y-2">
                {verificationHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-sm border border-[#d4dce8] p-3 text-sm dark:border-[#334a76]">
                    <div className="mt-0.5">
                      {entry.registration_verified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{entry.verification_type}</Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            entry.status === 'verified'
                              ? 'border-green-300 text-green-700'
                              : entry.status === 'rejected'
                              ? 'border-red-300 text-red-700'
                              : 'border-blue-300 text-blue-700'
                          }`}
                        >
                          {entry.status}
                        </Badge>
                      </div>
                      {entry.admin_notes && <p className="mt-1 text-xs text-[#496c83] dark:text-[#8aaec9]">{entry.admin_notes}</p>}
                      <p className="mt-1 text-xs text-[#7999b9]">{formatDisplayDate(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#1f3a61] dark:text-[#c5d5e4]">Manual Verification</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1f3a61] dark:text-[#c5d5e4]" htmlFor="regNumber">
                  Verified Registration Number
                </label>
                <input
                  id="regNumber"
                  value={verifiedRegNumber}
                  onChange={(event) => setVerifiedRegNumber(event.target.value)}
                  placeholder={type === 'hospital' ? 'Enter verified registration number' : 'Enter verified company registration'}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1f3a61] dark:text-[#c5d5e4]" htmlFor="docVerified">
                  Document Verified (optional)
                </label>
                <input
                  id="docVerified"
                  value={documentVerified}
                  onChange={(event) => setDocumentVerified(event.target.value)}
                  placeholder="e.g., Government license, Official letter"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1f3a61] dark:text-[#c5d5e4]" htmlFor="status">
                  Verification Decision
                </label>
                <select
                  id="status"
                  value={verificationStatus}
                  onChange={(event) => setVerificationStatus(event.target.value as VerificationStatus)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="verified">Verified</option>
                  <option value="manual_override">Manual Override</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1f3a61] dark:text-[#c5d5e4]" htmlFor="notes">
                  Admin Notes {verificationStatus === 'rejected' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder={verificationStatus === 'rejected' ? 'Required: Explain why this registration is being rejected...' : 'Optional: Add notes about this verification decision...'}
                  rows={4}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-[#1f3a61] text-white hover:bg-[#2a4a7a]">
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <> 
                <ShieldCheck className="mr-2 h-4 w-4" />
                Save Verification
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

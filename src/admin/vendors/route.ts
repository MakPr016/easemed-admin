import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_override'

type VendorRow = {
  id: string
  user_id: string | null
  vendor_name: string
  company_registration: string | null
  gst_number: string | null
  vat_id: string | null
  country: string | null
  city: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_person: string | null
  vendor_type: string[] | null
  created_at: string
  is_verified: boolean | null
  verification_status: VerificationStatus | null
}

type ProfileRow = {
  id: string
  full_name: string
  organization_name: string | null
  email: string
  phone: string | null
  city: string | null
  country: string | null
  created_at: string
}

type VendorVerificationRow = {
  vendor_id: string
  status: VerificationStatus | null
  created_at: string
}

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service credentials')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function fetchAllVendorRows(supabase: ReturnType<typeof getServiceClient>) {
  const rows: VendorRow[] = []
  const pageSize = 500

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('vendors')
      .select('id, user_id, vendor_name, company_registration, gst_number, vat_id, country, city, contact_email, contact_phone, contact_person, vendor_type, created_at, is_verified, verification_status')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const batch = (data ?? []) as VendorRow[]
    rows.push(...batch)

    if (batch.length < pageSize) {
      break
    }
  }

  return rows
}

function getEffectiveStatus(row: VendorRow): VerificationStatus {
  if (row.verification_status) return row.verification_status
  if (row.is_verified) return 'verified'
  return 'pending'
}

function getVerificationStatusFromHistory(
  row: VendorRow,
  historyMap: Map<string, VerificationStatus>,
): VerificationStatus | null {
  return historyMap.get(row.id) ?? (row.user_id ? historyMap.get(row.user_id) ?? null : null)
}

async function fetchLatestVendorVerificationMap(supabase: ReturnType<typeof getServiceClient>) {
  const rows: VendorVerificationRow[] = []
  const pageSize = 500

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('vendor_verifications')
      .select('vendor_id, status, created_at')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const batch = (data ?? []) as VendorVerificationRow[]
    rows.push(...batch)

    if (batch.length < pageSize) break
  }

  const historyMap = new Map<string, VerificationStatus>()
  for (const row of rows) {
    if (!historyMap.has(row.vendor_id) && row.status) {
      historyMap.set(row.vendor_id, row.status)
    }
  }

  return historyMap
}

export async function GET() {
  try {
    const supabase = getServiceClient()

    const [vendors, profilesResult, vendorHistory] = await Promise.all([
      fetchAllVendorRows(supabase),
      supabase
        .from('profiles')
        .select('id, full_name, organization_name, email, phone, city, country, created_at')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false }),
      fetchLatestVendorVerificationMap(supabase),
    ])

    if (profilesResult.error) {
      return NextResponse.json({ error: profilesResult.error.message }, { status: 500 })
    }

    const profiles = (profilesResult.data ?? []) as ProfileRow[]
    const historyMap = vendorHistory

    const existingUserIds = new Set(
      vendors.map((vendor) => vendor.user_id).filter((id): id is string => Boolean(id))
    )

    const mergedVendors = [
      ...vendors.map((vendor) => ({
        ...vendor,
        verification_status: (() => {
          const historyStatus = getVerificationStatusFromHistory(vendor, historyMap)
          if (historyStatus === 'manual_override') return 'verified' as VerificationStatus
          if (historyStatus) return historyStatus
          return getEffectiveStatus(vendor)
        })(),
        verification_source: (() => {
          const historyStatus = getVerificationStatusFromHistory(vendor, historyMap)
          if (historyStatus === 'verified' || historyStatus === 'manual_override') return 'manual_override'
          if (historyStatus === 'rejected') return 'manual'
          return vendor.is_verified ? 'manual_override' : vendor.verification_status === 'rejected' ? 'manual' : null
        })(),
      })),
      ...profiles
        .filter((profile) => !existingUserIds.has(profile.id))
        .map((profile) => ({
          id: profile.id,
          user_id: profile.id,
          vendor_name: profile.organization_name || profile.full_name || profile.email || 'Unnamed vendor account',
          company_registration: null,
          gst_number: null,
          vat_id: null,
          country: profile.country,
          city: profile.city,
          contact_email: profile.email,
          contact_phone: profile.phone,
          contact_person: profile.full_name,
          vendor_type: null,
          created_at: profile.created_at,
          is_verified: false,
          verification_status: (() => {
            const historyStatus = historyMap.get(profile.id)
            if (historyStatus === 'manual_override') return 'verified' as VerificationStatus
            if (historyStatus) return historyStatus
            return 'pending' as VerificationStatus
          })(),
          verification_source: (() => {
            const historyStatus = historyMap.get(profile.id)
            if (historyStatus === 'verified' || historyStatus === 'manual_override') return 'manual_override'
            if (historyStatus === 'rejected') return 'manual'
            return 'profile'
          })(),
        })),
    ]

    return NextResponse.json({ vendors: mergedVendors })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load vendors'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
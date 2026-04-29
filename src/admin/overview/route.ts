import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_override'

type HospitalRow = {
  id: string
  user_id: string | null
  hospital_name: string
  is_verified: boolean | null
  verification_status: VerificationStatus | null
  created_at: string
}

type VendorRow = {
  id: string
  user_id: string | null
  vendor_name: string
  is_verified: boolean | null
  verification_status: VerificationStatus | null
  created_at: string
}

type ProfileRow = {
  id: string
  role: 'hospital' | 'vendor'
  full_name: string
  organization_name: string | null
  email: string
  created_at: string
}

type HospitalVerificationRow = {
  hospital_id: string
  status: VerificationStatus | null
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
      .select('id, user_id, vendor_name, is_verified, verification_status, created_at')
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

function getEffectiveStatus(row: { is_verified: boolean | null; verification_status: VerificationStatus | null }): VerificationStatus {
  if (row.verification_status) return row.verification_status
  if (row.is_verified) return 'verified'
  return 'pending'
}

async function fetchLatestHistoryMap<T extends { hospital_id?: string; vendor_id?: string; status: VerificationStatus | null; created_at: string }>(
  supabase: ReturnType<typeof getServiceClient>,
  tableName: 'hospital_verifications' | 'vendor_verifications',
) {
  const rows: T[] = []
  const pageSize = 500

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from(tableName)
      .select(tableName === 'hospital_verifications' ? 'hospital_id, status, created_at' : 'vendor_id, status, created_at')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const batch = (data ?? []) as T[]
    rows.push(...batch)

    if (batch.length < pageSize) break
  }

  const historyMap = new Map<string, VerificationStatus>()
  for (const row of rows) {
    const key = tableName === 'hospital_verifications' ? row.hospital_id : row.vendor_id
    if (key && !historyMap.has(key) && row.status) {
      historyMap.set(key, row.status)
    }
  }

  return historyMap
}

function buildRecentSignups(
  recentHospitals: HospitalRow[],
  recentVendors: VendorRow[]
) {
  return [
    ...recentHospitals.map((hospital) => ({
      type: 'Hospital',
      name: hospital.hospital_name,
      date: hospital.created_at,
    })),
    ...recentVendors.map((vendor) => ({
      type: 'Vendor',
      name: vendor.vendor_name,
      date: vendor.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
}

export async function GET() {
  try {
    const supabase = getServiceClient()

    const [hospitalRows, vendorRows, hospitalProfiles, vendorProfiles, hospitalHistory, vendorHistory] = await Promise.all([
      supabase
        .from('hospitals')
        .select('id, user_id, hospital_name, is_verified, verification_status, created_at')
        .order('created_at', { ascending: false }),
      fetchAllVendorRows(supabase),
      supabase
        .from('profiles')
        .select('id, role, full_name, organization_name, email, created_at')
        .eq('role', 'hospital')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, role, full_name, organization_name, email, created_at')
        .eq('role', 'vendor')
        .order('created_at', { ascending: false }),
      fetchLatestHistoryMap<HospitalVerificationRow>(supabase, 'hospital_verifications'),
      fetchLatestHistoryMap<VendorVerificationRow>(supabase, 'vendor_verifications'),
    ])

    if (hospitalRows.error) {
      return NextResponse.json({ error: hospitalRows.error.message }, { status: 500 })
    }

    const hospitals = (hospitalRows.data ?? []) as HospitalRow[]
    const vendors = vendorRows as VendorRow[]
    const hospitalProfileRows = (hospitalProfiles.data ?? []) as ProfileRow[]
    const vendorProfileRows = (vendorProfiles.data ?? []) as ProfileRow[]
    const hospitalHistoryMap = hospitalHistory
    const vendorHistoryMap = vendorHistory

    const hospitalUserIds = new Set(hospitals.map((row) => row.user_id).filter((id): id is string => Boolean(id)))
    const vendorUserIds = new Set(vendors.map((row) => row.user_id).filter((id): id is string => Boolean(id)))

    const profileOnlyHospitals = hospitalProfileRows.filter((profile) => !hospitalUserIds.has(profile.id))
    const totalHospitals = hospitals.length + profileOnlyHospitals.length
    const totalVendors = vendors.length

    const resolvedHospitalStatus = (row: HospitalRow) => {
      const historyStatus = hospitalHistoryMap.get(row.id) ?? (row.user_id ? hospitalHistoryMap.get(row.user_id) ?? null : null)
      if (historyStatus === 'manual_override') return 'verified' as VerificationStatus
      return historyStatus ?? getEffectiveStatus(row)
    }

    const resolvedVendorStatus = (row: VendorRow) => {
      const historyStatus = vendorHistoryMap.get(row.id) ?? (row.user_id ? vendorHistoryMap.get(row.user_id) ?? null : null)
      if (historyStatus === 'manual_override') return 'verified' as VerificationStatus
      return historyStatus ?? getEffectiveStatus(row)
    }

    const verifiedHospitals = hospitals.filter((row) => resolvedHospitalStatus(row) === 'verified').length
    const verifiedVendors = vendors.filter((row) => resolvedVendorStatus(row) === 'verified').length
    const pendingHospitalRows = hospitals.filter((row) => resolvedHospitalStatus(row) === 'pending').length
    const pendingVendorRows = vendors.filter((row) => resolvedVendorStatus(row) === 'pending').length

    const recentDaysAgo = new Date()
    recentDaysAgo.setDate(recentDaysAgo.getDate() - 7)

    const [recentHospitalRows, recentVendorRows] = await Promise.all([
      supabase
        .from('hospitals')
        .select('hospital_name, created_at')
        .gte('created_at', recentDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('vendors')
        .select('vendor_name, created_at')
        .gte('created_at', recentDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    if (recentHospitalRows.error) {
      return NextResponse.json({ error: recentHospitalRows.error.message }, { status: 500 })
    }

    if (recentVendorRows.error) {
      return NextResponse.json({ error: recentVendorRows.error.message }, { status: 500 })
    }

    const recentSignups = buildRecentSignups(
      (recentHospitalRows.data ?? []) as HospitalRow[],
      (recentVendorRows.data ?? []) as VendorRow[]
    )

    return NextResponse.json({
      totalHospitals,
      totalVendors,
      pendingHospitals: Math.max(0, pendingHospitalRows + profileOnlyHospitals.filter((profile) => {
        const historyStatus = hospitalHistoryMap.get(profile.id)
        return !historyStatus || historyStatus === 'pending'
      }).length),
      pendingVendors: Math.max(0, pendingVendorRows + vendorProfileRows.filter((profile) => {
        const historyStatus = vendorHistoryMap.get(profile.id)
        return !historyStatus || historyStatus === 'pending'
      }).length),
      verifiedHospitals,
      verifiedVendors,
      recentSignups,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load overview stats'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
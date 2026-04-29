import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_override'

type HospitalRow = {
  id: string
  user_id: string | null
  hospital_name: string
  registration_number: string | null
  country: string | null
  city: string | null
  hospital_type: string | null
  facility_type: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_person: string | null
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

type HospitalVerificationRow = {
  hospital_id: string
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

function getEffectiveStatus(row: HospitalRow): VerificationStatus {
  if (row.verification_status) return row.verification_status
  if (row.is_verified) return 'verified'
  return 'pending'
}

function getVerificationStatusFromHistory(
  row: HospitalRow,
  historyMap: Map<string, VerificationStatus>,
): VerificationStatus | null {
  return historyMap.get(row.id) ?? (row.user_id ? historyMap.get(row.user_id) ?? null : null)
}

async function fetchLatestHospitalVerificationMap(supabase: ReturnType<typeof getServiceClient>) {
  const rows: HospitalVerificationRow[] = []
  const pageSize = 500

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('hospital_verifications')
      .select('hospital_id, status, created_at')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const batch = (data ?? []) as HospitalVerificationRow[]
    rows.push(...batch)

    if (batch.length < pageSize) break
  }

  const historyMap = new Map<string, VerificationStatus>()
  for (const row of rows) {
    if (!historyMap.has(row.hospital_id) && row.status) {
      historyMap.set(row.hospital_id, row.status)
    }
  }

  return historyMap
}

export async function GET() {
  try {
    const supabase = getServiceClient()

    const [hospitalsResult, profilesResult, hospitalHistory] = await Promise.all([
      supabase
        .from('hospitals')
        .select('id, user_id, hospital_name, registration_number, country, city, hospital_type, facility_type, contact_email, contact_phone, contact_person, created_at, is_verified, verification_status')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, organization_name, email, phone, city, country, created_at')
        .eq('role', 'hospital')
        .order('created_at', { ascending: false }),
      fetchLatestHospitalVerificationMap(supabase),
    ])

    if (hospitalsResult.error) {
      return NextResponse.json({ error: hospitalsResult.error.message }, { status: 500 })
    }

    if (profilesResult.error) {
      return NextResponse.json({ error: profilesResult.error.message }, { status: 500 })
    }

    const hospitalsData = (hospitalsResult.data ?? []) as HospitalRow[]
    const profileRows = (profilesResult.data ?? []) as ProfileRow[]
    const historyMap = hospitalHistory

    const existingUserIds = new Set(
      hospitalsData
        .map((hospital) => hospital.user_id)
        .filter((id): id is string => Boolean(id))
    )

    const mergedHospitals = [
      ...hospitalsData.map((hospital) => ({
        ...hospital,
        verification_status: (() => {
          const historyStatus = getVerificationStatusFromHistory(hospital, historyMap)
          if (historyStatus === 'manual_override') return 'verified' as VerificationStatus
          if (historyStatus) return historyStatus
          return getEffectiveStatus(hospital)
        })(),
        verification_source: (() => {
          const historyStatus = getVerificationStatusFromHistory(hospital, historyMap)
          if (historyStatus === 'verified' || historyStatus === 'manual_override') return 'manual_override'
          if (historyStatus === 'rejected') return 'manual'
          return hospital.is_verified ? 'manual_override' : hospital.verification_status === 'rejected' ? 'manual' : null
        })(),
      })),
      ...profileRows
        .filter((profile) => !existingUserIds.has(profile.id))
        .map((profile) => ({
          id: profile.id,
          user_id: profile.id,
          hospital_name: profile.organization_name || profile.full_name || profile.email || 'Unnamed hospital account',
          registration_number: null,
          country: profile.country,
          city: profile.city,
          hospital_type: null,
          facility_type: null,
          contact_email: profile.email,
          contact_phone: profile.phone,
          contact_person: profile.full_name,
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

    return NextResponse.json({ hospitals: mergedHospitals })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load hospitals'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
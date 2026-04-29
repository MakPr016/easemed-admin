import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient as createAuthClient } from '@/lib/supabase/server'

type EntityType = 'hospital' | 'vendor'
type VerificationStatus = 'verified' | 'rejected' | 'manual_override'

type EntityRecord = Record<string, unknown>

const resend = new Resend(process.env.RESEND_API_KEY)

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

function normalizeType(value: unknown): EntityType {
  return value === 'vendor' ? 'vendor' : 'hospital'
}

function normalizeStatus(value: unknown): VerificationStatus {
  return value === 'rejected' || value === 'manual_override' ? value : 'verified'
}

function getWebsiteUrl(request: Request) {
  return new URL('/', request.url).toString()
}

function getLoginUrl(request: Request) {
  return new URL('/login', request.url).toString()
}

function getEntityTable(type: EntityType) {
  return type === 'hospital' ? 'hospitals' : 'vendors'
}

function getVerificationTable(type: EntityType) {
  return type === 'hospital' ? 'hospital_verifications' : 'vendor_verifications'
}

function getEntityIdColumn(type: EntityType) {
  return type === 'hospital' ? 'hospital_id' : 'vendor_id'
}

function getDisplayName(type: EntityType, entity: EntityRecord, profile?: EntityRecord | null) {
  if (type === 'hospital') {
    return String(entity.hospital_name ?? profile?.organization_name ?? profile?.full_name ?? profile?.email ?? 'Hospital account')
  }

  return String(entity.vendor_name ?? profile?.organization_name ?? profile?.full_name ?? profile?.email ?? 'Vendor account')
}

function getContactEmail(entity: EntityRecord, profile?: EntityRecord | null) {
  return String(entity.contact_email ?? profile?.email ?? '')
}

function getAdminNotes(notes: unknown) {
  const text = typeof notes === 'string' ? notes.trim() : ''
  return text || null
}

function buildVerificationSnapshot(
  type: EntityType,
  entity: EntityRecord,
  profile: EntityRecord | null,
  adminNotes: string | null,
) {
  return {
    entityType: type,
    capturedAt: new Date().toISOString(),
    adminNotes,
    entity,
    profile,
  }
}

async function insertVerificationLog(
  admin: ReturnType<typeof getServiceClient>,
  type: EntityType,
  entity: EntityRecord,
  profile: EntityRecord | null,
  status: 'verified' | 'rejected',
  adminId: string,
  adminNotes: string | null,
) {
  const verificationTable = getVerificationTable(type)
  const entityIdColumn = getEntityIdColumn(type)
  const entityRowId = String(entity.id ?? entity.user_id ?? profile?.id ?? '')

  const payload: Record<string, unknown> = {
    [entityIdColumn]: entityRowId,
    verification_type: 'manual',
    registration_verified: status === 'verified',
    status,
    admin_id: adminId,
    admin_notes: adminNotes,
    verified_at: new Date().toISOString(),
    registration_verified_data: buildVerificationSnapshot(type, entity, profile, adminNotes),
  }

  if (type === 'hospital') {
    payload.registration_number = entity.registration_number ?? null
    payload.country = entity.country ?? profile?.country ?? null
  } else {
    payload.company_registration = entity.company_registration ?? null
    payload.vat_id = entity.vat_id ?? null
    payload.country = entity.country ?? profile?.country ?? null
  }

  const { error } = await admin.from(verificationTable).insert(payload)
  if (!error) return

  const fallbackPayload: Record<string, unknown> = {
    [entityIdColumn]: entityRowId,
    verification_type: 'manual',
    registration_verified: status === 'verified',
    admin_id: adminId,
    admin_notes: adminNotes,
    verified_at: new Date().toISOString(),
  }

  await admin.from(verificationTable).insert(fallbackPayload)
}

async function sendStatusEmail(
  websiteUrl: string,
  loginUrl: string,
  type: EntityType,
  entityName: string,
  recipientEmail: string,
  status: VerificationStatus,
  reason: string | null,
) {
  if (!recipientEmail) return

  const isApproved = status !== 'rejected'
  const statusLabel = isApproved ? 'Approved' : 'Rejected'
  const reasonText = reason ?? (isApproved ? 'Your account was approved after manual review.' : 'Your account was not approved during manual review.')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 640px; margin: 0 auto;">
      <h2 style="color: ${isApproved ? '#15803d' : '#b91c1c'}; margin-bottom: 12px;">${statusLabel}: ${entityName}</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Your ${type} application has been <strong>${statusLabel.toLowerCase()}</strong>.
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        <strong>Reason:</strong> ${reasonText}
      </p>
      ${isApproved ? '<p style="font-size: 14px; color: #475569; line-height: 1.6;">You can now sign in and access your dashboard.</p>' : '<p style="font-size: 14px; color: #475569; line-height: 1.6;">Your application remains saved for audit history. You can sign in and submit updated onboarding details to re-apply.</p>'}
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Website: <a href="${websiteUrl}" style="color: #1f3a61;">${websiteUrl}</a>
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        Sign in: <a href="${loginUrl}" style="color: #1f3a61;">${loginUrl}</a>
      </p>
    </div>
  `

  await resend.emails.send({
    from: 'Easemed <onboarding@resend.dev>',
    to: [recipientEmail],
    subject: `EaseMed application ${statusLabel.toLowerCase()} for ${entityName}`,
    html,
  })
}

async function fetchEntity(admin: ReturnType<typeof getServiceClient>, type: EntityType, entityId: string) {
  const table = getEntityTable(type)
  const { data, error } = await admin
    .from(table)
    .select('*')
    .or(`id.eq.${entityId},user_id.eq.${entityId}`)
    .maybeSingle()

  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? null) as EntityRecord | null
}

async function fetchProfile(admin: ReturnType<typeof getServiceClient>, userId: string) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, organization_name, email, role, phone, city, state, country, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(`profiles: ${error.message}`)
  return (data ?? null) as EntityRecord | null
}

async function approveEntity(
  admin: ReturnType<typeof getServiceClient>,
  websiteUrl: string,
  loginUrl: string,
  type: EntityType,
  entityId: string,
  entity: EntityRecord,
  profile: EntityRecord | null,
  adminId: string,
) {
  const table = getEntityTable(type)
  const entityName = getDisplayName(type, entity, profile)
  const contactEmail = getContactEmail(entity, profile)
  const userId = String(entity.user_id ?? profile?.id ?? entityId)
  const reason = getAdminNotes(entity.admin_notes) ?? 'Approved after manual review.'

  const baseUpdate: EntityRecord = {
    is_verified: true,
  }

  const optionalUpdate: EntityRecord = {
    verification_status: 'verified',
    verification_source: 'manual',
  }

  const upsertPayload: EntityRecord = {
    ...entity,
    id: entity.id ?? entityId,
    user_id: userId,
    is_verified: true,
    verification_status: 'verified',
    verification_source: 'manual',
  }

  const { data: existing, error: fetchError } = await admin
    .from(table)
    .select('id, user_id')
    .or(`id.eq.${entityId},user_id.eq.${userId}`)
    .maybeSingle()

  if (fetchError) throw new Error(`${table}: ${fetchError.message}`)

  if (existing?.id) {
    const { error: updateError } = await admin
      .from(table)
      .update({ ...baseUpdate, ...optionalUpdate })
      .eq('id', existing.id)

    if (updateError) {
      const fallback = await admin.from(table).update(baseUpdate).eq('id', existing.id)
      if (fallback.error) throw new Error(`${table}: ${fallback.error.message}`)
    }
  } else {
    const { error: insertError } = await admin.from(table).upsert(upsertPayload, { onConflict: 'user_id' })
    if (insertError) {
      const fallbackPayload = { ...upsertPayload }
      delete fallbackPayload.verification_status
      delete fallbackPayload.verification_source
      const fallback = await admin.from(table).upsert(fallbackPayload, { onConflict: 'user_id' })
      if (fallback.error) throw new Error(`${table}: ${fallback.error.message}`)
    }
  }

  await insertVerificationLog(
    admin,
    type,
    {
      ...entity,
      id: existing?.id ?? entity.id ?? entityId,
      user_id: userId,
      verification_status: 'verified',
      is_verified: true,
    },
    profile,
    'verified',
    adminId,
    getAdminNotes(entity.admin_notes) ?? reason,
  )

  await sendStatusEmail(
    websiteUrl,
    loginUrl,
    type,
    entityName,
    contactEmail,
    'verified',
    getAdminNotes(entity.admin_notes) ?? reason,
  ).catch((emailError) => {
    console.error('Verification email failed:', emailError)
  })
}

async function rejectEntity(
  admin: ReturnType<typeof getServiceClient>,
  websiteUrl: string,
  loginUrl: string,
  type: EntityType,
  entityId: string,
  entity: EntityRecord,
  profile: EntityRecord | null,
  adminId: string,
) {
  const table = getEntityTable(type)
  const entityName = getDisplayName(type, entity, profile)
  const contactEmail = getContactEmail(entity, profile)
  const reason = getAdminNotes(entity.admin_notes) ?? 'Rejected after manual review.'
  const userId = String(entity.user_id ?? profile?.id ?? entityId)
  const rowId = String(entity.id ?? entityId)

  const rejectedUpdate: EntityRecord = {
    is_verified: false,
    verification_status: 'rejected',
    verification_source: 'manual',
  }

  const updateById = await admin.from(table).update(rejectedUpdate).eq('id', rowId)
  const updateByUser = await admin.from(table).update(rejectedUpdate).eq('user_id', userId)

  if (updateById.error && updateByUser.error) {
    const fallback = await admin.from(table).update({ is_verified: false }).eq('user_id', userId)
    if (fallback.error) throw new Error(`${table}: ${fallback.error.message}`)
  }

  await insertVerificationLog(
    admin,
    type,
    {
      ...entity,
      id: rowId,
      user_id: userId,
      verification_status: 'rejected',
      is_verified: false,
    },
    profile,
    'rejected',
    adminId,
    reason,
  )

  await sendStatusEmail(
    websiteUrl,
    loginUrl,
    type,
    entityName,
    contactEmail,
    'rejected',
    reason,
  ).catch((emailError) => {
    console.error('Rejection email failed:', emailError)
  })
}

export async function POST(request: Request) {
  try {
    const authClient = await createAuthClient()
    const serviceClient = getServiceClient()

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await authClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as {
      entityType?: unknown
      entityId?: unknown
      status?: unknown
      adminNotes?: unknown
      entity?: EntityRecord
    }

    const type = normalizeType(body.entityType)
    const status = normalizeStatus(body.status)
    const entityId = typeof body.entityId === 'string' ? body.entityId : ''
    const websiteUrl = getWebsiteUrl(request)
    const loginUrl = getLoginUrl(request)

    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required' }, { status: 400 })
    }

    const entity = body.entity ?? (await fetchEntity(serviceClient, type, entityId))
    if (!entity) {
      return NextResponse.json({ error: `${type} record not found` }, { status: 404 })
    }

    entity.admin_notes = getAdminNotes(body.adminNotes) ?? getAdminNotes(entity.admin_notes)

    const profileRow = await fetchProfile(serviceClient, String(entity.user_id ?? entityId))

    if (status === 'rejected') {
      await rejectEntity(serviceClient, websiteUrl, loginUrl, type, entityId, entity, profileRow, user.id)
      return NextResponse.json({ success: true, status: 'rejected' })
    }

    await approveEntity(serviceClient, websiteUrl, loginUrl, type, entityId, entity, profileRow, user.id)
    return NextResponse.json({ success: true, status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update verification status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
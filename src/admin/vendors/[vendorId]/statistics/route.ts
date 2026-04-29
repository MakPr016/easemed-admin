import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type VendorRow = {
  id: string
  user_id: string | null
  vendor_name: string
  city: string | null
  country: string | null
  vendor_type: string[] | null
  created_at: string
  verification_status: string | null
  is_verified: boolean | null
}

type VerificationRow = {
  id: string
  status: string | null
  admin_notes: string | null
  created_at: string
  verified_at: string | null
}

type QuotationRow = {
  id: string
  rfq_id: string
  vendor_id: string | null
  total_amount: number | null
  status: string | null
  submitted_at: string | null
  created_at: string
  notes: string | null
  terms: string | null
  valid_until: string | null
}

type PurchaseOrderRow = {
  id: string
  rfq_id: string | null
  hospital_id: string | null
  vendor_id: string | null
  total_amount: number | null
  status: string | null
  payment_status: string | null
  order_date: string | null
  created_at: string
  delivery_date: string | null
}

type ConversationRow = {
  id: string
  rfq_id: string
  hospital_id: string
  vendor_id: string
  eligibility_status: string
  created_at: string
}

type RfqRow = {
  id: string
  user_id: string
  title: string
  status: string
  created_at: string
  updated_at: string
  deadline: string | null
  metadata: Record<string, unknown> | null
}

type RfqItemRow = {
  id: string
  rfq_id: string
  component_name: string | null
  line_item_id: number
  item_type: string | null
  fields: Record<string, unknown> | null
  raw_row: unknown[] | null
  delivery_schedule: unknown[] | null
  created_at: string
}

type HospitalRow = {
  id: string
  hospital_name: string
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

function monthKey(value: string) {
  const d = new Date(value)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  })
}

function buildLastMonths(count: number) {
  const out: string[] = []
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()

  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(year, month - i, 1))
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }

  return out
}

function toNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return value
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params
    const supabase = getServiceClient()

    const { data: vendorById, error: vendorByIdError } = await supabase
      .from('vendors')
      .select('id, user_id, vendor_name, city, country, vendor_type, created_at, verification_status, is_verified')
      .eq('id', vendorId)
      .maybeSingle()

    if (vendorByIdError) {
      return NextResponse.json({ error: vendorByIdError.message }, { status: 500 })
    }

    const { data: vendorByUser, error: vendorByUserError } = vendorById
      ? { data: null, error: null }
      : await supabase
          .from('vendors')
          .select('id, user_id, vendor_name, city, country, vendor_type, created_at, verification_status, is_verified')
          .eq('user_id', vendorId)
          .maybeSingle()

    if (vendorByUserError) {
      return NextResponse.json({ error: vendorByUserError.message }, { status: 500 })
    }

    const vendor = (vendorById ?? vendorByUser) as VendorRow | null
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const vendorIdCandidates = [vendor.id, vendor.user_id, vendorId].filter((value): value is string => Boolean(value))

    const [verificationRes, quotationRes, ordersRes, conversationRes] = await Promise.all([
      supabase
        .from('vendor_verifications')
        .select('id, status, admin_notes, created_at, verified_at')
        .in('vendor_id', vendorIdCandidates)
        .order('created_at', { ascending: false }),
      supabase
        .from('quotations')
        .select('id, rfq_id, vendor_id, total_amount, status, submitted_at, created_at, notes, terms, valid_until')
        .in('vendor_id', vendorIdCandidates)
        .order('created_at', { ascending: false }),
      supabase
        .from('purchase_orders')
        .select('id, rfq_id, hospital_id, vendor_id, total_amount, status, payment_status, order_date, created_at, delivery_date')
        .in('vendor_id', vendorIdCandidates)
        .order('created_at', { ascending: false }),
      supabase
        .from('conversations')
        .select('id, rfq_id, hospital_id, vendor_id, eligibility_status, created_at')
        .in('vendor_id', vendorIdCandidates)
        .order('created_at', { ascending: false }),
    ])

    if (verificationRes.error) return NextResponse.json({ error: verificationRes.error.message }, { status: 500 })
    if (quotationRes.error) return NextResponse.json({ error: quotationRes.error.message }, { status: 500 })
    if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 })
    if (conversationRes.error) return NextResponse.json({ error: conversationRes.error.message }, { status: 500 })

    const verifications = (verificationRes.data ?? []) as VerificationRow[]
    const quotations = (quotationRes.data ?? []) as QuotationRow[]
    const purchaseOrders = (ordersRes.data ?? []) as PurchaseOrderRow[]
    const conversations = (conversationRes.data ?? []) as ConversationRow[]

    const rfqIds = Array.from(new Set(quotations.map((row) => row.rfq_id).filter(Boolean)))

    const [rfqRes, rfqItemsRes] = rfqIds.length
      ? await Promise.all([
          supabase
            .from('rfqs')
            .select('id, user_id, title, status, created_at, updated_at, deadline, metadata')
            .in('id', rfqIds),
          supabase
            .from('rfq_items')
            .select('id, rfq_id, component_name, line_item_id, item_type, fields, raw_row, delivery_schedule, created_at')
            .in('rfq_id', rfqIds)
            .order('line_item_id', { ascending: true }),
        ])
      : [{ data: [], error: null }, { data: [], error: null }]

    if (rfqRes.error) return NextResponse.json({ error: rfqRes.error.message }, { status: 500 })
    if (rfqItemsRes.error) return NextResponse.json({ error: rfqItemsRes.error.message }, { status: 500 })

    const rfqs = (rfqRes.data ?? []) as RfqRow[]
    const rfqItems = (rfqItemsRes.data ?? []) as RfqItemRow[]

    const hospitalIds = Array.from(new Set(
      [
        ...rfqs.map((row) => row.user_id),
        ...purchaseOrders.map((row) => row.hospital_id ?? ''),
        ...conversations.map((row) => row.hospital_id),
      ].filter((value): value is string => Boolean(value))
    ))

    const { data: hospitals, error: hospitalsError } = hospitalIds.length
      ? await supabase
          .from('hospitals')
          .select('id, hospital_name')
          .in('id', hospitalIds)
      : { data: [], error: null }

    if (hospitalsError) {
      return NextResponse.json({ error: hospitalsError.message }, { status: 500 })
    }

    const hospitalMap = new Map((hospitals ?? []).map((row: HospitalRow) => [row.id, row.hospital_name]))
    const rfqMap = new Map(rfqs.map((row) => [row.id, row]))

    const itemsByRfqId = new Map<string, RfqItemRow[]>()
    for (const item of rfqItems) {
      const bucket = itemsByRfqId.get(item.rfq_id) ?? []
      bucket.push(item)
      itemsByRfqId.set(item.rfq_id, bucket)
    }

    const quotesByRfqId = new Map<string, QuotationRow[]>()
    for (const quote of quotations) {
      const bucket = quotesByRfqId.get(quote.rfq_id) ?? []
      bucket.push(quote)
      quotesByRfqId.set(quote.rfq_id, bucket)
    }

    const ordersByRfqId = new Map<string, PurchaseOrderRow[]>()
    for (const order of purchaseOrders) {
      if (!order.rfq_id) continue
      const bucket = ordersByRfqId.get(order.rfq_id) ?? []
      bucket.push(order)
      ordersByRfqId.set(order.rfq_id, bucket)
    }

    const conversationsByRfqId = new Map<string, ConversationRow[]>()
    for (const conversation of conversations) {
      const bucket = conversationsByRfqId.get(conversation.rfq_id) ?? []
      bucket.push(conversation)
      conversationsByRfqId.set(conversation.rfq_id, bucket)
    }

    const totalQuotes = quotations.length
    const totalOrders = purchaseOrders.length
    const totalRevenue = purchaseOrders.reduce((sum, row) => sum + toNumber(row.total_amount), 0)
    const awardedQuotes = quotations.filter((quote) => quote.status === 'accepted' || quote.status === 'awarded').length

    const quotationByStatusMap = new Map<string, { count: number; amount: number }>()
    for (const row of quotations) {
      const key = row.status ?? 'unknown'
      const existing = quotationByStatusMap.get(key) ?? { count: 0, amount: 0 }
      existing.count += 1
      existing.amount += toNumber(row.total_amount)
      quotationByStatusMap.set(key, existing)
    }

    const quotationsByStatus = Array.from(quotationByStatusMap.entries()).map(([status, aggregate]) => ({
      status,
      count: aggregate.count,
      totalAmount: aggregate.amount,
    }))

    const ordersByStatusMap = new Map<string, { count: number; amount: number }>()
    for (const row of purchaseOrders) {
      const key = row.status ?? 'unknown'
      const existing = ordersByStatusMap.get(key) ?? { count: 0, amount: 0 }
      existing.count += 1
      existing.amount += toNumber(row.total_amount)
      ordersByStatusMap.set(key, existing)
    }

    const ordersByStatus = Array.from(ordersByStatusMap.entries()).map(([status, aggregate]) => ({
      status,
      count: aggregate.count,
      totalAmount: aggregate.amount,
    }))

    const monthKeys = buildLastMonths(6)
    const monthlyQuoteMap = new Map(monthKeys.map((key) => [key, 0]))
    const monthlyOrderMap = new Map(monthKeys.map((key) => [key, 0]))

    for (const row of quotations) {
      const key = monthKey(row.created_at)
      if (monthlyQuoteMap.has(key)) {
        monthlyQuoteMap.set(key, (monthlyQuoteMap.get(key) ?? 0) + 1)
      }
    }

    for (const row of purchaseOrders) {
      const key = monthKey(row.created_at)
      if (monthlyOrderMap.has(key)) {
        monthlyOrderMap.set(key, (monthlyOrderMap.get(key) ?? 0) + 1)
      }
    }

    const monthlyActivity = monthKeys.map((key) => ({
      monthKey: key,
      label: monthLabel(key),
      quotations: monthlyQuoteMap.get(key) ?? 0,
      orders: monthlyOrderMap.get(key) ?? 0,
    }))

    const timeline = [
      ...verifications.map((row) => ({
        id: `verification-${row.id}`,
        type: 'verification',
        title: `Verification ${row.status ?? 'pending'}`,
        subtitle: row.admin_notes ?? null,
        created_at: row.verified_at ?? row.created_at,
      })),
      ...quotations.map((row) => ({
        id: `quote-${row.id}`,
        type: 'quote',
        title: `Quotation ${row.id.slice(0, 8)}`,
        subtitle: `Status: ${row.status ?? 'pending'}`,
        created_at: row.submitted_at ?? row.created_at,
      })),
      ...purchaseOrders.map((row) => ({
        id: `order-${row.id}`,
        type: 'order',
        title: `Purchase Order ${row.id.slice(0, 8)}`,
        subtitle: `Status: ${row.status ?? 'pending'}${row.total_amount ? ` • $${toNumber(row.total_amount).toLocaleString()}` : ''}`,
        created_at: row.order_date ?? row.created_at,
      })),
      ...conversations.map((row) => ({
        id: `conversation-${row.id}`,
        type: 'conversation',
        title: `Conversation ${row.id.slice(0, 8)}`,
        subtitle: `Eligibility: ${row.eligibility_status}`,
        created_at: row.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)

    const rfqActivity = rfqs.map((rfq) => {
      const rfqQuotes = quotesByRfqId.get(rfq.id) ?? []
      const relatedOrders = ordersByRfqId.get(rfq.id) ?? []
      const relatedConversations = conversationsByRfqId.get(rfq.id) ?? []
      const lineItems = itemsByRfqId.get(rfq.id) ?? []

      return {
        id: rfq.id,
        title: rfq.title,
        status: rfq.status,
        created_at: rfq.created_at,
        updated_at: rfq.updated_at,
        deadline: rfq.deadline,
        metadata: rfq.metadata,
        hospitalId: rfq.user_id,
        hospitalName: hospitalMap.get(rfq.user_id) ?? null,
        itemCount: lineItems.length,
        quoteCount: rfqQuotes.length,
        orderCount: relatedOrders.length,
        conversationCount: relatedConversations.length,
        lineItems: lineItems.map((item) => ({
          id: item.id,
          lineItemId: item.line_item_id,
          componentName: item.component_name,
          itemType: item.item_type,
          fields: item.fields,
          rawRow: item.raw_row,
          deliverySchedule: item.delivery_schedule,
          createdAt: item.created_at,
        })),
        quotations: rfqQuotes.map((quote) => ({
          id: quote.id,
          totalAmount: quote.total_amount,
          status: quote.status,
          submittedAt: quote.submitted_at,
          createdAt: quote.created_at,
          validUntil: quote.valid_until,
          notes: quote.notes,
          terms: quote.terms,
        })),
        orders: relatedOrders.map((order) => ({
          id: order.id,
          totalAmount: order.total_amount,
          status: order.status,
          paymentStatus: order.payment_status,
          orderDate: order.order_date,
          createdAt: order.created_at,
          deliveryDate: order.delivery_date,
        })),
        conversations: relatedConversations.map((conversation) => ({
          id: conversation.id,
          hospitalId: conversation.hospital_id,
          hospitalName: hospitalMap.get(conversation.hospital_id) ?? null,
          eligibilityStatus: conversation.eligibility_status,
          createdAt: conversation.created_at,
        })),
      }
    })

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        user_id: vendor.user_id,
        vendor_name: vendor.vendor_name,
        city: vendor.city,
        country: vendor.country,
        vendor_type: vendor.vendor_type,
        created_at: vendor.created_at,
        verification_status: vendor.verification_status,
        is_verified: vendor.is_verified,
      },
      summary: {
        totalQuotations: totalQuotes,
        totalOrders,
        totalRevenue,
        awardedQuotes,
        activeConversations: conversations.filter((row) => row.eligibility_status === 'enabled').length,
        totalConversations: conversations.length,
        quotationToOrderRate: totalQuotes > 0 ? Number((totalOrders / totalQuotes).toFixed(2)) : 0,
      },
      quotationsByStatus,
      ordersByStatus,
      monthlyActivity,
      recentTimeline: timeline,
      verificationHistory: verifications,
      purchaseOrders,
      conversations,
      rfqs: rfqActivity,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load vendor statistics'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

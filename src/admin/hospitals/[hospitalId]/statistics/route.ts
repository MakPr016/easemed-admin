import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type HospitalRow = {
    id: string
    user_id: string | null
    hospital_name: string
    created_at: string
    verification_status: string | null
    is_verified: boolean | null
    city: string | null
    country: string | null
    facility_type: string | null
    hospital_type: string | null
}

type RfqRow = {
    id: string
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
    vendor_id: string | null
    total_amount: number | null
    status: string | null
    payment_status: string | null
    order_date: string | null
    created_at: string
    delivery_date: string | null
}

type VerificationRow = {
    id: string
    status: string | null
    admin_notes: string | null
    created_at: string
    verified_at: string | null
}

type ConversationRow = {
    id: string
    rfq_id: string
    vendor_id: string
    eligibility_status: string
    created_at: string
}

type NotificationRow = {
    id: string
    title: string
    type: string
    is_read: boolean | null
    created_at: string
}

type VendorRow = {
    id: string
    vendor_name: string
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
    { params }: { params: Promise<{ hospitalId: string }> }
) {
    try {
        const { hospitalId } = await params
        const supabase = getServiceClient()

        const { data: hospitalById, error: hospitalByIdError } = await supabase
            .from('hospitals')
            .select('id, user_id, hospital_name, created_at, verification_status, is_verified, city, country, facility_type, hospital_type')
            .eq('id', hospitalId)
            .maybeSingle()

        if (hospitalByIdError) {
            return NextResponse.json({ error: hospitalByIdError.message }, { status: 500 })
        }

        const { data: hospitalByUser, error: hospitalByUserError } = hospitalById
            ? { data: null, error: null }
            : await supabase
                .from('hospitals')
                .select('id, user_id, hospital_name, created_at, verification_status, is_verified, city, country, facility_type, hospital_type')
                .eq('user_id', hospitalId)
                .maybeSingle()

        if (hospitalByUserError) {
            return NextResponse.json({ error: hospitalByUserError.message }, { status: 500 })
        }

        const hospital = (hospitalById ?? hospitalByUser) as HospitalRow | null
        if (!hospital) {
            return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
        }

        const profileIdCandidates = [hospital.user_id, hospital.id, hospitalId].filter((value): value is string => Boolean(value))
        const hospitalIdCandidates = [hospital.id, hospital.user_id].filter((value): value is string => Boolean(value))
        const [
            rfqRes,
            verificationRes,
            conversationRes,
            notificationRes,
            ordersRes,
        ] = await Promise.all([
            supabase
                .from('rfqs')
                .select('id, title, status, created_at, updated_at, deadline, metadata')
                .in('user_id', profileIdCandidates)
                .order('created_at', { ascending: false }),
            supabase
                .from('hospital_verifications')
                .select('id, status, admin_notes, created_at, verified_at')
                .in('hospital_id', profileIdCandidates)
                .order('created_at', { ascending: false }),
            supabase
                .from('conversations')
                .select('id, rfq_id, vendor_id, eligibility_status, created_at')
                .in('hospital_id', profileIdCandidates)
                .order('created_at', { ascending: false }),
            supabase
                .from('notifications')
                .select('id, title, type, is_read, created_at')
                .in('user_id', profileIdCandidates)
                .order('created_at', { ascending: false })
                .limit(100),
            supabase
                .from('purchase_orders')
                .select('id, rfq_id, vendor_id, total_amount, status, payment_status, order_date, created_at, delivery_date')
                .in('hospital_id', hospitalIdCandidates)
                .order('created_at', { ascending: false }),
        ])

        if (rfqRes.error) return NextResponse.json({ error: rfqRes.error.message }, { status: 500 })
        if (verificationRes.error) return NextResponse.json({ error: verificationRes.error.message }, { status: 500 })
        if (conversationRes.error) return NextResponse.json({ error: conversationRes.error.message }, { status: 500 })
        if (notificationRes.error) return NextResponse.json({ error: notificationRes.error.message }, { status: 500 })
        if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 })

        const rfqs = (rfqRes.data ?? []) as RfqRow[]
        const verifications = (verificationRes.data ?? []) as VerificationRow[]
        const conversations = (conversationRes.data ?? []) as ConversationRow[]
        const notifications = (notificationRes.data ?? []) as NotificationRow[]
        const purchaseOrders = (ordersRes.data ?? []) as PurchaseOrderRow[]

        const rfqIds = rfqs.map((row) => row.id)

        const [rfqItemsRes, quotationRes] = rfqIds.length
            ? await Promise.all([
                supabase
                    .from('rfq_items')
                    .select('id, rfq_id, component_name, line_item_id, item_type, fields, raw_row, delivery_schedule, created_at')
                    .in('rfq_id', rfqIds)
                    .order('line_item_id', { ascending: true }),
                supabase
                    .from('quotations')
                    .select('id, rfq_id, vendor_id, total_amount, status, submitted_at, created_at, notes, terms, valid_until')
                    .in('rfq_id', rfqIds)
                    .order('created_at', { ascending: false }),
            ])
            : [{ data: [], error: null }, { data: [], error: null }]

        if (rfqItemsRes.error) return NextResponse.json({ error: rfqItemsRes.error.message }, { status: 500 })
        if (quotationRes.error) return NextResponse.json({ error: quotationRes.error.message }, { status: 500 })

        const rfqItems = (rfqItemsRes.data ?? []) as RfqItemRow[]
        const quotations = (quotationRes.data ?? []) as QuotationRow[]

        const quotesByRfqId = new Map<string, QuotationRow[]>()
        for (const quote of quotations) {
            const bucket = quotesByRfqId.get(quote.rfq_id) ?? []
            bucket.push(quote)
            quotesByRfqId.set(quote.rfq_id, bucket)
        }

        const itemsByRfqId = new Map<string, RfqItemRow[]>()
        for (const item of rfqItems) {
            const bucket = itemsByRfqId.get(item.rfq_id) ?? []
            bucket.push(item)
            itemsByRfqId.set(item.rfq_id, bucket)
        }

        const vendorIds = Array.from(new Set(
            purchaseOrders.map((row) => row.vendor_id).filter((value): value is string => Boolean(value))
        ))

        const { data: vendors, error: vendorsError } = vendorIds.length
            ? await supabase
                .from('vendors')
                .select('id, vendor_name')
                .in('id', vendorIds)
            : { data: [], error: null }

        if (vendorsError) {
            return NextResponse.json({ error: vendorsError.message }, { status: 500 })
        }

        const vendorMap = new Map((vendors ?? []).map((vendor: VendorRow) => [vendor.id, vendor.vendor_name]))

        const totalRfq = rfqs.length
        const totalQuotes = quotations.length
        const totalOrders = purchaseOrders.length
        const totalSpend = purchaseOrders.reduce((sum, row) => sum + toNumber(row.total_amount), 0)

        const rfqByStatus = {
            draft: rfqs.filter((row) => row.status === 'draft').length,
            published: rfqs.filter((row) => row.status === 'published').length,
            closed: rfqs.filter((row) => row.status === 'closed').length,
            awarded: rfqs.filter((row) => row.status === 'awarded').length,
        }

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

        const vendorTradeMap = new Map<string, { vendorName: string; orders: number; amount: number }>()
        for (const row of purchaseOrders) {
            const key = row.vendor_id ?? 'unknown'
            const vendorName = key === 'unknown' ? 'Unknown Vendor' : (vendorMap.get(key) ?? 'Unknown Vendor')
            const existing = vendorTradeMap.get(key) ?? { vendorName, orders: 0, amount: 0 }
            existing.orders += 1
            existing.amount += toNumber(row.total_amount)
            vendorTradeMap.set(key, existing)
        }

        const topVendors = Array.from(vendorTradeMap.values())
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)

        const monthKeys = buildLastMonths(6)
        const monthlyRfqMap = new Map(monthKeys.map((key) => [key, 0]))
        const monthlyOrderMap = new Map(monthKeys.map((key) => [key, 0]))

        for (const row of rfqs) {
            const key = monthKey(row.created_at)
            if (monthlyRfqMap.has(key)) {
                monthlyRfqMap.set(key, (monthlyRfqMap.get(key) ?? 0) + 1)
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
            rfqs: monthlyRfqMap.get(key) ?? 0,
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
            ...rfqs.map((row) => ({
                id: `rfq-${row.id}`,
                type: 'rfq',
                title: `RFQ: ${row.title}`,
                subtitle: `Status: ${row.status}`,
                created_at: row.created_at,
            })),
            ...purchaseOrders.map((row) => ({
                id: `order-${row.id}`,
                type: 'order',
                title: `Purchase Order ${row.id.slice(0, 8)}`,
                subtitle: `Status: ${row.status ?? 'pending'}${row.total_amount ? ` • $${toNumber(row.total_amount).toLocaleString()}` : ''}`,
                created_at: row.order_date ?? row.created_at,
            })),
            ...quotations.map((row) => ({
                id: `quote-${row.id}`,
                type: 'quote',
                title: `Quotation ${row.id.slice(0, 8)}`,
                subtitle: `Status: ${row.status ?? 'pending'}`,
                created_at: row.submitted_at ?? row.created_at,
            })),
        ]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 40)

        const rfqDetails = rfqs.map((rfq) => {
            const rfqItemsForRfq = itemsByRfqId.get(rfq.id) ?? []
            const quotesForRfq = quotesByRfqId.get(rfq.id) ?? []
            const relatedOrders = purchaseOrders.filter((order) => order.rfq_id === rfq.id)
            const relatedConversations = conversations.filter((conversation) => conversation.rfq_id === rfq.id)

            return {
                ...rfq,
                itemCount: rfqItemsForRfq.length,
                quoteCount: quotesForRfq.length,
                orderCount: relatedOrders.length,
                conversationCount: relatedConversations.length,
                lineItems: rfqItemsForRfq.map((item) => ({
                    id: item.id,
                    lineItemId: item.line_item_id,
                    componentName: item.component_name,
                    itemType: item.item_type,
                    fields: item.fields,
                    rawRow: item.raw_row,
                    deliverySchedule: item.delivery_schedule,
                    createdAt: item.created_at,
                })),
                quotations: quotesForRfq.map((quote) => ({
                    id: quote.id,
                    vendorId: quote.vendor_id,
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
                    vendorId: order.vendor_id,
                    totalAmount: order.total_amount,
                    status: order.status,
                    paymentStatus: order.payment_status,
                    orderDate: order.order_date,
                    createdAt: order.created_at,
                    deliveryDate: order.delivery_date,
                })),
                conversations: relatedConversations.map((conversation) => ({
                    id: conversation.id,
                    vendorId: conversation.vendor_id,
                    eligibilityStatus: conversation.eligibility_status,
                    createdAt: conversation.created_at,
                })),
            }
        })

        return NextResponse.json({
            hospital: {
                id: hospital.id,
                user_id: hospital.user_id,
                hospital_name: hospital.hospital_name,
                city: hospital.city,
                country: hospital.country,
                facility_type: hospital.facility_type,
                hospital_type: hospital.hospital_type,
                created_at: hospital.created_at,
                verification_status: hospital.verification_status,
                is_verified: hospital.is_verified,
            },
            summary: {
                totalRfqs: totalRfq,
                totalQuotations: totalQuotes,
                totalOrders,
                totalSpend,
                activeConversations: conversations.filter((row) => row.eligibility_status === 'enabled').length,
                totalConversations: conversations.length,
                unreadNotifications: notifications.filter((row) => !row.is_read).length,
                quotePerRfq: totalRfq > 0 ? Number((totalQuotes / totalRfq).toFixed(2)) : 0,
            },
            rfqByStatus,
            ordersByStatus,
            topVendors,
            monthlyActivity,
            recentTimeline: timeline,
            verificationHistory: verifications,
            purchaseOrders,
            conversations,
            notifications: notifications.slice(0, 10),
            rfqs: rfqDetails,
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to load hospital statistics'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

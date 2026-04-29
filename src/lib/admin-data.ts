export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'manual_override'
export type EntityType = 'hospital' | 'vendor'

export type OverviewResponse = {
    totalHospitals: number
    totalVendors: number
    pendingHospitals: number
    pendingVendors: number
    verifiedHospitals: number
    verifiedVendors: number
    recentSignups: Array<{
        type: 'Hospital' | 'Vendor'
        name: string
        date: string
    }>
}

export type AdminEntity = {
    id: string
    userId: string | null
    type: EntityType
    name: string
    verificationStatus: VerificationStatus | null
    verificationSource: 'manual_override' | 'manual' | 'profile' | null
    createdAt: string
    country: string | null
    city: string | null
    contactEmail: string | null
    contactPhone: string | null
    contactPerson: string | null
    registrationNumber: string | null
    companyRegistration: string | null
    tags: string[]
    isVerified: boolean | null
}

export type HospitalStatisticsResponse = {
    hospital: {
        id: string
        user_id: string | null
        hospital_name: string
        city: string | null
        country: string | null
        facility_type: string | null
        hospital_type: string | null
        created_at: string
        verification_status: string | null
        is_verified: boolean | null
    }
    summary: {
        totalRfqs: number
        totalQuotations: number
        totalOrders: number
        totalSpend: number
        activeConversations: number
        totalConversations: number
        unreadNotifications: number
        quotePerRfq: number
    }
    rfqByStatus: Record<string, number>
    ordersByStatus: Array<{ status: string; count: number; totalAmount: number }>
    topVendors: Array<{ vendorName: string; orders: number; amount: number }>
    monthlyActivity: Array<{ monthKey: string; label: string; rfqs: number; orders: number }>
    recentTimeline: Array<{ id: string; type: string; title: string; subtitle: string | null; created_at: string }>
    verificationHistory: Array<{
        id: string
        status: string | null
        admin_notes: string | null
        created_at: string
        verified_at: string | null
    }>
    purchaseOrders: Array<{
        id: string
        rfq_id: string | null
        vendor_id: string | null
        total_amount: number | null
        status: string | null
        payment_status: string | null
        order_date: string | null
        created_at: string
        delivery_date: string | null
    }>
    conversations: Array<{
        id: string
        rfq_id: string
        vendor_id: string
        eligibility_status: string
        created_at: string
    }>
    notifications: Array<{ id: string; title: string; type: string; is_read: boolean | null; created_at: string }>
    rfqs: Array<{
        id: string
        title: string
        status: string
        created_at: string
        updated_at: string
        deadline: string | null
        metadata: Record<string, unknown> | null
        itemCount: number
        quoteCount: number
        orderCount: number
        conversationCount: number
        lineItems: Array<{
            id: string
            lineItemId: number
            componentName: string | null
            itemType: string | null
            fields: Record<string, unknown> | null
            rawRow: unknown[] | null
            deliverySchedule: unknown[] | null
            createdAt: string
        }>
        quotations: Array<{
            id: string
            vendorId: string | null
            totalAmount: number | null
            status: string | null
            submittedAt: string | null
            createdAt: string
            validUntil: string | null
            notes: string | null
            terms: string | null
        }>
        orders: Array<{
            id: string
            vendorId: string | null
            totalAmount: number | null
            status: string | null
            paymentStatus: string | null
            orderDate: string | null
            createdAt: string
            deliveryDate: string | null
        }>
        conversations: Array<{
            id: string
            vendorId: string
            eligibilityStatus: string
            createdAt: string
        }>
    }>
}

export type VendorStatisticsResponse = {
    vendor: {
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
    summary: {
        totalQuotations: number
        totalOrders: number
        totalRevenue: number
        awardedQuotes: number
        activeConversations: number
        totalConversations: number
        quotationToOrderRate: number
    }
    quotationsByStatus: Array<{ status: string; count: number; totalAmount: number }>
    ordersByStatus: Array<{ status: string; count: number; totalAmount: number }>
    monthlyActivity: Array<{ monthKey: string; label: string; quotations: number; orders: number }>
    recentTimeline: Array<{ id: string; type: string; title: string; subtitle: string | null; created_at: string }>
    verificationHistory: Array<{
        id: string
        status: string | null
        admin_notes: string | null
        created_at: string
        verified_at: string | null
    }>
    purchaseOrders: Array<{
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
    }>
    conversations: Array<{
        id: string
        rfq_id: string
        hospital_id: string
        vendor_id: string
        eligibility_status: string
        created_at: string
    }>
    rfqs: Array<{
        id: string
        title: string
        status: string
        created_at: string
        updated_at: string
        deadline: string | null
        metadata: Record<string, unknown> | null
        hospitalId: string
        hospitalName: string | null
        itemCount: number
        quoteCount: number
        orderCount: number
        conversationCount: number
        lineItems: Array<{
            id: string
            lineItemId: number
            componentName: string | null
            itemType: string | null
            fields: Record<string, unknown> | null
            rawRow: unknown[] | null
            deliverySchedule: unknown[] | null
            createdAt: string
        }>
        quotations: Array<{
            id: string
            totalAmount: number | null
            status: string | null
            submittedAt: string | null
            createdAt: string
            validUntil: string | null
            notes: string | null
            terms: string | null
        }>
        orders: Array<{
            id: string
            totalAmount: number | null
            status: string | null
            paymentStatus: string | null
            orderDate: string | null
            createdAt: string
            deliveryDate: string | null
        }>
        conversations: Array<{
            id: string
            hospitalId: string
            hospitalName: string | null
            eligibilityStatus: string
            createdAt: string
        }>
    }>
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...init,
        cache: 'no-store',
        headers: {
            'content-type': 'application/json',
            ...(init?.headers ?? {}),
        },
    })

    const data = await response.json().catch(() => ({})) as T & { error?: string }
    if (!response.ok) {
        throw new Error(data && typeof data === 'object' && 'error' in data ? String(data.error) : `Request failed: ${response.status}`)
    }

    return data
}

function normalizeStatus(value: unknown): VerificationStatus | null {
    if (value === 'pending' || value === 'verified' || value === 'rejected' || value === 'manual_override') {
        return value
    }

    return null
}

export function normalizeHospital(row: Record<string, unknown>): AdminEntity {
    return {
        id: String(row.id ?? ''),
        userId: typeof row.user_id === 'string' ? row.user_id : null,
        type: 'hospital',
        name: String(row.hospital_name ?? 'Unnamed hospital'),
        verificationStatus: normalizeStatus(row.verification_status),
        verificationSource: row.verification_source === 'manual_override' || row.verification_source === 'manual' || row.verification_source === 'profile' ? row.verification_source : null,
        createdAt: String(row.created_at ?? ''),
        country: typeof row.country === 'string' ? row.country : null,
        city: typeof row.city === 'string' ? row.city : null,
        contactEmail: typeof row.contact_email === 'string' ? row.contact_email : null,
        contactPhone: typeof row.contact_phone === 'string' ? row.contact_phone : null,
        contactPerson: typeof row.contact_person === 'string' ? row.contact_person : null,
        registrationNumber: typeof row.registration_number === 'string' ? row.registration_number : null,
        companyRegistration: null,
        tags: [row.hospital_type, row.facility_type].filter((value): value is string => typeof value === 'string' && value.length > 0),
        isVerified: typeof row.is_verified === 'boolean' ? row.is_verified : null,
    }
}

export function normalizeVendor(row: Record<string, unknown>): AdminEntity {
    return {
        id: String(row.id ?? ''),
        userId: typeof row.user_id === 'string' ? row.user_id : null,
        type: 'vendor',
        name: String(row.vendor_name ?? 'Unnamed vendor'),
        verificationStatus: normalizeStatus(row.verification_status),
        verificationSource: row.verification_source === 'manual_override' || row.verification_source === 'manual' || row.verification_source === 'profile' ? row.verification_source : null,
        createdAt: String(row.created_at ?? ''),
        country: typeof row.country === 'string' ? row.country : null,
        city: typeof row.city === 'string' ? row.city : null,
        contactEmail: typeof row.contact_email === 'string' ? row.contact_email : null,
        contactPhone: typeof row.contact_phone === 'string' ? row.contact_phone : null,
        contactPerson: typeof row.contact_person === 'string' ? row.contact_person : null,
        registrationNumber: null,
        companyRegistration: typeof row.company_registration === 'string' ? row.company_registration : null,
        tags: Array.isArray(row.vendor_type) ? row.vendor_type.filter((value): value is string => typeof value === 'string') : [],
        isVerified: typeof row.is_verified === 'boolean' ? row.is_verified : null,
    }
}

export async function loadOverview(): Promise<OverviewResponse> {
    return fetchJson<OverviewResponse>('/api/admin/overview')
}

export async function loadHospitals(): Promise<{ hospitals: AdminEntity[] }> {
    const result = await fetchJson<{ hospitals: Record<string, unknown>[] }>('/api/admin/hospitals')
    return { hospitals: result.hospitals.map(normalizeHospital) }
}

export async function loadVendors(): Promise<{ vendors: AdminEntity[] }> {
    const result = await fetchJson<{ vendors: Record<string, unknown>[] }>('/api/admin/vendors')
    return { vendors: result.vendors.map(normalizeVendor) }
}

export async function loadEntityStatistics(hospitalId: string) {
    return fetchJson<HospitalStatisticsResponse>(`/api/admin/hospitals/${hospitalId}/statistics`)
}

export async function loadVendorStatistics(vendorId: string) {
    return fetchJson<VendorStatisticsResponse>(`/api/admin/vendors/${vendorId}/statistics`)
}

export async function submitVerificationAction(body: {
    entityType: EntityType
    entityId: string
    status: 'verified' | 'rejected'
    adminNotes?: string
    entity?: Record<string, unknown>
}) {
    return fetchJson<{ success: true; status: string }>('/api/admin/verification', {
        method: 'POST',
        body: JSON.stringify(body),
    })
}
